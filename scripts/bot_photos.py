#!/usr/bin/env python3
"""Full-size photos of NEW posts through the ordinary Bot API (no my.telegram.org keys needed).

The bot is an administrator of the group, so Telegram delivers every new post to it. Each run (GitHub Actions,
every 2 hours) takes the pending updates (Telegram keeps them 24 h), remembers the largest photo of every message
in data/tg-photos.json (file_id stays valid, so a photo can be downloaded later), and for every lot without
"orig": true whose post is known, downloads its album into public/catalog/<id>/<n>.jpg (old files and @2x copies
are removed, "hd" is reset, so scripts/upscale.py processes the photo again from the original).
Posts published before the bot was added are not delivered by Telegram and keep their preview photos.

env: TELEGRAM_BOT_TOKEN   (a separate bot only for the site: getUpdates must not compete with another program)
  python3 scripts/bot_photos.py
"""
import glob, json, os, sys, time, urllib.error, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOTS = os.path.join(ROOT, "data", "lots.json")
STORE = os.path.join(ROOT, "data", "tg-photos.json")
PUBLIC = os.path.join(ROOT, "public")
GROUP = os.environ.get("TG_GROUP", "koreamotocycles_veltor").lower()
KEEP = 4000  # remembered messages


def api(token, method, **params):
    url = f"https://api.telegram.org/bot{token}/{method}"
    data = urllib.parse.urlencode({k: json.dumps(v) if isinstance(v, (list, dict)) else v for k, v in params.items()}).encode()
    try:
        r = json.load(urllib.request.urlopen(url, data=data, timeout=60))
    except urllib.error.HTTPError as e:
        r = json.loads(e.read() or b"{}")
    if not r.get("ok"):
        raise RuntimeError(f"{method}: {r.get('error_code')} {r.get('description')}")
    return r["result"]


def main():
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    if not token:
        print("Нет TELEGRAM_BOT_TOKEN — оригиналы фото пропущены"); return
    store = json.load(open(STORE, encoding="utf-8")) if os.path.exists(STORE) else {"offset": 0, "msgs": {}}
    msgs = store["msgs"]

    # 1) new posts delivered to the bot
    try:
        me = api(token, "getMe")
        print(f"Бот @{me['username']}")
        store["bot"] = me["username"]
        got = 0
        while True:
            ups = api(token, "getUpdates", offset=store["offset"], limit=100, timeout=0, allowed_updates=["message", "channel_post"])
            if not ups:
                break
            for u in ups:
                store["offset"] = u["update_id"] + 1
                m = u.get("message") or u.get("channel_post")
                if m:
                    store["lastSeen"] = {"chat": m["chat"].get("username") or m["chat"].get("title"), "id": m["message_id"]}
                if not m or (m["chat"].get("username") or "").lower() != GROUP or not m.get("photo"):
                    continue
                big = max(m["photo"], key=lambda p: p.get("width", 0) * p.get("height", 0))
                msgs[str(m["message_id"])] = {"g": m.get("media_group_id"), "f": big["file_id"], "w": big.get("width")}
                got += 1
        print(f"Новых фото из группы: {got}")
    except RuntimeError as e:
        msg = str(e)
        if "409" in msg:
            print("! Этот бот уже получает обновления другой программой (webhook или getUpdates). Нужен отдельный бот для сайта.")
        elif "401" in msg:
            print("! Неверный TELEGRAM_BOT_TOKEN")
        else:
            print("!", msg)
        return
    if len(msgs) > KEEP:
        for k in sorted(msgs, key=int)[: len(msgs) - KEEP]:
            del msgs[k]

    # 2) lots whose post photos are known → download the originals
    lots = json.load(open(LOTS, encoding="utf-8"))
    done = 0
    for l in lots:
        if l.get("orig") or str(l["id"]) not in msgs:
            continue
        head = msgs[str(l["id"])]
        ids = sorted((int(k) for k, v in msgs.items() if head["g"] and v["g"] == head["g"]), key=int) if head["g"] else [l["id"]]
        folder = os.path.join(PUBLIC, "catalog", str(l["id"]))
        os.makedirs(folder, exist_ok=True)
        photos = []
        try:
            for n, mid in enumerate(ids, 1):
                f = api(token, "getFile", file_id=msgs[str(mid)]["f"])
                data = urllib.request.urlopen(f"https://api.telegram.org/file/bot{token}/{f['file_path']}", timeout=120).read()
                rel = f"catalog/{l['id']}/{n}.jpg"
                with open(os.path.join(PUBLIC, rel), "wb") as fh:
                    fh.write(data)
                photos.append(rel)
                time.sleep(0.2)
        except Exception as e:
            print(f"! {l['id']}: {e}"); continue
        for f in glob.glob(os.path.join(folder, "*.jpg")):
            rel = os.path.relpath(f, PUBLIC).replace(os.sep, "/")
            if rel not in photos:
                os.remove(f)
        l["photos"], l["orig"] = photos, True
        l.pop("hd", None)
        done += 1
        print(f"+ {l['id']} {l['name']}: {len(photos)} фото, {head.get('w')} px")

    with open(STORE, "w", encoding="utf-8") as f:
        json.dump(store, f, ensure_ascii=False, separators=(",", ":")); f.write("\n")
    if done:
        with open(LOTS, "w", encoding="utf-8") as f:
            json.dump(lots, f, ensure_ascii=False, indent=1); f.write("\n")
    print(f"Оригиналы загружены: {done}, без оригиналов: {sum(1 for l in lots if not l.get('orig'))}")


if __name__ == "__main__":
    main()

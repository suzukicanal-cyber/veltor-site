#!/usr/bin/env python3
"""Full-size photos of NEW posts through the ordinary Bot API (no my.telegram.org keys needed).

The VELTOR stories bot (repo veltor-stories) is an administrator of the group and receives every new post; it records
the largest photo of every message in its photos.json. Each run here (GitHub Actions, every 2 hours) merges that list
into data/tg-photos.json (file_id stays valid, so a photo can be downloaded later) and, for every lot without
"orig": true whose post is known, downloads its album into public/catalog/<id>/<n>.jpg (old files and @2x copies
are removed, "hd" is reset, so scripts/upscale.py processes the photo again from the original).
Posts published before the bot was added are not delivered by Telegram and keep their preview photos.

env: TELEGRAM_BOT_TOKEN   (the same bot as in veltor-stories; this script never calls getUpdates)
  python3 scripts/bot_photos.py
"""
import glob, json, os, sys, time, urllib.error, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOTS = os.path.join(ROOT, "data", "lots.json")
STORE = os.path.join(ROOT, "data", "tg-photos.json")
PUBLIC = os.path.join(ROOT, "public")
GROUP = os.environ.get("TG_GROUP", "koreamotocycles_veltor").lower()
KEEP = 4000  # remembered messages
SHARED = os.environ.get("TG_PHOTOS_URL", "https://raw.githubusercontent.com/suzukicanal-cyber/veltor-stories/main/photos.json")


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
    store = json.load(open(STORE, encoding="utf-8")) if os.path.exists(STORE) else {"msgs": {}}
    msgs = store["msgs"]

    # 1) photos of the group recorded by the stories bot (repo veltor-stories, every 15 min).
    # The same bot must not call getUpdates here: that would take the updates away from the stories.
    try:
        req = urllib.request.Request(SHARED, headers={"Cache-Control": "no-cache"})
        shared = json.load(urllib.request.urlopen(req, timeout=60))
    except Exception as e:
        print(f"! {SHARED}: {e}"); return
    before = len(msgs)
    for k, v in shared.items():
        msgs.setdefault(k, {"g": v.get("g"), "f": v["f"], "w": v.get("w")})
    print(f"Фото из группы: {len(shared)} (новых для сайта: {len(msgs) - before})")
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
        l.pop("hd", None); l.pop("hdv", None)
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

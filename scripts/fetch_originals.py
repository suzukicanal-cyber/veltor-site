#!/usr/bin/env python3
"""Full-size original photos from the Telegram group (instead of the 800 px previews of the public embed).

Works with the VELTOR bot through MTProto (Telethon): a bot that is a member of the group may read any message
by its id, so old posts are reachable too. For every lot without "orig": true the album of its post is
downloaded (largest size of every photo) into public/catalog/<id>/<n>.jpg, old @2x copies are removed and
"hd" is reset, so scripts/upscale.py processes the photo again from the original.

env: TELEGRAM_BOT_TOKEN, TG_API_ID, TG_API_HASH  (api id/hash from my.telegram.org → API development tools)
  python3 scripts/fetch_originals.py [--limit 400] [--ids 7713,7674] [--force]
"""
import argparse, asyncio, glob, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOTS = os.path.join(ROOT, "data", "lots.json")
PUBLIC = os.path.join(ROOT, "public")
GROUP = os.environ.get("TG_GROUP", "koreamotocycles_veltor")
ALBUM_SPAN = 12  # album messages follow the first one; look this far ahead


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=400, help="lots per run")
    ap.add_argument("--ids", default="")
    ap.add_argument("--force", action="store_true", help="download again even if already done")
    a = ap.parse_args()
    token, api_id, api_hash = os.environ.get("TELEGRAM_BOT_TOKEN"), os.environ.get("TG_API_ID"), os.environ.get("TG_API_HASH")
    if not (token and api_id and api_hash):
        print("Нет TELEGRAM_BOT_TOKEN / TG_API_ID / TG_API_HASH — оригиналы фото пропущены"); return

    from telethon import TelegramClient
    from telethon.sessions import StringSession
    from telethon.tl.types import MessageMediaPhoto

    lots = json.load(open(LOTS, encoding="utf-8"))
    only = {int(x) for x in a.ids.split(",") if x}
    todo = [l for l in lots if (a.force or not l.get("orig")) and (not only or l["id"] in only)]
    todo.sort(key=lambda l: (l["date"], l["id"]), reverse=True)
    todo = todo[: a.limit]
    if not todo:
        print("Оригиналы уже загружены для всех вариантов"); return

    client = TelegramClient(StringSession(), int(api_id), api_hash)
    await client.start(bot_token=token)
    group = await client.get_entity(GROUP)
    done = 0
    for l in todo:
        first = l["id"]
        msgs = await client.get_messages(group, ids=list(range(first, first + ALBUM_SPAN)))
        head = msgs[0]
        if head is None:
            print(f"! {first}: сообщение недоступно"); continue
        if head.grouped_id:
            album = [m for m in msgs if m is not None and m.grouped_id == head.grouped_id]
        else:
            album = [head]
        album = [m for m in album if isinstance(m.media, MessageMediaPhoto)]
        if not album:
            print(f"! {first}: в посте нет фото"); continue
        folder = os.path.join(PUBLIC, "catalog", str(first))
        os.makedirs(folder, exist_ok=True)
        photos = []
        for n, m in enumerate(sorted(album, key=lambda m: m.id), 1):
            data = await client.download_media(m, file=bytes)  # largest size of the photo
            rel = f"catalog/{first}/{n}.jpg"
            with open(os.path.join(PUBLIC, rel), "wb") as f:
                f.write(data)
            photos.append(rel)
        # old copies: numbered files beyond the album and all @2x versions
        for f in glob.glob(os.path.join(folder, "*.jpg")):
            rel = os.path.relpath(f, PUBLIC).replace(os.sep, "/")
            if rel not in photos:
                os.remove(f)
        l["photos"], l["orig"] = photos, True
        l.pop("hd", None)
        done += 1
        print(f"+ {first} {l['name']}: {len(photos)} фото")
    await client.disconnect()
    with open(LOTS, "w", encoding="utf-8") as f:
        json.dump(lots, f, ensure_ascii=False, indent=1); f.write("\n")
    left = sum(1 for l in lots if not l.get("orig"))
    print(f"Оригиналы загружены: {done}, осталось: {left}")


if __name__ == "__main__":
    asyncio.run(main())

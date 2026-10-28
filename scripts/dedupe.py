#!/usr/bin/env python3
"""Reposted listings: when the same vehicle is published in the Telegram group again, keep only the newest post.

Two lots are the same vehicle when they have the same type, model name and year AND one of:
  • the same "exact" mileage (not a round number, e.g. 5 135 km; ± 0.5 %) and photos not clearly different (≤ 18 bits);
  • the same photo (perceptual hash, ≤ 3 bits apart);
  • a very similar photo (≤ 8 bits) and mileage within 30 %;
  • the same round mileage (e.g. 18 000 km) and a similar photo (≤ 12 bits).
Round mileage alone is not enough: different bikes are often listed as "9 000 km".
The older lot is removed from data/lots.json, its photos are deleted, and its address is redirected to the
newest one (data/redirects.json → the old page sends visitors and search engines to the new one).
  python3 scripts/dedupe.py [--dry]
"""
import argparse, json, os, re, shutil
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOTS = os.path.join(ROOT, "data", "lots.json")
REDIRECTS = os.path.join(ROOT, "data", "redirects.json")
PUBLIC = os.path.join(ROOT, "public")


def dhash(path, size=8):
    im = Image.open(path).convert("L").resize((size + 1, size), Image.LANCZOS)
    px = list(im.get_flattened_data() if hasattr(im, "get_flattened_data") else im.getdata())
    bits = 0
    for y in range(size):
        for x in range(size):
            bits = (bits << 1) | (px[y * (size + 1) + x] > px[y * (size + 1) + x + 1])
    return bits


def hashes(lot):
    out = []
    for p in lot["photos"]:
        f = os.path.join(PUBLIC, p)
        if not p.startswith("http") and os.path.exists(f):
            try:
                out.append(dhash(f))
            except Exception:
                pass
    return out


def key(l):
    return (l["type"], re.sub(r"[^a-z0-9а-я]+", "", l["name"].lower()), l["year"])


def ham(ha, hb):
    return min((bin(x ^ y).count("1") for x in ha for y in hb), default=99)


def same_vehicle(a, b, ha, hb):
    ka, kb, h = a["km"], b["km"], ham(ha, hb)
    if h <= 3:
        return True
    if ka and kb:
        exact = ka % 100 and kb % 100
        if exact and abs(ka - kb) <= max(10, 0.005 * max(ka, kb)) and h <= 18:
            return True
        if ka == kb and h <= 12:
            return True
        if h <= 8 and abs(ka - kb) <= 0.3 * max(ka, kb):
            return True
    elif not ka and not kb and h <= 8:
        return True
    return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry", action="store_true")
    a = ap.parse_args()
    lots = json.load(open(LOTS, encoding="utf-8"))
    redirects = json.load(open(REDIRECTS, encoding="utf-8")) if os.path.exists(REDIRECTS) else {}
    groups = {}
    for l in lots:
        groups.setdefault(key(l), []).append(l)
    remove = {}
    for g in groups.values():
        if len(g) < 2:
            continue
        g.sort(key=lambda l: (l["date"], l["id"]), reverse=True)  # newest first
        hs = {l["id"]: hashes(l) for l in g}
        kept = []
        for l in g:
            twin = next((k for k in kept if same_vehicle(k, l, hs[k["id"]], hs[l["id"]])), None)
            if twin:
                remove[l["id"]] = twin
            else:
                kept.append(l)
    for old_id, new in remove.items():
        old = next(l for l in lots if l["id"] == old_id)
        print(f"- {old_id} {old['name']} {old['year']} ({old['date'][:10]}) → повтор, оставлен {new['id']} ({new['date'][:10]})")
        redirects[old["slug"]] = new["slug"]
    if not remove:
        print("Повторов нет"); return
    if a.dry:
        return
    for old_id in remove:
        shutil.rmtree(os.path.join(PUBLIC, "catalog", str(old_id)), ignore_errors=True)
    lots = [l for l in lots if l["id"] not in remove]
    alive = {l["slug"] for l in lots}
    # follow chains: an old address always leads to a lot that exists
    for src in list(redirects):
        dst, seen = redirects[src], set()
        while dst not in alive and dst in redirects and dst not in seen:
            seen.add(dst); dst = redirects[dst]
        if dst in alive:
            redirects[src] = dst
        else:
            del redirects[src]
    with open(LOTS, "w", encoding="utf-8") as f:
        json.dump(lots, f, ensure_ascii=False, indent=1); f.write("\n")
    with open(REDIRECTS, "w", encoding="utf-8") as f:
        json.dump(redirects, f, ensure_ascii=False, indent=1); f.write("\n")
    print(f"Удалено повторов: {len(remove)}, вариантов осталось: {len(lots)}")


if __name__ == "__main__":
    main()

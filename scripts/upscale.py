#!/usr/bin/env python3
"""Sharper published copies of catalog photos (scripts/enhance.py: D = Real-ESRGAN x4plus for originals, B = sharpening for previews).

For every local photo public/catalog/<id>/<n>.jpg a sharper copy <n>@2x.jpg is written next to it;
the original stays untouched (cards use it, galleries and retina screens use @2x).
When all photos of a lot are processed, the lot gets "hd": true in data/lots.json.
"noUpscale": true in a lot keeps its photos as published (no neural processing).

Lots processed by the current scheme carry "hdv": 2; older ones are processed again. Newest first, stops at the budget.
  python3 scripts/upscale.py [--budget SECONDS] [--ids 7713,7674] [--shard i/n --no-write] [--mark-only]
"""
import argparse, json, os, shutil, sys, time, zipfile, pickle
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS = os.path.join(ROOT, "scripts", "models")
LOTS = os.path.join(ROOT, "data", "lots.json")
PUBLIC = os.path.join(ROOT, "public")

def load_pth(path):
    z = zipfile.ZipFile(path)
    root = z.namelist()[0].split("/")[0]
    class Storage:
        def __init__(self, key, dtype): self.key, self.dtype = key, dtype
    def rebuild(storage, offset, size, stride, *a):
        buf = np.frombuffer(z.read(f"{root}/data/{storage.key}"), dtype=storage.dtype)
        n = int(np.prod(size)) if size else 1
        arr = buf[offset:offset + max(n, 1)] if not stride or list(stride) == contiguous(size) else np.lib.stride_tricks.as_strided(buf[offset:], size, [s * buf.itemsize for s in stride])
        return np.array(arr).reshape(size)
    def contiguous(size):
        st, acc = [], 1
        for d in reversed(size): st.insert(0, acc); acc *= d
        return st
    class U(pickle.Unpickler):
        def find_class(self, mod, name):
            if name == "_rebuild_tensor_v2": return rebuild
            if name in ("FloatStorage",): return np.float32
            if name == "OrderedDict": import collections; return collections.OrderedDict
            if mod.startswith("torch"): return lambda *a, **k: None
            return super().find_class(mod, name)
        def persistent_load(self, pid):
            _, cls, key, loc, n = pid
            return Storage(key, np.float32)
    obj = U(z.open(f"{root}/data.pkl")).load()
    return obj.get("params", obj)

def conv3(x, w, b):
    # x: (C,H,W), w: (O,C,3,3) -> (O,H,W); im2col in row bands to bound memory
    C, H, W = x.shape; O = w.shape[0]
    xp = np.pad(x, ((0, 0), (1, 1), (1, 1)), mode="edge")
    wm = w.reshape(O, C * 9)
    out = np.empty((O, H, W), np.float32)
    band = max(1, 60000 // W)
    for y0 in range(0, H, band):
        y1 = min(H, y0 + band); h = y1 - y0
        cols = np.empty((C, 9, h, W), np.float32)
        k = 0
        for dy in range(3):
            for dx in range(3):
                cols[:, k] = xp[:, y0 + dy:y1 + dy, dx:dx + W]; k += 1
        out[:, y0:y1] = (wm @ cols.reshape(C * 9, h * W)).reshape(O, h, W)
    return out + b[:, None, None]

def prelu(x, a): return np.where(x > 0, x, x * a[:, None, None])

def run(img, P):
    x = img.transpose(2, 0, 1).astype(np.float32) / 255.0
    i = 0; h = x
    while f"body.{i}.weight" in P:
        w = P[f"body.{i}.weight"]
        if w.ndim == 4:
            h = conv3(h, w, P[f"body.{i}.bias"])
        else:
            h = prelu(h, w)
        i += 1
    r = 4
    C = h.shape[0] // (r * r); H, W = h.shape[1:]
    h = h.reshape(C, r, r, H, W).transpose(0, 3, 1, 4, 2).reshape(C, H * r, W * r)
    base = x.repeat(r, 1).repeat(r, 2)
    out = np.clip(h + base, 0, 1)
    return (out.transpose(1, 2, 0) * 255 + 0.5).astype(np.uint8)


def load_model(denoise):
    a = load_pth(os.path.join(MODELS, "realesr-general-x4v3.pth"))
    b = load_pth(os.path.join(MODELS, "realesr-general-wdn-x4v3.pth"))
    # same mix as Real-ESRGAN --denoise_strength: low value keeps texture (scratches, wear) instead of smoothing it
    return {k: denoise * a[k] + (1 - denoise) * b[k] for k in a}

def hd_path(rel):
    return rel[:-4] + "@2x.jpg"

TARGET = 1600  # width of the published copy

def upscale(src, dst, P):
    im = Image.open(src).convert("RGB")
    k = min(2.5, TARGET / im.width)
    if k <= 1.05:  # already large enough (originals from Telegram are ~1200–1280 px; this is for bigger ones)
        out = im
    else:
        out = Image.fromarray(run(np.asarray(im), P))
        out = out.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    out.save(dst, "JPEG", quality=86, optimize=True, progressive=True)

HDV = 2  # processing version: 2 = variant D (originals, x4plus) + B (previews, sharpening)


def is_original(l, p):
    return bool(l.get("orig")) or p in l.get("origPhotos", [])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--budget", type=float, default=2400, help="seconds to spend, then stop (the rest goes to the next run)")
    ap.add_argument("--ids", default="")
    ap.add_argument("--shard", default="", help="i/n: process only lots whose index %% n == i (parallel jobs)")
    ap.add_argument("--mark-only", action="store_true", help="mark lots listed in public/catalog/done-*.json (after parallel jobs)")
    ap.add_argument("--no-write", action="store_true", help="do not write lots.json, list finished lots in public/catalog/done-<shard>.json")
    ap.add_argument("--denoise", type=float, default=0.3, help="(unused, kept for old commands)")
    a = ap.parse_args()
    lots = json.load(open(LOTS, encoding="utf-8"))
    if a.mark_only:
        import glob
        ids = set()
        for f in glob.glob(os.path.join(PUBLIC, "catalog", "done-*.json")):
            ids |= set(json.load(open(f))); os.remove(f)
        for l in lots:
            if l["id"] in ids:
                l["hd"], l["hdv"] = True, HDV
        with open(LOTS, "w", encoding="utf-8") as f:
            json.dump(lots, f, ensure_ascii=False, indent=1); f.write("\n")
        print(f"Отмечено: {len(ids)}, обработано по новой схеме: {sum(1 for l in lots if l.get('hdv') == HDV)} из {len(lots)}"); return
    only = {int(x) for x in a.ids.split(",") if x}
    todo = [l for l in lots if l.get("hdv") != HDV and not l.get("noUpscale") and (not only or l["id"] in only)]
    todo.sort(key=lambda l: (l["date"], l["id"]), reverse=True)
    if a.shard:
        i, n = map(int, a.shard.split("/"))
        todo = [l for k, l in enumerate(todo) if k % n == i]
    if not todo:
        print("Все фото уже обработаны"); return
    import enhance
    t0, done, finished, n_d = time.time(), 0, [], 0
    for l in todo:
        local = [p for p in l["photos"] if not p.startswith("http")]
        if not local or len(local) != len(l["photos"]):
            continue  # photos not downloaded yet
        if time.time() - t0 > a.budget:
            break
        ok = True
        for p in local:
            if time.time() - t0 > a.budget:
                ok = False; break
            try:
                orig = is_original(l, p)
                enhance.process(os.path.join(PUBLIC, p), os.path.join(PUBLIC, hd_path(p)), orig)
                if a.no_write and a.shard:  # parallel job: hand over only what this job made
                    out = os.path.join(ROOT, "hdout", os.path.relpath(hd_path(p), "catalog"))
                    os.makedirs(os.path.dirname(out), exist_ok=True)
                    shutil.copy(os.path.join(PUBLIC, hd_path(p)), out)
                done += 1; n_d += orig
            except Exception as e:  # a broken photo must not stop the catalog
                print(f"! {p}: {e}", file=sys.stderr); ok = False
        if ok:
            l["hd"], l["hdv"] = True, HDV; finished.append(l["id"])
    if a.no_write:
        if a.shard:
            os.makedirs(os.path.join(ROOT, "hdout"), exist_ok=True)
            with open(os.path.join(ROOT, "hdout", f"done-{a.shard.split('/')[0]}.json"), "w") as f:
                json.dump(finished, f)
    else:
        with open(LOTS, "w", encoding="utf-8") as f:
            json.dump(lots, f, ensure_ascii=False, indent=1); f.write("\n")
    left = sum(1 for l in lots if l.get("hdv") != HDV and not l.get("noUpscale"))
    print(f"Обработано фото: {done} (оригиналы x4plus: {n_d}, превью резкость: {done - n_d}), вариантов готово: {len(finished)}, осталось: {left}, {time.time() - t0:.0f} с")

if __name__ == "__main__":
    main()

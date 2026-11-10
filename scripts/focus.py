"""Where the vehicle is on each catalog photo and which way it faces, so card previews never cut off its front.

For every photo not yet in data/focus.json:
  * YOLOv8 finds the motorcycle / car (largest box of the right class);
  * CLIP tells the view (side / front / rear / detail) and, for side views, which way the front points
    (scored on the photo and on its mirror image, which cancels CLIP's own left/right bias);
  * from that the crop position is computed for the two card shapes, 4:3 (desktop) and 1:1 (phones):
    the whole vehicle if it fits, otherwise the window is pushed against its front end.

data/focus.json: { "catalog/9247/1.jpg": {"b": [x1,y1,x2,y2], "d": -1|0|1, "v": "side|front|rear|detail|none",
                                          "p43": [x%, y%], "p11": [x%, y%]} }
The site reads it at build time (lib/lots.ts): it sets object-position and puts a front/side photo first.
Run: python3 scripts/focus.py [--limit N] [--sheet out.jpg]
"""
import argparse, json, os, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "data", "focus.json")
LOTS = os.path.join(ROOT, "data", "lots.json")
PUB = os.path.join(ROOT, "public")

COCO = {"moto": {3}, "car": {2, 7, 5}}          # motorcycle; car, truck, bus
NOUN = {"moto": "motorcycle", "car": "car"}
WHOLE = ("a photo of an entire {v}", "a close-up photo of a part of a {v}")
ENDS = {  # what the front and the back end of the vehicle look like
    "moto": ("the front wheel, front fork and headlight of a motorcycle", "the rear wheel, exhaust and tail of a motorcycle"),
    "car": ("the front of a car with headlights and grille", "the back of a car with taillights and trunk"),
}
SIDE_RATIO = {"moto": 1.2, "car": 1.75}     # box width / height above this: side or three-quarter view
MARGIN = 0.03


def window(aspect_img, aspect_t):
    """Crop window as fractions of the image (w, h) for object-fit: cover into aspect_t."""
    return (aspect_t / aspect_img, 1.0) if aspect_img > aspect_t else (1.0, aspect_img / aspect_t)


def pos(lo, hi, win, d):
    """object-position % on one axis: show [lo, hi] whole if it fits, else keep the front end (d) in view."""
    if win >= 0.999:
        return 50.0
    if hi - lo + 2 * MARGIN <= win or d == 0:
        left = (lo + hi) / 2 - win / 2
    elif d > 0:
        left = hi + MARGIN - win
    else:
        left = lo - MARGIN
    left = min(max(left, 0.0), 1.0 - win)
    return round(left / (1.0 - win) * 100, 1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--sheet", default="")
    a = ap.parse_args()

    import torch, open_clip
    from ultralytics import YOLO
    torch.set_num_threads(os.cpu_count() or 2)

    lots = json.load(open(LOTS, encoding="utf-8"))
    data = json.load(open(OUT, encoding="utf-8")) if os.path.exists(OUT) else {}
    todo = [(l["type"], p) for l in lots for p in l["photos"] if p not in data and os.path.exists(os.path.join(PUB, p))]
    if a.limit:
        todo = todo[: a.limit]
    print(f"photos to analyse: {len(todo)} (known: {len(data)})")
    if not todo:
        return

    det = YOLO("yolov8s.pt")
    model, _, prep = open_clip.create_model_and_transforms("ViT-B-32", pretrained="laion2b_s34b_b79k")
    tok = open_clip.get_tokenizer("ViT-B-32")
    model.eval()

    def txt(lines):
        with torch.no_grad():
            t = model.encode_text(tok(list(lines)))
        return t / t.norm(dim=-1, keepdim=True)

    def img(ims):
        with torch.no_grad():
            f = model.encode_image(torch.stack([prep(i) for i in ims]))
        return f / f.norm(dim=-1, keepdim=True)

    T = {t: (txt(s.format(v=NOUN[t]) for s in WHOLE), txt(ENDS[t])) for t in COCO}

    sheet = []
    for n, (typ, p) in enumerate(todo, 1):
        im = Image.open(os.path.join(PUB, p)).convert("RGB")
        W, H = im.size
        r = det(im, verbose=False)[0]
        box = None
        for bb, c in zip(r.boxes.xyxy.tolist(), r.boxes.cls.tolist()):
            if int(c) in COCO[typ]:
                area = (bb[2] - bb[0]) * (bb[3] - bb[1])
                if box is None or area > box[0]:
                    box = (area, bb)
        tw, te = T[typ]
        rec = {"v": "none", "d": 0}
        if box:
            x1, y1, x2, y2 = box[1]
            bw, bh = x2 - x1, y2 - y1
            whole = img([im.crop((int(x1), int(y1), int(x2), int(y2)))])
            part = (100 * whole @ tw.T).softmax(dim=-1)[0, 1].item()
            if part > 0.6:
                rec["v"] = "detail"
            else:
                # which end is where: compare the left and the right part of the box against "front end" / "back end"
                lft = im.crop((int(x1), int(y1), int(x1 + bw * .45), int(y2)))
                rgt = im.crop((int(x2 - bw * .45), int(y1), int(x2), int(y2)))
                e = img([lft, rgt]) @ te.T                       # rows: left, right; cols: front, back
                lf, rf = (e[0, 0] - e[0, 1]).item(), (e[1, 0] - e[1, 1]).item()
                if bw / bh > SIDE_RATIO[typ]:
                    rec["v"] = "side"
                    if abs(rf - lf) > 0.004:
                        rec["d"] = 1 if rf > lf else -1
                else:
                    fb = (whole @ te.T)[0]
                    rec["fb"] = round((fb[0] - fb[1]).item(), 4)   # > 0 looks like the front end, < 0 the back
                    rec["v"] = "front" if rec["fb"] > 0 else "rear"
                rec["s"] = round(rf - lf, 4)
            bx = [round(x1 / W, 3), round(y1 / H, 3), round(x2 / W, 3), round(y2 / H, 3)]
            rec["b"] = bx
            for key, at in (("p43", 4 / 3), ("p11", 1.0)):
                ww, wh = window(W / H, at)
                rec[key] = [pos(bx[0], bx[2], ww, rec["d"]), pos(bx[1], bx[3], wh, 0)]
        data[p] = rec
        if a.sheet and len(sheet) < 60:
            sheet.append((im, rec))
        if n % 50 == 0:
            print(n, p, rec, flush=True)
            json.dump(data, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"), sort_keys=True)
    json.dump(data, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"), sort_keys=True)
    print("done", len(data))

    if a.sheet and sheet:
        from PIL import ImageDraw
        tiles = []
        for im, rec in sheet:
            t = im.copy(); t.thumbnail((400, 400)); W, H = t.size
            dr = ImageDraw.Draw(t)
            if "b" in rec:
                b = rec["b"]; dr.rectangle([b[0] * W, b[1] * H, b[2] * W, b[3] * H], outline=(0, 255, 0), width=3)
                ww, wh = window(W / H, 1.0); px, py = rec["p11"]
                lx = (1 - ww) * px / 100 * W; ly = (1 - wh) * py / 100 * H
                dr.rectangle([lx, ly, lx + ww * W, ly + wh * H], outline=(255, 60, 60), width=3)
            dr.rectangle([0, 0, W, 22], fill=(0, 0, 0))
            dr.text((4, 4), f"{rec['v']} d={rec['d']} s={rec.get('s')}", fill=(255, 255, 255))
            tiles.append(t)
        cols = 6; rows = (len(tiles) + cols - 1) // cols
        out = Image.new("RGB", (cols * 400, rows * 400), (20, 20, 20))
        for i, t in enumerate(tiles):
            out.paste(t, ((i % cols) * 400, (i // cols) * 400))
        out.save(a.sheet, quality=85)


if __name__ == "__main__":
    sys.exit(main())

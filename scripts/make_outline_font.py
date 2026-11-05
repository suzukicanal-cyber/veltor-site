#!/usr/bin/env python3
"""Unbounded for outlined words (-webkit-text-stroke): a static weight with overlapping contours merged.

The variable Unbounded from Google Fonts draws letters from overlapping pieces; a text stroke shows every
seam inside the letter (А, В, Т…). Here the needed weight is cut from the variable font, overlaps are removed
(skia-pathops) and the result is saved as woff2 for public/fonts/.
  pip install fonttools skia-pathops brotli && python3 scripts/make_outline_font.py
"""
import os
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont, OverlapMode
from fontTools.subset import Subsetter, Options

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "scripts", "fonts", "Unbounded-VF.ttf")
OUT = os.path.join(ROOT, "public", "fonts")

for w in (300,):
    f = instantiateVariableFont(TTFont(SRC), {"wght": w}, overlap=OverlapMode.REMOVE)
    opt = Options(); opt.flavor = "woff2"; opt.layout_features = ["*"]; opt.name_IDs = ["*"]
    s = Subsetter(opt)
    s.populate(unicodes=list(range(0x20, 0x7F)) + list(range(0xA0, 0x180)) + list(range(0x400, 0x460)) + [0x2013, 0x2014, 0x2116, 0x20BD, 0x2192, 0x00B7])
    s.subset(f)
    os.makedirs(OUT, exist_ok=True)
    f.flavor = "woff2"
    p = os.path.join(OUT, f"unbounded-{w}-outline.woff2")
    f.save(p)
    print(p, os.path.getsize(p))

"""The ruble sign (U+20BD) sits in Google's latin-ext subset, so every price on the site made the browser download
the whole latin-ext file of each font (Unbounded alone is 116 KB) before the first screen settled.
This cuts ₽ out of each latin-ext file into a ~1 KB file of its own and drops U+20BD from the latin-ext range,
so ₽ keeps its real glyph and latin-ext loads only for text that really needs it.
Safe to run again. Called by fetch_fonts.py; needs fonttools and brotli."""
import os, re
from fontTools import subset

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "fonts")
RUB = 0x20BD


def main():
    path = os.path.join(OUT, "fonts.css")
    css = open(path, encoding="utf-8").read()
    if "-rub.woff2" in css:
        print("ruble subsets: already done")
        return
    out, n = [], 0
    for head, block in re.findall(r"(/\* [\w-]+ \*/\n)(@font-face \{.*?\})", css, re.S):
        if head.strip() != "/* latin-ext */":
            out.append(head + block)
            continue
        src = re.search(r"url\((g/[^)]+\.woff2)\)", block).group(1)
        rub = src.replace(".woff2", "-rub.woff2")
        opts = subset.Options(flavor="woff2", layout_features=["*"], name_IDs=["*"], notdef_outline=True)
        font = subset.load_font(os.path.join(OUT, src), opts)
        sub = subset.Subsetter(opts)
        sub.populate(unicodes=[RUB])
        sub.subset(font)
        subset.save_font(font, os.path.join(OUT, rub), opts)
        out.append(head + block.replace("U+20AD-20C4", "U+20AD-20BC, U+20BE-20C4"))
        out.append("/* ruble */\n" + re.sub(r"unicode-range: [^;]+;", "unicode-range: U+20BD;", block.replace(src, rub)))
        n += 1
    first = css.split("\n", 1)[0]
    with open(path, "w", encoding="utf-8") as f:
        f.write(first + "\n" + "\n".join(out) + "\n")
    print("ruble subsets:", n)


if __name__ == "__main__":
    main()

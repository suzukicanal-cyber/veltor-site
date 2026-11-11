"""Unbounded (about 90 KB with the outlined cut) only sets display numbers and words below the first screen, yet the
browser fetched it while the first screen was still rendering. This moves every Unbounded face from fonts.css to
fonts-late.css, which the page links once it has loaded (app/layout.tsx). The header logo «VELTOR» is the one
Unbounded text on the first screen, so its six letters stay in fonts.css as a ~2 KB file and the logo never swaps.
Safe to run again. Called by fetch_fonts.py after rub_subset; needs fonttools and brotli."""
import os, re
from fontTools import subset

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "fonts")
LATE = "Unbounded"
LOGO = "VELTOR"
OUTLINE = ('/* Unbounded 300 with merged contours: outlined words (text-stroke) show no seams inside letters '
           '(scripts/make_outline_font.py) */\n@font-face {\n  font-family: \'Unbounded Outline\';\n  font-weight: 300;\n'
           '  font-display: swap;\n  src: url(unbounded-300-outline.woff2) format(\'woff2\');\n}')


def main():
    path, late_path = os.path.join(OUT, "fonts.css"), os.path.join(OUT, "fonts-late.css")
    css = open(path, encoding="utf-8").read().replace("\r\n", "\n")
    blocks = re.findall(r"(/\* [\w-]+ \*/\n)(@font-face \{.*?\})", css, re.S)
    early = [h + b for h, b in blocks if f"font-family: '{LATE}';" not in b]
    late = [h + b for h, b in blocks if f"font-family: '{LATE}';" in b and h != "/* logo */\n"]
    if not late:
        print("late fonts: already done")
        return
    latin = next(b for h, b in blocks if h == "/* latin */\n" and f"font-family: '{LATE}';" in b)
    src = re.search(r"url\((g/[^)]+\.woff2)\)", latin).group(1)
    logo = src.replace("-latin.woff2", "-logo.woff2")
    opts = subset.Options(flavor="woff2", layout_features=["*"], name_IDs=["*"], notdef_outline=True)
    font = subset.load_font(os.path.join(OUT, src), opts)
    sub = subset.Subsetter(opts)
    sub.populate(text=LOGO)
    sub.subset(font)
    subset.save_font(font, os.path.join(OUT, logo), opts)
    rng = ", ".join(f"U+{ord(c):X}" for c in sorted(set(LOGO)))
    early.append("/* logo */\n" + re.sub(r"unicode-range: [^;]+;", f"unicode-range: {rng};", latin.replace(src, logo)))
    head = css.split("\n", 1)[0]
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(head + "\n" + "\n".join(early) + "\n")
    with open(late_path, "w", encoding="utf-8", newline="\n") as f:
        f.write("/* Unbounded, linked after the page has loaded (scripts/late_fonts.py). Do not edit by hand. */\n"
                + "\n".join(late) + "\n" + OUTLINE + "\n")
    print("late fonts:", len(late), "faces moved, logo subset", logo)


if __name__ == "__main__":
    main()

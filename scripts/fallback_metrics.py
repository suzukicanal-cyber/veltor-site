"""Prints @font-face rules for metric-matched fallback fonts, so text set in a system font while the site's fonts
load takes the same room and does not jump when they swap in (layout shift, CLS). Run by hand after the site's
fonts change; paste the output into app/globals.css. The sizes come from the average advance of Russian text,
the vertical overrides from the web font's own metrics. Needs fonttools and brotli.

    python scripts/fallback_metrics.py <Arial.ttf> <Roboto.ttf> <Consolas.ttf>
"""
import os, sys
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
G = os.path.join(ROOT, "public", "fonts", "g")
# letter frequencies of Russian prose plus spaces, digits and some Latin, roughly as on the site
SAMPLE = ("Подбираем, осматриваем, выкупаем и оформляем документы. Каждый этап подтверждаем фото- и видеоотчётом, "
          "а вы просто ждёте встречи. Мотоциклы и автомобили из Южной Кореи под ключ. Инчхон Москва 45 дней BMW")


def width(paths, text):
    """Average advance per character in em; each character comes from the first file (subset) that has it."""
    fonts = [TTFont(p) for p in paths]
    total = 0.0
    for c in text:
        f = next(f for f in fonts if ord(c) in f.getBestCmap())
        total += f["hmtx"][f.getBestCmap()[ord(c)]][0] / f["head"].unitsPerEm
    return total / len(text)


def vertical(f):
    upm, os2, hhea = f["head"].unitsPerEm, f["OS/2"], f["hhea"]
    if os2.fsSelection & (1 << 7):  # USE_TYPO_METRICS
        return os2.sTypoAscender / upm, -os2.sTypoDescender / upm, os2.sTypoLineGap / upm
    return hhea.ascent / upm, -hhea.descent / upm, hhea.lineGap / upm


def face(name, local, web_files, fallback):
    adj = width([os.path.join(G, w) for w in web_files], SAMPLE) / width([fallback], SAMPLE)
    asc, desc, gap = vertical(TTFont(os.path.join(G, web_files[0])))
    return (f'@font-face{{font-family:"{name}";src:local("{local}");size-adjust:{adj * 100:.2f}%;'
            f'ascent-override:{asc / adj * 100:.2f}%;descent-override:{desc / adj * 100:.2f}%;line-gap-override:{gap / adj * 100:.2f}%}}')


def main():
    arial, roboto, consolas = sys.argv[1:4]
    text = ["wix-madefor-text-400-600-cyrillic.woff2", "wix-madefor-text-400-600-latin.woff2"]
    disp = ["wix-madefor-display-400-700-cyrillic.woff2", "wix-madefor-display-400-700-latin.woff2"]
    mono = ["ibm-plex-mono-400-cyrillic.woff2", "ibm-plex-mono-400-latin.woff2"]
    print(face("Wix Madefor Text Arial", "Arial", text, arial))
    print(face("Wix Madefor Text Roboto", "Roboto", text, roboto))
    print(face("Wix Madefor Display Arial", "Arial", disp, arial))
    print(face("Wix Madefor Display Roboto", "Roboto", disp, roboto))
    print(face("IBM Plex Mono Consolas", "Consolas", mono, consolas))


if __name__ == "__main__":
    main()

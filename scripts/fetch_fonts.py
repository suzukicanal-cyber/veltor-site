"""Self-hosted fonts: downloads the site's Google Fonts once into public/fonts/g/ and writes public/fonts/fonts.css.
Visitors' browsers then never contact Google (no cross-border transfer of their IP addresses, 152-ФЗ), and pages load faster.
Only the cyrillic and latin subsets are kept. Run by .github/workflows/self-host-fonts.yml."""
import os, re, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "fonts")
CSS = ("https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Unbounded:wght@200..700"
       "&family=Wix+Madefor+Display:wght@400..700&family=Wix+Madefor+Text:wght@400..600&display=swap")
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
KEEP = {"cyrillic", "cyrillic-ext", "latin", "latin-ext"}


def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=60).read()


css = get(CSS).decode()
blocks = re.findall(r"/\* ([\w-]+) \*/\s*(@font-face \{.*?\})", css, re.S)
os.makedirs(os.path.join(OUT, "g"), exist_ok=True)
out = ["/* Self-hosted copy of Google Fonts (scripts/fetch_fonts.py). Do not edit by hand. */"]
n = 0
for subset, block in blocks:
    if subset not in KEEP:
        continue
    fam = re.search(r"font-family: '([^']+)'", block).group(1)
    wt = re.search(r"font-weight: ([\d ]+);", block).group(1).replace(" ", "-")
    url = re.search(r"url\((https://[^)]+\.woff2)\)", block).group(1)
    name = f"{fam.lower().replace(' ', '-')}-{wt}-{subset}.woff2"
    with open(os.path.join(OUT, "g", name), "wb") as f:
        f.write(get(url))
    out.append(f"/* {subset} */\n" + block.replace(url, f"g/{name}"))
    n += 1
with open(os.path.join(OUT, "fonts.css"), "w", encoding="utf-8") as f:
    f.write("\n".join(out) + "\n")
print("font files:", n)

import rub_subset  # ₽ in its own ~1 KB files, so prices no longer pull in the whole latin-ext subset
rub_subset.main()

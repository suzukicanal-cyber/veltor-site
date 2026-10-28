#!/usr/bin/env python3
"""IndexNow: сообщает Яндексу (и Bing) о новых и изменённых страницах сразу после обновления сайта.
Запускается из deploy/update-docker.sh после удачной сборки:
  python3 scripts/indexnow.py <прошлый_коммит>   — новые/изменённые объявления с прошлого обновления
  python3 scripts/indexnow.py --all              — все страницы из sitemap (один раз, при первом запуске)
"""
import glob, json, os, re, subprocess, sys, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.environ.get("SITE_URL", "https://veltormotokorea.ru").rstrip("/")
HOST = re.sub(r"^https?://", "", SITE)


def key():
    for f in glob.glob(os.path.join(ROOT, "public", "*.txt")):
        name = os.path.basename(f)[:-4]
        if re.fullmatch(r"[0-9a-f]{32}", name) and open(f).read().strip() == name:
            return name
    sys.exit("нет файла ключа IndexNow в public/")


def lots_at(rev):
    try:
        return json.loads(subprocess.check_output(["git", "-C", ROOT, "show", f"{rev}:data/lots.json"], stderr=subprocess.DEVNULL))
    except Exception:
        return []


def changed(old_rev):
    new = json.load(open(os.path.join(ROOT, "data", "lots.json"), encoding="utf-8"))
    old = {l["slug"]: l for l in lots_at(old_rev)}
    urls = [f"{SITE}/catalog/{l['slug']}/" for l in new if l["slug"] not in old or old[l["slug"]] != l]
    gone = [s for s in old if s not in {l["slug"] for l in new}]
    urls += [f"{SITE}/catalog/{s}/" for s in gone]  # старые адреса теперь ведут на новый пост
    if urls:
        types = {l["type"] for l in new if f"{SITE}/catalog/{l['slug']}/" in urls}
        urls += [f"{SITE}/", f"{SITE}/catalog/"] + [f"{SITE}/{'moto' if t == 'moto' else 'auto'}/" for t in types]
    return urls


def from_sitemap():
    req = urllib.request.Request(f"{SITE}/sitemap.xml", headers={"User-Agent": "veltor-indexnow"})
    return re.findall(r"<loc>([^<]+)</loc>", urllib.request.urlopen(req, timeout=30).read().decode())


def main():
    k = key()
    urls = from_sitemap() if sys.argv[1:] == ["--all"] else changed(sys.argv[1] if len(sys.argv) > 1 else "HEAD~1")
    urls = list(dict.fromkeys(urls))[:10000]
    if not urls:
        print("IndexNow: новых страниц нет"); return
    body = json.dumps({"host": HOST, "key": k, "keyLocation": f"{SITE}/{k}.txt", "urlList": urls}).encode()
    for api in ("https://yandex.com/indexnow", "https://api.indexnow.org/indexnow"):
        try:
            req = urllib.request.Request(api, data=body, headers={"Content-Type": "application/json; charset=utf-8"})
            code = urllib.request.urlopen(req, timeout=30).status
        except urllib.error.HTTPError as e:
            code = f"{e.code} {e.read()[:200]!r}"
        except Exception as e:
            code = f"ошибка {e}"
        print(f"IndexNow {api.split('/')[2]}: {len(urls)} адресов → {code}")


if __name__ == "__main__":
    main()

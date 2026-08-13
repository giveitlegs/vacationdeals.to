import re, sys
from bs4 import BeautifulSoup, NavigableString

KEEP = {"h1","h2","h3","h4","h5","h6","p","ul","ol","li","strong","b","em","i",
        "a","br","table","thead","tbody","tr","td","th","blockquote","sup","sub"}
BASE = "https://www.westgatereservations.com"

def clean(infile, outfile, ts_name):
    raw = open(infile, "rb").read()
    soup = BeautifulSoup(raw, "html.parser")
    container = soup.select_one("div.entry-content")
    if not container:
        print(f"NO CONTAINER in {infile}"); sys.exit(1)
    # drop unwanted subtrees
    for sel in ["script","style","form","iframe","noscript","img","svg","button",
                "input","nav","header","footer"]:
        for t in container.select(sel):
            t.decompose()
    # unwrap/scrub every tag
    for tag in container.find_all(True):
        if tag.name not in KEEP:
            tag.unwrap()
            continue
        attrs = {}
        if tag.name == "a":
            href = tag.get("href","").strip()
            if href.startswith("/"):
                href = BASE + href
            if href and not href.startswith("#"):
                attrs["href"] = href
                attrs["target"] = "_blank"
                attrs["rel"] = "noopener noreferrer"
        tag.attrs = attrs
    for _h1 in container.find_all('h1'):
        _h1.name = 'h2'
    _first = container.find(['h2','h3'])
    if _first and _first.get_text(strip=True).lower() in ('privacy policy','terms and conditions','terms & conditions'):
        _first.decompose()
    inner = container.decode_contents()
    # collapse whitespace, drop empty paragraphs
    inner = re.sub(r"\s+", " ", inner)
    inner = re.sub(r"<p>\s*</p>", "", inner)
    inner = re.sub(r"<(ul|ol)>\s*</(ul|ol)>", "", inner)
    inner = inner.strip()
    # TS-escape for backtick template literal
    esc = inner.replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${")
    words = len(re.sub(r"<[^>]+>"," ", inner).split())
    with open(outfile, "w", encoding="utf-8") as f:
        f.write(f"// Auto-extracted verbatim from {BASE} on 2026-08-12. Do not hand-edit;\n")
        f.write(f"// re-run scripts/extract-wg.py to refresh if Westgate updates their policy.\n")
        f.write(f"export const {ts_name} = `{esc}`;\n")
    print(f"{outfile}: {words} words, {len(inner)} chars HTML")

clean("wg-privacy-policy.html", "wg-privacy.ts", "WESTGATE_PRIVACY_HTML")
clean("wg-terms-and-conditions.html", "wg-terms.ts", "WESTGATE_TERMS_HTML")

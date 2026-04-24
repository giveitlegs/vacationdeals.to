import sys, re, urllib.request

urls = [
    "https://www.westgatereservations.com/specials/3-day-stay-plus-4-seaworld-orlando-tickets/",
    "https://www.westgatereservations.com/specials/westgate-las-vegas-resort-and-casino-4-3/",
    "https://www.westgatereservations.com/specials/4-days-3-nights-6-disney-tickets/",
    "https://www.westgatereservations.com/specials/gatlinburg-getaway-100-toward-dollywood-tickets-149/",
    "https://www.westgatereservations.com/specials/westgate-myrtle-beach-oceanfront-resort-4-3/",
    "https://www.westgatereservations.com/specials/4-day-orlando-dream-vacation/",
    "https://www.westgatereservations.com/specials/thanksgiving-special-branson/",
    "https://www.westgatereservations.com/specials/orlando-couples-vacation/",
]

meta_re = re.compile(r'<meta\s+(?:name|property)=[\"\'](description|og:description)[\"\']\s+content=[\"\']([^\"\']+)[\"\']', re.IGNORECASE)

for url in urls:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=15) as r:
            html = r.read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"=== {url} === FETCH FAILED: {e}")
        continue
    print(f"=== {url} ===")
    seen = set()
    for m in meta_re.finditer(html):
        kind, content = m.group(1), m.group(2)
        if content in seen:
            continue
        seen.add(content)
        print(f"  {kind}: {content[:260]}")
    print()

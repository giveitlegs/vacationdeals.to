import re
html = open(r'C:\temp\aip.html', encoding='utf-8', errors='ignore').read()
# Find each h3 with class el-title (the destination card title)
titles = list(re.finditer(r'<h3[^>]*class="el-title[^"]*"[^>]*>\s*([^<]+?)\s*</h3>', html))
print(f'Card titles found: {len(titles)}')
for t in titles[:14]:
    title_text = t.group(1).strip()
    # Look at the next 1500 chars for price + href
    chunk = html[t.end():t.end()+2500]
    price_m = re.search(r'\$([\d,]+)', chunk)
    href_m = re.search(r'href="([^"]+(?:destination|package|resort|preview|deal|offer|promotion|book|details)[^"]*)"', chunk, re.I)
    if not href_m:
        href_m = re.search(r'href="(/[^"]{4,80})"', chunk)
    nights_m = re.search(r'(\d+)\s*nights?', chunk, re.I)
    print(f'  {title_text[:42]:42s} | ${price_m.group(1) if price_m else "?":7s} | {nights_m.group(0) if nights_m else "?":12s} | {href_m.group(1)[:80] if href_m else "?"}')

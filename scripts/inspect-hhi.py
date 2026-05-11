import re
html = open(r'C:\temp\dom2\hiltonheadislanddeals_com.html', encoding='utf-8', errors='ignore').read()
for m in list(re.finditer(r'class="robo-header"[^>]*>([^<]+)', html))[:3]:
    pos = m.start()
    print('---')
    print('TITLE:', m.group(1).strip()[:60])
    chunk = html[pos:pos+1500]
    price_m = re.search(r'\$([\d,]+)', chunk)
    print('PRICE:', price_m.group(0) if price_m else '?')
    pre = html[max(0, pos - 400):pos]
    div_class = re.findall(r'class="([^"]*)"', pre)
    print('NEARBY_CLASSES:', div_class[-3:])

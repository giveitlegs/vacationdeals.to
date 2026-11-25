#!/usr/bin/env bash
# source-images.sh <lander_url> <outdir>
# Fetches a deal's lander, extracts clean candidate resort images (prefers gallery/resort
# photos, drops logos/icons/promo chrome), downloads up to 6, prints "file|WxH|bytes".
# Part of the overnight image rollout. Images are scp'd to the VPS, NOT committed to git.
set -uo pipefail
url="${1:?lander url}"; out="${2:?outdir}"; mkdir -p "$out"
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36"

html="$(curl -s -A "$UA" -L -m 30 "$url" 2>/dev/null)"
[ -z "$html" ] && { echo "ERR empty html"; exit 2; }

# NOTE: og:image is deliberately IGNORED — on promo landers it's a social card with baked-in
# price/offer TEXT, which we must never publish. We source only content <img> photos.

# all image file URLs, filtered to likely real photos (aggressive junk/promo blacklist)
mapfile -t imgs < <(printf '%s' "$html" \
  | grep -oiE 'https?://[^"'"'"' )]+\.(jpg|jpeg|png|webp)' \
  | grep -viE 'logo|icon|sprite|favicon|pixel|spacer|placeholder|badge|flag|mastercard|visa|amex|discover|paypal|cart|/footer|/header|/nav|avatar|thumb/|-150x|-300x|50x50|100x100|insiders-guide|disney-insiders|/guide|banner|promo|coupon|gift-?card|download|ebook|e-book|brochure|free-|offer|deal-|special|/ads?/|sale|cta|-tickets?|voucher' \
  | awk '!seen[$0]++')

# Clean product-photo URL patterns (reliably text-free interior/exterior shots).
product=()
for u in "${imgs[@]}"; do case "$u" in
  *gallery-*|*-gallery*|*room*|*suite*|*exterior*|*aerial*|*pool*|*lobby*|*villa*|*bedroom*|*living*|*kitchen*|*balcony*|*patio*|*amenit*|*resort-view*|*oceanfront*|*courtyard*) product+=("$u");;
esac; done

# If we have enough clean product photos, use ONLY those (drops stray promo/hero cards).
if [ "${#product[@]}" -ge 2 ]; then ranked=("${product[@]}"); else ranked=("${imgs[@]}"); fi

i=0; n=0
declare -A got
for u in "${ranked[@]}"; do
  [ -n "${got[$u]:-}" ] && continue; got[$u]=1
  i=$((i+1)); f="$out/cand_$(printf '%02d' $i).img"
  curl -s -A "$UA" -e "$url" -L -m 25 -o "$f" "$u" 2>/dev/null || continue
  # validate it's a real raster ≥500px on the long edge
  read -r W H < <(python -I -c "
from PIL import Image
try:
    im=Image.open(r'$f'); print(im.size[0], im.size[1])
except Exception: print(0,0)" 2>/dev/null)
  W=$(printf '%s' "${W:-0}" | grep -oE '^[0-9]+' || echo 0); W=${W:-0}
  H=$(printf '%s' "${H:-0}" | grep -oE '^[0-9]+' || echo 0); H=${H:-0}
  if [ "$W" -ge 500 ] || [ "$H" -ge 500 ]; then
    ext=webp; case "$(head -c4 "$f" | xxd -p)" in ffd8ff*) ext=jpg;; 89504e47) ext=png;; 52494646*) ext=webp;; esac
    mv "$f" "$out/cand_$(printf '%02d' $i).$ext"
    echo "cand_$(printf '%02d' $i).$ext|${W}x${H}|$(wc -c < "$out/cand_$(printf '%02d' $i).$ext")|$u"
    n=$((n+1))
  else
    rm -f "$f"
  fi
  [ "$n" -ge 6 ] && break
done
if [ "$n" -eq 0 ]; then echo "ERR no usable images"; exit 3; fi
exit 0

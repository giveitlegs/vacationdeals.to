#!/usr/bin/env bash
# build_pin.sh <base.png> <theme: neon|fire|snow> <out.gif>
# Offer text via env: PIN_HEAD, PIN_SUB, PIN_PRICE, [PIN_CTA].
# Renders pin_build2.py PNG frames then assembles an optimized looping GIF
# with a 2-pass ffmpeg palette (palettegen stats_mode=diff + paletteuse).
set -euo pipefail
base="$1"; theme="$2"; out="$3"
frdir="fr_$(basename "$out" .gif)"
rm -rf "$frdir"; mkdir -p "$frdir"
PY="${PYTHON:-/c/Users/givei/AppData/Local/Programs/Python/Python312/python}"
"$PY" -I pin_build2.py "$base" "$frdir" "$theme"
ffmpeg -y -loglevel error -framerate 12 -i "$frdir/f%02d.png" \
  -vf "fps=12,scale=1000:-1:flags=lanczos,palettegen=stats_mode=diff" "$frdir/pal.png"
ffmpeg -y -loglevel error -framerate 12 -i "$frdir/f%02d.png" -i "$frdir/pal.png" \
  -lavfi "fps=12,scale=1000:-1:flags=lanczos,paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle" \
  -loop 0 "$out"
echo "built $out ($(du -h "$out" | cut -f1))"

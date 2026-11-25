#!/usr/bin/env bash
# run-wave.sh <deals.psv> <rollout_base>
# deals.psv lines: id|slug|url  → sources + grades each into <base>/<slug>/out/.
# Prints: id|slug|STATUS|n_images  (STATUS: OK / SOURCE_FAIL / SKIP)
# Images are NOT upscaled (rollout speed) and NOT committed — a later step scp's them + inserts rows.
set -uo pipefail
SD="$(cd "$(dirname "$0")" && pwd)"
psv="${1:?deals.psv}"; base="${2:?rollout_base}"; mkdir -p "$base"
ledger="$base/_ledger.psv"
while IFS='|' read -r id slug url; do
  [ -z "${slug:-}" ] && continue
  cdir="$base/$slug/candidates"; odir="$base/$slug/out"; log="$base/$slug/run.log"
  mkdir -p "$base/$slug"
  if ! bash "$SD/source-images.sh" "$url" "$cdir" >"$log" 2>&1; then
    echo "$id|$slug|SOURCE_FAIL|0"; echo "$id|$slug|SOURCE_FAIL|0|$(date +%F)" >> "$ledger"; continue
  fi
  res="$(python -I "$SD/grade_pick.py" "$cdir" "$odir" 2>>"$log")"
  st="${res%% *}"; n="$(printf '%s' "$res" | grep -oE '[0-9]+' | head -1)"; n="${n:-0}"
  echo "$id|$slug|$st|$n"; echo "$id|$slug|$st|$n|$(date +%F)" >> "$ledger"
done < "$psv"

#!/usr/bin/env bash
# publish-wave.sh <rollout_base> <wave.psv>   (psv lines: id|slug|url)
# For each deal that produced images: scp its WebPs to the VPS public dir (NOT git) and
# insert deal_images rows (hero + gallery). Alt text is set from the deal's resort_name/city.
# Pages pick the new rows up via hourly ISR — no rebuild needed.
set -uo pipefail
base="${1:?rollout_base}"; psv="${2:?wave.psv}"
VPS="root@72.60.126.82"; DEST="/var/www/vacationdeals/apps/web/public/resort-images"
sql="$(mktemp)"; echo "BEGIN;" > "$sql"; pub=0
while IFS='|' read -r id slug url; do
  [ -z "${slug:-}" ] && continue
  od="$base/$slug/out"; [ -d "$od" ] || continue
  ls "$od"/*.webp >/dev/null 2>&1 || continue
  ssh -n -o StrictHostKeyChecking=no "$VPS" "mkdir -p '$DEST/$slug'" 2>/dev/null
  scp -q -o StrictHostKeyChecking=no "$od"/*.webp "$VPS:$DEST/$slug/" 2>/dev/null || { echo "scp-fail $slug"; continue; }
  echo "DELETE FROM deal_images WHERE deal_id=$id;" >> "$sql"
  so=1
  if [ -f "$od/hero.webp" ]; then
    echo "INSERT INTO deal_images(deal_id,url,alt,kind,sort_order,status) VALUES($id,'/resort-images/$slug/hero.webp',NULL,'hero',$so,'published');" >> "$sql"; so=$((so+1))
  fi
  for g in "$od"/gallery-*.webp; do
    [ -f "$g" ] || continue; bn="$(basename "$g")"
    echo "INSERT INTO deal_images(deal_id,url,alt,kind,sort_order,status) VALUES($id,'/resort-images/$slug/$bn',NULL,'gallery',$so,'published');" >> "$sql"; so=$((so+1))
  done
  pub=$((pub+1))
done < "$psv"
# Fill alt from the deal's resort name + city (one pass).
echo "UPDATE deal_images di SET alt = trim(both ' ' from coalesce(nullif(d.resort_name,''), d.title)) || CASE WHEN dest.city IS NOT NULL AND dest.city<>'' THEN ' resort — '||dest.city ELSE ' resort' END FROM deals d LEFT JOIN destinations dest ON dest.id=d.destination_id WHERE di.deal_id=d.id AND di.alt IS NULL;" >> "$sql"
echo "COMMIT;" >> "$sql"
scp -q -o StrictHostKeyChecking=no "$sql" "$VPS:/tmp/pub-wave.sql"
ssh -n -o StrictHostKeyChecking=no "$VPS" 'cd /var/www/vacationdeals && set -a && source .env && set +a && psql "$DATABASE_URL" -q -f /tmp/pub-wave.sql && rm -f /tmp/pub-wave.sql && echo PUBLISHED_OK && psql "$DATABASE_URL" -tA -c "select count(distinct deal_id) from deal_images where status='"'"'published'"'"'" | sed "s/^/total_deals_with_images=/"'
rm -f "$sql"
echo "deals_published_this_wave=$pub"

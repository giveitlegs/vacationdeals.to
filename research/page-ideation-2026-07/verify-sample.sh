#!/bin/bash
# Spot-check a sample of shipped niche pages: 200 status, BLUF box, FAQPage
# schema, and (for legal slugs) the "not legal advice" disclaimer.
BASE="https://vacationdeals.to"
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
SAMPLE=(
  vacation-package-price-index
  average-timeshare-presentation-deal-price
  timeshare-presentation-self-employed-income
  florida-timeshare-cancellation-rights
  mexico-timeshare-cancellation-rights
  orlando-resort-fee-database
  timeshare-presentation-hourly-rate-calculator
  westgate-vs-wyndham-orlando
  cheapest-presentation-deal-orlando-ranked
  vacation-deals-travel-nurses
  vacation-deals-dialysis-travelers
  branson-christmas-lights-vacation-deals
  parked-domain-vacation-sites-list
  glossary-vacpack
  glossary-rescission-period
)
LEGAL="florida-timeshare-cancellation-rights mexico-timeshare-cancellation-rights glossary-rescission-period timeshare-presentation-hourly-rate-calculator"
for s in "${SAMPLE[@]}"; do
  html=$(curl -sL --max-time 30 -A "$UA" "$BASE/$s")
  code=$(curl -sL -o /dev/null -w "%{http_code}" --max-time 30 -A "$UA" "$BASE/$s")
  bluf=$(echo "$html" | grep -c "Bottom Line Up Front")
  faq=$(echo "$html" | grep -c '"@type":"FAQPage"')
  disc=""
  if echo "$LEGAL" | grep -qw "$s"; then
    if echo "$html" | grep -q "not legal advice"; then disc="DISC:ok"; else disc="DISC:MISSING"; fi
  fi
  echo "$code bluf=$bluf faq=$faq $disc  /$s"
done

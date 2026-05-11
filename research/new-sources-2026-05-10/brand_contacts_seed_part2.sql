-- ============================================================
-- B2B Outreach Seed Data: Remaining 24 Brands (Part 2)
-- ============================================================
-- Researched 2026-05-10 from public sources: company websites,
-- BBB profiles, FL Sunbiz registrations, LinkedIn, Crunchbase,
-- press releases, hospitality trade publications.
--
-- Companion file to brand_contacts_seed.sql (top 15 brands).
-- Covers the 24 mid-tier brokers, Mexico/Caribbean direct
-- operators, and Marriott Vacations Worldwide sub-brands.
--
-- Rules followed:
--   * No emails or phones invented. NULL when not publicly listed.
--   * No home addresses, no personal cell phones.
--   * Acquired/subsidiary brands have parent_company set.
--   * Small brokers with no public exec data get HQ + parent_company
--     only; no fabricated contacts.
-- ============================================================


-- ============================================================
-- 1. BestVacationDealz
-- ============================================================
-- KEY FINDING: bestvacationdealz.com is operated by Westgate
-- Reservations (footer copyright "Westgate Reservations"). Site is
-- a Westgate marketing channel, not an independent broker.
UPDATE brands SET
  parent_company = 'Westgate Resorts / Central Florida Investments, Inc.',
  hq_address = '5601 Windhover Drive',
  hq_city = 'Orlando',
  hq_state = 'FL',
  hq_country = 'US',
  hq_zip = '32819',
  main_phone = '+1-800-269-2921',
  general_email = NULL,
  linkedin_url = NULL,
  crunchbase_url = NULL,
  ownership = 'subsidiary',
  year_founded = NULL,
  employee_count = NULL,
  est_revenue = NULL,
  contacts_last_researched_at = NOW(),
  updated_at = NOW()
WHERE slug = 'bestvacationdealz';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Parent CEO (Westgate)', 'Jim Gissy', NULL, NULL, NULL, 'company_website', 'https://www.bestvacationdealz.com/', 'high', 'BestVacationDealz is a Westgate marketing channel; reach via Westgate parent. See westgate brand row for full exec list.', NOW() FROM brands WHERE slug = 'bestvacationdealz';


-- ============================================================
-- 2. Departure Depot
-- ============================================================
-- Boutique travel concierge launched 2024 by Douglas Colson in
-- The Villages, FL. Storefront in Wildwood, FL. Offers "Resort
-- Preview Getaways" via partner timeshare developers.
UPDATE brands SET
  parent_company = NULL,
  hq_address = NULL,
  hq_city = 'Wildwood',
  hq_state = 'FL',
  hq_country = 'US',
  hq_zip = NULL,
  main_phone = NULL,
  general_email = NULL,
  linkedin_url = NULL,
  crunchbase_url = NULL,
  ownership = 'private',
  year_founded = 2024,
  employee_count = '1-50',
  est_revenue = NULL,
  contacts_last_researched_at = NOW(),
  updated_at = NOW()
WHERE slug = 'departure-depot';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Founder & Owner', 'Douglas Colson', NULL, NULL, NULL, 'press_release', 'https://lakeandsumterstyle.com/departure-depot-is-where-exceptional-journeys-begin/', 'high', 'Founded Departure Depot in 2024; prior career at Priceline + Expedia. Featured in Lake & Sumter Style magazine.', NOW() FROM brands WHERE slug = 'departure-depot';


-- ============================================================
-- 3. Discount Vacation Hotels
-- ============================================================
-- KEY FINDING: discountvacationhotels.com is operated by Westgate
-- via "Discovery Resort Marketing" (Central Florida Investments).
-- FL ST-32029 / ST-38016. Address matches Westgate corporate.
UPDATE brands SET
  parent_company = 'Westgate Resorts / Central Florida Investments, Inc.',
  hq_address = '10524 Moss Park Rd, Ste 204-729',
  hq_city = 'Orlando',
  hq_state = 'FL',
  hq_country = 'US',
  hq_zip = '32832',
  main_phone = '+1-800-372-0827',
  general_email = NULL,
  linkedin_url = NULL,
  crunchbase_url = NULL,
  ownership = 'subsidiary',
  year_founded = NULL,
  employee_count = NULL,
  est_revenue = NULL,
  contacts_last_researched_at = NOW(),
  updated_at = NOW()
WHERE slug = 'discount-vacation';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Parent CEO (Westgate)', 'Jim Gissy', NULL, NULL, NULL, 'company_website', 'https://www.discountvacationhotels.com/', 'high', 'Operated by Discovery Resort Marketing / Westgate; FL ST-32029. Reach via Westgate parent.', NOW() FROM brands WHERE slug = 'discount-vacation';


-- ============================================================
-- 4. GetawayDealz
-- ============================================================
-- KEY FINDING: GetawayDealz is owned by Nicolas J. Nelson /
-- Discovery Resort Marketing, Inc. — and Orlando99.com is the
-- SAME OPERATOR (alternate name per BBB filing).
UPDATE brands SET
  parent_company = 'Discovery Resort Marketing, Inc.',
  hq_address = '10524 Moss Park Rd, Ste 204-729',
  hq_city = 'Orlando',
  hq_state = 'FL',
  hq_country = 'US',
  hq_zip = '32832',
  main_phone = '+1-888-541-5714',
  general_email = NULL,
  linkedin_url = NULL,
  crunchbase_url = NULL,
  ownership = 'private',
  year_founded = 2010,
  employee_count = '1-50',
  est_revenue = NULL,
  contacts_last_researched_at = NOW(),
  updated_at = NOW()
WHERE slug = 'getawaydealz';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'President & Owner', 'Nicolas J. Nelson', NULL, NULL, NULL, 'company_website', 'https://www.bbb.org/us/fl/orlando/profile/vacation-certificates-and-vouchers/getawaydealzcom-0733-90168013', 'high', 'BBB profile: President/Owner. Incorporated Nov 24, 2010. Also operates Orlando99.com under same legal entity.', NOW() FROM brands WHERE slug = 'getawaydealz';


-- ============================================================
-- 5. GoVIP
-- ============================================================
-- Parked / monitored brand. No public exec data; status uncertain.
-- Some sources informally link govip.com to the Monster Vacations
-- / Fenderbosch family network in Myrtle Beach, but no public
-- confirmation found. Treat as unverified.
UPDATE brands SET
  parent_company = NULL,
  hq_address = NULL,
  hq_city = NULL,
  hq_state = NULL,
  hq_country = 'US',
  hq_zip = NULL,
  main_phone = NULL,
  general_email = NULL,
  linkedin_url = NULL,
  crunchbase_url = NULL,
  ownership = NULL,
  year_founded = NULL,
  employee_count = NULL,
  est_revenue = NULL,
  contacts_last_researched_at = NOW(),
  updated_at = NOW()
WHERE slug = 'govip';
-- No contacts inserted: no public executive data found.


-- ============================================================
-- 6. I Want To Travel To
-- ============================================================
-- KEY FINDING: Tom Bowman Jr. is the owner; site states packages
-- are fulfilled by Monster Reservations Group LLC. Independent
-- marketing affiliate of MRG. FL ST42014.
UPDATE brands SET
  parent_company = 'Monster Reservations Group LLC (fulfillment partner)',
  hq_address = NULL,
  hq_city = 'Port Orange',
  hq_state = 'FL',
  hq_country = 'US',
  hq_zip = NULL,
  main_phone = '+1-888-988-2256',
  general_email = NULL,
  linkedin_url = NULL,
  crunchbase_url = NULL,
  ownership = 'private',
  year_founded = NULL,
  employee_count = '1-50',
  est_revenue = NULL,
  contacts_last_researched_at = NOW(),
  updated_at = NOW()
WHERE slug = 'iwanttotravelto';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Owner', 'Tom Bowman Jr.', NULL, NULL, NULL, 'company_website', 'https://iwanttotravelto.com/', 'high', 'Independent marketing affiliate; fulfillment by MRG. FL ST42014, CA 2153955-50, WA 605-218-030. Solo operator.', NOW() FROM brands WHERE slug = 'iwanttotravelto';


-- ============================================================
-- 7. Las Vegas Timeshare (las-vegas-timeshare.com)
-- ============================================================
-- Bare-bones marketing site with no public exec data; site is
-- maintained by "eCommerce SEO Agency" (vendor, not operator).
-- No LLC or owner disclosed publicly.
UPDATE brands SET
  parent_company = NULL,
  hq_address = NULL,
  hq_city = 'Las Vegas',
  hq_state = 'NV',
  hq_country = 'US',
  hq_zip = NULL,
  main_phone = '+1-800-749-4045',
  general_email = NULL,
  linkedin_url = NULL,
  crunchbase_url = NULL,
  ownership = NULL,
  year_founded = NULL,
  employee_count = NULL,
  est_revenue = NULL,
  contacts_last_researched_at = NOW(),
  updated_at = NOW()
WHERE slug = 'vegas-timeshare';
-- No contacts inserted: no public executive data found.


-- ============================================================
-- 8. Legendary Vacation Club
-- ============================================================
-- KEY FINDING: Owned by RCD Hotels (Roberto Chapur's Mexican
-- hospitality group). Vacation ownership arm tied to Hard Rock
-- Hotels in Cancun/Vallarta/Punta Cana/Los Cabos/Riviera Maya.
UPDATE brands SET
  parent_company = 'RCD Hotels',
  hq_address = NULL,
  hq_city = 'Cancun',
  hq_state = 'Quintana Roo',
  hq_country = 'MX',
  hq_zip = NULL,
  main_phone = NULL,
  general_email = NULL,
  linkedin_url = 'https://mx.linkedin.com/company/legendary-vacation-club',
  crunchbase_url = NULL,
  ownership = 'subsidiary',
  year_founded = 1985,
  employee_count = '1001-5000',
  est_revenue = '$100M-$500M',
  contacts_last_researched_at = NOW(),
  updated_at = NOW()
WHERE slug = 'legendary';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Founder & President (RCD Hotels parent)', 'Roberto Chapur Duarte', NULL, NULL, NULL, 'press_release', 'https://www.reportur.com/tag/roberto-chapur/', 'high', 'Mexican entrepreneur; founded RCD Hotels 1985; opened first all-inclusive (Beach Palace) in Cancun.', NOW() FROM brands WHERE slug = 'legendary';


-- ============================================================
-- 9. Massanutten Resort
-- ============================================================
-- Owned by Great Eastern Resort Corporation (formed 1984 by
-- C. Dice Hammer and Jim Lambert after Massanutten bankruptcy).
-- McGaheysville, VA.
UPDATE brands SET
  parent_company = 'Great Eastern Resort Corporation',
  hq_address = '1822 Resort Drive',
  hq_city = 'McGaheysville',
  hq_state = 'VA',
  hq_country = 'US',
  hq_zip = '22840',
  main_phone = '+1-540-289-9441',
  general_email = NULL,
  linkedin_url = NULL,
  crunchbase_url = NULL,
  ownership = 'private',
  year_founded = 1984,
  employee_count = '501-1000',
  est_revenue = '$50M-$100M',
  contacts_last_researched_at = NOW(),
  updated_at = NOW()
WHERE slug = 'massanutten';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Key Principal', 'Mak Koebig', NULL, NULL, NULL, 'crunchbase', 'https://www.dnb.com/business-directory/company-profiles.great_eastern_resort_management_inc.6c80adafb4ed606c257031e76c6a92cb.html', 'medium', 'Listed as key principal at Great Eastern Resort Management per D&B.', NOW() FROM brands WHERE slug = 'massanutten';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'CFO', 'Tom Waterbury', NULL, '+1-540-289-9441', NULL, 'crunchbase', 'https://www.buzzfile.com/business/Massanutten-Resort-540-289-9441', 'medium', 'CFO at Great Eastern Resort Management per Buzzfile.', NOW() FROM brands WHERE slug = 'massanutten';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'General Manager & VP', 'Michael Hammes', NULL, NULL, NULL, 'press_release', 'https://www.dnb.com/business-directory/company-profiles.great_eastern_resort_management_inc.6c80adafb4ed606c257031e76c6a92cb.html', 'medium', 'Recently appointed General Manager and Vice President of Massanutten Resort.', NOW() FROM brands WHERE slug = 'massanutten';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Co-Founder (Great Eastern)', 'C. Dice Hammer', NULL, NULL, NULL, 'press_release', 'https://www.vpap.org/lobbying/client/361653-great-eastern-resort-management/', 'medium', 'Co-founded Great Eastern Resort Associates in Aug 1984; rescued Massanutten from bankruptcy.', NOW() FROM brands WHERE slug = 'massanutten';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Co-Founder (Great Eastern)', 'Jim Lambert', NULL, NULL, NULL, 'press_release', 'https://www.vpap.org/lobbying/client/361653-great-eastern-resort-management/', 'medium', 'Co-founded Great Eastern Resort Associates in Aug 1984.', NOW() FROM brands WHERE slug = 'massanutten';


-- ============================================================
-- 10. PayVibe Travel
-- ============================================================
-- Sparse public data. travel.payvibe.com appears to resell vacation
-- packages from various developers but no LLC, exec, or HQ data
-- found via public sources.
UPDATE brands SET
  parent_company = NULL,
  hq_address = NULL,
  hq_city = NULL,
  hq_state = NULL,
  hq_country = 'US',
  hq_zip = NULL,
  main_phone = NULL,
  general_email = NULL,
  linkedin_url = NULL,
  crunchbase_url = NULL,
  ownership = NULL,
  year_founded = NULL,
  employee_count = NULL,
  est_revenue = NULL,
  contacts_last_researched_at = NOW(),
  updated_at = NOW()
WHERE slug = 'payvibe';
-- No contacts inserted: no public executive data found.


-- ============================================================
-- 11. Premier Travel Resorts
-- ============================================================
-- Premier Travel Resorts, LLC. FL ST38926. Orlando-based.
-- No public executive data; small operator.
UPDATE brands SET
  parent_company = NULL,
  hq_address = NULL,
  hq_city = 'Orlando',
  hq_state = 'FL',
  hq_country = 'US',
  hq_zip = NULL,
  main_phone = '+1-407-217-1090',
  general_email = NULL,
  linkedin_url = NULL,
  crunchbase_url = NULL,
  ownership = 'private',
  year_founded = NULL,
  employee_count = '1-50',
  est_revenue = NULL,
  contacts_last_researched_at = NOW(),
  updated_at = NOW()
WHERE slug = 'premier-travel';
-- No contacts inserted: no public executive data found. Recommend
-- FL Sunbiz lookup for registered agent / manager name.


-- ============================================================
-- 12. TAFER Hotels & Resorts
-- ============================================================
-- Mexican hospitality group. Owns Garza Blanca, Hotel Mousai,
-- Villa del Palmar (note: TAFER also operates some "Villa del
-- Palmar" properties; the Villa Group is a separate sister org).
-- Headquarters in Puerto Vallarta.
UPDATE brands SET
  parent_company = 'TAFER Resorts Management S.A. de C.V.',
  hq_address = 'Garza Blanca Preserve',
  hq_city = 'Puerto Vallarta',
  hq_state = 'Jalisco',
  hq_country = 'MX',
  hq_zip = NULL,
  main_phone = NULL,
  general_email = NULL,
  linkedin_url = 'https://www.linkedin.com/company/tafer-hotels-resorts',
  crunchbase_url = NULL,
  ownership = 'private',
  year_founded = 2008,
  employee_count = '1001-5000',
  est_revenue = '$100M-$500M',
  contacts_last_researched_at = NOW(),
  updated_at = NOW()
WHERE slug = 'tafer';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'COO', 'Sasa Milojevic', NULL, NULL, NULL, 'press_release', 'https://www.hospitalitynet.org/organization/17022697.html', 'medium', 'Chief Operating Officer for TAFER Hotels & Resorts per Hospitality Net.', NOW() FROM brands WHERE slug = 'tafer';


-- ============================================================
-- 13. Timeshare Presentation Deals
-- ============================================================
-- timesharepresentationdeals.com — fetch returned 403; minimal
-- public data. Operates in the Orlando timeshare promo space.
-- No LLC or owner publicly disclosed without paid records.
UPDATE brands SET
  parent_company = NULL,
  hq_address = NULL,
  hq_city = 'Orlando',
  hq_state = 'FL',
  hq_country = 'US',
  hq_zip = NULL,
  main_phone = NULL,
  general_email = NULL,
  linkedin_url = NULL,
  crunchbase_url = NULL,
  ownership = 'private',
  year_founded = NULL,
  employee_count = '1-50',
  est_revenue = NULL,
  contacts_last_researched_at = NOW(),
  updated_at = NOW()
WHERE slug = 'timeshare-presentation-deals';
-- No contacts inserted: no public executive data found.


-- ============================================================
-- 14. Vacation Offer
-- ============================================================
-- VacationOffer.com / VO Travel Club. Founded by Terry Allen,
-- CEO. HQ in Cedar City, UT, with offices in Las Vegas, Orlando,
-- Fort Lauderdale, Gainesville.
UPDATE brands SET
  parent_company = NULL,
  hq_address = NULL,
  hq_city = 'Cedar City',
  hq_state = 'UT',
  hq_country = 'US',
  hq_zip = NULL,
  main_phone = NULL,
  general_email = NULL,
  linkedin_url = NULL,
  crunchbase_url = NULL,
  ownership = 'private',
  year_founded = NULL,
  employee_count = '201-500',
  est_revenue = '$10M-$50M',
  contacts_last_researched_at = NOW(),
  updated_at = NOW()
WHERE slug = 'vacation-offer';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Founder & CEO', 'Terry Allen', NULL, NULL, NULL, 'company_website', 'https://alachuachronicle.com/a-homegrown-success-story-comes-to-gainesville/', 'high', 'Founder & CEO. Started as 18yo telemarketer; built VO Travel Club to 1.5M+ customers across 5 US offices.', NOW() FROM brands WHERE slug = 'vacation-offer';


-- ============================================================
-- 15. VacationVIP
-- ============================================================
-- KEY FINDING: vacationvip.com is operated by Sogno Tours, LLC.
-- FL ST44683. Note: BBB shows the original "Vacation VIP, LLC"
-- entity as "out of business" — Sogno Tours appears to be a
-- successor entity operating the same brand. No public exec data.
UPDATE brands SET
  parent_company = 'Sogno Tours, LLC',
  hq_address = '5900 Lake Ellenor Drive, Suite 300',
  hq_city = 'Orlando',
  hq_state = 'FL',
  hq_country = 'US',
  hq_zip = '32809',
  main_phone = '+1-800-266-0602',
  general_email = NULL,
  linkedin_url = NULL,
  crunchbase_url = NULL,
  ownership = 'private',
  year_founded = NULL,
  employee_count = '1-50',
  est_revenue = NULL,
  contacts_last_researched_at = NOW(),
  updated_at = NOW()
WHERE slug = 'vacationvip';
-- No contacts inserted: no public exec data; recommend FL Sunbiz
-- lookup of Sogno Tours, LLC for registered agent / manager.


-- ============================================================
-- 16. Westgate Events
-- ============================================================
-- Sub-brand of Westgate Resorts for entertainment/concert
-- packages at Westgate Las Vegas Resort & Casino. Same corporate
-- parent as Westgate (Central Florida Investments).
UPDATE brands SET
  parent_company = 'Central Florida Investments, Inc. / Westgate Resorts',
  hq_address = '3000 Paradise Rd',
  hq_city = 'Las Vegas',
  hq_state = 'NV',
  hq_country = 'US',
  hq_zip = '89109',
  main_phone = '+1-702-732-5111',
  general_email = NULL,
  linkedin_url = NULL,
  crunchbase_url = NULL,
  ownership = 'subsidiary',
  year_founded = NULL,
  employee_count = NULL,
  est_revenue = NULL,
  contacts_last_researched_at = NOW(),
  updated_at = NOW()
WHERE slug = 'westgate-events';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Parent CEO (Westgate)', 'Jim Gissy', NULL, NULL, NULL, 'company_website', 'https://www.westgateresorts.com/executive-team/', 'high', 'Westgate Events is a Westgate Las Vegas entertainment division; reach via Westgate parent exec list.', NOW() FROM brands WHERE slug = 'westgate-events';


-- ============================================================
-- 17. Timeshare Vacation Packages
-- ============================================================
-- KEY FINDING: Same operator as #18 Timeshare Orlando — both are
-- divisions of Timeshare Orlando Marketing Group, LLC. FL ST35208.
-- Note: All Inclusive Promotions (allinclusivepromotions.com) is
-- also commonly associated with this FL ST# operator family.
UPDATE brands SET
  parent_company = 'Timeshare Orlando Marketing Group, LLC',
  hq_address = '7380 Sand Lake Rd, Suite 500',
  hq_city = 'Orlando',
  hq_state = 'FL',
  hq_country = 'US',
  hq_zip = '32819',
  main_phone = '+1-866-850-9535',
  general_email = NULL,
  linkedin_url = NULL,
  crunchbase_url = NULL,
  ownership = 'subsidiary',
  year_founded = 2002,
  employee_count = '1-50',
  est_revenue = NULL,
  contacts_last_researched_at = NOW(),
  updated_at = NOW()
WHERE slug = 'timeshare-vacation-packages';
-- No contacts inserted: owners of Timeshare Orlando Marketing
-- Group, LLC not publicly disclosed. Recommend FL Sunbiz lookup.


-- ============================================================
-- 18. Timeshare Orlando
-- ============================================================
-- Parent: Timeshare Orlando Marketing Group, LLC. FL ST35208.
-- Same operator as #17.
UPDATE brands SET
  parent_company = 'Timeshare Orlando Marketing Group, LLC',
  hq_address = '7380 Sand Lake Rd, Suite 500',
  hq_city = 'Orlando',
  hq_state = 'FL',
  hq_country = 'US',
  hq_zip = '32819',
  main_phone = '+1-866-850-9535',
  general_email = NULL,
  linkedin_url = NULL,
  crunchbase_url = NULL,
  ownership = 'subsidiary',
  year_founded = 2002,
  employee_count = '1-50',
  est_revenue = NULL,
  contacts_last_researched_at = NOW(),
  updated_at = NOW()
WHERE slug = 'timeshare-orlando';
-- No contacts inserted: same operator as #17; FL Sunbiz lookup
-- of Timeshare Orlando Marketing Group, LLC needed for principals.


-- ============================================================
-- 19. Orlando99
-- ============================================================
-- KEY FINDING: orlando99.com is an alternate name of GetawayDealz
-- per BBB filing (Discovery Resort Marketing, Inc. — Nicolas J.
-- Nelson). Same operator as #4.
UPDATE brands SET
  parent_company = 'Discovery Resort Marketing, Inc.',
  hq_address = '10524 Moss Park Rd, Ste 204-729',
  hq_city = 'Orlando',
  hq_state = 'FL',
  hq_country = 'US',
  hq_zip = '32832',
  main_phone = '+1-888-541-5714',
  general_email = NULL,
  linkedin_url = NULL,
  crunchbase_url = NULL,
  ownership = 'private',
  year_founded = 2010,
  employee_count = '1-50',
  est_revenue = NULL,
  contacts_last_researched_at = NOW(),
  updated_at = NOW()
WHERE slug = 'orlando99';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'President & Owner', 'Nicolas J. Nelson', NULL, NULL, NULL, 'company_website', 'https://www.bbb.org/us/fl/orlando/profile/vacation-certificates-and-vouchers/getawaydealzcom-0733-90168013', 'high', 'Same operator as GetawayDealz (BBB alternate-name disclosure).', NOW() FROM brands WHERE slug = 'orlando99';


-- ============================================================
-- 20. Bahia Principe Privilege Club
-- ============================================================
-- Vacation ownership arm of Bahia Principe Hotels & Resorts.
-- Parent: Grupo Piñero (Spain). MAJOR: 2024 Hyatt JV announced;
-- 2025 finalized. Encarna Piñero is Global CEO of Grupo Piñero;
-- Julio Pérez is CEO of Bahia Principe brand specifically.
UPDATE brands SET
  parent_company = 'Grupo Piñero (Hyatt JV partner since 2025)',
  hq_address = 'Plaza Mediterráneo, 5',
  hq_city = 'Palma de Mallorca',
  hq_state = 'Balearic Islands',
  hq_country = 'ES',
  hq_zip = '07014',
  main_phone = NULL,
  general_email = NULL,
  linkedin_url = 'https://www.linkedin.com/company/grupo-pinero',
  crunchbase_url = NULL,
  ownership = 'private',
  year_founded = 1975,
  employee_count = '5001+',
  est_revenue = '$1B+',
  contacts_last_researched_at = NOW(),
  updated_at = NOW()
WHERE slug = 'bahia-principe';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Global CEO (Grupo Piñero parent)', 'Encarna Piñero', NULL, NULL, NULL, 'press_release', 'https://www.hotel-online.com/press_releases/release/grupo-pinero-bahia-principes-parent-company-names-encarna-pinero-ceo/', 'high', 'Global CEO since 2017; daughter of founder Pablo Piñero. Drove Hyatt JV deal.', NOW() FROM brands WHERE slug = 'bahia-principe';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'CEO Bahia Principe brand', 'Julio Pérez', NULL, NULL, NULL, 'press_release', 'https://newsroom.hyatt.com/news-releases?item=124581', 'high', 'CEO of Bahia Principe Hotels & Resorts brand; reports to Encarna Piñero.', NOW() FROM brands WHERE slug = 'bahia-principe';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Chief Sustainability Officer', 'Isabel Piñero', NULL, NULL, NULL, 'press_release', 'https://www.hotel-online.com/press_releases/release/grupo-pinero-bahia-principes-parent-company-names-encarna-pinero-ceo/', 'medium', 'Sister of Encarna; Grupo Piñero family leadership team.', NOW() FROM brands WHERE slug = 'bahia-principe';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Chair of Investment Committee', 'Lydia Piñero', NULL, NULL, NULL, 'press_release', 'https://www.hotel-online.com/press_releases/release/grupo-pinero-bahia-principes-parent-company-names-encarna-pinero-ceo/', 'medium', 'Sister of Encarna; Grupo Piñero family leadership team.', NOW() FROM brands WHERE slug = 'bahia-principe';


-- ============================================================
-- 21. Divi Resorts
-- ============================================================
-- Caribbean resort operator (Aruba, Barbados, St. Maarten,
-- St. Croix, Bonaire). HQ in Chapel Hill, NC. Founded 1969.
UPDATE brands SET
  parent_company = 'Divi Resorts, Inc.',
  hq_address = '6320 Quadrangle Drive',
  hq_city = 'Chapel Hill',
  hq_state = 'NC',
  hq_country = 'US',
  hq_zip = '27517',
  main_phone = '+1-919-419-3484',
  general_email = NULL,
  linkedin_url = 'https://www.linkedin.com/company/divi-resorts',
  crunchbase_url = 'https://www.crunchbase.com/organization/divi-resorts',
  ownership = 'private',
  year_founded = 1969,
  employee_count = '1001-5000',
  est_revenue = '$100M-$500M',
  contacts_last_researched_at = NOW(),
  updated_at = NOW()
WHERE slug = 'divi';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'President & COO', 'Marco Galaverna', NULL, NULL, 'https://www.linkedin.com/in/marco-galaverna', 'linkedin', 'https://theorg.com/org/divi-resorts/org-chart/marco-galaverna', 'high', 'President & Chief Operating Officer. Highest-ranking exec listed publicly.', NOW() FROM brands WHERE slug = 'divi';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'CFO', 'Perry W. Meister', NULL, NULL, NULL, 'crunchbase', 'https://www.zoominfo.com/c/divi-resorts/35359916', 'medium', 'Chief Financial Officer per ZoomInfo.', NOW() FROM brands WHERE slug = 'divi';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Director Marketing & Brand Strategy', 'Beverley David', NULL, NULL, NULL, 'crunchbase', 'https://www.zoominfo.com/c/divi-resorts/35359916', 'medium', 'Marketing/brand lead — partnerships outreach contact.', NOW() FROM brands WHERE slug = 'divi';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Corporate Director of HR', 'Carla Bostick', NULL, NULL, NULL, 'crunchbase', 'https://www.zoominfo.com/c/divi-resorts/35359916', 'low', NULL, NOW() FROM brands WHERE slug = 'divi';


-- ============================================================
-- 22. El Cid Vacations Club
-- ============================================================
-- Vacation ownership arm of Grupo El Cid Resorts. Founded 1972
-- by Don Julio Berdegué (died 2007). Son Carlos Berdegué Sacristán
-- is current President & CEO. HQ in Mazatlán, Sinaloa.
UPDATE brands SET
  parent_company = 'Grupo El Cid Resorts',
  hq_address = NULL,
  hq_city = 'Mazatlán',
  hq_state = 'Sinaloa',
  hq_country = 'MX',
  hq_zip = NULL,
  main_phone = NULL,
  general_email = NULL,
  linkedin_url = 'https://www.linkedin.com/company/grupo-el-cid-resorts',
  crunchbase_url = NULL,
  ownership = 'private',
  year_founded = 1972,
  employee_count = '1001-5000',
  est_revenue = '$100M-$500M',
  contacts_last_researched_at = NOW(),
  updated_at = NOW()
WHERE slug = 'el-cid';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'President & CEO', 'Carlos Berdegué Sacristán', NULL, NULL, NULL, 'company_website', 'https://elcidvacationsclub.com/about-us/', 'high', 'Son of founder Julio Berdegué; runs Grupo El Cid since 2007.', NOW() FROM brands WHERE slug = 'el-cid';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Founder (deceased 2007)', 'Julio Berdegué', NULL, NULL, NULL, 'press_release', 'https://www.hotelnewsresource.com/article27333.html', 'high', 'Founded El Cid in 1972 in Mazatlán; passed April 21, 2007.', NOW() FROM brands WHERE slug = 'el-cid';


-- ============================================================
-- 23. Margaritaville Vacation Club
-- ============================================================
-- Vacation ownership brand within Travel + Leisure Co. (T+L Co.,
-- NYSE: TNL), part of the Wyndham vacation-club portfolio. Same
-- corporate parent as Club Wyndham and WorldMark by Wyndham.
UPDATE brands SET
  parent_company = 'Travel + Leisure Co. (NYSE: TNL)',
  hq_address = '6277 Sea Harbor Drive',
  hq_city = 'Orlando',
  hq_state = 'FL',
  hq_country = 'US',
  hq_zip = '32821',
  main_phone = '+1-407-626-5200',
  general_email = NULL,
  linkedin_url = 'https://www.linkedin.com/showcase/margaritaville-vacation-club',
  crunchbase_url = NULL,
  ownership = 'subsidiary',
  year_founded = 2017,
  employee_count = '1001-5000',
  est_revenue = NULL,
  contacts_last_researched_at = NOW(),
  updated_at = NOW()
WHERE slug = 'margaritaville';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Parent President & CEO (T+L Co.)', 'Michael D. Brown', NULL, NULL, NULL, 'company_website', 'https://www.travelandleisureco.com/us/en/our-leadership', 'high', 'CEO Travel + Leisure Co. since 2017; oversees Margaritaville VC and Wyndham vacation clubs.', NOW() FROM brands WHERE slug = 'margaritaville';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'EVP & Chief Brand Officer (T+L Co.)', 'Noah Brodsky', NULL, NULL, NULL, 'company_website', 'https://www.travelandleisureco.com/us/en/our-leadership', 'high', 'Brand strategy for T+L Co. vacation-club portfolio including Margaritaville VC.', NOW() FROM brands WHERE slug = 'margaritaville';


-- ============================================================
-- 24. Pueblo Bonito Resorts
-- ============================================================
-- Mexican luxury resort group. Founded by Ernesto Coppel
-- (Chairman). Headquartered in Mazatlán, Sinaloa. ~4,500
-- employees. Properties in Mazatlán, Cabo San Lucas, Quivira.
UPDATE brands SET
  parent_company = 'Pueblo Bonito Golf & Spa Resorts',
  hq_address = '201 Av. Ernesto Coppel Campaña',
  hq_city = 'Mazatlán',
  hq_state = 'Sinaloa',
  hq_country = 'MX',
  hq_zip = '82110',
  main_phone = '+52-669-989-0525',
  general_email = NULL,
  linkedin_url = 'https://www.linkedin.com/company/pueblo-bonito-golf-and-spa-resorts',
  crunchbase_url = 'https://www.crunchbase.com/organization/pueblo-bonito',
  ownership = 'private',
  year_founded = 1986,
  employee_count = '1001-5000',
  est_revenue = '$100M-$500M',
  contacts_last_researched_at = NOW(),
  updated_at = NOW()
WHERE slug = 'pueblo-bonito';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Founder & Chairman', 'Ernesto Coppel Kelly', NULL, NULL, NULL, 'crunchbase', 'https://www.crunchbase.com/person/ernesto-coppel-kelly', 'high', 'Founder; visionary developer of Pueblo Bonito + Quivira Los Cabos. Still Chairman.', NOW() FROM brands WHERE slug = 'pueblo-bonito';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'CEO', 'Alberto Ernesto Coppel', NULL, NULL, NULL, 'crunchbase', 'https://theorg.com/org/pueblo-bonito-golf-and-spa-resorts/org-chart/alberto-ernesto-coppel', 'high', 'CEO per TheOrg/Crunchbase. Son of founder Ernesto Coppel.', NOW() FROM brands WHERE slug = 'pueblo-bonito';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Executive (family team)', 'Jose Ernesto Coppel Osuna', NULL, NULL, NULL, 'crunchbase', 'https://contactout.com/jose-ernesto-coppel-osuna-25606', 'low', 'Family-member executive at Pueblo Bonito per ContactOut.', NOW() FROM brands WHERE slug = 'pueblo-bonito';


-- ============================================================
-- 25. Villa Group Resorts
-- ============================================================
-- Mexican family-owned resort + real estate developer. Owen
-- Perry is Co-Owner & President. Owners include Fernando
-- Gonzalez Corona, Owen Perry, Luz Maria Torres. Properties in
-- Puerto Vallarta, Cabo, Cancun, Loreto, Riviera Nayarit.
UPDATE brands SET
  parent_company = NULL,
  hq_address = NULL,
  hq_city = 'Puerto Vallarta',
  hq_state = 'Jalisco',
  hq_country = 'MX',
  hq_zip = NULL,
  main_phone = '+52-322-226-1400',
  general_email = NULL,
  linkedin_url = 'https://www.linkedin.com/company/the-villa-group-resorts',
  crunchbase_url = 'https://www.crunchbase.com/organization/the-villa-group-resorts',
  ownership = 'private',
  year_founded = 1984,
  employee_count = '1001-5000',
  est_revenue = '$100M-$500M',
  contacts_last_researched_at = NOW(),
  updated_at = NOW()
WHERE slug = 'villa-group';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Co-Owner & President', 'Owen Perry', NULL, NULL, NULL, 'crunchbase', 'https://www.zoominfo.com/p/Owen-Perry/1670709960', 'high', 'Co-Owner & President; featured in Baja Traveler / HOMBRE Magazine. Public face of Villa Group.', NOW() FROM brands WHERE slug = 'villa-group';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Co-Owner', 'Fernando Gonzalez Corona', NULL, NULL, NULL, 'press_release', 'https://www.travelagewest.com/News/Industry-Interviews/Villa-Group-Unveiled', 'medium', 'Co-owner of Villa Group per Travel Age West interview.', NOW() FROM brands WHERE slug = 'villa-group';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Co-Owner', 'Luz Maria Torres', NULL, NULL, NULL, 'press_release', 'https://www.travelagewest.com/News/Industry-Interviews/Villa-Group-Unveiled', 'medium', 'Co-owner of Villa Group per Travel Age West interview.', NOW() FROM brands WHERE slug = 'villa-group';


-- ============================================================
-- 26. Sheraton Vacation Club
-- ============================================================
-- Brand within Marriott Vacations Worldwide (MVW, NYSE: VAC).
-- Acquired in 2018 ILG/Vistana acquisition. Brand portfolio
-- includes ~9 Sheraton-branded vacation ownership resorts (FL,
-- SC, CO). Mike Flaskey (new MVW President/COO Feb 2026)
-- previously developed experiential strategy for this brand
-- at Starwood Vacation Ownership.
UPDATE brands SET
  parent_company = 'Marriott Vacations Worldwide (NYSE: VAC)',
  hq_address = '6649 Westwood Blvd, Suite 500',
  hq_city = 'Orlando',
  hq_state = 'FL',
  hq_country = 'US',
  hq_zip = '32821',
  main_phone = '+1-407-206-6000',
  general_email = NULL,
  linkedin_url = 'https://www.linkedin.com/company/marriott-vacations-worldwide',
  crunchbase_url = 'https://www.crunchbase.com/organization/marriott-vacations-worldwide',
  ownership = 'subsidiary',
  year_founded = 1991,
  employee_count = '5001+',
  est_revenue = '$1B+',
  contacts_last_researched_at = NOW(),
  updated_at = NOW()
WHERE slug = 'sheraton-vc';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Parent CEO (MVW)', 'Matthew E. Avril', NULL, NULL, NULL, 'press_release', 'https://www.marriottvacationsworldwide.com/2026/02/marriott-vacations-worldwide-announces-leadership-appointments/', 'high', 'CEO of MVW since Feb 2026 (interim since Nov 2025). 30+ yrs hospitality.', NOW() FROM brands WHERE slug = 'sheraton-vc';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Parent President & COO (MVW)', 'Michael A. Flaskey', NULL, NULL, NULL, 'press_release', 'https://www.marriottvacationsworldwide.com/2026/02/marriott-vacations-worldwide-announces-leadership-appointments/', 'high', 'Joined MVW Feb 2026. Previously developed experiential strategy for Sheraton VC + Westin VC at Starwood Vacation Ownership. Brand-aware contact for both subs.', NOW() FROM brands WHERE slug = 'sheraton-vc';


-- ============================================================
-- 27. Westin Vacation Club
-- ============================================================
-- Brand within Marriott Vacations Worldwide (MVW, NYSE: VAC).
-- Same parent + exec team as Sheraton VC (both came over in 2018
-- ILG/Vistana acquisition).
UPDATE brands SET
  parent_company = 'Marriott Vacations Worldwide (NYSE: VAC)',
  hq_address = '6649 Westwood Blvd, Suite 500',
  hq_city = 'Orlando',
  hq_state = 'FL',
  hq_country = 'US',
  hq_zip = '32821',
  main_phone = '+1-407-206-6000',
  general_email = NULL,
  linkedin_url = 'https://www.linkedin.com/company/marriott-vacations-worldwide',
  crunchbase_url = 'https://www.crunchbase.com/organization/marriott-vacations-worldwide',
  ownership = 'subsidiary',
  year_founded = 1991,
  employee_count = '5001+',
  est_revenue = '$1B+',
  contacts_last_researched_at = NOW(),
  updated_at = NOW()
WHERE slug = 'westin-vc';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Parent CEO (MVW)', 'Matthew E. Avril', NULL, NULL, NULL, 'press_release', 'https://www.marriottvacationsworldwide.com/2026/02/marriott-vacations-worldwide-announces-leadership-appointments/', 'high', 'Same MVW exec team as Sheraton VC.', NOW() FROM brands WHERE slug = 'westin-vc';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Parent President & COO (MVW)', 'Michael A. Flaskey', NULL, NULL, NULL, 'press_release', 'https://www.marriottvacationsworldwide.com/2026/02/marriott-vacations-worldwide-announces-leadership-appointments/', 'high', 'Brand-aware contact: previously ran Westin VC + Sheraton VC strategy at Starwood Vacation Ownership.', NOW() FROM brands WHERE slug = 'westin-vc';


-- ============================================================
-- END-OF-FILE SUMMARY
-- ============================================================
/*

BRANDS FULLY RESEARCHED (with named contacts):
  1.  BestVacationDealz       — Westgate-owned; reuse Westgate execs
  2.  Departure Depot          — Douglas Colson (Owner)
  3.  Discount Vacation Hotels — Westgate-owned; reuse Westgate execs
  4.  GetawayDealz             — Nicolas J. Nelson (President/Owner)
  6.  I Want To Travel To      — Tom Bowman Jr. (Owner)
  8.  Legendary Vacation Club  — Roberto Chapur Duarte (RCD Hotels)
  9.  Massanutten Resort       — 5 contacts (Great Eastern Resort)
  12. TAFER Hotels & Resorts   — Sasa Milojevic (COO)
  14. Vacation Offer           — Terry Allen (Founder/CEO)
  16. Westgate Events          — Westgate sub-brand
  19. Orlando99                — Same as GetawayDealz
  20. Bahia Principe           — 4 contacts (Grupo Piñero family)
  21. Divi Resorts             — 4 contacts (Galaverna, Meister, David, Bostick)
  22. El Cid Vacations Club    — Carlos Berdegué Sacristán + founder
  23. Margaritaville VC        — Brown + Brodsky (T+L Co. parent)
  24. Pueblo Bonito            — 3 contacts (Coppel family)
  25. Villa Group              — 3 contacts (Perry, Gonzalez Corona, Torres)
  26. Sheraton VC              — Avril + Flaskey (MVW parent)
  27. Westin VC                — Avril + Flaskey (MVW parent)
  17. Timeshare Vacation Pkgs  — HQ only (same FL operator as #18)
  18. Timeshare Orlando        — HQ only (Timeshare Orlando Marketing Group, LLC)

BRANDS WITH HQ-ONLY (no public exec data, no contacts inserted):
  5.  GoVIP                       — defunct/parked; no public data
  7.  Las Vegas Timeshare         — bare-bones SEO site
  10. PayVibe Travel              — minimal public footprint
  11. Premier Travel Resorts      — small Orlando LLC; needs Sunbiz lookup
  13. Timeshare Presentation Deals — 403 on direct fetch; opaque
  15. VacationVIP                  — Sogno Tours, LLC; original entity defunct

TOTAL COUNTS:
  * 27 brands updated (HQ metadata)
  * ~40 named contacts inserted across 19 brands
  * 6 brands left contactless (intentional — no public data; flagged
    for FL Sunbiz / paid data follow-up)

NOTABLE FINDINGS:

1. WESTGATE CHANNEL NETWORK:
   - BestVacationDealz, Discount Vacation Hotels, Westgate Events
     are ALL Westgate-operated marketing channels (not independent
     brokers). Three brand rows roll up to one B2B contact set
     (Jim Gissy / Jared Saft / John Willman per westgate brand).
   - Outreach to any of these brands should go through Westgate
     corporate, not the individual sites.

2. DISCOVERY RESORT MARKETING / NICOLAS NELSON NETWORK:
   - GetawayDealz and Orlando99 are the SAME OPERATOR — Discovery
     Resort Marketing, Inc., owned by Nicolas J. Nelson, Orlando.
   - Two brand rows, one decision-maker. Note: "Discovery Resort
     Marketing" name is similar to but distinct from Westgate's
     Discovery program — these are different entities at the same
     Moss Park Rd address (suite differs).

3. TIMESHARE ORLANDO MARKETING GROUP NETWORK:
   - Timeshare Orlando + Timeshare Vacation Packages are both
     divisions of Timeshare Orlando Marketing Group, LLC (FL
     ST35208, since 2002).
   - All Inclusive Promotions (allinclusivepromotions.com, slug
     'all-inclusive-promotions' — separate brand row) is also
     associated with the ST35208 operator family per the project
     CLAUDE.md.
   - LLC principal names not publicly disclosed; FL Sunbiz lookup
     of the LLC at 7380 Sand Lake Rd, Suite 500 is recommended
     to identify decision-maker.

4. MONSTER RESERVATIONS GROUP AFFILIATE NETWORK:
   - I Want To Travel To is run by Tom Bowman Jr. as an independent
     marketing affiliate, but packages are FULFILLED by MRG.
   - MRG (Andrew Fenderbosch, already in part 1 file) is the
     decision-maker for actual deal terms.

5. MVW SUB-BRAND CONSOLIDATION:
   - Sheraton VC + Westin VC share the SAME exec team as MVW
     parent (Avril, Flaskey, plus existing MVW contacts in part 1).
   - Important: Mike Flaskey (joined MVW Feb 2026 as President/COO)
     previously ran experiential strategy for BOTH brands at
     Starwood Vacation Ownership pre-2018. He is the most brand-
     aware contact for Sheraton VC / Westin VC partnerships.
   - TAFER is unrelated to MVW despite shared Mexican-resort space.

6. BAHIA PRINCIPE — HYATT JV (2025):
   - Encarna Piñero (Global CEO, Grupo Piñero) finalized the
     strategic JV with Hyatt in 2025 to grow the Bahia Principe
     brand. Bahia Principe Privilege Club (the timeshare arm) is
     now indirectly tied to Hyatt's all-inclusive portfolio. For
     B2B outreach, Encarna Piñero or brand CEO Julio Pérez are
     primary contacts; Hyatt corporate is now an indirect partner.

7. PUEBLO BONITO / EL CID — FAMILY-RUN MEXICAN GROUPS:
   - Both are 2nd-generation family-owned (Coppel family at
     Pueblo Bonito; Berdegué family at El Cid). Decision-making
     stays within the family. Direct outreach to the CEO is the
     only practical path.

8. VILLA GROUP — OWEN PERRY IS THE PUBLIC FACE:
   - Trade press consistently features Owen Perry as the
     spokesperson and primary partnership contact. The other
     co-owners (Gonzalez Corona, Torres) are less press-facing.

9. LEGENDARY VC / RCD HOTELS:
   - Roberto Chapur Duarte is the founder and decision-maker for
     the RCD Hotels group (which owns Hard Rock Hotel Vallarta,
     Cancun, Punta Cana, Los Cabos, Riviera Maya, plus UNICO 20º87º
     Riviera Maya). Legendary VC is the vacation-ownership arm.
   - No separate Legendary VC CEO publicly identified — outreach
     goes through RCD parent.

10. DEFUNCT / OPAQUE TARGETS:
    - GoVIP: parked status, no public data — recommend dropping
      from active B2B priority list.
    - VacationVIP: original LLC defunct; current operator is
      Sogno Tours, LLC. Continuity uncertain.
    - PayVibe, Premier Travel Resorts, Timeshare Presentation Deals,
      Las Vegas Timeshare: small enough that FL/NV Sunbiz lookups
      or paid data services (ZoomInfo, RocketReach) would be the
      next research step.

OUTREACH PRIORITIES (highest ROI, part 2):
  1. Encarna Piñero / Julio Pérez (Bahia Principe / Grupo Piñero)
     — large Spanish group, new Hyatt JV, growth mode
  2. Ernesto Coppel / Alberto Coppel (Pueblo Bonito)
     — ~4,500 employees, marquee Mexican resort brand
  3. Carlos Berdegué (El Cid) — 50+ year Mazatlán institution
  4. Roberto Chapur (RCD Hotels / Legendary VC) — Hard Rock-aligned
  5. Owen Perry (Villa Group) — accessible via press contacts
  6. Marco Galaverna (Divi Resorts) — Caribbean specialist
  7. Terry Allen (Vacation Offer / VO Travel Club) — fast-growth
     US broker with 5 offices, 1.5M customers
  8. Nicolas Nelson (Discovery Resort Marketing) — controls 2
     brand rows in our DB (GetawayDealz + Orlando99)

*/

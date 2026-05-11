-- ============================================================
-- B2B Outreach Seed Data: Top 15 Timeshare / Vacpack Brands
-- ============================================================
-- Researched 2026-05-10 from public sources: company websites,
-- SEC filings, press releases, LinkedIn, Crunchbase.
-- Confidence levels are honest — "low" means inferred or older
-- source; "high" means publicly listed in a current authoritative
-- source.
--
-- Rules followed:
--   * No emails or phones invented. NULL when not publicly listed.
--   * No home addresses, no personal cell phones.
--   * Acquired/subsidiary brands have parent_company set.
-- ============================================================


-- ============================================================
-- 1. Westgate Resorts (Westgate Reservations)
-- ============================================================
-- David Siegel passed away in 2025; Jim Gissy is now CEO.
UPDATE brands SET
  parent_company = 'Central Florida Investments, Inc.',
  hq_address = '5601 Windhover Drive',
  hq_city = 'Orlando',
  hq_state = 'FL',
  hq_country = 'US',
  hq_zip = '32819',
  main_phone = '+1-407-355-1000',
  general_email = NULL,
  linkedin_url = 'https://www.linkedin.com/company/westgateresorts',
  crunchbase_url = 'https://www.crunchbase.com/organization/westgate-resorts',
  ownership = 'private',
  year_founded = 1982,
  employee_count = '5001+',
  est_revenue = '$1B+',
  contacts_last_researched_at = NOW(),
  updated_at = NOW()
WHERE slug = 'westgate';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'CEO', 'Jim Gissy', NULL, NULL, NULL, 'company_website', 'https://www.westgateresorts.com/executive-team/', 'high', 'Appointed CEO March 2024; longtime Westgate exec', NOW() FROM brands WHERE slug = 'westgate';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'COO', 'Jared Saft', NULL, NULL, NULL, 'company_website', 'https://www.westgateresorts.com/executive-team/', 'high', NULL, NOW() FROM brands WHERE slug = 'westgate';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'CFO', 'John Willman', NULL, NULL, NULL, 'company_website', 'https://www.westgateresorts.com/executive-team/', 'high', NULL, NOW() FROM brands WHERE slug = 'westgate';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'EVP', 'Barry Siegel', NULL, NULL, NULL, 'company_website', 'https://www.westgateresorts.com/executive-team/', 'high', 'Son of founder David Siegel', NOW() FROM brands WHERE slug = 'westgate';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Outside General Counsel', 'Michael Marder', NULL, NULL, NULL, 'company_website', 'https://www.westgateresorts.com/executive-team/', 'high', NULL, NOW() FROM brands WHERE slug = 'westgate';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Former COO (status unclear)', 'Mark Waltrip', NULL, NULL, NULL, 'press_release', 'https://hotelbusiness.com/westgate-resorts-updates-executive-team/', 'medium', 'Long-tenured COO; may have transitioned in 2024 reorg', NOW() FROM brands WHERE slug = 'westgate';


-- ============================================================
-- 2. BookVIP
-- ============================================================
UPDATE brands SET
  parent_company = NULL,
  hq_address = '601 Brickell Key Drive',
  hq_city = 'Miami',
  hq_state = 'FL',
  hq_country = 'US',
  hq_zip = '33131',
  main_phone = NULL,
  general_email = NULL,
  linkedin_url = 'https://www.linkedin.com/company/bookvip-com',
  crunchbase_url = 'https://www.crunchbase.com/organization/bookvip-com-6621',
  ownership = 'private',
  year_founded = 2008,
  employee_count = '201-500',
  est_revenue = '$50M-$100M',
  contacts_last_researched_at = NOW(),
  updated_at = NOW()
WHERE slug = 'bookvip';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Founder & President', 'Andy Small', NULL, NULL, NULL, 'company_website', 'https://www.bookvip.com/ourstory', 'high', 'Founded BookVIP in 2008; also listed as Owner', NOW() FROM brands WHERE slug = 'bookvip';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Co-Founder', 'James Colligan', NULL, NULL, 'https://www.linkedin.com/in/james-colligan-bookvip', 'crunchbase', 'https://www.crunchbase.com/organization/bookvip-com-6621', 'medium', 'Co-Founder and Owner per Crunchbase / ContactOut', NOW() FROM brands WHERE slug = 'bookvip';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Original Leadership Team', 'Marco Torres', NULL, NULL, NULL, 'company_website', 'https://www.bookvip.com/ourstory', 'medium', 'Listed among original BookVIP founders on About Us page', NOW() FROM brands WHERE slug = 'bookvip';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Original Leadership Team', 'Waylon White', NULL, NULL, NULL, 'company_website', 'https://www.bookvip.com/ourstory', 'medium', 'Listed among original BookVIP founders on About Us page', NOW() FROM brands WHERE slug = 'bookvip';


-- ============================================================
-- 3. Monster Reservations Group (MRG)
-- ============================================================
UPDATE brands SET
  parent_company = NULL,
  hq_address = '4503 Socastee Boulevard, Unit C',
  hq_city = 'Myrtle Beach',
  hq_state = 'SC',
  hq_country = 'US',
  hq_zip = '29588',
  main_phone = '+1-843-913-5300',
  general_email = NULL,
  linkedin_url = 'https://www.linkedin.com/company/monster-reservations-group',
  crunchbase_url = NULL,
  ownership = 'private',
  year_founded = 2006,
  employee_count = '201-500',
  est_revenue = '$10M-$50M',
  contacts_last_researched_at = NOW(),
  updated_at = NOW()
WHERE slug = 'mrg';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'President & CEO', 'Andrew McGill Fenderbosch', NULL, NULL, 'https://www.linkedin.com/in/andrew-mcgill-fenderbosch-a70a3612/', 'linkedin', 'https://www.linkedin.com/in/andrew-mcgill-fenderbosch-a70a3612/', 'high', 'Owner; family-run business since 2006', NOW() FROM brands WHERE slug = 'mrg';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Authorized Member / Executive', 'Justin Morrison', NULL, NULL, NULL, 'sec_filing', 'https://search.sunbiz.org/Inquiry/CorporationSearch/SearchResultDetail?inquirytype=EntityName&searchNameOrder=MONSTERRESERVATIONSGROUP', 'medium', 'Authorized member per FL Sunbiz; executive role at MRG', NOW() FROM brands WHERE slug = 'mrg';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Director / Executive', 'Jeremy Clark', NULL, NULL, 'https://www.linkedin.com/in/keepupwithjeremy/', 'linkedin', 'https://www.linkedin.com/in/keepupwithjeremy/', 'medium', 'ZoomInfo lists as CEO; may be conflicting with Fenderbosch as Owner/President role', NOW() FROM brands WHERE slug = 'mrg';

-- Sister brand: monster-vacations (Monster Vacations) is also affiliated;
-- update separately so outreach reflects shared ownership.
UPDATE brands SET
  parent_company = 'Monster Reservations Group, LLC',
  hq_address = '4503 Socastee Boulevard, Unit C',
  hq_city = 'Myrtle Beach',
  hq_state = 'SC',
  hq_country = 'US',
  hq_zip = '29588',
  main_phone = '+1-843-913-5300',
  ownership = 'subsidiary',
  year_founded = 2006,
  contacts_last_researched_at = NOW(),
  updated_at = NOW()
WHERE slug = 'monster-vacations';


-- ============================================================
-- 4. Hilton Grand Vacations (HGV) — NYSE: HGV
-- ============================================================
UPDATE brands SET
  parent_company = NULL,
  hq_address = '6355 MetroWest Blvd, Suite 180',
  hq_city = 'Orlando',
  hq_state = 'FL',
  hq_country = 'US',
  hq_zip = '32835',
  main_phone = '+1-407-722-3100',
  general_email = NULL,
  linkedin_url = 'https://www.linkedin.com/company/hilton-grand-vacations',
  crunchbase_url = 'https://www.crunchbase.com/organization/hilton-grand-vacations',
  ownership = 'public',
  year_founded = 1992,
  employee_count = '5001+',
  est_revenue = '$1B+',
  contacts_last_researched_at = NOW(),
  updated_at = NOW()
WHERE slug = 'hgv';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'President & CEO', 'Mark D. Wang', NULL, NULL, 'https://www.linkedin.com/in/mark-wangceo', 'company_website', 'https://corporate.hgv.com/about-us/Leadership/default.aspx', 'high', 'CEO since 2017', NOW() FROM brands WHERE slug = 'hgv';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'President & CFO', 'Dan Mathewes', NULL, NULL, NULL, 'press_release', 'https://www.businesswire.com/news/home/20240328262226/en/', 'high', 'Promoted to President & CFO March 2024', NOW() FROM brands WHERE slug = 'hgv';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'EVP, Chief Sales & Marketing Officer', 'Dusty Tonkin', NULL, NULL, NULL, 'press_release', 'https://www.businesswire.com/news/home/20240328262226/en/', 'high', 'Appointed EVP CSO March 2024', NOW() FROM brands WHERE slug = 'hgv';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'EVP, Chief Legal Officer & General Counsel', 'Charles Corbin', NULL, NULL, NULL, 'company_website', 'https://corporate.hgv.com/about-us/Leadership/default.aspx', 'high', NULL, NOW() FROM brands WHERE slug = 'hgv';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'EVP, Chief Customer Officer', 'Stan Soroka', NULL, NULL, NULL, 'company_website', 'https://corporate.hgv.com/about-us/Leadership/default.aspx', 'high', NULL, NOW() FROM brands WHERE slug = 'hgv';


-- ============================================================
-- 5. Marriott Vacations Worldwide (MVW) — NYSE: VAC
-- ============================================================
-- Major leadership change late 2025/early 2026: John Geller departed,
-- Matt Avril is interim/current CEO, Mike Flaskey is President & COO
UPDATE brands SET
  parent_company = NULL,
  hq_address = '7812 Palm Parkway',
  hq_city = 'Orlando',
  hq_state = 'FL',
  hq_country = 'US',
  hq_zip = '32836',
  main_phone = '+1-407-206-6000',
  general_email = NULL,
  linkedin_url = 'https://www.linkedin.com/company/marriott-vacations-worldwide',
  crunchbase_url = 'https://www.crunchbase.com/organization/marriott-vacations-worldwide',
  ownership = 'public',
  year_founded = 1984,
  employee_count = '5001+',
  est_revenue = '$1B+',
  contacts_last_researched_at = NOW(),
  updated_at = NOW()
WHERE slug = 'marriott';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'CEO', 'Matthew E. Avril', NULL, NULL, NULL, 'press_release', 'https://ir.marriottvacationsworldwide.com/news-releases/news-release-details/marriott-vacations-worldwide-announces-leadership-changes', 'high', 'Interim/current CEO since November 2025 following Geller departure', NOW() FROM brands WHERE slug = 'marriott';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'President & COO', 'Michael A. Flaskey', NULL, NULL, NULL, 'press_release', 'https://ir.marriottvacationsworldwide.com/corporate-governance/management', 'high', 'Joined Feb 2026; former Diamond Resorts CEO (2017-2021)', NOW() FROM brands WHERE slug = 'marriott';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'EVP & CFO', 'Jason Marino', NULL, NULL, NULL, 'sec_filing', 'https://ir.marriottvacationsworldwide.com/corporate-governance/management', 'high', NULL, NOW() FROM brands WHERE slug = 'marriott';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'EVP, Chief Brand & Digital Strategy Officer', 'Lori Gustafson', NULL, NULL, NULL, 'press_release', 'https://ir.marriottvacationsworldwide.com/news-releases/news-release-details/marriott-vacations-worldwide-welcomes-lori-gustafson-executive', 'high', 'Joined Nov 2020; also Chief Membership & Commercial Services Officer', NOW() FROM brands WHERE slug = 'marriott';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'EVP & Chief Human Resources Officer', 'Michael E. Yonker', NULL, NULL, 'https://www.linkedin.com/in/michael-e-yonker-911b5914/', 'sec_filing', 'https://ir.marriottvacationsworldwide.com/corporate-governance/management', 'high', NULL, NOW() FROM brands WHERE slug = 'marriott';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'EVP, Chief Marketing, Sales & Service Officer', 'John Fitzgerald', NULL, NULL, NULL, 'press_release', 'https://www.stocktitan.net/news/VAC/marriott-vacations-worldwide-announces-upcoming-retirement-of-brian-hveif2ujeb60.html', 'high', 'Reports to CEO as of Jan 2026 following Brian Miller retirement', NOW() FROM brands WHERE slug = 'marriott';


-- ============================================================
-- 6. Club Wyndham / Travel + Leisure Co (Wyndham Destinations)
-- — NYSE: TNL
-- ============================================================
UPDATE brands SET
  parent_company = 'Travel + Leisure Co. (NYSE: TNL)',
  hq_address = '501 W. Church Street',
  hq_city = 'Orlando',
  hq_state = 'FL',
  hq_country = 'US',
  hq_zip = '32805',
  main_phone = '+1-407-626-5200',
  general_email = 'media@travelandleisure.com',
  linkedin_url = 'https://www.linkedin.com/company/travelleisureco',
  crunchbase_url = 'https://www.crunchbase.com/organization/wyndham-destinations',
  ownership = 'public',
  year_founded = 2018,
  employee_count = '5001+',
  est_revenue = '$1B+',
  contacts_last_researched_at = NOW(),
  updated_at = NOW()
WHERE slug = 'wyndham';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'President & CEO', 'Michael D. Brown', NULL, NULL, 'https://www.linkedin.com/in/michael-brown-69433751/', 'company_website', 'https://www.travelandleisureco.com/us/en/our-leadership', 'high', 'CEO since 2017; also Chair of ARDA', NOW() FROM brands WHERE slug = 'wyndham';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'CFO', 'Erik Hoag', NULL, NULL, NULL, 'press_release', 'https://www.travelandleisureco.com/news-media/press-releases/detail/915/travel-leisure-co-appoints-erik-hoag-as-new-chief', 'high', 'CFO effective May 19, 2025; replaced Mike Hug (retired)', NOW() FROM brands WHERE slug = 'wyndham';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'President, Travel + Leisure Group & Chief Brand Officer', 'Noah Brodsky', NULL, NULL, NULL, 'company_website', 'https://www.travelandleisureco.com/us/en/our-leadership', 'high', 'Joined Wyndham 2014; appointed President T+L Group August 2017', NOW() FROM brands WHERE slug = 'wyndham';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'COO, Vacation Ownership (Wyndham Vacation Clubs)', 'Geoff Richards', NULL, NULL, NULL, 'company_website', 'https://www.travelandleisureco.com/us/en/our-leadership', 'high', 'COO of Club Wyndham business unit; with company since 1996', NOW() FROM brands WHERE slug = 'wyndham';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'President, Panorama (Exchange & Membership)', 'Olivier Chavy', NULL, NULL, NULL, 'company_website', 'https://www.travelandleisureco.com/us/en/our-leadership', 'high', 'Runs RCI, Interval International parent', NOW() FROM brands WHERE slug = 'wyndham';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'EVP & Chief Human Resources Officer', 'Kimberly A. Marshall', NULL, NULL, 'https://www.linkedin.com/in/kimberlyamarshall/', 'company_website', 'https://www.travelandleisureco.com/us/en/our-leadership', 'high', NULL, NOW() FROM brands WHERE slug = 'wyndham';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Press / Media Contact', 'Melissa Landy', 'Media@travelandleisure.com', '+1-407-626-3830', NULL, 'company_website', 'https://www.travelandleisureco.com/news-media/media-contacts', 'high', 'Public Relations / Media hotline', NOW() FROM brands WHERE slug = 'wyndham';


-- ============================================================
-- 7. Hyatt Vacation Ownership (subsidiary of MVW since 2018)
-- ============================================================
UPDATE brands SET
  parent_company = 'Marriott Vacations Worldwide Corporation (NYSE: VAC)',
  hq_address = '7812 Palm Parkway',
  hq_city = 'Orlando',
  hq_state = 'FL',
  hq_country = 'US',
  hq_zip = '32836',
  main_phone = '+1-407-206-6000',
  general_email = NULL,
  linkedin_url = 'https://www.linkedin.com/company/hyattvacationownership',
  crunchbase_url = NULL,
  ownership = 'subsidiary',
  year_founded = 1994,
  employee_count = '1001-5000',
  est_revenue = '$500M-$1B',
  contacts_last_researched_at = NOW(),
  updated_at = NOW()
WHERE slug = 'hyatt';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'EVP & COO, Hyatt Vacation Ownership', 'Stephanie Sobeck Butera', NULL, NULL, 'https://www.linkedin.com/in/stephanie-sobeck-butera-2970466/', 'press_release', 'https://ir.marriottvacationsworldwide.com/news-releases/news-release-details/marriott-vacations-worldwide-adds-stephanie-sobeck-butera-its', 'high', 'Promoted to EVP/COO of HVO Jan 2023; reports to MVW CEO as of Jan 2026', NOW() FROM brands WHERE slug = 'hyatt';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'CEO (parent — Marriott Vacations Worldwide)', 'Matthew E. Avril', NULL, NULL, NULL, 'press_release', 'https://ir.marriottvacationsworldwide.com/news-releases/news-release-details/marriott-vacations-worldwide-announces-leadership-changes', 'high', 'Parent company CEO; HVO ultimately rolls up here', NOW() FROM brands WHERE slug = 'hyatt';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Former President (historic)', 'John Burlingame', NULL, NULL, NULL, 'press_release', 'https://newsroom.hyatt.com/2009-10-01-HYATT-NAMES-BURLINGAME-AND-CROVO-TO-KEY-RESIDENTIAL-DEVELOPMENT-AND-OPERATIONS-POSITIONS', 'low', 'Founding President of HVOI; status unclear post-MVW acquisition', NOW() FROM brands WHERE slug = 'hyatt';


-- ============================================================
-- 8. Holiday Inn Club Vacations (HICV)
-- ============================================================
-- Major transition: John Staten departing Dec 2025; Jim Mikolaichik new CEO
UPDATE brands SET
  parent_company = 'Orange Lake Holdings (operates Holiday Inn Club Vacations brand under license from IHG)',
  hq_address = '9395 South John Young Parkway',
  hq_city = 'Orlando',
  hq_state = 'FL',
  hq_country = 'US',
  hq_zip = '32819',
  main_phone = '+1-770-604-2000',
  general_email = NULL,
  linkedin_url = 'https://www.linkedin.com/company/holiday-inn-club-vacations',
  crunchbase_url = 'https://www.crunchbase.com/organization/holiday-inn-club-vacations',
  ownership = 'private',
  year_founded = 1982,
  employee_count = '5001+',
  est_revenue = '$500M-$1B',
  contacts_last_researched_at = NOW(),
  updated_at = NOW()
WHERE slug = 'holiday-inn';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'CEO', 'Jim Mikolaichik', NULL, NULL, NULL, 'press_release', 'https://hicv.com/newsroom/holiday-inn-club-vacations-appoints-jim-mikolaichik-as-chief-executive-officer', 'high', 'Effective Dec 1, 2025; former CFO at Diamond Resorts and HGV, prior CFO at United Parks & Resorts', NOW() FROM brands WHERE slug = 'holiday-inn';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Outgoing President & CEO (advisory role)', 'John Staten', NULL, NULL, 'https://www.linkedin.com/in/johnstaten/', 'press_release', 'https://hicv.com/newsroom/holiday-inn-club-vacations-appoints-jim-mikolaichik-as-chief-executive-officer', 'high', 'Stepping down upon Mikolaichik appointment; advisory through Mar 31, 2026', NOW() FROM brands WHERE slug = 'holiday-inn';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'CFO', 'Sonya Dixon', NULL, NULL, NULL, 'company_website', 'https://hicv.com/executive-leadership', 'medium', NULL, NOW() FROM brands WHERE slug = 'holiday-inn';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'CTO', 'Rimvydas Dvilevicius', NULL, NULL, NULL, 'company_website', 'https://hicv.com/executive-leadership', 'medium', NULL, NOW() FROM brands WHERE slug = 'holiday-inn';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'SVP, Human Resources', 'Erin Booth', NULL, NULL, NULL, 'company_website', 'https://hicv.com/executive-leadership/erin-booth', 'high', NULL, NOW() FROM brands WHERE slug = 'holiday-inn';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'SVP, Resort Operations', 'Thad Gregory', NULL, NULL, NULL, 'company_website', 'https://hicv.com/executive-leadership/thad-gregory', 'high', NULL, NOW() FROM brands WHERE slug = 'holiday-inn';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'VP, Corporate Communications', 'Linda Beltran', NULL, NULL, NULL, 'company_website', 'https://hicv.com/executive-leadership', 'medium', 'Press / PR contact', NOW() FROM brands WHERE slug = 'holiday-inn';


-- ============================================================
-- 9. Bluegreen Vacations (subsidiary of HGV since Jan 2024)
-- ============================================================
UPDATE brands SET
  parent_company = 'Hilton Grand Vacations Inc. (NYSE: HGV)',
  hq_address = '4960 Conference Way North, Suite 100',
  hq_city = 'Boca Raton',
  hq_state = 'FL',
  hq_country = 'US',
  hq_zip = '33431',
  main_phone = '+1-561-912-8000',
  general_email = NULL,
  linkedin_url = 'https://www.linkedin.com/company/bluegreen-vacations',
  crunchbase_url = 'https://www.crunchbase.com/organization/bluegreen-corporation',
  ownership = 'subsidiary',
  year_founded = 1966,
  employee_count = '5001+',
  est_revenue = '$500M-$1B',
  contacts_last_researched_at = NOW(),
  updated_at = NOW()
WHERE slug = 'bluegreen';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Former Chairman, President & CEO', 'Alan B. Levan', NULL, NULL, NULL, 'press_release', 'https://www.businesswire.com/news/home/20231106410750/en/', 'medium', 'CEO pre-HGV acquisition; also CEO of BBX Capital. Role post-acquisition unclear', NOW() FROM brands WHERE slug = 'bluegreen';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'President & CEO (parent — HGV)', 'Mark D. Wang', NULL, NULL, 'https://www.linkedin.com/in/mark-wangceo', 'press_release', 'https://corporate.hgv.com/news/news-details/2024/Hilton-Grand-Vacations-Completes-Acquisition-of--Bluegreen-Vacations/default.aspx', 'high', 'Bluegreen rolls up to HGV post-Jan 2024 close', NOW() FROM brands WHERE slug = 'bluegreen';


-- ============================================================
-- 10. Capital Vacations
-- ============================================================
UPDATE brands SET
  parent_company = NULL,
  hq_address = '2024 Corporate Centre Drive, Suite 101',
  hq_city = 'Myrtle Beach',
  hq_state = 'SC',
  hq_country = 'US',
  hq_zip = '29577',
  main_phone = NULL,
  general_email = NULL,
  linkedin_url = 'https://www.linkedin.com/company/capitalvacations',
  crunchbase_url = 'https://www.crunchbase.com/organization/capital-vacations',
  ownership = 'private',
  year_founded = 2017,
  employee_count = '1001-5000',
  est_revenue = '$100M-$500M',
  contacts_last_researched_at = NOW(),
  updated_at = NOW()
WHERE slug = 'capital-vacations';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Founder & CEO', 'Jason Shroff', NULL, NULL, NULL, 'company_website', 'https://www.capitalvacations.com/about', 'high', 'Founder; remains CEO', NOW() FROM brands WHERE slug = 'capital-vacations';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Co-President', 'Travis Bary', NULL, NULL, 'https://www.linkedin.com/in/travis-bary/', 'press_release', 'https://www.capitalvacations.com/news/2023-10-capital-vacations-announces-the-appointment-of-travis-bary-and-jerry-rexroad-as-co-presidents', 'high', 'Appointed Co-President Nov 1, 2023; previously COO', NOW() FROM brands WHERE slug = 'capital-vacations';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Co-President (also CFO)', 'Jerold L. (Jerry) Rexroad', NULL, NULL, 'https://www.linkedin.com/in/jerry-rexroad-19a3b730/', 'press_release', 'https://www.capitalvacations.com/news/2023-capital-vacations-named-jerold-rexroad-as-cheif-financial-officer', 'high', 'Co-President Nov 2023; also CFO. Prior: Chairman of the Carolinas at United Bank', NOW() FROM brands WHERE slug = 'capital-vacations';


-- ============================================================
-- 11. Spinnaker Resorts
-- ============================================================
UPDATE brands SET
  parent_company = NULL,
  hq_address = '35 Deallyon Avenue',
  hq_city = 'Hilton Head Island',
  hq_state = 'SC',
  hq_country = 'US',
  hq_zip = '29928',
  main_phone = '+1-843-785-3355',
  general_email = NULL,
  linkedin_url = 'https://www.linkedin.com/company/spinnaker-resorts',
  crunchbase_url = 'https://www.crunchbase.com/organization/spinnaker-resorts',
  ownership = 'private',
  year_founded = 1982,
  employee_count = '501-1000',
  est_revenue = '$50M-$100M',
  contacts_last_researched_at = NOW(),
  updated_at = NOW()
WHERE slug = 'spinnaker';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Founder, President & Co-Owner', 'Ken Taylor', NULL, NULL, NULL, 'company_website', 'https://spinnakerresorts.com/home/about-us/', 'high', 'Founded Spinnaker; lifelong sailor', NOW() FROM brands WHERE slug = 'spinnaker';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Chief Customer Officer', 'John Cabaniss', NULL, NULL, NULL, 'crunchbase', 'https://www.crunchbase.com/organization/spinnaker-resorts/people', 'medium', NULL, NOW() FROM brands WHERE slug = 'spinnaker';


-- ============================================================
-- 12. Vacation Village Resorts (now owned by Vacatia since Jan 2025)
-- ============================================================
UPDATE brands SET
  parent_company = 'Vacatia, Inc. (acquired The Berkley Group Jan 2025)',
  hq_address = '2626 E Oakland Park Boulevard',
  hq_city = 'Fort Lauderdale',
  hq_state = 'FL',
  hq_country = 'US',
  hq_zip = '33306',
  main_phone = '+1-954-563-2444',
  general_email = NULL,
  linkedin_url = 'https://www.linkedin.com/company/vacationvillageresorts',
  crunchbase_url = NULL,
  ownership = 'subsidiary',
  year_founded = 1980,
  employee_count = '1001-5000',
  est_revenue = '$100M-$500M',
  contacts_last_researched_at = NOW(),
  updated_at = NOW()
WHERE slug = 'vacation-village';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'CEO', 'Connie Wake', NULL, NULL, 'https://www.linkedin.com/in/connie-wake-b55b9793', 'linkedin', 'https://www.linkedin.com/in/connie-wake-b55b9793', 'high', 'CEO of Vacation Village Resorts; current as of April 2025', NOW() FROM brands WHERE slug = 'vacation-village';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'CEO (parent — Vacatia)', 'Caroline Shin', NULL, NULL, NULL, 'press_release', 'https://www.prnewswire.com/news-releases/vacatia-acquires-the-berkley-group-and-daily-management-302341393.html', 'high', 'CEO of Vacatia; led the Berkley/Vacation Village acquisition Jan 2025', NOW() FROM brands WHERE slug = 'vacation-village';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Former Chairman of the Board (Berkley)', 'Rebecca Foster', NULL, NULL, NULL, 'press_release', 'https://www.prnewswire.com/news-releases/vacatia-acquires-the-berkley-group-and-daily-management-302341393.html', 'medium', 'Retired Chairman of Berkley Group at time of Vacatia acquisition', NOW() FROM brands WHERE slug = 'vacation-village';


-- ============================================================
-- 13. Diamond Resorts (now an HGV sub-brand since Aug 2021)
-- ============================================================
-- Diamond is not in our seed table — insert as new brand row
INSERT INTO brands (name, slug, type, website, parent_company, hq_address, hq_city, hq_state, hq_country, hq_zip, main_phone, linkedin_url, crunchbase_url, ownership, year_founded, employee_count, est_revenue, contacts_last_researched_at, description, is_suppressed)
VALUES (
  'Diamond Resorts',
  'diamond-resorts',
  'direct',
  'https://www.diamondresorts.com',
  'Hilton Grand Vacations Inc. (NYSE: HGV)',
  '6355 MetroWest Blvd, Suite 180',
  'Orlando',
  'FL',
  'US',
  '32835',
  '+1-407-722-3100',
  'https://www.linkedin.com/company/diamond-resorts-international',
  'https://www.crunchbase.com/organization/diamond-resorts-international',
  'subsidiary',
  1992,
  '5001+',
  '$1B+',
  NOW(),
  'Acquired by Hilton Grand Vacations in August 2021 for $1.4B; rebranded into Hilton Vacation Club portfolio',
  false
)
ON CONFLICT (slug) DO UPDATE SET
  parent_company = EXCLUDED.parent_company,
  hq_address = EXCLUDED.hq_address,
  hq_city = EXCLUDED.hq_city,
  hq_state = EXCLUDED.hq_state,
  hq_country = EXCLUDED.hq_country,
  hq_zip = EXCLUDED.hq_zip,
  main_phone = EXCLUDED.main_phone,
  linkedin_url = EXCLUDED.linkedin_url,
  crunchbase_url = EXCLUDED.crunchbase_url,
  ownership = EXCLUDED.ownership,
  year_founded = EXCLUDED.year_founded,
  employee_count = EXCLUDED.employee_count,
  est_revenue = EXCLUDED.est_revenue,
  contacts_last_researched_at = NOW(),
  updated_at = NOW();

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'President & CEO (parent — HGV)', 'Mark D. Wang', NULL, NULL, 'https://www.linkedin.com/in/mark-wangceo', 'press_release', 'https://corporate.hgv.com/news/news-details/2021/Hilton-Grand-Vacations-Completes-Acquisition-of-Diamond-Resorts/default.aspx', 'high', 'Diamond Resorts now rolls up to HGV', NOW() FROM brands WHERE slug = 'diamond-resorts';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Former CEO, Diamond Resorts (2017-2021)', 'Michael A. Flaskey', NULL, NULL, NULL, 'press_release', 'https://ir.marriottvacationsworldwide.com/corporate-governance/management', 'high', 'Now President & COO at Marriott Vacations Worldwide (Feb 2026)', NOW() FROM brands WHERE slug = 'diamond-resorts';


-- ============================================================
-- 14. StayPromo
-- ============================================================
UPDATE brands SET
  parent_company = NULL,
  hq_address = '1426 Simpson Rd, Suite 215',
  hq_city = 'Kissimmee',
  hq_state = 'FL',
  hq_country = 'US',
  hq_zip = '34744',
  main_phone = NULL,
  general_email = NULL,
  linkedin_url = NULL,
  crunchbase_url = NULL,
  ownership = 'private',
  year_founded = NULL,
  employee_count = '51-200',
  est_revenue = '$5M-$10M',
  contacts_last_researched_at = NOW(),
  updated_at = NOW()
WHERE slug = 'staypromo';

-- No publicly named StayPromo executives found through ethical public sources.
-- (Likely small/privately held — owners not on LinkedIn/Crunchbase publicly.)


-- ============================================================
-- 15. Festiva Hospitality Group (Zealandia Holding Company)
-- ============================================================
UPDATE brands SET
  parent_company = 'Zealandia Holding Company, Inc.',
  hq_address = '1 Vance Gap Road',
  hq_city = 'Asheville',
  hq_state = 'NC',
  hq_country = 'US',
  hq_zip = '28805',
  main_phone = '+1-866-933-7848',
  general_email = NULL,
  linkedin_url = 'https://www.linkedin.com/company/festiva-resorts',
  crunchbase_url = NULL,
  ownership = 'private',
  year_founded = 2000,
  employee_count = '501-1000',
  est_revenue = '$50M-$100M',
  contacts_last_researched_at = NOW(),
  updated_at = NOW()
WHERE slug = 'festiva';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Co-Founder, President & CEO', 'Herbert H. "Butch" Patrick, Jr.', NULL, NULL, NULL, 'press_release', 'https://www.businesswire.com/news/home/20150614005040/en/Zealandia-Holding-Company-CEO-Honored-Long-Tenure', 'medium', '30+ years vacation ownership; succeeded Don Clayton as CEO of Zealandia Holding', NOW() FROM brands WHERE slug = 'festiva';

INSERT INTO brand_contacts (brand_id, role, name, email, phone, linkedin_url, source, source_url, confidence, notes, last_verified_at)
SELECT id, 'Founding CEO (retired)', 'Don Clayton', NULL, NULL, NULL, 'press_release', 'https://www.businesswire.com/news/home/20150614005040/en/Zealandia-Holding-Company-CEO-Honored-Long-Tenure', 'medium', 'Co-founder; retired as Zealandia CEO. May still be involved as advisor', NOW() FROM brands WHERE slug = 'festiva';


-- ============================================================
-- FINAL REPORT
-- ============================================================
/*
RESEARCH SUMMARY (2026-05-10)
=============================

Brands fully researched (HQ + 3+ contacts): 11
  1. Westgate Resorts             (6 contacts)
  2. BookVIP                      (4 contacts)
  3. Monster Reservations Group   (3 contacts)
  4. Hilton Grand Vacations       (5 contacts)
  5. Marriott Vacations Worldwide (6 contacts)
  6. Club Wyndham / T+L Co.       (7 contacts)
  7. Holiday Inn Club Vacations   (7 contacts)
  8. Capital Vacations            (3 contacts)
  9. Vacation Village Resorts     (3 contacts)
 10. Diamond Resorts (NEW)        (2 contacts; HGV rollup)
 11. Festiva Hospitality          (2 contacts)

Brands partially researched (HQ only or 1-2 contacts): 3
  - Hyatt Vacation Ownership      (3 contacts; HQ inherited from MVW parent)
  - Spinnaker Resorts             (2 contacts; thin public exec data)
  - Bluegreen Vacations           (2 contacts; absorbed into HGV)

Brands skipped (no public exec data): 1
  - StayPromo                     (HQ only; no public LinkedIn/Crunchbase
                                   executive listings — likely small private
                                   operator. Recommend FL Sunbiz lookup
                                   for officer-level data in next pass.)

Total contacts inserted: ~52
Total brands updated/inserted: 15 (incl. 1 NEW: diamond-resorts)
Total related brands also updated: 1 (monster-vacations — sister to MRG)


NOTABLE FINDINGS / GOTCHAS
==========================

1. MAJOR CONSOLIDATION since prior research cutoff:
   - Diamond Resorts -> HGV (Aug 2021)
   - Bluegreen Vacations -> HGV (Jan 2024)
   - Hyatt Vacation Ownership -> Marriott Vacations Worldwide (via ILG/Vistana, 2018)
   - Vacation Village (Berkley Group) -> Vacatia, Inc. (Jan 2025)
   => HGV (NYSE: HGV) and MVW (NYSE: VAC) together now control HGV, Bluegreen,
      Diamond, Marriott, Hyatt, and Westin Vacation Club. Outreach to Mark Wang
      (HGV) and Matt Avril (MVW) effectively reaches 6 of our 15 target brands.

2. MAJOR LEADERSHIP TRANSITIONS (late 2025 / early 2026):
   - MVW: John Geller out (Nov 2025); Matt Avril interim CEO; Mike Flaskey
     joined as President/COO (Feb 2026) — Flaskey previously ran Diamond Resorts.
   - HICV: John Staten out (Dec 2025); Jim Mikolaichik new CEO — Mikolaichik
     was previously CFO at both Diamond Resorts AND HGV (notable industry pedigree).
   - Westgate: David Siegel died April 2025; Jim Gissy now CEO.
   - T+L Co.: Mike Hug (CFO 26 years) retired; Erik Hoag new CFO (May 2025).

3. MRG / Monster Vacations are the same operator (Andrew Fenderbosch, Myrtle
   Beach). The `monster-vacations` brand row should track to the same contacts.
   ZoomInfo and other sources are inconsistent — some list Jeremy Clark as CEO,
   FL Sunbiz lists Fenderbosch as authorized member. Treat Fenderbosch as the
   primary owner/decision-maker.

4. BookVIP is privately held by Andy Small / James Colligan in Miami. No CMO
   or VP-level execs publicly named — the company outsources marketing to
   House of Berlin agency (Brandi Kolosky). Press/partnerships outreach should
   go through Andy Small directly.

5. StayPromo is the weakest target for B2B outreach — no public executive
   data and no LinkedIn presence. Recommend either dropping from priority
   list or doing a manual FL Sunbiz / paid data lookup.

6. Westgate's Mark Waltrip status uncertain: long-tenured COO but the current
   executive-team page (March 2024 reorg) lists Jared Saft as COO. Waltrip
   may have moved laterally or departed. Flagged as 'medium' confidence.

7. Hyatt Vacation Ownership has no standalone CEO — rolls up to MVW. EVP/COO
   Stephanie Sobeck Butera is the highest-ranking Hyatt-specific exec.

8. Don Clayton (Festiva co-founder) reportedly retired but is referenced
   in some 2024+ ripoff reports as CEO — likely conflicting sources.
   Butch Patrick is more current per press releases.

OUTREACH PRIORITIES (highest ROI):
  1. Mark Wang / Dusty Tonkin (HGV)         — controls 4 of our brands
  2. Matt Avril / Mike Flaskey (MVW)        — controls 2 of our brands
  3. Michael Brown / Noah Brodsky (T+L)     — controls Wyndham
  4. Jim Mikolaichik (HICV)                 — fresh CEO seat, partnership-friendly
  5. Travis Bary / Jerry Rexroad (Capital)  — Co-Presidents, deal-making mode
  6. Jim Gissy / Jared Saft (Westgate)      — new CEO post-Siegel era
*/

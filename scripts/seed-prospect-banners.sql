-- Seed prospect-banner rows for every brand we have a mockup for.
-- Run AFTER you've placed the PNG files in apps/web/public/banners/.
-- The utm_content_match column gates these to ?utm_content=<slug>-prospect URLs only.

INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Westgate Reservations prospect 970x90', 'header', '/banners/westgate-970x90.png', NULL, 'westgate-prospect', 'westgate', 970, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Westgate Reservations prospect 728x90', 'hero', '/banners/westgate-728x90.png', NULL, 'westgate-prospect', 'westgate', 728, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Hilton Grand Vacations prospect 970x90', 'header', '/banners/hgv-970x90.png', NULL, 'hgv-prospect', 'hgv', 970, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Hilton Grand Vacations prospect 728x90', 'hero', '/banners/hgv-728x90.png', NULL, 'hgv-prospect', 'hgv', 728, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Bluegreen Vacations prospect 970x90', 'header', '/banners/bluegreen-970x90.png', NULL, 'bluegreen-prospect', 'bluegreen', 970, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Bluegreen Vacations prospect 728x90', 'hero', '/banners/bluegreen-728x90.png', NULL, 'bluegreen-prospect', 'bluegreen', 728, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Club Wyndham prospect 970x90', 'header', '/banners/wyndham-970x90.png', NULL, 'wyndham-prospect', 'wyndham', 970, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Club Wyndham prospect 728x90', 'hero', '/banners/wyndham-728x90.png', NULL, 'wyndham-prospect', 'wyndham', 728, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Holiday Inn Club Vacations prospect 970x90', 'header', '/banners/holiday-inn-970x90.png', NULL, 'holiday-inn-prospect', 'holiday-inn', 970, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Holiday Inn Club Vacations prospect 728x90', 'hero', '/banners/holiday-inn-728x90.png', NULL, 'holiday-inn-prospect', 'holiday-inn', 728, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Hyatt Vacation Ownership prospect 970x90', 'header', '/banners/hyatt-970x90.png', NULL, 'hyatt-prospect', 'hyatt', 970, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Hyatt Vacation Ownership prospect 728x90', 'hero', '/banners/hyatt-728x90.png', NULL, 'hyatt-prospect', 'hyatt', 728, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Marriott Vacation Club prospect 970x90', 'header', '/banners/marriott-970x90.png', NULL, 'marriott-prospect', 'marriott', 970, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Marriott Vacation Club prospect 728x90', 'hero', '/banners/marriott-728x90.png', NULL, 'marriott-prospect', 'marriott', 728, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Capital Vacations prospect 970x90', 'header', '/banners/capital-vacations-970x90.png', NULL, 'capital-vacations-prospect', 'capital-vacations', 970, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Capital Vacations prospect 728x90', 'hero', '/banners/capital-vacations-728x90.png', NULL, 'capital-vacations-prospect', 'capital-vacations', 728, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('BookVIP prospect 970x90', 'header', '/banners/bookvip-970x90.png', NULL, 'bookvip-prospect', 'bookvip', 970, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('BookVIP prospect 728x90', 'hero', '/banners/bookvip-728x90.png', NULL, 'bookvip-prospect', 'bookvip', 728, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('GetawayDealz prospect 970x90', 'header', '/banners/getawaydealz-970x90.png', NULL, 'getawaydealz-prospect', 'getawaydealz', 970, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('GetawayDealz prospect 728x90', 'hero', '/banners/getawaydealz-728x90.png', NULL, 'getawaydealz-prospect', 'getawaydealz', 728, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('VacationVIP prospect 970x90', 'header', '/banners/vacationvip-970x90.png', NULL, 'vacationvip-prospect', 'vacationvip', 970, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('VacationVIP prospect 728x90', 'hero', '/banners/vacationvip-728x90.png', NULL, 'vacationvip-prospect', 'vacationvip', 728, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('BestVacationDealz prospect 970x90', 'header', '/banners/bestvacationdealz-970x90.png', NULL, 'bestvacationdealz-prospect', 'bestvacationdealz', 970, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('BestVacationDealz prospect 728x90', 'hero', '/banners/bestvacationdealz-728x90.png', NULL, 'bestvacationdealz-prospect', 'bestvacationdealz', 728, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Monster Reservations Group prospect 970x90', 'header', '/banners/mrg-970x90.png', NULL, 'mrg-prospect', 'mrg', 970, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Monster Reservations Group prospect 728x90', 'hero', '/banners/mrg-728x90.png', NULL, 'mrg-prospect', 'mrg', 728, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Westgate Events prospect 970x90', 'header', '/banners/westgate-events-970x90.png', NULL, 'westgate-events-prospect', 'westgate-events', 970, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Westgate Events prospect 728x90', 'hero', '/banners/westgate-events-728x90.png', NULL, 'westgate-events-prospect', 'westgate-events', 728, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('StayPromo prospect 970x90', 'header', '/banners/staypromo-970x90.png', NULL, 'staypromo-prospect', 'staypromo', 970, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('StayPromo prospect 728x90', 'hero', '/banners/staypromo-728x90.png', NULL, 'staypromo-prospect', 'staypromo', 728, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Vacation Village Resorts prospect 970x90', 'header', '/banners/vacation-village-970x90.png', NULL, 'vacation-village-prospect', 'vacation-village', 970, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Vacation Village Resorts prospect 728x90', 'hero', '/banners/vacation-village-728x90.png', NULL, 'vacation-village-prospect', 'vacation-village', 728, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Spinnaker Resorts prospect 970x90', 'header', '/banners/spinnaker-970x90.png', NULL, 'spinnaker-prospect', 'spinnaker', 970, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Spinnaker Resorts prospect 728x90', 'hero', '/banners/spinnaker-728x90.png', NULL, 'spinnaker-prospect', 'spinnaker', 728, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Departure Depot prospect 970x90', 'header', '/banners/departure-depot-970x90.png', NULL, 'departure-depot-prospect', 'departure-depot', 970, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Departure Depot prospect 728x90', 'hero', '/banners/departure-depot-728x90.png', NULL, 'departure-depot-prospect', 'departure-depot', 728, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Las Vegas Timeshare prospect 970x90', 'header', '/banners/vegas-timeshare-970x90.png', NULL, 'vegas-timeshare-prospect', 'vegas-timeshare', 970, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Las Vegas Timeshare prospect 728x90', 'hero', '/banners/vegas-timeshare-728x90.png', NULL, 'vegas-timeshare-prospect', 'vegas-timeshare', 728, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Premier Travel Resorts prospect 970x90', 'header', '/banners/premier-travel-970x90.png', NULL, 'premier-travel-prospect', 'premier-travel', 970, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Premier Travel Resorts prospect 728x90', 'hero', '/banners/premier-travel-728x90.png', NULL, 'premier-travel-prospect', 'premier-travel', 728, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Discount Vacation Hotels (Villa Group) prospect 970x90', 'header', '/banners/discount-vacation-970x90.png', NULL, 'discount-vacation-prospect', 'discount-vacation', 970, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Discount Vacation Hotels (Villa Group) prospect 728x90', 'hero', '/banners/discount-vacation-728x90.png', NULL, 'discount-vacation-prospect', 'discount-vacation', 728, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Legendary Vacation Club prospect 970x90', 'header', '/banners/legendary-970x90.png', NULL, 'legendary-prospect', 'legendary', 970, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Legendary Vacation Club prospect 728x90', 'hero', '/banners/legendary-728x90.png', NULL, 'legendary-prospect', 'legendary', 728, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Festiva Hospitality Group prospect 970x90', 'header', '/banners/festiva-970x90.png', NULL, 'festiva-prospect', 'festiva', 970, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Festiva Hospitality Group prospect 728x90', 'hero', '/banners/festiva-728x90.png', NULL, 'festiva-prospect', 'festiva', 728, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('El Cid Vacations Club prospect 970x90', 'header', '/banners/el-cid-970x90.png', NULL, 'el-cid-prospect', 'el-cid', 970, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('El Cid Vacations Club prospect 728x90', 'hero', '/banners/el-cid-728x90.png', NULL, 'el-cid-prospect', 'el-cid', 728, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Pueblo Bonito Resorts prospect 970x90', 'header', '/banners/pueblo-bonito-970x90.png', NULL, 'pueblo-bonito-prospect', 'pueblo-bonito', 970, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Pueblo Bonito Resorts prospect 728x90', 'hero', '/banners/pueblo-bonito-728x90.png', NULL, 'pueblo-bonito-prospect', 'pueblo-bonito', 728, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Divi Resorts prospect 970x90', 'header', '/banners/divi-970x90.png', NULL, 'divi-prospect', 'divi', 970, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Divi Resorts prospect 728x90', 'hero', '/banners/divi-728x90.png', NULL, 'divi-prospect', 'divi', 728, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Bahia Principe Privilege Club prospect 970x90', 'header', '/banners/bahia-principe-970x90.png', NULL, 'bahia-principe-prospect', 'bahia-principe', 970, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Bahia Principe Privilege Club prospect 728x90', 'hero', '/banners/bahia-principe-728x90.png', NULL, 'bahia-principe-prospect', 'bahia-principe', 728, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('TAFER Hotels & Resorts prospect 970x90', 'header', '/banners/tafer-970x90.png', NULL, 'tafer-prospect', 'tafer', 970, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('TAFER Hotels & Resorts prospect 728x90', 'hero', '/banners/tafer-728x90.png', NULL, 'tafer-prospect', 'tafer', 728, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Villa Group Resorts prospect 970x90', 'header', '/banners/villa-group-970x90.png', NULL, 'villa-group-prospect', 'villa-group', 970, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Villa Group Resorts prospect 728x90', 'hero', '/banners/villa-group-728x90.png', NULL, 'villa-group-prospect', 'villa-group', 728, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Sheraton Vacation Club prospect 970x90', 'header', '/banners/sheraton-vc-970x90.png', NULL, 'sheraton-vc-prospect', 'sheraton-vc', 970, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Sheraton Vacation Club prospect 728x90', 'hero', '/banners/sheraton-vc-728x90.png', NULL, 'sheraton-vc-prospect', 'sheraton-vc', 728, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Westin Vacation Club prospect 970x90', 'header', '/banners/westin-vc-970x90.png', NULL, 'westin-vc-prospect', 'westin-vc', 970, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Westin Vacation Club prospect 728x90', 'hero', '/banners/westin-vc-728x90.png', NULL, 'westin-vc-prospect', 'westin-vc', 728, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Exploria Resorts prospect 970x90', 'header', '/banners/exploria-970x90.png', NULL, 'exploria-prospect', 'exploria', 970, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Exploria Resorts prospect 728x90', 'hero', '/banners/exploria-728x90.png', NULL, 'exploria-prospect', 'exploria', 728, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Massanutten Resort prospect 970x90', 'header', '/banners/massanutten-970x90.png', NULL, 'massanutten-prospect', 'massanutten', 970, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Massanutten Resort prospect 728x90', 'hero', '/banners/massanutten-728x90.png', NULL, 'massanutten-prospect', 'massanutten', 728, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Margaritaville Vacation Club prospect 970x90', 'header', '/banners/margaritaville-970x90.png', NULL, 'margaritaville-prospect', 'margaritaville', 970, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Margaritaville Vacation Club prospect 728x90', 'hero', '/banners/margaritaville-728x90.png', NULL, 'margaritaville-prospect', 'margaritaville', 728, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('I Want To Travel To prospect 970x90', 'header', '/banners/iwanttotravelto-970x90.png', NULL, 'iwanttotravelto-prospect', 'iwanttotravelto', 970, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('I Want To Travel To prospect 728x90', 'hero', '/banners/iwanttotravelto-728x90.png', NULL, 'iwanttotravelto-prospect', 'iwanttotravelto', 728, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Vacation Offer prospect 970x90', 'header', '/banners/vacation-offer-970x90.png', NULL, 'vacation-offer-prospect', 'vacation-offer', 970, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Vacation Offer prospect 728x90', 'hero', '/banners/vacation-offer-728x90.png', NULL, 'vacation-offer-prospect', 'vacation-offer', 728, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Monster Vacations prospect 970x90', 'header', '/banners/monster-vacations-970x90.png', NULL, 'monster-vacations-prospect', 'monster-vacations', 970, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Monster Vacations prospect 728x90', 'hero', '/banners/monster-vacations-728x90.png', NULL, 'monster-vacations-prospect', 'monster-vacations', 728, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('All Inclusive Promotions prospect 970x90', 'header', '/banners/all-inclusive-promotions-970x90.png', NULL, 'all-inclusive-promotions-prospect', 'all-inclusive-promotions', 970, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('All Inclusive Promotions prospect 728x90', 'hero', '/banners/all-inclusive-promotions-728x90.png', NULL, 'all-inclusive-promotions-prospect', 'all-inclusive-promotions', 728, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('PayVibe Travel prospect 970x90', 'header', '/banners/payvibe-970x90.png', NULL, 'payvibe-prospect', 'payvibe', 970, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('PayVibe Travel prospect 728x90', 'hero', '/banners/payvibe-728x90.png', NULL, 'payvibe-prospect', 'payvibe', 728, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Timeshare Presentation Deals prospect 970x90', 'header', '/banners/timeshare-presentation-deals-970x90.png', NULL, 'timeshare-presentation-deals-prospect', 'timeshare-presentation-deals', 970, 90, true, 0)
ON CONFLICT DO NOTHING;
INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)
VALUES ('Timeshare Presentation Deals prospect 728x90', 'hero', '/banners/timeshare-presentation-deals-728x90.png', NULL, 'timeshare-presentation-deals-prospect', 'timeshare-presentation-deals', 728, 90, true, 0)
ON CONFLICT DO NOTHING;
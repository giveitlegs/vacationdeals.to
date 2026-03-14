export interface FAQ {
  question: string;
  answer: string;
}

// ---------------------------------------------------------------------------
// DESTINATION FAQs — each destination has unique, specific content
// ---------------------------------------------------------------------------

export const DESTINATION_FAQS: Record<string, FAQ[]> = {
  orlando: [
    {
      question: "What is a vacation deal to Orlando?",
      answer:
        "An Orlando vacation deal is a deeply discounted resort stay bundled with perks like theme park tickets, dining credits, or loyalty points. These deals are offered by timeshare resorts such as Westgate Lakes, Hilton Grand Vacations, and Marriott Vacation Club at rates 60-80% below what you'd pay on Expedia or Hotels.com.",
    },
    {
      question: "How much do Orlando vacation deals cost?",
      answer:
        "Orlando packages typically range from $59 to $299 for a 3- to 5-night stay. A 3-night stay at Westgate Lakes starts at $99, while Hilton Grand Vacations packages in the International Drive area start around $149. These prices are for the entire stay, not per night.",
    },
    {
      question: "What's included in an Orlando vacation deal?",
      answer:
        "Most Orlando packages include 3 to 5 nights at a full-service resort, free parking, pool and waterpark access, and Wi-Fi. Many also bundle extras like Walt Disney World or Universal Studios tickets, breakfast vouchers, or Hilton Honors / Bonvoy points worth $50-$200.",
    },
    {
      question: "Do I have to attend a timeshare presentation in Orlando?",
      answer:
        "Yes, the discounted rate is available in exchange for attending a 90- to 120-minute vacation ownership presentation at the resort. There is no obligation to purchase anything. You keep all package perks regardless of your decision at the presentation.",
    },
    {
      question: "What resorts offer vacation deals in Orlando?",
      answer:
        "Top Orlando resorts offering packages include Westgate Lakes Resort & Spa on International Drive, Westgate Vacation Villas near Disney, Hilton Grand Vacations at SeaWorld, Marriott's Grande Vista, and Holiday Inn Club Vacations at Orange Lake Resort. Each property offers unique amenities like waterparks, lazy rivers, and golf courses.",
    },
    {
      question: "How is this different from booking Orlando hotels on Expedia?",
      answer:
        "Vacation deals offer resort-quality stays at 60-80% less than OTA prices because the resort subsidizes your stay in exchange for a sales presentation. A room that costs $200/night on Expedia might be $33/night through a vacation package. You also get extras like theme park tickets and resort credits that standard hotel bookings don't include.",
    },
    {
      question: "What's the best time to visit Orlando?",
      answer:
        "The best value for Orlando vacation packages is during shoulder seasons: mid-January through mid-March and September through mid-November. You'll avoid peak crowds at Disney and Universal while enjoying pleasant 70-85°F weather. Holiday weeks and summer are the most expensive times to book.",
    },
    {
      question: "Are Orlando vacation deals refundable?",
      answer:
        "Refund policies vary by resort and booking company. Most packages allow cancellation with full refund up to 72 hours before check-in. Some brands like Westgate offer a 30-day money-back guarantee. Always check the specific cancellation policy before booking and keep your confirmation email.",
    },
    {
      question: "What are the age and income requirements for Orlando deals?",
      answer:
        "To qualify for the discounted rate, at least one guest must be 25-70 years old (some resorts allow 21+) with a household income of $50,000+ per year. Married or cohabiting couples must attend the presentation together. A valid ID and credit card are required at check-in.",
    },
    {
      question: "Can I bring kids to Orlando resort vacation deals?",
      answer:
        "Absolutely — Orlando vacation packages are very family-friendly. Most resorts welcome up to 2 adults and 2 children at no extra charge. Resorts like Westgate Lakes and Orange Lake have waterparks, game rooms, and kids' clubs. Many packages include family perks like Disney tickets or character dining experiences.",
    },
  ],

  "las-vegas": [
    {
      question: "What is a vacation deal to Las Vegas?",
      answer:
        "A Las Vegas vacation deal is a discounted resort stay on or near the Strip, offered by timeshare brands like Club Wyndham, Hilton Grand Vacations, and Marriott Vacation Club. Packages include 2 to 4 nights plus perks such as show tickets, dining credits, or virtual Mastercard gift cards worth $100-$200.",
    },
    {
      question: "How much do Las Vegas vacation deals cost?",
      answer:
        "Las Vegas packages start as low as $79 for a 2-night midweek stay. Popular options include Club Wyndham Grand Desert at $99 for 2 nights and Hilton Grand Vacations on the Boulevard at $149 for 3 nights. Weekend packages cost $20-$50 more. All prices are for the total stay, not per night.",
    },
    {
      question: "What's included in a Las Vegas vacation deal?",
      answer:
        "Vegas packages typically include 2-4 nights in a suite-style room with kitchenette, resort pool access, and free Wi-Fi. Many add a $200 virtual Mastercard, Wyndham Rewards or Hilton Honors points, Cirque du Soleil or comedy show tickets, and buffet dining credits at popular Strip restaurants.",
    },
    {
      question: "Do I have to attend a timeshare presentation in Las Vegas?",
      answer:
        "Yes, the discounted pricing requires attending a 90- to 120-minute vacation ownership presentation, usually the morning after check-in. The presentation takes place at the resort. You are under no obligation to buy, and all package benefits remain yours regardless of your decision.",
    },
    {
      question: "What resorts offer vacation deals in Las Vegas?",
      answer:
        "Major Las Vegas resorts with packages include Club Wyndham Grand Desert (1 mile from the Strip), Hilton Grand Vacations on the Las Vegas Boulevard, Hilton Grand Vacations Elara (attached to Planet Hollywood), and Marriott's Grand Chateau on the Strip. All feature pools, fitness centers, and concierge services.",
    },
    {
      question: "How are Las Vegas vacation packages different from booking on Hotels.com?",
      answer:
        "A Strip-adjacent suite that runs $250/night on Hotels.com can cost just $50/night through a vacation package. In addition to massive savings, packages include perks like show tickets and gift cards that Hotels.com doesn't offer. The trade-off is attending a single timeshare presentation during your stay.",
    },
    {
      question: "What's the best time to visit Las Vegas?",
      answer:
        "For the best deals, visit Las Vegas in January, February, or November when hotel demand is lowest and vacation package availability is highest. Spring and fall offer the most comfortable weather at 65-85°F. Avoid CES week in January, March Madness, and major holiday weekends when Strip prices spike.",
    },
    {
      question: "Are Las Vegas vacation deals refundable?",
      answer:
        "Most Las Vegas vacation packages offer free cancellation up to 48-72 hours before check-in. Some brokers provide a 7-day right of rescission period after booking. Wyndham and Hilton packages typically allow date changes up to 12 months from the original booking date. Always review the terms before purchasing.",
    },
    {
      question: "What are the age and income requirements for Las Vegas deals?",
      answer:
        "Las Vegas vacation package qualifications typically require at least one guest aged 25-65 (some resorts accept 21+) with a minimum household income of $50,000. Couples must attend the presentation together. You'll need a valid government-issued ID and a major credit card at check-in.",
    },
    {
      question: "Can I bring kids to Las Vegas resort vacation deals?",
      answer:
        "Yes, most Las Vegas vacation package resorts are family-friendly with pools, lazy rivers, and game rooms. Club Wyndham Grand Desert and Hilton Elara both welcome families with children. However, Las Vegas is generally better suited for adults-only trips since many attractions are 21+. Kid-friendly options include the High Roller, Adventuredome, and Shark Reef.",
    },
  ],

  cancun: [
    {
      question: "What is a vacation deal to Cancun?",
      answer:
        "A Cancun vacation deal is an all-inclusive or partial-inclusive resort stay along the Caribbean coast of Mexico's Riviera Maya. Packages are offered through companies like BookVIP and timeshare brands at rates 50-75% below booking directly. Most include airport transfers, meals, drinks, and resort activities.",
    },
    {
      question: "How much do Cancun vacation deals cost?",
      answer:
        "Cancun all-inclusive packages range from $199 to $599 per couple for 4 to 6 nights. BookVIP offers 5-night stays at Grand Oasis Cancun starting at $399 including all meals, drinks, and airport transfers. Non-all-inclusive resort packages start even lower at $149 for 3 nights.",
    },
    {
      question: "What's included in a Cancun vacation deal?",
      answer:
        "All-inclusive Cancun packages cover accommodations, all meals and beverages (including alcohol), airport round-trip transportation, resort entertainment, non-motorized water sports, pool and beach access, and resort credits. Some packages add excursions to Chichen Itza, snorkeling at Isla Mujeres, or spa credits.",
    },
    {
      question: "Do I have to attend a timeshare presentation in Cancun?",
      answer:
        "Yes, most Cancun vacation packages require attendance at a 90- to 120-minute resort presentation, typically on the morning after arrival. The presentation covers the resort's vacation club membership options. You are not obligated to purchase anything, and all your package benefits remain valid either way.",
    },
    {
      question: "What resorts offer vacation deals in Cancun?",
      answer:
        "Popular Cancun resorts with vacation packages include Grand Oasis Cancun in the Hotel Zone, Hyatt Ziva Cancun, Royalton CHIC Cancun, Palace Resorts Moon Palace, and Vidanta Riviera Maya. These are beachfront properties with multiple pools, restaurants, spas, and entertainment venues.",
    },
    {
      question: "How is this different from booking Cancun on Expedia?",
      answer:
        "A 5-night all-inclusive stay at a Cancun resort typically costs $2,000-$3,500 on Expedia for two guests. Through a vacation package, the same stay with airport transfers and resort credits costs $399-$599. The savings come from the resort subsidizing your stay to introduce you to their vacation ownership program.",
    },
    {
      question: "What's the best time to visit Cancun?",
      answer:
        "Cancun has warm weather year-round, but the driest and most comfortable months are December through April. For the best vacation package deals, book during May through November (excluding spring break). Water temperature stays above 78°F year-round, and even the rainy season brings only brief afternoon showers.",
    },
    {
      question: "Are Cancun vacation deals refundable?",
      answer:
        "Cancun package refund policies vary by provider. BookVIP typically allows cancellation with full refund up to 30 days before travel. Most resort-direct packages offer date changes up to 12-18 months from booking. Travel insurance is recommended for international packages to cover flight disruptions or health emergencies.",
    },
    {
      question: "What are the age and income requirements for Cancun deals?",
      answer:
        "Cancun vacation packages generally require at least one guest to be 28-65 years old with a household income above $50,000-$75,000 USD annually. Married couples must both attend the presentation. You need a valid passport (not expiring within 6 months) and a major credit card. Some resorts require guests to be fluent in English or Spanish.",
    },
    {
      question: "Can I bring kids to Cancun resort vacation deals?",
      answer:
        "Many Cancun resorts welcome families with children, including Grand Oasis and Moon Palace which feature kids' clubs, waterparks, and family pools. However, some adults-only resorts like Royalton CHIC do not allow children. Check the specific resort's policy before booking. Most packages allow 2 children free when sharing a room with 2 adults.",
    },
  ],

  gatlinburg: [
    {
      question: "What is a vacation deal to Gatlinburg?",
      answer:
        "A Gatlinburg vacation deal is a discounted mountain resort stay in the Great Smoky Mountains of Tennessee. Top providers include Westgate Smoky Mountain Resort and Bluegreen's MountainLoft Resort. Packages include cozy cabin-style suites, waterpark access, and proximity to Great Smoky Mountains National Park — America's most visited national park.",
    },
    {
      question: "How much do Gatlinburg vacation deals cost?",
      answer:
        "Gatlinburg packages are some of the most affordable, starting at $79 for a 3-night stay. Westgate Smoky Mountain Resort offers 3-night packages starting at $99 including Wild Bear Falls Waterpark access and fireplace suites. Premium cabin-style packages with mountain views run $149-$249 for 3-4 nights.",
    },
    {
      question: "What's included in a Gatlinburg vacation deal?",
      answer:
        "Gatlinburg packages typically include 3-4 nights in a spacious suite with full kitchen and fireplace, indoor waterpark access at Wild Bear Falls, free parking, Wi-Fi, and resort amenities like fitness centers and game rooms. Some packages add Dollywood tickets, Ripley's Aquarium passes, or Old Smoky Moonshine tastings.",
    },
    {
      question: "Do I have to attend a timeshare presentation in Gatlinburg?",
      answer:
        "Yes, the discounted rate requires attending a 90-minute vacation ownership presentation at the resort, usually scheduled the morning after your first night. The presentation covers the resort's timeshare program. No purchase is required, and you keep all benefits including waterpark passes and any bonus perks.",
    },
    {
      question: "What resorts offer vacation deals in Gatlinburg?",
      answer:
        "Key Gatlinburg-area resorts with packages include Westgate Smoky Mountain Resort (with Wild Bear Falls Waterpark), Westgate Smoky Mountain Resort & Water Park at Gatlinburg, Bluegreen's MountainLoft Resort, and Capital Vacations properties in Pigeon Forge. All are within minutes of downtown Gatlinburg and GSMNP entrances.",
    },
    {
      question: "How is this different from booking a Gatlinburg cabin on VRBO?",
      answer:
        "A comparable 3-night cabin or resort stay in Gatlinburg costs $150-$300/night on VRBO or Airbnb. Vacation deals offer resort-quality stays for $33/night or less, plus extras like waterpark access. You also get on-site dining, housekeeping, and resort amenities that private cabin rentals lack.",
    },
    {
      question: "What's the best time to visit Gatlinburg?",
      answer:
        "Fall foliage season (mid-October to early November) is Gatlinburg's most popular time, with the Smokies draped in reds, oranges, and golds. For the best package deals, visit in January through March or mid-April through May when crowds thin and resort availability increases. Summer is busy but great for hiking and waterpark fun.",
    },
    {
      question: "Are Gatlinburg vacation deals refundable?",
      answer:
        "Most Gatlinburg packages allow cancellation with full refund 72 hours or more before check-in. Westgate offers a satisfaction guarantee and flexible rebooking up to 12 months. If severe weather or GSMNP closures affect your trip, resorts typically offer date changes at no extra cost.",
    },
    {
      question: "What are the age and income requirements for Gatlinburg deals?",
      answer:
        "Gatlinburg vacation packages require at least one guest aged 25-70 with a combined household income of $40,000-$50,000 or more. Couples must attend the presentation together. A valid driver's license and credit card are required at check-in. Income requirements tend to be slightly lower than beach or international destinations.",
    },
    {
      question: "Can I bring kids to Gatlinburg resort vacation deals?",
      answer:
        "Gatlinburg is one of the most family-friendly vacation package destinations. Westgate Smoky Mountain Resort's Wild Bear Falls Waterpark is a huge hit with kids, and suites sleep up to 6 comfortably. Nearby attractions like Dollywood, Ripley's Aquarium, Ober Mountain Ski Area, and the Great Smoky Mountains offer endless family activities.",
    },
  ],

  "myrtle-beach": [
    {
      question: "What is a vacation deal to Myrtle Beach?",
      answer:
        "A Myrtle Beach vacation deal is a discounted oceanfront or near-ocean resort stay along South Carolina's Grand Strand. Leading providers include Marriott Vacation Club OceanWatch, Westgate Myrtle Beach, and Wyndham Vacation Resorts. Packages include beach access, pool amenities, and resort perks at a fraction of retail rates.",
    },
    {
      question: "How much do Myrtle Beach vacation deals cost?",
      answer:
        "Myrtle Beach packages range from $99 to $399 for a 3- to 5-night stay. Marriott's OceanWatch offers 3-night packages starting at $299 with ocean views and Bonvoy points. Westgate Myrtle Beach packages start at $99 for 3 nights. Summer packages run $50-$100 more than off-season rates.",
    },
    {
      question: "What's included in a Myrtle Beach vacation deal?",
      answer:
        "Myrtle Beach packages include 3-5 nights in a resort suite (many with ocean views and kitchenettes), beach access, multiple pools, free parking, and Wi-Fi. Premium packages add Bonvoy or Hilton Honors points, golf tee times at Grand Strand courses, Broadway at the Beach dining credits, or deep-sea fishing excursions.",
    },
    {
      question: "Do I have to attend a timeshare presentation in Myrtle Beach?",
      answer:
        "Yes, a 90-minute to 2-hour vacation ownership presentation is required, typically the morning after arrival. The presentation takes place at the resort and covers membership options. No purchase is necessary, and your package perks — including ocean-view room and bonus points — remain yours regardless of the outcome.",
    },
    {
      question: "What resorts offer vacation deals in Myrtle Beach?",
      answer:
        "Top Myrtle Beach resorts with packages include Marriott OceanWatch Villas at Grande Dunes (oceanfront), Westgate Myrtle Beach Oceanfront Resort, Hilton Grand Vacations at Anderson Ocean Club, Bluegreen's Shore Crest Vacation Villas, and Wyndham Vacation Resorts at Bay Watch. All offer direct or nearby beach access.",
    },
    {
      question: "How is this different from booking Myrtle Beach on Hotels.com?",
      answer:
        "Oceanfront resort rooms in Myrtle Beach run $200-$400/night on Hotels.com during summer. Vacation deals offer the same quality for $33-$80/night and include extras like loyalty points and golf credits. The savings are possible because resorts use these packages to introduce guests to vacation ownership programs.",
    },
    {
      question: "What's the best time to visit Myrtle Beach?",
      answer:
        "Peak beach season runs June through August with water temperatures around 80°F. For the best package deals, visit in April-May or September-October when weather is still warm (70s-80s), beaches are less crowded, and package prices drop significantly. Spring also coincides with excellent golf conditions on the Grand Strand's 80+ courses.",
    },
    {
      question: "Are Myrtle Beach vacation deals refundable?",
      answer:
        "Refund policies vary by provider but most Myrtle Beach packages allow cancellation with full refund up to 48-72 hours before check-in. Marriott and Hilton packages typically offer flexible date changes up to 12 months. Hurricane-related cancellations are usually handled with full refunds or complimentary rebooking.",
    },
    {
      question: "What are the age and income requirements for Myrtle Beach deals?",
      answer:
        "Myrtle Beach vacation packages typically require at least one guest aged 25-70 with a minimum household income of $50,000 per year. Couples traveling together must both attend the presentation. A valid government-issued photo ID and a major credit card are required at check-in.",
    },
    {
      question: "Can I bring kids to Myrtle Beach resort vacation deals?",
      answer:
        "Myrtle Beach is excellent for families. Most resort packages accommodate 2 adults and 2 children at no extra cost. Kids love the waterparks, the SkyWheel, Ripley's attractions, and Brookgreen Gardens. Family-friendly resorts like Westgate and Holiday Inn Club Vacations offer kids' pools, game rooms, and organized activities.",
    },
  ],

  branson: [
    {
      question: "What is a vacation deal to Branson?",
      answer:
        "A Branson vacation deal is a discounted resort stay in the live entertainment capital of the Ozarks. Branson, Missouri offers over 100 live shows, Silver Dollar City theme park, and beautiful Table Rock Lake. Packages are offered by resorts like Westgate Branson Woods and Wyndham Branson at rates far below standard booking prices.",
    },
    {
      question: "How much do Branson vacation deals cost?",
      answer:
        "Branson is one of the most affordable vacation package destinations, with deals starting at $59 for a 3-night stay. Westgate Branson Woods offers 3-night packages from $79 with show tickets included. Premium lakefront packages with boat rentals and dinner shows run $149-$249 for 3-4 nights.",
    },
    {
      question: "What's included in a Branson vacation deal?",
      answer:
        "Branson packages typically include 3-4 nights in a spacious condo-style suite, show tickets (often 2-4 shows), Silver Dollar City passes, free parking, and resort amenities. Some packages add Table Rock Lake activities like pontoon boat rentals, fishing guides, or dining credits at the resort's restaurants.",
    },
    {
      question: "Do I have to attend a timeshare presentation in Branson?",
      answer:
        "Yes, you'll attend a 60- to 90-minute vacation ownership presentation at the resort, usually scheduled for the morning after check-in. Branson presentations tend to be on the shorter side. No purchase is required, and all your show tickets, theme park passes, and resort perks stay with you regardless.",
    },
    {
      question: "What resorts offer vacation deals in Branson?",
      answer:
        "Leading Branson resorts with packages include Westgate Branson Woods Resort & Cabins, Wyndham Branson at the Meadows, Capital Vacations' Palace View and Palace View Heights, Holiday Inn Club Vacations at Ozark Mountain Resort, and Bluegreen Wilderness Club at Big Cedar. Many are nestled in wooded Ozark Mountain settings.",
    },
    {
      question: "How is this different from booking a Branson hotel online?",
      answer:
        "A Branson hotel room costs $100-$200/night on booking sites, and show tickets add $40-$80 each. Vacation packages bundle a 3-night suite stay with multiple show tickets for $79-$149 total — that's less than a single night at a comparable hotel. The resort subsidizes the cost through its vacation ownership preview program.",
    },
    {
      question: "What's the best time to visit Branson?",
      answer:
        "Branson's peak season is March through December, with Silver Dollar City's festivals driving attendance. The best package deals are in January-February and September-October. November-December features Branson's legendary Christmas shows and Silver Dollar City's Old Time Christmas, but packages sell out quickly during the holiday season.",
    },
    {
      question: "Are Branson vacation deals refundable?",
      answer:
        "Most Branson packages allow free cancellation 48-72 hours before check-in. Westgate and Capital Vacations offer flexible rebooking up to 12 months from the original date. Show tickets included in the package are typically exchangeable for alternate dates or different shows if your plans change.",
    },
    {
      question: "What are the age and income requirements for Branson deals?",
      answer:
        "Branson vacation packages have some of the most accessible qualification requirements. Most require at least one guest aged 25-70 with a household income of $40,000+ per year. Couples must attend the presentation together. A valid ID and credit card are needed at check-in. Some Branson packages accept guests as young as 21.",
    },
    {
      question: "Can I bring kids to Branson resort vacation deals?",
      answer:
        "Branson is an outstanding family destination. Silver Dollar City has rides for all ages, and shows like Dolly Parton's Stampede and the Acrobats of China thrill kids and adults alike. Resort packages accommodate families with suites sleeping 4-6. Table Rock Lake offers swimming, fishing, and boat rides perfect for family adventures.",
    },
  ],

  cabo: [
    {
      question: "What is a vacation deal to Cabo San Lucas?",
      answer:
        "A Cabo San Lucas vacation deal is a discounted luxury resort stay at the tip of Mexico's Baja California Peninsula. Packages are offered by timeshare resorts like Vidanta Los Cabos, Hilton Grand Vacations, and Marriott Vacation Club along with brokers like BookVIP. Stays include ocean-view rooms, resort amenities, and often airport transfers.",
    },
    {
      question: "How much do Cabo vacation deals cost?",
      answer:
        "Cabo packages range from $299 to $699 for a 4- to 6-night stay for two. BookVIP offers 5-night stays at beachfront resorts starting at $349. Marriott Vacation Club Cabo packages with Bonvoy points start at $499 for 4 nights. All-inclusive options at Vidanta Los Cabos start around $599 for 5 nights.",
    },
    {
      question: "What's included in a Cabo vacation deal?",
      answer:
        "Cabo packages include resort accommodations with ocean or marina views, pool and beach access, airport round-trip transportation, and resort credits. All-inclusive packages add unlimited meals, cocktails, and entertainment. Some packages bundle whale watching tours (December-March), sunset sailing on the Sea of Cortez, or spa treatments.",
    },
    {
      question: "Do I have to attend a timeshare presentation in Cabo?",
      answer:
        "Yes, Cabo vacation packages require attending a 90- to 120-minute vacation ownership presentation at the resort, typically scheduled for the morning after arrival. The presentation covers membership in the resort's vacation club. No purchase is required, and your package perks including airport transfers and resort credits remain intact.",
    },
    {
      question: "What resorts offer vacation deals in Cabo?",
      answer:
        "Top Cabo resorts with vacation packages include Vidanta Los Cabos (luxury beachfront on the Pacific), Hilton Grand Vacations at The Grand Solmar, Marriott Vacation Club Pulse at The Grand Coral, Hyatt Ziva Los Cabos (all-inclusive), and Pueblo Bonito Sunset Beach. All feature stunning ocean scenery and world-class dining.",
    },
    {
      question: "How is this different from booking Cabo on Expedia?",
      answer:
        "A comparable 5-night resort stay in Cabo costs $2,500-$5,000 on Expedia for two guests. Vacation deals offer the same caliber resort for $349-$699 including airport transfers. The dramatic savings are possible because resorts use these introductory packages as a marketing tool for their vacation ownership programs.",
    },
    {
      question: "What's the best time to visit Cabo San Lucas?",
      answer:
        "Cabo enjoys 350+ days of sunshine annually. The best weather is October through May with temperatures of 75-90°F and minimal rain. Whale watching season runs December through March. Hurricane season (June-October) brings occasional storms but also the lowest package prices. Water temperature stays between 68-84°F year-round.",
    },
    {
      question: "Are Cabo vacation deals refundable?",
      answer:
        "Most Cabo packages offer cancellation with full refund 30+ days before travel. BookVIP provides a money-back guarantee on most packages. Given the international travel involved, trip insurance is strongly recommended to cover flight disruptions, weather events, or health emergencies. Date changes are usually allowed up to 12-18 months out.",
    },
    {
      question: "What are the age and income requirements for Cabo deals?",
      answer:
        "Cabo vacation packages typically require at least one guest aged 28-65 with a household income of $75,000+ USD. Married couples must both attend the presentation. You need a valid passport with at least 6 months validity and a major credit card. Some resorts also require proof of employment or homeownership.",
    },
    {
      question: "Can I bring kids to Cabo resort vacation deals?",
      answer:
        "Some Cabo resorts are family-friendly — Hyatt Ziva Los Cabos has a kids' club and family pool, and Vidanta offers family suites. However, many Cabo packages are geared toward couples and may be at adults-only properties like Grand Solmar. Check the specific resort's child policy before booking. Kid-friendly excursions include glass-bottom boat tours and snorkeling at Chileno Bay.",
    },
  ],

  "key-west": [
    {
      question: "What is a vacation deal to Key West?",
      answer:
        "A Key West vacation deal is a discounted resort stay in Florida's southernmost island city, known for its pastel-colored houses, Duval Street nightlife, and stunning sunsets at Mallory Square. Packages are offered by Hyatt Vacation Ownership, Marriott Vacation Club, and other timeshare brands with properties in the Florida Keys.",
    },
    {
      question: "How much do Key West vacation deals cost?",
      answer:
        "Key West packages range from $199 to $499 for a 3- to 4-night stay. Hyatt Windward Pointe offers 3-night packages starting at $249. Marriott's Sunset Place packages start at $349 for 3 nights with Bonvoy points. Key West is pricier than mainland Florida destinations but packages still save 60-70% over rack rates.",
    },
    {
      question: "What's included in a Key West vacation deal?",
      answer:
        "Key West packages include resort accommodations (often suite-style with kitchenettes), pool access, free Wi-Fi, and resort amenities. Premium packages add snorkeling trips to the reef, sunset sailing cruises, Duval Street dining credits, tickets to the Hemingway Home, or bike rentals for exploring Old Town's charming streets.",
    },
    {
      question: "Do I have to attend a timeshare presentation in Key West?",
      answer:
        "Yes, Key West vacation packages require attending a 90-minute vacation ownership presentation at the resort. Given Key West's relaxed island atmosphere, presentations are typically scheduled early morning so you have the rest of the day free. No purchase obligation, and all your package perks remain regardless of your decision.",
    },
    {
      question: "What resorts offer vacation deals in Key West?",
      answer:
        "Resorts offering Key West vacation packages include Hyatt Windward Pointe, Hyatt Beach House, Marriott's Sunset Place, Galleon Resort and Marina, and Bluegreen's The Hammocks at Marathon (in the Middle Keys). Most are within walking distance or a short drive from Duval Street and the island's historic attractions.",
    },
    {
      question: "How is this different from booking Key West hotels online?",
      answer:
        "Key West hotel rooms cost $300-$600/night on booking sites, making it one of Florida's most expensive destinations. Vacation packages cut that to $66-$125/night and include extras like snorkeling trips and dining credits. These savings make Key West accessible to travelers who might otherwise skip this bucket-list destination.",
    },
    {
      question: "What's the best time to visit Key West?",
      answer:
        "Key West is a year-round destination with temperatures of 70-90°F. High season runs December through April with the driest weather and coolest ocean breezes. For the best package deals, visit in May-June or November when prices drop but weather remains excellent. October's Fantasy Fest is popular but books up early.",
    },
    {
      question: "Are Key West vacation deals refundable?",
      answer:
        "Most Key West packages allow cancellation with full refund 72+ hours before check-in. Hyatt and Marriott packages offer flexible date changes up to 12 months. Given Key West's vulnerability to tropical weather, travel insurance is recommended for visits during June through November. Hurricane-related cancellations are typically refunded in full.",
    },
    {
      question: "What are the age and income requirements for Key West deals?",
      answer:
        "Key West vacation packages require at least one guest aged 25-65 with a minimum household income of $50,000-$75,000 per year. Couples must attend the presentation together. A valid government ID and major credit card are required at check-in. Some Key West packages have slightly higher income requirements due to the premium destination.",
    },
    {
      question: "Can I bring kids to Key West resort vacation deals?",
      answer:
        "Key West resort packages welcome families, though the island is more popular with couples. Resorts like Hyatt Windward Pointe have family-friendly pools and are near kid-friendly attractions like the Key West Aquarium, Key West Butterfly and Nature Conservatory, and Fort Zachary Taylor beach. Most packages accommodate 2 adults and up to 2 children.",
    },
  ],

  sedona: [
    {
      question: "What is a vacation deal to Sedona?",
      answer:
        "A Sedona vacation deal is a discounted luxury resort stay surrounded by Arizona's iconic red rock formations. Packages are offered by timeshare resorts like Hyatt Residence Club Sedona, Diamond Resorts' Los Abrigados, and Wyndham Sedona. Stays include stunning canyon views, resort spas, and access to world-class hiking trails.",
    },
    {
      question: "How much do Sedona vacation deals cost?",
      answer:
        "Sedona packages range from $149 to $399 for a 3- to 4-night stay. Hyatt Residence Club offers 3-night packages starting at $199 with red rock views. Diamond Resorts Los Abrigados packages start at $149 for 3 nights on Oak Creek. Wyndham Sedona packages with spa credits run $249-$349 for 3 nights.",
    },
    {
      question: "What's included in a Sedona vacation deal?",
      answer:
        "Sedona packages include resort accommodations (many with balconies overlooking red rock formations), pool and hot tub access, fitness centers, and free parking. Premium packages add spa treatments at the resort, Pink Jeep Tours through red rock country, guided vortex hikes, wine tasting at Page Springs vineyards, or stargazing tours in Sedona's Dark Sky-certified skies.",
    },
    {
      question: "Do I have to attend a timeshare presentation in Sedona?",
      answer:
        "Yes, Sedona vacation packages require attending a 90-minute vacation ownership presentation at the resort. Presentations are scheduled in the morning so you can spend the rest of the day exploring Cathedral Rock, Devil's Bridge, or the charming Tlaquepaque Arts & Shopping Village. No purchase is required.",
    },
    {
      question: "What resorts offer vacation deals in Sedona?",
      answer:
        "Top Sedona resorts with packages include Hyatt Residence Club Sedona Pinon Pointe (in Uptown Sedona), Diamond Resorts Los Abrigados Resort & Spa (on Oak Creek), Wyndham Sedona at Bell Rock, Ridge on Sedona Golf Resort, and Arroyo Roble Resort. All are surrounded by Sedona's spectacular red rock landscape.",
    },
    {
      question: "How is this different from booking a Sedona hotel on Booking.com?",
      answer:
        "Sedona resort rooms cost $250-$500/night on Booking.com, especially during peak season. Vacation deals offer comparable accommodations for $50-$100/night with extras like spa credits and tour discounts. The savings make Sedona's luxury resort experience accessible without the luxury price tag.",
    },
    {
      question: "What's the best time to visit Sedona?",
      answer:
        "Sedona is beautiful year-round. Spring (March-May) and fall (September-November) offer ideal hiking temperatures of 65-85°F with clear skies. Summer is hot (95-105°F) but package prices drop significantly. Winter brings mild days (55-65°F), occasional dusting of snow on red rocks for stunning photos, and the lowest prices of the year.",
    },
    {
      question: "Are Sedona vacation deals refundable?",
      answer:
        "Most Sedona packages offer free cancellation 48-72 hours before check-in. Hyatt and Wyndham packages allow date changes up to 12 months. Sedona rarely faces weather disruptions, but monsoon season (July-September) can bring afternoon thunderstorms. Resort pools and indoor spas remain available during inclement weather.",
    },
    {
      question: "What are the age and income requirements for Sedona deals?",
      answer:
        "Sedona vacation packages typically require at least one guest aged 25-70 with a household income of $50,000+ per year. Couples must attend the presentation together. A valid government-issued ID and major credit card are needed at check-in. Sedona's appeal to retirees means many packages extend the upper age limit to 75.",
    },
    {
      question: "Can I bring kids to Sedona resort vacation deals?",
      answer:
        "While Sedona is popular with couples, families are welcome at most resort packages. Kids enjoy Pink Jeep Tours, Slide Rock State Park's natural water slide on Oak Creek, the Sedona Heritage Museum, and easy hikes like the Bell Rock Pathway. Resorts like Wyndham Sedona have pools and spacious suites that accommodate families of 4-6.",
    },
  ],

  "hilton-head": [
    {
      question: "What is a vacation deal to Hilton Head?",
      answer:
        "A Hilton Head vacation deal is a discounted resort stay on South Carolina's premier barrier island, known for its pristine beaches, championship golf courses, and Lowcountry charm. Packages are offered by Marriott Vacation Club, Hilton Grand Vacations, and Bluegreen at island resorts with beach access, pools, and tennis courts.",
    },
    {
      question: "How much do Hilton Head vacation deals cost?",
      answer:
        "Hilton Head packages range from $149 to $449 for a 3- to 5-night stay. Marriott's Barony Beach Club offers 3-night packages starting at $299 with Bonvoy points and beach access. Hilton Grand Vacations at RBC Heritage offers packages from $199 for 3 nights. Off-season packages start as low as $149.",
    },
    {
      question: "What's included in a Hilton Head vacation deal?",
      answer:
        "Hilton Head packages include resort accommodations (many with ocean views), beach access, pool and hot tub access, free Wi-Fi, and parking. Premium packages add rounds of golf at Harbour Town Golf Links, tennis lessons, bike rentals for exploring the island's 60+ miles of trails, dolphin-watching cruises, or dining credits at Lowcountry restaurants.",
    },
    {
      question: "Do I have to attend a timeshare presentation on Hilton Head?",
      answer:
        "Yes, the discounted rate requires attending a 90-minute to 2-hour vacation ownership presentation at the resort. Presentations are held in the morning so you can enjoy Hilton Head's beaches and activities the rest of the day. No purchase is required, and all package benefits remain yours regardless.",
    },
    {
      question: "What resorts offer vacation deals on Hilton Head?",
      answer:
        "Leading Hilton Head resorts with packages include Marriott's Barony Beach Club and SurfWatch, Hilton Grand Vacations at RBC Heritage, Bluegreen's Shore Crest Villas, and Club Wyndham Ocean Ridge. These are located within gated plantation communities like Palmetto Dunes, Shipyard, and Port Royal with private beach access.",
    },
    {
      question: "How is this different from booking Hilton Head on VRBO?",
      answer:
        "Hilton Head villa rentals on VRBO cost $200-$500/night, especially in summer. Vacation deals offer resort-quality stays for $50-$90/night with amenities like beach service, daily housekeeping, concierge, and pool complexes that private villa rentals don't provide. The savings come from the resort's vacation ownership preview program.",
    },
    {
      question: "What's the best time to visit Hilton Head?",
      answer:
        "Beach season runs May through September with water temperatures of 75-85°F. The best package deals are in March-April (azaleas blooming, mild weather) and October-November (warm days, zero crowds). The RBC Heritage PGA tournament in April is iconic but makes that week harder to book. Winter is mild (50s-60s) and ideal for golf.",
    },
    {
      question: "Are Hilton Head vacation deals refundable?",
      answer:
        "Most Hilton Head packages allow cancellation with full refund 48-72 hours before check-in. Marriott and Hilton packages typically offer flexible date changes up to 12 months from booking. Hurricane season (June-November) cancellations due to tropical weather are usually refunded fully or rebooked at no extra cost.",
    },
    {
      question: "What are the age and income requirements for Hilton Head deals?",
      answer:
        "Hilton Head vacation packages require at least one guest aged 25-70 with a household income of $50,000-$75,000 per year. Couples must attend the presentation together. A valid photo ID and major credit card are needed at check-in. Hilton Head's upscale positioning means some resorts have slightly higher income requirements.",
    },
    {
      question: "Can I bring kids to Hilton Head resort vacation deals?",
      answer:
        "Hilton Head is very family-friendly. Kids love the island's beaches, the Coastal Discovery Museum, alligator spotting at Sea Pines Forest Preserve, and biking the flat island trails. Resort packages accommodate families in spacious villas, and properties like Marriott's SurfWatch have kids' pools and organized activities. Most packages include 2 adults and up to 2 children.",
    },
  ],
};

// ---------------------------------------------------------------------------
// BRAND FAQs — unique content per brand
// ---------------------------------------------------------------------------

export const BRAND_FAQS: Record<string, FAQ[]> = {
  westgate: [
    {
      question: "What is Westgate Resorts?",
      answer:
        "Westgate Resorts is one of the largest privately held timeshare companies in the United States, founded by David Siegel. They own and operate over 28 resorts across popular vacation destinations including Orlando, Las Vegas, Gatlinburg, Myrtle Beach, Branson, Park City, and Cocoa Beach.",
    },
    {
      question: "How much do Westgate vacation deals cost?",
      answer:
        "Westgate vacation packages typically range from $79 to $299 for 3-4 night stays. Their most popular packages — Orlando and Gatlinburg — start at $99 for 3 nights. Westgate Las Vegas packages start at $79 for 2 nights. Prices include resort accommodations, waterpark access (where available), and free parking.",
    },
    {
      question: "What's included in a Westgate vacation deal?",
      answer:
        "Westgate packages include suite-style accommodations with full kitchens, free parking, Wi-Fi, pool and waterpark access, and resort amenities like fitness centers and game rooms. Properties like Westgate Lakes Orlando and Westgate Smoky Mountain include access to on-site waterparks at no extra charge.",
    },
    {
      question: "Are Westgate vacation deals legitimate?",
      answer:
        "Yes, Westgate Resorts is a well-established company with over 50 years in the hospitality industry. They operate real resorts at real addresses, and vacation deals are a legitimate marketing tool used by the timeshare industry. You do need to attend a sales presentation, but there is no obligation to purchase anything.",
    },
    {
      question: "What happens at a Westgate timeshare presentation?",
      answer:
        "The Westgate presentation lasts 90-120 minutes and takes place at the resort. A sales representative will tour you through a model unit, explain vacation ownership benefits, and present pricing options. You may receive additional incentives during the presentation. You are never obligated to buy and can say no at any time.",
    },
    {
      question: "Which Westgate resort is the best?",
      answer:
        "Westgate Lakes Resort & Spa in Orlando is their flagship property with a massive waterpark, 7 pools, boat rentals, and full-service spa. Westgate Smoky Mountain Resort in Gatlinburg is beloved for its Wild Bear Falls Waterpark and mountain setting. Westgate Park City in Utah offers ski-in/ski-out access to Canyons Village.",
    },
    {
      question: "Can I bring my family to a Westgate vacation deal?",
      answer:
        "Absolutely. Westgate resorts are designed for families with spacious suites sleeping 4-8, on-site waterparks, game rooms, and kids' activities. Most packages accommodate 2 adults and 2 children at no extra charge. Westgate Orlando is minutes from Disney World and Universal Studios, making it ideal for family vacations.",
    },
    {
      question: "What are the requirements to book a Westgate deal?",
      answer:
        "To qualify, at least one guest must be 25-70 years old with a household income of $50,000+ per year. Married or cohabiting couples must attend the presentation together. You'll need a valid ID and credit card at check-in. Some locations accept guests as young as 21 with higher income requirements.",
    },
    {
      question: "Can I cancel or reschedule a Westgate vacation deal?",
      answer:
        "Westgate offers flexible booking with cancellation up to 72 hours before check-in for a full refund. Date changes are usually allowed up to 12 months from the original booking date. Westgate also offers a satisfaction guarantee — if you're unhappy during your stay, speak with the resort manager for potential remedies.",
    },
    {
      question: "How does Westgate compare to other timeshare vacation deals?",
      answer:
        "Westgate is known for having some of the lowest entry-level package prices ($79-$99) and the most family-friendly amenities including waterparks. Compared to Marriott or Hilton packages, Westgate is more affordable but targets drive-to destinations rather than luxury international resorts. Their properties are consistently rated 3.5-4 stars.",
    },
  ],

  hgv: [
    {
      question: "What is Hilton Grand Vacations?",
      answer:
        "Hilton Grand Vacations (HGV) is Hilton's vacation ownership brand, offering timeshare resorts in destinations like Orlando, Las Vegas, New York City, Hawaii, and international locations. HGV properties feature Hilton-quality accommodations and integrate with the Hilton Honors loyalty program for points earning and redemption.",
    },
    {
      question: "How much do HGV vacation deals cost?",
      answer:
        "Hilton Grand Vacations packages range from $149 to $399 for 3-4 night stays. Orlando packages at SeaWorld-area properties start at $149, while Las Vegas packages at Elara (attached to Planet Hollywood) start at $199. Most packages include bonus Hilton Honors points worth $50-$150 in hotel stays.",
    },
    {
      question: "What's included in an HGV vacation deal?",
      answer:
        "HGV packages include suite-style accommodations with kitchenettes or full kitchens, resort pool access, fitness center, Wi-Fi, and typically 40,000-50,000 bonus Hilton Honors points. Rooms feature Hilton-quality bedding, bathroom amenities, and daily housekeeping. Some packages add dining credits or attraction tickets.",
    },
    {
      question: "Are Hilton Grand Vacations deals legitimate?",
      answer:
        "Yes, HGV is a publicly traded company (NYSE: HGV) and part of the Hilton family of brands. Their vacation packages are a well-established marketing channel. You attend a presentation about Hilton vacation ownership but are under no obligation to purchase. Your Hilton Honors points and all perks are honored regardless.",
    },
    {
      question: "What happens at an HGV timeshare presentation?",
      answer:
        "The HGV presentation is typically 90-120 minutes and includes a resort tour, explanation of the Hilton Grand Vacations ownership model, and pricing options. HGV's approach tends to be more polished and less high-pressure than some competitors, befitting the Hilton brand. You can decline the purchase at any time.",
    },
    {
      question: "Do I earn Hilton Honors points with HGV packages?",
      answer:
        "Yes, most HGV vacation packages include 40,000-50,000 bonus Hilton Honors points credited after your stay. These points can be used for free nights at any Hilton property worldwide. If you're already an Honors member, the points add to your existing balance and count toward tier status.",
    },
    {
      question: "Which HGV resort is the best?",
      answer:
        "HGV's Las Vegas Elara property (attached to Planet Hollywood on the Strip) is a standout for its location and city views. In Orlando, HGV at SeaWorld offers a beautiful lakefront setting. In Hawaii, HGV's Grand Waikikian and Kings' Land on the Big Island are consistently rated among the best timeshare resorts anywhere.",
    },
    {
      question: "What are the requirements for an HGV vacation deal?",
      answer:
        "HGV packages require at least one guest aged 25-70 with a household income of $50,000+ per year. Couples must attend together. A valid government ID and major credit card are required. HGV typically has a more thorough qualification process than discount brokers, reflecting the premium Hilton brand positioning.",
    },
    {
      question: "Can I cancel or reschedule an HGV deal?",
      answer:
        "HGV offers cancellation with full refund typically up to 72 hours before check-in. Date changes are usually accommodated within 12-18 months of the original booking. HGV's customer service is highly rated, and their policies tend to be more flexible than smaller operators.",
    },
    {
      question: "How does HGV compare to other vacation deal brands?",
      answer:
        "HGV packages are mid-priced ($149-$399) compared to budget options like Westgate ($79-$99) or premium options like Marriott ($299-$499). The key differentiator is Hilton Honors integration — the bonus points alone can be worth $100-$200 in future hotel stays. HGV resorts consistently rank among the highest-rated in the timeshare industry.",
    },
  ],

  marriott: [
    {
      question: "What is Marriott Vacation Club?",
      answer:
        "Marriott Vacation Club (MVC) is the vacation ownership division of Marriott International, offering premium timeshare resorts in over 90 locations worldwide. MVC is known for high-quality accommodations, integration with the Marriott Bonvoy loyalty program, and resorts in prime locations from Maui to Marco Island.",
    },
    {
      question: "How much do Marriott Vacation Club deals cost?",
      answer:
        "Marriott Vacation Club packages range from $199 to $499 for 3-5 night stays, making them among the pricier vacation package options. However, you get premium resort quality and typically 20,000-50,000 bonus Bonvoy points. Popular packages include Myrtle Beach OceanWatch at $299 and Marco Island at $449 for 3 nights.",
    },
    {
      question: "What's included in a Marriott Vacation Club deal?",
      answer:
        "MVC packages include luxury suite accommodations (1-2 bedrooms with full kitchens), resort pool and beach access, Bonvoy points, daily housekeeping, concierge services, fitness center, and Marriott-grade amenities. Premium packages add golf rounds, spa credits, wine tastings, or excursion discounts depending on location.",
    },
    {
      question: "Are Marriott Vacation Club deals legitimate?",
      answer:
        "Yes, Marriott Vacation Club is owned by Marriott Vacations Worldwide (NYSE: VAC), a publicly traded company affiliated with the world's largest hotel company. Their packages are a legitimate marketing tool backed by the Marriott brand's reputation. Presentations are professional and you're never required to purchase anything.",
    },
    {
      question: "What happens at a Marriott timeshare presentation?",
      answer:
        "Marriott presentations last approximately 90-120 minutes and are among the most professional in the industry. You'll tour a model villa, learn about the Marriott Vacation Club Destinations points program, and see pricing options. Marriott's sales approach emphasizes the brand's value proposition rather than high-pressure tactics.",
    },
    {
      question: "Do I earn Marriott Bonvoy points with MVC packages?",
      answer:
        "Yes, MVC packages typically include 20,000-50,000 bonus Bonvoy points. These can be redeemed for free nights at any of Marriott's 8,000+ hotels worldwide. Some packages also offer Bonvoy elite night credits. If you're already a Bonvoy member, the points stack with your existing balance.",
    },
    {
      question: "Which Marriott Vacation Club resort is the best?",
      answer:
        "Marriott's Ko Olina Beach Club in Hawaii and Aruba Surf Club are perennial favorites. In the continental US, OceanWatch in Myrtle Beach offers stunning oceanfront villas, Grande Vista in Orlando provides family-friendly luxury, and Crystal Shores in Marco Island delivers Gulf Coast elegance. All MVC resorts maintain Marriott's premium quality standards.",
    },
    {
      question: "What are the requirements for a Marriott Vacation Club deal?",
      answer:
        "MVC packages generally require at least one guest aged 25-70 with a minimum household income of $75,000-$100,000 per year. Couples must attend together. A valid ID and credit card are required. Marriott's qualification requirements are higher than most competitors, reflecting their premium market positioning.",
    },
    {
      question: "Can I cancel or reschedule a Marriott deal?",
      answer:
        "Marriott Vacation Club typically offers cancellation with full refund up to 72 hours before arrival. Date changes are accommodated within 12 months. MVC's customer service is consistently rated among the best in the industry, and they're generally accommodating with schedule changes.",
    },
    {
      question: "How does Marriott compare to other vacation deal brands?",
      answer:
        "Marriott Vacation Club packages are premium-priced but deliver top-tier resort quality. Compared to Westgate ($79-$99) or HGV ($149-$399), MVC packages ($199-$499) cost more but feature higher-end properties and stronger Bonvoy integration. If you're already in the Marriott ecosystem, the bonus points alone justify the higher package price.",
    },
  ],

  wyndham: [
    {
      question: "What is Club Wyndham?",
      answer:
        "Club Wyndham is the vacation ownership brand of Travel + Leisure Co. (formerly Wyndham Destinations), offering access to 230+ resorts worldwide. It's one of the largest timeshare networks in the world with properties across the US, Caribbean, and international destinations, plus exchange access through RCI.",
    },
    {
      question: "How much do Club Wyndham vacation deals cost?",
      answer:
        "Club Wyndham vacation packages are competitively priced at $79-$249 for 2-4 night stays. Their popular Las Vegas package at Grand Desert starts at $99 for 2 nights. Orlando packages at Wyndham Bonnet Creek start at $129. Many packages include virtual Mastercard gift cards worth $100-$200 as a bonus incentive.",
    },
    {
      question: "What's included in a Club Wyndham vacation deal?",
      answer:
        "Wyndham packages include suite-style accommodations with kitchenettes, resort pool access, fitness center, free Wi-Fi, and parking. Many packages bundle $100-$200 virtual Mastercard gift cards and 30,000-60,000 Wyndham Rewards points. Properties at Bonnet Creek Orlando include access to the resort's lazy river and multiple pool areas.",
    },
    {
      question: "Are Club Wyndham vacation deals legitimate?",
      answer:
        "Yes, Club Wyndham is owned by Travel + Leisure Co. (NYSE: TNL), a major publicly traded travel company. Their vacation packages are a standard marketing tool for the timeshare industry. You attend a presentation about vacation ownership with no obligation to buy. The virtual Mastercard and Wyndham Rewards points are real and usable.",
    },
    {
      question: "What happens at a Club Wyndham timeshare presentation?",
      answer:
        "The Wyndham presentation typically lasts 90-120 minutes and includes a tour of the resort property, an overview of the Club Wyndham points-based ownership system, and pricing options. Wyndham's system is points-based, allowing owners to book at different resorts for varying lengths. You can decline the offer at any time.",
    },
    {
      question: "Do I earn Wyndham Rewards points with packages?",
      answer:
        "Yes, many Club Wyndham packages include 30,000-60,000 bonus Wyndham Rewards points. These points can be redeemed for free nights at any of Wyndham's 9,000+ hotels worldwide (including Days Inn, Ramada, La Quinta, and more). Points can also be used for vacation rentals and experiences through Wyndham's platform.",
    },
    {
      question: "Which Club Wyndham resort is the best?",
      answer:
        "Wyndham Bonnet Creek in Orlando is consistently rated a top Club Wyndham property, situated on Disney property with a lazy river and multiple pools. Grand Desert in Las Vegas offers spacious suites a mile from the Strip. Wyndham Smoky Mountains in Tennessee features mountain-view suites with fireplaces near Dollywood.",
    },
    {
      question: "What are the requirements for a Wyndham vacation deal?",
      answer:
        "Club Wyndham packages require at least one guest aged 25-65 with a household income of $50,000+ annually. Married or cohabiting couples must attend the presentation together. A valid ID and major credit card are required at check-in. Some locations accept single travelers who meet the age and income requirements.",
    },
    {
      question: "Can I cancel or reschedule a Wyndham deal?",
      answer:
        "Wyndham offers cancellation with full refund up to 48-72 hours before check-in for most packages. Date changes are typically available within 12 months of the original booking. Wyndham's customer service team can be reached by phone and is generally responsive to rebooking and cancellation requests.",
    },
    {
      question: "How does Wyndham compare to other vacation deal brands?",
      answer:
        "Club Wyndham offers excellent value in the mid-range ($79-$249) with the bonus of virtual Mastercard gift cards that other brands don't provide. Their resort network is the largest in the industry at 230+ locations. Compared to Marriott, Wyndham is more affordable; compared to Westgate, Wyndham offers more destination variety.",
    },
  ],

  bookvip: [
    {
      question: "What is BookVIP?",
      answer:
        "BookVIP is a leading vacation package broker that partners with major timeshare resorts to offer deeply discounted resort stays. Unlike direct resort brands, BookVIP aggregates deals from multiple resorts and brands, specializing in all-inclusive packages in Mexico and the Caribbean as well as domestic US resort destinations.",
    },
    {
      question: "How much do BookVIP vacation deals cost?",
      answer:
        "BookVIP packages range from $99 to $699 depending on the destination and inclusions. Domestic US packages start around $99-$199 for 3-4 nights. Their best-selling all-inclusive Cancun packages run $349-$599 for 5-6 nights including meals, drinks, and airport transfers — a fraction of the $2,000+ you'd pay booking direct.",
    },
    {
      question: "What's included in a BookVIP vacation deal?",
      answer:
        "BookVIP packages vary by destination. Domestic packages include resort accommodations, parking, and Wi-Fi. International all-inclusive packages add unlimited meals and drinks, airport round-trip transportation, resort entertainment, and sometimes excursion credits. BookVIP's all-inclusive Cancun and Cabo deals are their most popular offerings.",
    },
    {
      question: "Is BookVIP legitimate and trustworthy?",
      answer:
        "BookVIP is a legitimate company that has been operating since 2009. They have an A+ rating with the Better Business Bureau and have served millions of travelers. As a broker, they work with established resort brands, so you're staying at real, verified resort properties. Always book through BookVIP's official website to ensure authenticity.",
    },
    {
      question: "What happens at a BookVIP timeshare presentation?",
      answer:
        "BookVIP packages require attending a 90- to 120-minute presentation at the partner resort. The presentation is conducted by the resort's sales team (not BookVIP), covering their vacation ownership program. BookVIP acts as the booking agent — the resort handles the on-site experience. No purchase is ever required.",
    },
    {
      question: "Does BookVIP offer packages in the US or just Mexico?",
      answer:
        "BookVIP offers packages in both domestic and international destinations. Popular US destinations include Orlando, Las Vegas, Myrtle Beach, and Branson. International options include Cancun, Cabo San Lucas, Puerto Vallarta, Punta Cana, and Jamaica. Their international all-inclusive deals typically offer the best overall value.",
    },
    {
      question: "What resorts does BookVIP partner with?",
      answer:
        "BookVIP partners with major resort brands including Grand Oasis (Cancun), Royalton Resorts, Palace Resorts, Vidanta (Mexico), Hilton Grand Vacations, Westgate Resorts, and Wyndham. The specific resort varies by destination and deal. Each listing on BookVIP shows the exact resort name and property details.",
    },
    {
      question: "What are the requirements to book a BookVIP deal?",
      answer:
        "BookVIP package requirements are set by the partner resort and typically require at least one guest aged 25-65 with a household income of $50,000+ (some international packages require $75,000+). Couples must attend together. A valid passport is required for international destinations. Credit card and ID are needed at check-in.",
    },
    {
      question: "Can I cancel or reschedule a BookVIP deal?",
      answer:
        "BookVIP offers a money-back guarantee on most packages if cancelled within their stated window. Date changes are usually allowed up to 12-18 months from booking. For international packages, they recommend trip insurance through a third party. Contact BookVIP's customer service team directly for specific cancellation policies on your booking.",
    },
    {
      question: "How does BookVIP compare to booking direct with a resort?",
      answer:
        "BookVIP often offers lower prices than booking directly with the resort because they purchase packages in bulk. However, booking direct sometimes gives you more flexibility on dates and room types. BookVIP's strength is their curated all-inclusive international deals, where the savings can be $1,000+ compared to booking the same resort through an OTA.",
    },
  ],
};

// ---------------------------------------------------------------------------
// PRICE FAQs
// ---------------------------------------------------------------------------

export const PRICE_FAQS: Record<string, FAQ[]> = {
  "deals-under-100": [
    {
      question: "Are vacation deals under $100 real?",
      answer:
        "Yes, vacation deals under $100 are legitimate offers from timeshare resorts. The low price covers your entire stay (not per night), and the resort subsidizes the cost because you attend a 90-minute vacation ownership presentation. Brands like Westgate and Wyndham regularly offer 2-3 night packages for $59-$99.",
    },
    {
      question: "What do you get for under $100 on a vacation deal?",
      answer:
        "For under $100, you typically get a 2-3 night stay at a full-service resort with pool access, free parking, Wi-Fi, and a suite-style room. Popular options include Westgate Orlando and Gatlinburg at $99, Wyndham Las Vegas at $99 for 2 nights, and Branson packages starting at $79. Some packages also include waterpark access or show tickets.",
    },
    {
      question: "What destinations offer deals under $100?",
      answer:
        "The most common sub-$100 destinations are Orlando, Las Vegas, Gatlinburg, Branson, Williamsburg, and Myrtle Beach (off-season). These are drive-to destinations where resort operational costs are lower. International destinations like Cancun and Cabo are rarely available under $100 due to the higher cost of all-inclusive offerings.",
    },
    {
      question: "What's the catch with cheap vacation deals?",
      answer:
        "The main requirement is attending a 90-120 minute timeshare presentation at the resort. You must meet age (usually 25-70) and income ($40,000-$50,000+) qualifications. The presentation is the only 'catch' — you're never required to buy anything. All package perks remain yours regardless of your decision at the presentation.",
    },
    {
      question: "How long are the stays for deals under $100?",
      answer:
        "Sub-$100 packages typically offer 2-3 night stays. At $99, you can find 3-night packages in Orlando, Gatlinburg, and Branson. At $79-$89, expect 2-night stays in destinations like Las Vegas and Branson. A few promotional deals offer 4 nights for $99 during off-peak seasons at select properties.",
    },
    {
      question: "Can I bring my family on a deal under $100?",
      answer:
        "Yes, most sub-$100 packages accommodate 2 adults and 2 children in a single suite at no extra charge. Family-friendly options include Westgate Orlando (near Disney), Westgate Gatlinburg (with waterpark), and Branson resorts (near Silver Dollar City). These are some of the best-value family vacation options available anywhere.",
    },
    {
      question: "Do cheap deals mean low-quality resorts?",
      answer:
        "Not at all. The low price reflects the resort's marketing investment, not the quality of the property. Westgate Lakes Orlando ($99) has a full waterpark and 7 pools. Wyndham Grand Desert Las Vegas ($99) features spacious suites with Strip views. These are 3.5-4 star resorts with the same amenities as full-price guests.",
    },
    {
      question: "Are deals under $100 available year-round?",
      answer:
        "Sub-$100 deals are available most of the year but are subject to blackout dates during peak holiday periods. Availability is best midweek and during shoulder seasons. Summer and holiday weeks may see prices bump up $20-$50. Booking 2-4 weeks in advance typically yields the best selection at the lowest prices.",
    },
    {
      question: "How do I book a vacation deal under $100?",
      answer:
        "Compare sub-$100 deals on VacationDeals.to, where we aggregate deals from top resort brands and brokers. You can also book directly through Westgate, Wyndham, or broker sites like BookVIP and GetawayDealz. Read the qualification requirements carefully before booking to ensure you're eligible for the promotional rate.",
    },
    {
      question: "Can I extend my stay if I book a deal under $100?",
      answer:
        "Some resorts allow you to add extra nights at a discounted (but not promotional) rate, typically $50-$100/night. This must be arranged before or during check-in. Extending your stay doesn't require a second presentation. Alternatively, you can book back-to-back packages at different resorts in the same destination.",
    },
  ],
};

// ---------------------------------------------------------------------------
// DURATION FAQs
// ---------------------------------------------------------------------------

export const DURATION_FAQS: Record<string, FAQ[]> = {
  "3-night-packages": [
    {
      question: "Why are 3-night deals the most popular?",
      answer:
        "Three nights is the sweet spot for vacation deals — long enough to enjoy the resort and local attractions, short enough for a long weekend getaway. Most resorts price 3-night packages as their best value option, and the presentation is typically on day 2, leaving day 1 for arrival and day 3 for exploration.",
    },
    {
      question: "How much do 3-night vacation deals cost?",
      answer:
        "Three-night packages range from $79 to $399 depending on the destination. Domestic packages in Gatlinburg, Branson, and Orlando start at $79-$99. Las Vegas and Myrtle Beach 3-night packages run $99-$299. International destinations like Cancun start at $199-$399 for 3 nights. All prices are for the full stay, not per night.",
    },
    {
      question: "What destinations offer 3-night vacation deals?",
      answer:
        "Nearly every vacation package destination offers a 3-night option. The most popular include Orlando (near Disney), Las Vegas (near the Strip), Gatlinburg (Great Smoky Mountains), Myrtle Beach (oceanfront), Branson (live entertainment), Hilton Head (beach and golf), Sedona (red rocks), and Williamsburg (historic attractions).",
    },
    {
      question: "Can I upgrade a 3-night deal to more nights?",
      answer:
        "Some resorts allow adding nights at a discounted rate when booking or at check-in. Extra nights typically cost $50-$125/night depending on the property and season. Not all packages allow extensions, so check with the provider before booking if you'd like more time. Alternatively, consider booking a 4 or 5-night package from the start.",
    },
    {
      question: "Is 3 nights enough to enjoy the destination?",
      answer:
        "For most drive-to destinations like Orlando, Las Vegas, Gatlinburg, and Branson, 3 nights is perfect for a long weekend trip. You'll have time for the resort, major attractions, and dining. For international destinations like Cancun or Cabo, consider 4-5 nights to justify the travel time and maximize beach and excursion time.",
    },
    {
      question: "What day should I arrive for a 3-night deal?",
      answer:
        "Thursday arrival is ideal for a 3-night deal — you arrive Thursday evening, attend the presentation Friday morning, enjoy Friday afternoon through Saturday, and check out Sunday. Wednesday arrivals work well for midweek pricing. Check-in is usually 4 PM and check-out at 10-11 AM on your departure day.",
    },
    {
      question: "Do 3-night deals include a timeshare presentation?",
      answer:
        "Yes, all vacation packages regardless of duration require attending one timeshare presentation, typically 90-120 minutes. For 3-night stays, the presentation is usually the morning after your first night. Only one presentation is required per stay — you won't be asked to attend again during your remaining nights.",
    },
    {
      question: "Are 3-night deals available on weekends?",
      answer:
        "Yes, 3-night deals are available with Friday, Saturday, or any day check-in. Weekend arrivals may cost $10-$30 more at some properties but are widely available. Holiday weekends like Memorial Day, 4th of July, and Labor Day have limited availability and should be booked 3-4 weeks in advance.",
    },
    {
      question: "What's the best 3-night vacation package available?",
      answer:
        "The best value 3-night packages are Westgate Orlando at $99 (includes waterpark), Wyndham Las Vegas at $99 (includes $200 virtual Mastercard), and Westgate Gatlinburg at $99 (includes Wild Bear Falls). For premium options, Marriott OceanWatch in Myrtle Beach at $299 with Bonvoy points offers exceptional oceanfront quality.",
    },
    {
      question: "Can families enjoy a 3-night vacation package?",
      answer:
        "Absolutely. Three-night packages are the most popular option for family getaways. Most packages accommodate 2 adults and 2 children in suites with kitchenettes (saving on dining costs). Destinations like Orlando, Gatlinburg, and Branson are packed with family activities that fit perfectly into a 3-night itinerary.",
    },
  ],
};

// ---------------------------------------------------------------------------
// Slug lookup helper
// ---------------------------------------------------------------------------

export function getFAQsForSlug(slug: string): FAQ[] | null {
  // Check destinations
  if (DESTINATION_FAQS[slug]) return DESTINATION_FAQS[slug];

  // Check brands
  if (BRAND_FAQS[slug]) return BRAND_FAQS[slug];

  // Check price ranges
  if (PRICE_FAQS[slug]) return PRICE_FAQS[slug];

  // Check durations
  if (DURATION_FAQS[slug]) return DURATION_FAQS[slug];

  return null;
}

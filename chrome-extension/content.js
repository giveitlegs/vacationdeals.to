/**
 * VacationDeals.to — Hidden Resort Rates content script
 *
 * Anchors on the "Check availability" CTA in Google Business Profile (desktop + mobile
 * search, Google Maps) and inserts a vacpack rate banner directly above it.
 *
 * Rules:
 * 1. Only inject once per page (debounced by current business name)
 * 2. Re-fire on SPA navigation (Google Maps, Search tab switches)
 * 3. If API returns null, render nothing — never show a stale/wrong deal
 * 4. Clicking the CTA opens the canonical vacationdeals.to lander in a new tab
 * 5. All DOM construction uses textContent / element factories — no innerHTML
 */

const BANNER_ID = "vd-deal-banner";
const BUSINESS_TITLE_SELECTORS = [
  '[data-attrid="title"] span',
  'h1[data-attrid="title"]',
  'h1.fontHeadlineLarge',
  'div[role="main"] h2[aria-level="1"]',
  'div[role="main"] h1',
  '.SPZz6b h1',
];

const ANCHOR_SELECTORS = [
  'g-raised-button a[href*="google.com/travel/hotels"]',
  'a[data-ved][aria-label*="Check availability" i]',
  'a[aria-label*="Check availability" i]',
  'div[role="button"][aria-label*="Check availability" i]',
  'a[href*="/travel/hotels"][role="button"]',
  'button[data-value="check_availability"]',
  '[jsaction*="checkAvailability"]',
];

let lastInjectedFor = null;
let injecting = false;
let lastUrl = location.href;
let debounceTimer = null;

// --------------------------------------------------------------------------
// Utilities
// --------------------------------------------------------------------------

function findBusinessName() {
  for (const sel of BUSINESS_TITLE_SELECTORS) {
    const el = document.querySelector(sel);
    if (el && el.textContent) {
      const name = el.textContent.trim();
      if (name && name.length > 2 && name.length < 150) return name;
    }
  }
  return null;
}

function findAnchor() {
  for (const sel of ANCHOR_SELECTORS) {
    const el = document.querySelector(sel);
    if (el) return el;
  }
  return null;
}

function isLikelyLodging(name) {
  const lower = name.toLowerCase();
  const keywords = [
    "resort", "hotel", "inn", "lodge", "suites", "villas", "spa",
    "westgate", "wyndham", "marriott", "hilton", "hyatt", "hgv",
    "bluegreen", "holiday inn", "sheraton", "club", "vacation",
    "staybridge", "residence", "embassy", "hampton", "homewood",
  ];
  return keywords.some((kw) => lower.includes(kw));
}

function removeExisting() {
  const el = document.getElementById(BANNER_ID);
  if (el) el.remove();
}

// Small helper: create element with classes + attributes + text content
function el(tag, opts = {}) {
  const node = document.createElement(tag);
  if (opts.className) node.className = opts.className;
  if (opts.text != null) node.textContent = String(opts.text);
  if (opts.attrs) {
    for (const [k, v] of Object.entries(opts.attrs)) {
      node.setAttribute(k, String(v));
    }
  }
  if (opts.style) {
    for (const [k, v] of Object.entries(opts.style)) {
      node.style.setProperty(k, String(v));
    }
  }
  if (opts.children) {
    for (const child of opts.children) {
      if (child != null) node.appendChild(child);
    }
  }
  return node;
}

// --------------------------------------------------------------------------
// Render (DOM-only — no innerHTML)
// --------------------------------------------------------------------------

function buildBanner(deal) {
  const days = deal.durationDays || (deal.durationNights ? deal.durationNights + 1 : null);
  const nights = deal.durationNights || null;
  const duration = days && nights ? `${days}D/${nights}N` : "Vacpack";

  const tagEl = el("span", {
    className: "vd-tag",
    text: deal.tag || "EXCLUSIVE RATE",
    style: { background: deal.tagColor || "#2563EB" },
  });

  const line1Children = [
    el("span", { className: "vd-duration", text: duration }),
    el("span", { className: "vd-price", text: `$${Math.round(deal.price)}` }),
  ];

  if (deal.originalPrice && deal.originalPrice > deal.price) {
    line1Children.push(
      el("span", { className: "vd-original", text: `$${Math.round(deal.originalPrice)}` }),
    );
  }

  if (deal.savingsPercent && deal.savingsPercent > 0) {
    line1Children.push(
      el("span", { className: "vd-savings-chip", text: `Save ${deal.savingsPercent}%` }),
    );
  }

  const line1 = el("div", { className: "vd-line1", children: line1Children });

  const line2 = el("div", {
    className: "vd-line2",
    children: [
      document.createTextNode("via "),
      el("strong", { text: String(deal.brandName || "VacationDeals") }),
      document.createTextNode(" vacpack — includes resort stay "),
      el("span", { className: "vd-arrow", text: "→" }),
    ],
  });

  const main = el("div", { className: "vd-main", children: [line1, line2] });

  const footer = el("div", {
    className: "vd-footer",
    text: "Powered by VacationDeals.to · Independent rate · Not affiliated with Google",
  });

  const link = el("a", {
    className: "vd-banner",
    attrs: {
      href: String(deal.landerUrl || "https://vacationdeals.to"),
      target: "_blank",
      rel: "noopener noreferrer",
    },
    children: [tagEl, main, footer],
  });

  return el("div", {
    attrs: { id: BANNER_ID, "data-vd": "banner" },
    children: [link],
  });
}

function injectBanner(anchor, deal) {
  removeExisting();

  // Walk up until we reach a parent that is wide enough to house the banner.
  // This keeps the banner visually stacked with the action row rather than
  // shoved into a tight flex cell.
  let insertPoint = anchor;
  let parent = anchor.parentElement;
  while (parent && parent.offsetWidth < 200 && parent !== document.body) {
    insertPoint = parent;
    parent = parent.parentElement;
  }

  const banner = buildBanner(deal);
  if (insertPoint.parentElement) {
    insertPoint.parentElement.insertBefore(banner, insertPoint);
  }
}

// --------------------------------------------------------------------------
// Fetch + orchestrate
// --------------------------------------------------------------------------

async function checkAndInject() {
  if (injecting) return;

  const name = findBusinessName();
  if (!name) return;
  if (!isLikelyLodging(name)) return;
  if (lastInjectedFor === name && document.getElementById(BANNER_ID)) return;

  const anchor = findAnchor();
  if (!anchor) return;

  injecting = true;
  try {
    const res = await chrome.runtime.sendMessage({ type: "CHECK_RESORT", name });
    if (res && res.deal) {
      injectBanner(anchor, res.deal);
      lastInjectedFor = name;
    } else {
      lastInjectedFor = name; // remember misses so we don't re-query
      removeExisting();
    }
  } catch (e) {
    // Extension context invalidated — silently stop
  } finally {
    injecting = false;
  }
}

// --------------------------------------------------------------------------
// Observers: DOM mutations + SPA navigation
// --------------------------------------------------------------------------

function schedule() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(checkAndInject, 300);
}

const observer = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    lastInjectedFor = null;
    removeExisting();
  }
  schedule();
});

observer.observe(document.body, { childList: true, subtree: true });

schedule();

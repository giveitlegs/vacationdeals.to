/**
 * VacationDeals.to — MV3 service worker
 * Bridges the content-script to the vacationdeals.to match API.
 * Caches negative + positive matches for 1h to keep API load low.
 */

const MATCH_ENDPOINT = "https://vacationdeals.to/api/extension/match";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1h
const cache = new Map(); // key: normalized resort name, value: { result, time }

function normalizeKey(name) {
  return String(name || "").toLowerCase().replace(/\s+/g, " ").trim();
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message && message.type === "CHECK_RESORT") {
    handleResortCheck(String(message.name || "")).then(sendResponse);
    return true; // async
  }
  return false;
});

async function handleResortCheck(businessName) {
  const key = normalizeKey(businessName);
  if (!key) return { deal: null };

  const cached = cache.get(key);
  if (cached && Date.now() - cached.time < CACHE_TTL_MS) {
    return cached.result;
  }

  try {
    const url = `${MATCH_ENDPOINT}?resort=${encodeURIComponent(businessName)}`;
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      const miss = { deal: null };
      cache.set(key, { result: miss, time: Date.now() });
      return miss;
    }

    const data = await response.json();
    const result = { deal: data && data.deal ? data.deal : null };
    cache.set(key, { result, time: Date.now() });
    return result;
  } catch (e) {
    // Network failure — cache briefly to avoid hammering
    const miss = { deal: null };
    cache.set(key, { result: miss, time: Date.now() - CACHE_TTL_MS + 5 * 60 * 1000 });
    return miss;
  }
}

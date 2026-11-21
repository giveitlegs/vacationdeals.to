/**
 * Derive a lead's acquisition CHANNEL from first-touch signals.
 *
 * Rule: UTM wins (the owner labeled the link themselves); otherwise read the
 * referrer host; if neither, it's "direct". We store the raw referrer + UTMs on
 * every lead_submissions row, so channels can be re-derived later if this logic
 * is refined — never lossy.
 *
 * Taxonomy (keep in sync with the /admin/leads filter + CHANNEL_LABELS below):
 *   direct · organic-google|bing|yahoo|duckduckgo · ai-chatgpt|perplexity|gemini
 *   · social-facebook|instagram|x|reddit|tiktok|linkedin|pinterest|youtube
 *   · paid · email · referral
 */

export interface ChannelSignals {
  referrer?: string | null; // first-touch external referrer (full URL or host)
  utmSource?: string | null;
  utmMedium?: string | null;
}

export type Channel = string;

function hostOf(ref: string): string {
  const raw = ref.trim();
  if (!raw) return "";
  try {
    // Accept a bare host or a full URL.
    const u = new URL(raw.includes("://") ? raw : `https://${raw}`);
    return u.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return raw.toLowerCase().replace(/^www\./, "");
  }
}

/** UTM medium → coarse paid/email/social bucket (only when a UTM is present). */
function channelFromUtm(source: string, medium: string): Channel | null {
  const m = medium.toLowerCase();
  const s = source.toLowerCase();
  if (!m && !s) return null;
  if (/^(cpc|ppc|paid|paidsearch|paid-search|display|cpm|retargeting|remarketing)$/.test(m)) return "paid";
  if (/^(email|newsletter|e-mail|mail)$/.test(m)) return "email";
  if (/^(social|social-paid|paid-social|paidsocial)$/.test(m)) {
    const net = detectSocial(s);
    return net ? `social-${net}` : "social-other";
  }
  if (/^(affiliate|partner|referral)$/.test(m)) return "referral";
  // Source-driven fallbacks when medium is uninformative.
  const se = detectSearchEngine(s);
  if (se && /^(organic|search|seo)$/.test(m)) return `organic-${se}`;
  const ai = detectAi(s);
  if (ai) return `ai-${ai}`;
  const net = detectSocial(s);
  if (net) return `social-${net}`;
  return null; // let the referrer path decide
}

function detectSearchEngine(host: string): string | null {
  if (host.includes("google")) return "google";
  if (host.includes("bing")) return "bing";
  if (host.includes("yahoo")) return "yahoo";
  if (host.includes("duckduckgo") || host === "ddg.gg") return "duckduckgo";
  if (host.includes("ecosia")) return "ecosia";
  if (host.includes("brave")) return "brave";
  if (host.includes("baidu")) return "baidu";
  if (host.includes("yandex")) return "yandex";
  return null;
}

function detectAi(host: string): string | null {
  if (host.includes("chatgpt") || host.includes("openai")) return "chatgpt";
  if (host.includes("perplexity")) return "perplexity";
  if (host.includes("gemini") || host.includes("bard")) return "gemini";
  if (host.includes("claude") || host === "anthropic.com") return "claude";
  if (host.includes("copilot")) return "copilot";
  return null;
}

function detectSocial(host: string): string | null {
  if (host.includes("facebook") || host === "fb.com" || host === "fb.me" || host === "lm.facebook.com") return "facebook";
  if (host.includes("instagram") || host === "ig.me") return "instagram";
  if (host === "x.com" || host.includes("twitter") || host === "t.co") return "x";
  if (host.includes("reddit")) return "reddit";
  if (host.includes("tiktok")) return "tiktok";
  if (host.includes("linkedin") || host === "lnkd.in") return "linkedin";
  if (host.includes("pinterest") || host === "pin.it") return "pinterest";
  if (host.includes("youtube") || host === "youtu.be") return "youtube";
  if (host.includes("threads")) return "threads";
  return null;
}

/** The site's own hosts — a referrer from these is internal, not an acquisition source. */
const OWN_HOSTS = ["vacationdeals.to"];
function isOwnHost(host: string): boolean {
  return OWN_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}

export function deriveChannel(sig: ChannelSignals): Channel {
  const utmSource = (sig.utmSource || "").trim();
  const utmMedium = (sig.utmMedium || "").trim();

  // 1. UTM wins when it resolves to a concrete channel.
  if (utmSource || utmMedium) {
    const fromUtm = channelFromUtm(utmSource, utmMedium);
    if (fromUtm) return fromUtm;
  }

  // 2. Referrer host.
  const host = hostOf(sig.referrer || "");
  if (host && !isOwnHost(host)) {
    const se = detectSearchEngine(host);
    if (se) return `organic-${se}`;
    const ai = detectAi(host);
    if (ai) return `ai-${ai}`;
    const net = detectSocial(host);
    if (net) return `social-${net}`;
    return "referral";
  }

  // 3. No usable signal → direct.
  return "direct";
}

/** Human labels for the admin UI (unknown keys fall back to the raw value). */
export const CHANNEL_LABELS: Record<string, string> = {
  "direct": "Direct",
  "organic-google": "Google (organic)",
  "organic-bing": "Bing (organic)",
  "organic-yahoo": "Yahoo (organic)",
  "organic-duckduckgo": "DuckDuckGo",
  "organic-ecosia": "Ecosia",
  "organic-brave": "Brave Search",
  "organic-baidu": "Baidu",
  "organic-yandex": "Yandex",
  "ai-chatgpt": "ChatGPT",
  "ai-perplexity": "Perplexity",
  "ai-gemini": "Gemini",
  "ai-claude": "Claude",
  "ai-copilot": "Copilot",
  "social-facebook": "Facebook",
  "social-instagram": "Instagram",
  "social-x": "X / Twitter",
  "social-reddit": "Reddit",
  "social-tiktok": "TikTok",
  "social-linkedin": "LinkedIn",
  "social-pinterest": "Pinterest",
  "social-youtube": "YouTube",
  "social-threads": "Threads",
  "social-other": "Social (other)",
  "paid": "Paid ad",
  "email": "Email",
  "referral": "Referral",
};

export function channelLabel(channel: string): string {
  return CHANNEL_LABELS[channel] || channel;
}

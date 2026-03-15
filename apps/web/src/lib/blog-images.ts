/**
 * Inline SVG illustrations for blog posts.
 * Zero-weight (no network requests) — rendered as inline HTML strings.
 * 10 travel-themed icons that cycle for each numbered point/h2 in a post.
 */

const illustrations: { label: string; svg: string }[] = [
  {
    label: "Suitcase illustration",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none">
      <rect x="18" y="28" width="44" height="34" rx="4" stroke="white" stroke-width="2.5" fill="none"/>
      <path d="M30 28V22a6 6 0 0 1 6-6h8a6 6 0 0 1 6 6v6" stroke="white" stroke-width="2.5" fill="none"/>
      <line x1="18" y1="42" x2="62" y2="42" stroke="white" stroke-width="2"/>
      <circle cx="40" cy="42" r="3" fill="white"/>
    </svg>`,
  },
  {
    label: "Compass illustration",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="24" stroke="white" stroke-width="2.5" fill="none"/>
      <circle cx="40" cy="40" r="3" fill="white"/>
      <polygon points="40,20 43,37 40,34 37,37" fill="white" opacity="0.9"/>
      <polygon points="40,60 37,43 40,46 43,43" fill="white" opacity="0.5"/>
      <polygon points="20,40 37,37 34,40 37,43" fill="white" opacity="0.5"/>
      <polygon points="60,40 43,43 46,40 43,37" fill="white" opacity="0.5"/>
    </svg>`,
  },
  {
    label: "Map pin illustration",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none">
      <path d="M40 14c-10.5 0-19 8.5-19 19 0 14.25 19 33 19 33s19-18.75 19-33c0-10.5-8.5-19-19-19z" stroke="white" stroke-width="2.5" fill="none"/>
      <circle cx="40" cy="33" r="7" stroke="white" stroke-width="2.5" fill="none"/>
    </svg>`,
  },
  {
    label: "Palm tree illustration",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none">
      <path d="M40 68V32" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M40 32c-4-10-18-12-22-8 6-2 14 0 22 8z" fill="white" opacity="0.8"/>
      <path d="M40 32c4-10 18-12 22-8-6-2-14 0-22 8z" fill="white" opacity="0.8"/>
      <path d="M40 28c-8-8-20-6-24-2 6 0 16 0 24 2z" fill="white" opacity="0.6"/>
      <path d="M40 28c8-8 20-6 24-2-6 0-16 0-24 2z" fill="white" opacity="0.6"/>
    </svg>`,
  },
  {
    label: "Sun illustration",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="12" stroke="white" stroke-width="2.5" fill="none"/>
      <line x1="40" y1="14" x2="40" y2="22" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="40" y1="58" x2="40" y2="66" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="14" y1="40" x2="22" y2="40" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="58" y1="40" x2="66" y2="40" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="21.6" y1="21.6" x2="27.3" y2="27.3" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="52.7" y1="52.7" x2="58.4" y2="58.4" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="21.6" y1="58.4" x2="27.3" y2="52.7" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="52.7" y1="27.3" x2="58.4" y2="21.6" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`,
  },
  {
    label: "Airplane illustration",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none">
      <path d="M58 22L22 40l14 4 4 14z" stroke="white" stroke-width="2.5" fill="none" stroke-linejoin="round"/>
      <line x1="36" y1="44" x2="48" y2="32" stroke="white" stroke-width="2" stroke-linecap="round"/>
      <path d="M22 40l-6 12 20-8" stroke="white" stroke-width="2" fill="none"/>
    </svg>`,
  },
  {
    label: "Camera illustration",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none">
      <rect x="14" y="28" width="52" height="34" rx="4" stroke="white" stroke-width="2.5" fill="none"/>
      <circle cx="40" cy="45" r="10" stroke="white" stroke-width="2.5" fill="none"/>
      <circle cx="40" cy="45" r="4" fill="white" opacity="0.6"/>
      <path d="M30 28l3-8h14l3 8" stroke="white" stroke-width="2.5" fill="none"/>
      <circle cx="56" cy="35" r="2" fill="white"/>
    </svg>`,
  },
  {
    label: "Binoculars illustration",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none">
      <circle cx="28" cy="48" r="12" stroke="white" stroke-width="2.5" fill="none"/>
      <circle cx="52" cy="48" r="12" stroke="white" stroke-width="2.5" fill="none"/>
      <rect x="36" y="40" width="8" height="6" rx="1" fill="white" opacity="0.6"/>
      <line x1="28" y1="36" x2="28" y2="24" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="52" y1="36" x2="52" y2="24" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`,
  },
  {
    label: "Passport illustration",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none">
      <rect x="20" y="14" width="40" height="52" rx="4" stroke="white" stroke-width="2.5" fill="none"/>
      <circle cx="40" cy="36" r="10" stroke="white" stroke-width="2" fill="none"/>
      <circle cx="40" cy="36" r="5" stroke="white" stroke-width="1.5" fill="none"/>
      <line x1="30" y1="36" x2="50" y2="36" stroke="white" stroke-width="1.5"/>
      <line x1="40" y1="26" x2="40" y2="46" stroke="white" stroke-width="1.5"/>
      <line x1="28" y1="54" x2="52" y2="54" stroke="white" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
  },
  {
    label: "Ticket illustration",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none">
      <path d="M12 28h20v-2a4 4 0 0 1 8 0v2h28v24H40v2a4 4 0 0 1-8 0v-2H12z" stroke="white" stroke-width="2.5" fill="none"/>
      <line x1="36" y1="32" x2="36" y2="48" stroke="white" stroke-width="1.5" stroke-dasharray="3 3"/>
      <line x1="46" y1="36" x2="60" y2="36" stroke="white" stroke-width="2" stroke-linecap="round"/>
      <line x1="46" y1="42" x2="56" y2="42" stroke="white" stroke-width="2" stroke-linecap="round"/>
      <line x1="46" y1="48" x2="58" y2="48" stroke="white" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
  },
];

const gradients = [
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-purple-500 to-indigo-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
  "from-sky-500 to-blue-500",
  "from-lime-500 to-green-500",
  "from-fuchsia-500 to-purple-500",
  "from-teal-500 to-cyan-500",
  "from-orange-500 to-red-500",
];

/**
 * Returns an HTML string with an inline SVG illustration for a blog content section.
 * Used to visually break up long-form content before each <h2>.
 */
export function getPointIllustration(index: number): string {
  const i = (index - 1) % illustrations.length;
  const { label, svg } = illustrations[i];
  const gradient = gradients[i];

  return `<div class="blog-illustration my-8 flex items-center justify-center" role="img" aria-label="${label}">
  <div class="w-full max-w-2xl h-[120px] rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm">
    <div class="w-16 h-16 opacity-90">${svg}</div>
  </div>
</div>`;
}

/**
 * Processes blog post HTML content to insert SVG illustrations before each <h2> tag.
 * This adds visual interest and breaks up long walls of text.
 */
export function addBlogIllustrations(html: string): string {
  let pointIndex = 0;
  return html.replace(/<h2>/g, (match) => {
    pointIndex++;
    const illustration = getPointIllustration(pointIndex);
    return `${illustration}${match}`;
  });
}

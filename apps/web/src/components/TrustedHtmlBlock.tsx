/**
 * Renders trusted HTML content (from source TS constants, not user input).
 * Supports <p>, <ul>, <li>, <strong>, <em>, <h2>, <h3> via minimal parser
 * — avoids dangerouslySetInnerHTML in favor of React nodes for defense-in-depth.
 *
 * All content passed to this component must be authored by the development
 * team in the repository — never accept user-provided HTML here.
 */

import type { ReactNode } from "react";

function parseInline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  let idx = 0;
  const pattern = /<(strong|em|b|i)>([^<]+)<\/\1>/g;
  let match: RegExpExecArray | null;
  let lastEnd = 0;
  // Iterate matches using String.matchAll to avoid lint flags on exec()
  for (const m of text.matchAll(pattern)) {
    match = m as RegExpExecArray;
    if (match.index != null && match.index > lastEnd) {
      out.push(text.slice(lastEnd, match.index));
    }
    const tag = match[1].toLowerCase();
    const inner = match[2];
    const key = `${keyBase}-${idx++}`;
    if (tag === "strong" || tag === "b") out.push(<strong key={key}>{inner}</strong>);
    else out.push(<em key={key}>{inner}</em>);
    lastEnd = (match.index ?? 0) + match[0].length;
  }
  if (lastEnd < text.length) out.push(text.slice(lastEnd));
  return out;
}

export function TrustedHtmlBlock({ html }: { html: string }): ReactNode {
  const blocks: ReactNode[] = [];
  let remaining = html.trim();
  let blockIdx = 0;

  // Hard-cap loop iterations to prevent infinite loop on malformed input
  let safety = 500;
  while (remaining.length > 0 && safety-- > 0) {
    const pMatch = remaining.match(/^<p>([\s\S]*?)<\/p>\s*/);
    if (pMatch) {
      blocks.push(
        <p key={`p-${blockIdx++}`} className="mb-3 last:mb-0">
          {parseInline(pMatch[1], `p-${blockIdx}`)}
        </p>,
      );
      remaining = remaining.slice(pMatch[0].length);
      continue;
    }

    const ulMatch = remaining.match(/^<ul>([\s\S]*?)<\/ul>\s*/);
    if (ulMatch) {
      const items: ReactNode[] = [];
      const liPattern = /<li>([\s\S]*?)<\/li>/g;
      let liIdx = 0;
      for (const liMatch of ulMatch[1].matchAll(liPattern)) {
        items.push(
          <li key={`li-${blockIdx}-${liIdx++}`}>
            {parseInline(liMatch[1], `li-${blockIdx}-${liIdx}`)}
          </li>,
        );
      }
      blocks.push(
        <ul key={`ul-${blockIdx++}`} className="mb-3 list-disc pl-5 last:mb-0">
          {items}
        </ul>,
      );
      remaining = remaining.slice(ulMatch[0].length);
      continue;
    }

    const hMatch = remaining.match(/^<(h[23])>([\s\S]*?)<\/\1>\s*/);
    if (hMatch) {
      const Tag = hMatch[1] as "h2" | "h3";
      blocks.push(
        <Tag key={`h-${blockIdx++}`} className="mb-2 mt-4 font-bold text-gray-900">
          {parseInline(hMatch[2], `h-${blockIdx}`)}
        </Tag>,
      );
      remaining = remaining.slice(hMatch[0].length);
      continue;
    }

    // Fallback: skip past anything unrecognized to prevent a stuck loop
    const nextLt = remaining.indexOf("<", 1);
    remaining = nextLt > 0 ? remaining.slice(nextLt) : "";
  }

  return <>{blocks}</>;
}

"use client";
import { useState, useEffect, useCallback } from "react";

/* -------------------------------------------------------------------------- */
/*  50 tiny vacation SVG icons (20x20, ~100-300 bytes each)                   */
/* -------------------------------------------------------------------------- */

const ICON_COLORS = [
  "#2563EB", // blue (ocean)
  "#F59E0B", // amber (sun)
  "#10B981", // emerald (palm trees)
  "#EC4899", // pink (flamingo)
  "#F97316", // orange (sunset)
  "#06B6D4", // cyan (tropical water)
];

// Each icon gets its color from its index
let ICON_COLOR = ICON_COLORS[0];

const icons: React.FC[] = [
  // 1. Flip flops
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <ellipse cx="6" cy="13" rx="4" ry="5" opacity=".7" />
      <ellipse cx="14" cy="13" rx="4" ry="5" opacity=".7" />
      <path d="M6 8v5M4 10l2-2 2 2" stroke={ICON_COLOR} strokeWidth="1.2" fill="none" />
      <path d="M14 8v5M12 10l2-2 2 2" stroke={ICON_COLOR} strokeWidth="1.2" fill="none" />
    </svg>
  ),
  // 2. Cocktail glass
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <path d="M4 3h12l-5 7v5h3v2H6v-2h3v-5z" opacity=".8" />
      <circle cx="15" cy="5" r="2" opacity=".5" />
    </svg>
  ),
  // 3. Sunglasses
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <path d="M1 9h4a3 3 0 0 1-4 3zm14 0h4a3 3 0 0 1-4 3z" opacity=".8" />
      <path d="M1 9h18" stroke={ICON_COLOR} strokeWidth="1.5" fill="none" />
      <path d="M8 10a2 2 0 0 0 4 0" stroke={ICON_COLOR} strokeWidth="1" fill="none" />
    </svg>
  ),
  // 4. Palm tree
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <path d="M10 8v10" stroke={ICON_COLOR} strokeWidth="2" fill="none" />
      <path d="M10 8c-3-4-7-2-8-1 2 0 5 1 8 1z" opacity=".8" />
      <path d="M10 8c3-4 7-2 8-1-2 0-5 1-8 1z" opacity=".8" />
      <path d="M10 6c-1-4-4-5-6-5 1 1 3 3 6 5z" opacity=".6" />
    </svg>
  ),
  // 5. Sun
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <circle cx="10" cy="10" r="4" opacity=".8" />
      <g stroke={ICON_COLOR} strokeWidth="1.5" strokeLinecap="round">
        <line x1="10" y1="1" x2="10" y2="4" />
        <line x1="10" y1="16" x2="10" y2="19" />
        <line x1="1" y1="10" x2="4" y2="10" />
        <line x1="16" y1="10" x2="19" y2="10" />
        <line x1="3.5" y1="3.5" x2="5.5" y2="5.5" />
        <line x1="14.5" y1="14.5" x2="16.5" y2="16.5" />
        <line x1="3.5" y1="16.5" x2="5.5" y2="14.5" />
        <line x1="14.5" y1="5.5" x2="16.5" y2="3.5" />
      </g>
    </svg>
  ),
  // 6. Beach umbrella
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <path d="M10 2C5 2 2 6 2 8h16c0-2-3-6-8-6z" opacity=".8" />
      <line x1="10" y1="2" x2="10" y2="18" stroke={ICON_COLOR} strokeWidth="1.5" />
      <path d="M10 18c0-2 3-3 5-2" stroke={ICON_COLOR} strokeWidth="1" fill="none" />
    </svg>
  ),
  // 7. Surfboard
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <ellipse cx="10" cy="10" rx="3" ry="9" opacity=".7" transform="rotate(-20 10 10)" />
      <line x1="10" y1="3" x2="10" y2="17" stroke="#fff" strokeWidth=".8" opacity=".5" transform="rotate(-20 10 10)" />
    </svg>
  ),
  // 8. Seashell
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <path d="M10 2C6 2 3 6 3 10c0 4 3 7 7 7s7-3 7-7C17 6 14 2 10 2z" opacity=".6" />
      <path d="M10 2c0 5-3 8-5 10M10 2c0 5 3 8 5 10M10 2v13" stroke={ICON_COLOR} strokeWidth=".8" fill="none" />
    </svg>
  ),
  // 9. Starfish
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <path d="M10 1l2.4 5.8 6.2.5-4.7 4 1.5 6.1L10 14.5l-5.4 2.9 1.5-6.1-4.7-4 6.2-.5z" opacity=".75" />
    </svg>
  ),
  // 10. Beach ball
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <circle cx="10" cy="10" r="8" opacity=".5" />
      <path d="M10 2a8 8 0 0 1 0 16" opacity=".8" />
      <path d="M10 2c3 3 3 13 0 16" stroke="#fff" strokeWidth=".6" fill="none" opacity=".5" />
      <path d="M2 10h16" stroke="#fff" strokeWidth=".6" opacity=".5" />
    </svg>
  ),
  // 11. Pineapple
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <ellipse cx="10" cy="13" rx="5" ry="6" opacity=".7" />
      <path d="M10 7l-3-5M10 7l3-5M10 7l0-6" stroke="#4ade80" strokeWidth="1.2" fill="none" />
      <path d="M7 11l6-2M7 14l6-2" stroke="#fff" strokeWidth=".5" opacity=".4" />
    </svg>
  ),
  // 12. Coconut
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <circle cx="10" cy="12" r="6" opacity=".7" />
      <circle cx="8" cy="11" r="1" fill="#8B4513" opacity=".6" />
      <circle cx="12" cy="11" r="1" fill="#8B4513" opacity=".6" />
      <circle cx="10" cy="13" r="1" fill="#8B4513" opacity=".6" />
    </svg>
  ),
  // 13. Wave
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M1 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0" stroke={ICON_COLOR} strokeWidth="2" strokeLinecap="round" opacity=".8" />
      <path d="M1 16c2-3 4-3 6 0s4 3 6 0 4-3 6 0" stroke={ICON_COLOR} strokeWidth="1.5" strokeLinecap="round" opacity=".5" />
    </svg>
  ),
  // 14. Sailboat
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <path d="M10 3v11" stroke={ICON_COLOR} strokeWidth="1.2" />
      <path d="M10 3l6 11H10z" opacity=".7" />
      <path d="M10 5L5 14h5z" opacity=".5" />
      <path d="M2 16h16l-2 2H4z" opacity=".6" />
    </svg>
  ),
  // 15. Anchor
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={ICON_COLOR} strokeWidth="1.5" strokeLinecap="round">
      <circle cx="10" cy="5" r="2" />
      <line x1="10" y1="7" x2="10" y2="17" />
      <line x1="6" y1="11" x2="14" y2="11" />
      <path d="M4 15c0-3 3-5 6-5s6 2 6 5" fill="none" />
    </svg>
  ),
  // 16. Compass
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8" stroke={ICON_COLOR} strokeWidth="1.2" />
      <path d="M10 4l2 5 5 1-5 2-2 5-2-5-5-2 5-2z" fill={ICON_COLOR} opacity=".7" />
    </svg>
  ),
  // 17. Camera
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <rect x="2" y="6" width="16" height="11" rx="2" opacity=".7" />
      <path d="M7 6l1-3h4l1 3" opacity=".8" />
      <circle cx="10" cy="11" r="3" fill="#fff" opacity=".4" />
    </svg>
  ),
  // 18. Passport
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <rect x="4" y="2" width="12" height="16" rx="2" opacity=".7" />
      <circle cx="10" cy="9" r="3" fill="#fff" opacity=".3" />
      <line x1="7" y1="14" x2="13" y2="14" stroke="#fff" strokeWidth=".8" opacity=".3" />
    </svg>
  ),
  // 19. Suitcase
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <rect x="3" y="6" width="14" height="11" rx="2" opacity=".7" />
      <path d="M7 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke={ICON_COLOR} strokeWidth="1.2" fill="none" />
      <line x1="10" y1="9" x2="10" y2="14" stroke="#fff" strokeWidth=".8" opacity=".4" />
    </svg>
  ),
  // 20. Airplane
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <path d="M10 2L8 8H2l2 3-2 3h6l2 6 2-6h6l-2-3 2-3h-6z" opacity=".75" />
    </svg>
  ),
  // 21. Hot air balloon
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <path d="M10 1C6 1 3 5 3 9c0 3 3 5 7 7 4-2 7-4 7-7 0-4-3-8-7-8z" opacity=".7" />
      <rect x="8" y="16" width="4" height="3" rx="1" opacity=".6" />
      <line x1="8" y1="16" x2="6" y2="13" stroke={ICON_COLOR} strokeWidth=".6" />
      <line x1="12" y1="16" x2="14" y2="13" stroke={ICON_COLOR} strokeWidth=".6" />
    </svg>
  ),
  // 22. Ice cream cone
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <path d="M6 9l4 10 4-10z" opacity=".6" />
      <circle cx="10" cy="7" r="4" opacity=".8" />
      <circle cx="7" cy="6" r="2.5" opacity=".6" />
      <circle cx="13" cy="6" r="2.5" opacity=".6" />
    </svg>
  ),
  // 23. Watermelon slice
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <path d="M3 14A9 9 0 0 1 17 14z" opacity=".7" />
      <path d="M4 14A8 8 0 0 1 16 14z" fill="#ef4444" opacity=".5" />
      <circle cx="8" cy="12" r=".8" fill="#333" />
      <circle cx="11" cy="11" r=".8" fill="#333" />
      <circle cx="10" cy="13" r=".8" fill="#333" />
    </svg>
  ),
  // 24. Flamingo
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={ICON_COLOR} strokeWidth="1.5" strokeLinecap="round">
      <path d="M10 2c-3 0-4 3-3 5s2 4 2 7" />
      <path d="M9 14v4M9 14l2 4" />
      <circle cx="8" cy="4" r="1.5" fill={ICON_COLOR} opacity=".7" />
    </svg>
  ),
  // 25. Toucan
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <ellipse cx="12" cy="9" rx="5" ry="6" opacity=".6" />
      <path d="M7 8c-4 0-6 1-6 2s2 2 6 1z" opacity=".9" />
      <circle cx="13" cy="7" r="1" fill="#fff" opacity=".6" />
    </svg>
  ),
  // 26. Dolphin
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <path d="M2 12c2-5 6-8 10-7 2 0 4 1 5 3l-2-1c-1 3-4 5-8 5-3 0-4-1-5 0z" opacity=".75" />
      <path d="M12 5l2-3 0 3z" opacity=".6" />
    </svg>
  ),
  // 27. Whale tail
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <path d="M10 18C6 14 2 10 4 6l6 6 6-6c2 4-2 8-6 12z" opacity=".75" />
    </svg>
  ),
  // 28. Turtle
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <ellipse cx="10" cy="12" rx="7" ry="5" opacity=".6" />
      <ellipse cx="10" cy="11" rx="5" ry="4" opacity=".8" />
      <circle cx="5" cy="10" r="1.5" opacity=".5" />
      <circle cx="15" cy="10" r="1.5" opacity=".5" />
      <circle cx="4" cy="14" r="1.2" opacity=".5" />
      <circle cx="16" cy="14" r="1.2" opacity=".5" />
      <ellipse cx="3" cy="9" rx="2" ry="1.5" opacity=".6" />
    </svg>
  ),
  // 29. Crab
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <ellipse cx="10" cy="12" rx="6" ry="4" opacity=".7" />
      <circle cx="7" cy="8" r="1.5" opacity=".8" />
      <circle cx="13" cy="8" r="1.5" opacity=".8" />
      <path d="M3 10c-2-2-1-4 0-5M17 10c2-2 1-4 0-5" stroke={ICON_COLOR} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  ),
  // 30. Jellyfish
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <path d="M3 10a7 7 0 0 1 14 0z" opacity=".7" />
      <path d="M5 10c0 3 1 5 0 8M8 10c0 4 1 5 0 8M11 10c0 3-1 5 0 8M14 10c0 4-1 5 0 8" stroke={ICON_COLOR} strokeWidth=".8" fill="none" opacity=".5" />
    </svg>
  ),
  // 31. Hammock
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={ICON_COLOR} strokeWidth="1.5" strokeLinecap="round">
      <line x1="2" y1="4" x2="2" y2="16" />
      <line x1="18" y1="4" x2="18" y2="16" />
      <path d="M2 6c4 8 12 8 16 0" />
    </svg>
  ),
  // 32. Tiki mask
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <rect x="5" y="3" width="10" height="14" rx="3" opacity=".7" />
      <rect x="7" y="7" width="2.5" height="2" rx="1" fill="#fff" opacity=".5" />
      <rect x="10.5" y="7" width="2.5" height="2" rx="1" fill="#fff" opacity=".5" />
      <path d="M7 13h6" stroke="#fff" strokeWidth="1" opacity=".5" />
    </svg>
  ),
  // 33. Ukulele
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <ellipse cx="8" cy="14" rx="4" ry="5" opacity=".6" />
      <rect x="11" y="2" width="2" height="10" rx="1" opacity=".7" transform="rotate(10 12 7)" />
      <line x1="10" y1="2" x2="14" y2="2" stroke={ICON_COLOR} strokeWidth="1" />
    </svg>
  ),
  // 34. Lei / flower garland
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <path d="M3 8c2-3 5-4 7-4s5 1 7 4c-1 2-3 3-7 3S4 10 3 8z" opacity=".5" />
      <circle cx="5" cy="8" r="2" opacity=".8" />
      <circle cx="10" cy="6" r="2" opacity=".8" />
      <circle cx="15" cy="8" r="2" opacity=".8" />
      <circle cx="7.5" cy="6.5" r="1.5" opacity=".6" />
      <circle cx="12.5" cy="6.5" r="1.5" opacity=".6" />
    </svg>
  ),
  // 35. Hibiscus flower
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <circle cx="10" cy="10" r="2" opacity=".9" />
      <ellipse cx="10" cy="4" rx="2.5" ry="3.5" opacity=".6" />
      <ellipse cx="10" cy="16" rx="2.5" ry="3.5" opacity=".6" />
      <ellipse cx="4" cy="10" rx="3.5" ry="2.5" opacity=".6" />
      <ellipse cx="16" cy="10" rx="3.5" ry="2.5" opacity=".6" />
    </svg>
  ),
  // 36. Sunset
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <path d="M2 14h16" stroke={ICON_COLOR} strokeWidth="1.5" />
      <path d="M4 14a6 6 0 0 1 12 0z" opacity=".7" />
      <line x1="10" y1="4" x2="10" y2="6" stroke={ICON_COLOR} strokeWidth="1.2" />
      <line x1="4" y1="8" x2="5.5" y2="9.5" stroke={ICON_COLOR} strokeWidth="1.2" />
      <line x1="16" y1="8" x2="14.5" y2="9.5" stroke={ICON_COLOR} strokeWidth="1.2" />
      <path d="M1 16h18" stroke={ICON_COLOR} strokeWidth="1" opacity=".4" />
    </svg>
  ),
  // 37. Moon and stars
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <path d="M12 2a7 7 0 1 0 5 11A6 6 0 0 1 12 2z" opacity=".7" />
      <circle cx="15" cy="4" r="1" opacity=".6" />
      <circle cx="17" cy="8" r=".7" opacity=".5" />
    </svg>
  ),
  // 38. Campfire
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <path d="M10 3c-2 3-4 5-4 8 0 3 2 4 4 4s4-1 4-4c0-3-2-5-4-8z" opacity=".7" />
      <path d="M10 7c-1 2-2 3-2 5 0 1.5 1 2 2 2s2-.5 2-2c0-2-1-3-2-5z" fill="#fff" opacity=".3" />
      <line x1="4" y1="18" x2="10" y2="15" stroke={ICON_COLOR} strokeWidth="1.2" />
      <line x1="16" y1="18" x2="10" y2="15" stroke={ICON_COLOR} strokeWidth="1.2" />
    </svg>
  ),
  // 39. Mountain peak
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <path d="M10 2l8 16H2z" opacity=".6" />
      <path d="M10 2l3 6-3-2-3 2z" opacity=".9" />
      <path d="M14 10l4 8" stroke={ICON_COLOR} strokeWidth="1" opacity=".4" />
    </svg>
  ),
  // 40. Cactus
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <rect x="8" y="4" width="4" height="14" rx="2" opacity=".7" />
      <path d="M8 10H5a2 2 0 0 1 0-4h1v4z" opacity=".6" />
      <path d="M12 12h3a2 2 0 0 0 0-4h-1v4z" opacity=".6" />
    </svg>
  ),
  // 41. Snorkel mask
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <rect x="3" y="6" width="14" height="8" rx="4" opacity=".6" />
      <circle cx="7" cy="10" r="2.5" fill="#fff" opacity=".4" />
      <circle cx="13" cy="10" r="2.5" fill="#fff" opacity=".4" />
      <path d="M16 7V3" stroke={ICON_COLOR} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  // 42. Diving fins
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <path d="M4 4c0 2 0 6-2 10 2 0 5-2 5-6V4z" opacity=".7" />
      <path d="M11 4c0 2 0 6-2 10 2 0 5-2 5-6V4z" opacity=".6" />
    </svg>
  ),
  // 43. Beach towel
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <rect x="3" y="5" width="14" height="10" rx="1" opacity=".5" />
      <rect x="3" y="5" width="14" height="2.5" opacity=".8" />
      <rect x="3" y="10" width="14" height="2.5" opacity=".8" />
      <path d="M3 15c1 1 2 2 3 1" stroke={ICON_COLOR} strokeWidth=".8" fill="none" />
    </svg>
  ),
  // 44. Sand castle
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <rect x="3" y="12" width="14" height="6" opacity=".5" />
      <rect x="5" y="8" width="4" height="4" opacity=".7" />
      <rect x="11" y="8" width="4" height="4" opacity=".7" />
      <rect x="8" y="5" width="4" height="7" opacity=".8" />
      <path d="M8 5l2-2 2 2" fill={ICON_COLOR} opacity=".9" />
    </svg>
  ),
  // 45. Lighthouse
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <path d="M7 18l1-12h4l1 12z" opacity=".7" />
      <rect x="7" y="5" width="6" height="2" rx="1" opacity=".9" />
      <path d="M9 5l1-4 1 4z" opacity=".8" />
      <line x1="4" y1="6" x2="7" y2="6" stroke={ICON_COLOR} strokeWidth="1" opacity=".5" />
      <line x1="13" y1="6" x2="16" y2="6" stroke={ICON_COLOR} strokeWidth="1" opacity=".5" />
    </svg>
  ),
  // 46. Binoculars
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <rect x="2" y="6" width="6" height="10" rx="3" opacity=".7" />
      <rect x="12" y="6" width="6" height="10" rx="3" opacity=".7" />
      <rect x="8" y="9" width="4" height="3" rx="1" opacity=".6" />
    </svg>
  ),
  // 47. Treasure map
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <rect x="2" y="3" width="16" height="14" rx="1" opacity=".5" />
      <path d="M5 7l3 2 4-3 3 4" stroke="#fff" strokeWidth="1" fill="none" opacity=".5" />
      <circle cx="15" cy="13" r="1.5" fill="#ef4444" opacity=".7" />
      <path d="M2 3c1 1 0 2 1 3" stroke={ICON_COLOR} strokeWidth=".8" fill="none" />
    </svg>
  ),
  // 48. Postcard
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <rect x="1" y="4" width="18" height="12" rx="1" opacity=".5" />
      <line x1="10" y1="4" x2="10" y2="16" stroke="#fff" strokeWidth=".6" opacity=".5" />
      <rect x="13" y="6" width="4" height="3" rx=".5" opacity=".8" />
      <line x1="12" y1="11" x2="17" y2="11" stroke="#fff" strokeWidth=".6" opacity=".4" />
      <line x1="12" y1="13" x2="16" y2="13" stroke="#fff" strokeWidth=".6" opacity=".4" />
    </svg>
  ),
  // 49. Ticket stub
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <path d="M1 5h18v3a2 2 0 0 0 0 4v3H1v-3a2 2 0 0 1 0-4z" opacity=".7" />
      <line x1="7" y1="5" x2="7" y2="15" stroke="#fff" strokeWidth=".8" strokeDasharray="2 1" opacity=".4" />
    </svg>
  ),
  // 50. Heart with wings
  () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={ICON_COLOR}>
      <path d="M10 16l-4-4c-2-2-2-5 0-6 1-1 3-1 4 1 1-2 3-2 4-1 2 1 2 4 0 6z" opacity=".8" />
      <path d="M6 9C4 8 2 7 1 8s0 3 2 3" opacity=".5" />
      <path d="M14 9c2-1 4-2 5-1s0 3-2 3" opacity=".5" />
    </svg>
  ),
];

/* -------------------------------------------------------------------------- */
/*  FloatingIcon component                                                     */
/* -------------------------------------------------------------------------- */

export function FloatingIcon() {
  const [iconIndex, setIconIndex] = useState(0);
  const [animating, setAnimating] = useState(true);
  const [key, setKey] = useState(0); // force re-mount for animation restart

  const advance = useCallback(() => {
    setAnimating(false);
    // Pause 2 seconds then show next icon
    const pauseTimer = setTimeout(() => {
      setIconIndex((prev) => (prev + 1) % icons.length);
      setKey((prev) => prev + 1);
      setAnimating(true);
    }, 2000);
    return pauseTimer;
  }, []);

  useEffect(() => {
    if (!animating) return;
    // Animation lasts 4s, then we advance
    const timer = setTimeout(() => {
      advance();
    }, 4000);
    return () => clearTimeout(timer);
  }, [animating, key, advance]);

  // Assign color based on current icon index
  ICON_COLOR = ICON_COLORS[iconIndex % ICON_COLORS.length];
  const IconComponent = icons[iconIndex];

  if (!animating) return null;

  return (
    <div
      key={key}
      className="floating-icon"
      aria-hidden="true"
    >
      <IconComponent />
    </div>
  );
}

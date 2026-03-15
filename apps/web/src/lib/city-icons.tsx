/**
 * Lightweight inline SVG city/vacation icons for gradient tile decoration.
 * Each icon is pure inline SVG, under 500 bytes, white at low opacity.
 * Used as subtle background decoration on deal cards and destination tiles.
 */

interface CityIconProps {
  className?: string;
}

/** Orlando: castle/theme park turret silhouette */
export function OrlandoIcon({ className }: CityIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="white" className={className} aria-hidden="true">
      <rect x="8" y="32" width="48" height="24" rx="2" />
      <rect x="14" y="20" width="8" height="12" />
      <rect x="28" y="16" width="8" height="16" />
      <rect x="42" y="20" width="8" height="12" />
      <polygon points="18,20 14,12 22,12" />
      <polygon points="32,16 28,6 36,6" />
      <polygon points="46,20 42,12 50,12" />
    </svg>
  );
}

/** Las Vegas: dice */
export function LasVegasIcon({ className }: CityIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="white" className={className} aria-hidden="true">
      <rect x="8" y="18" width="28" height="28" rx="4" transform="rotate(-10 22 32)" />
      <rect x="28" y="18" width="28" height="28" rx="4" transform="rotate(8 42 32)" />
      <circle cx="18" cy="28" r="2.5" fill="currentColor" opacity="0.3" />
      <circle cx="26" cy="36" r="2.5" fill="currentColor" opacity="0.3" />
      <circle cx="40" cy="26" r="2.5" fill="currentColor" opacity="0.3" />
      <circle cx="48" cy="34" r="2.5" fill="currentColor" opacity="0.3" />
      <circle cx="44" cy="42" r="2.5" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

/** Cancun: palm tree over water */
export function CancunIcon({ className }: CityIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="white" className={className} aria-hidden="true">
      <path d="M28 56V28" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M28 28C22 18 12 20 10 22C14 20 22 22 28 28Z" />
      <path d="M28 28C34 16 44 18 48 20C42 18 34 22 28 28Z" />
      <path d="M28 26C26 14 32 10 36 10C32 12 28 18 28 26Z" />
      <path d="M4 48Q16 42 32 48Q48 42 60 48" stroke="white" strokeWidth="2" fill="none" />
      <path d="M4 54Q16 48 32 54Q48 48 60 54" stroke="white" strokeWidth="2" fill="none" />
    </svg>
  );
}

/** Gatlinburg: mountain peaks */
export function GatlinburgIcon({ className }: CityIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="white" className={className} aria-hidden="true">
      <polygon points="32,8 52,48 12,48" />
      <polygon points="48,16 62,48 34,48" opacity="0.6" />
      <polygon points="16,20 30,48 2,48" opacity="0.6" />
      <rect x="0" y="48" width="64" height="8" rx="2" />
    </svg>
  );
}

/** Myrtle Beach: waves and umbrella */
export function MyrtleBeachIcon({ className }: CityIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="white" className={className} aria-hidden="true">
      <line x1="32" y1="12" x2="32" y2="44" stroke="white" strokeWidth="2.5" />
      <path d="M16 12C16 12 24 8 32 12C40 8 48 12 48 12L32 28Z" />
      <path d="M4 48Q16 42 32 48Q48 42 60 48" stroke="white" strokeWidth="2.5" fill="none" />
      <path d="M4 56Q16 50 32 56Q48 50 60 56" stroke="white" strokeWidth="2.5" fill="none" />
    </svg>
  );
}

/** Branson: music note */
export function BransonIcon({ className }: CityIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="white" className={className} aria-hidden="true">
      <line x1="24" y1="14" x2="24" y2="48" stroke="white" strokeWidth="3" />
      <line x1="44" y1="10" x2="44" y2="44" stroke="white" strokeWidth="3" />
      <line x1="24" y1="14" x2="44" y2="10" stroke="white" strokeWidth="3" />
      <ellipse cx="18" cy="50" rx="8" ry="6" />
      <ellipse cx="38" cy="46" rx="8" ry="6" />
    </svg>
  );
}

/** Cabo: cactus and sun */
export function CaboIcon({ className }: CityIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="white" className={className} aria-hidden="true">
      <circle cx="48" cy="16" r="8" />
      <rect x="20" y="20" width="6" height="32" rx="3" />
      <path d="M14 30C14 24 20 24 20 30" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <path d="M32 34C32 28 26 28 26 34" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <rect x="4" y="52" width="56" height="4" rx="2" />
    </svg>
  );
}

/** Key West: sunset over water */
export function KeyWestIcon({ className }: CityIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="white" className={className} aria-hidden="true">
      <path d="M8 36A24 24 0 0156 36" />
      <line x1="32" y1="8" x2="32" y2="16" stroke="white" strokeWidth="2" />
      <line x1="14" y1="20" x2="18" y2="24" stroke="white" strokeWidth="2" />
      <line x1="50" y1="20" x2="46" y2="24" stroke="white" strokeWidth="2" />
      <line x1="8" y1="32" x2="14" y2="32" stroke="white" strokeWidth="2" />
      <line x1="56" y1="32" x2="50" y2="32" stroke="white" strokeWidth="2" />
      <path d="M4 44Q16 38 32 44Q48 38 60 44" stroke="white" strokeWidth="2.5" fill="none" />
      <path d="M4 52Q16 46 32 52Q48 46 60 52" stroke="white" strokeWidth="2.5" fill="none" />
    </svg>
  );
}

/** Sedona: red rock mesa formation */
export function SedonaIcon({ className }: CityIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="white" className={className} aria-hidden="true">
      <polygon points="10,48 18,20 30,20 34,48" />
      <polygon points="30,48 36,14 48,14 56,48" opacity="0.7" />
      <rect x="0" y="48" width="64" height="8" rx="2" />
    </svg>
  );
}

/** Hilton Head: lighthouse */
export function HiltonHeadIcon({ className }: CityIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="white" className={className} aria-hidden="true">
      <polygon points="26,52 24,16 40,16 38,52" />
      <rect x="22" y="10" width="20" height="6" rx="2" />
      <circle cx="32" cy="8" r="4" />
      <line x1="32" y1="4" x2="32" y2="0" stroke="white" strokeWidth="2" />
      <rect x="28" y="28" width="8" height="6" rx="1" opacity="0.3" />
      <rect x="28" y="40" width="8" height="6" rx="1" opacity="0.3" />
      <rect x="18" y="52" width="28" height="4" rx="2" />
    </svg>
  );
}

/** Williamsburg: colonial building */
export function WilliamsburgIcon({ className }: CityIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="white" className={className} aria-hidden="true">
      <rect x="10" y="28" width="44" height="24" rx="2" />
      <polygon points="8,28 32,12 56,28" />
      <rect x="18" y="34" width="6" height="8" rx="1" opacity="0.3" />
      <rect x="40" y="34" width="6" height="8" rx="1" opacity="0.3" />
      <rect x="28" y="38" width="8" height="14" rx="1" />
      <rect x="30" y="8" width="4" height="8" />
    </svg>
  );
}

/** Cocoa Beach: rocket (Space Coast) */
export function CocoaBeachIcon({ className }: CityIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="white" className={className} aria-hidden="true">
      <path d="M32 4C32 4 40 16 40 36L24 36C24 16 32 4 32 4Z" />
      <polygon points="24,32 16,44 24,40" />
      <polygon points="40,32 48,44 40,40" />
      <rect x="28" y="36" width="8" height="10" rx="2" />
      <path d="M26 50L32 58L38 50" opacity="0.5" />
    </svg>
  );
}

/** Park City: ski/snowflake */
export function ParkCityIcon({ className }: CityIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="white" className={className} aria-hidden="true">
      <line x1="32" y1="8" x2="32" y2="56" stroke="white" strokeWidth="2.5" />
      <line x1="12" y1="22" x2="52" y2="42" stroke="white" strokeWidth="2.5" />
      <line x1="12" y1="42" x2="52" y2="22" stroke="white" strokeWidth="2.5" />
      <line x1="32" y1="8" x2="26" y2="14" stroke="white" strokeWidth="2" />
      <line x1="32" y1="8" x2="38" y2="14" stroke="white" strokeWidth="2" />
      <line x1="32" y1="56" x2="26" y2="50" stroke="white" strokeWidth="2" />
      <line x1="32" y1="56" x2="38" y2="50" stroke="white" strokeWidth="2" />
    </svg>
  );
}

/** Generic beach: umbrella and wave */
export function BeachIcon({ className }: CityIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="white" className={className} aria-hidden="true">
      <line x1="32" y1="12" x2="32" y2="44" stroke="white" strokeWidth="2.5" />
      <path d="M16 12C16 12 24 8 32 12C40 8 48 12 48 12L32 28Z" />
      <path d="M4 48Q16 42 32 48Q48 42 60 48" stroke="white" strokeWidth="2.5" fill="none" />
      <path d="M4 56Q16 50 32 56Q48 50 60 56" stroke="white" strokeWidth="2.5" fill="none" />
    </svg>
  );
}

/** Generic mountain: peaks */
export function MountainIcon({ className }: CityIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="white" className={className} aria-hidden="true">
      <polygon points="32,8 56,48 8,48" />
      <polygon points="48,18 62,48 34,48" opacity="0.6" />
      <rect x="0" y="48" width="64" height="8" rx="2" />
    </svg>
  );
}

/** Generic city: skyline */
export function CityIcon({ className }: CityIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="white" className={className} aria-hidden="true">
      <rect x="4" y="32" width="10" height="20" rx="1" />
      <rect x="16" y="20" width="10" height="32" rx="1" />
      <rect x="28" y="12" width="10" height="40" rx="1" />
      <rect x="40" y="24" width="10" height="28" rx="1" />
      <rect x="52" y="28" width="8" height="24" rx="1" />
      <rect x="0" y="52" width="64" height="4" rx="1" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Lookup helper: maps city/destination name to the right icon component
// ---------------------------------------------------------------------------

const cityIconMap: Record<string, React.FC<CityIconProps>> = {
  Orlando: OrlandoIcon,
  "Las Vegas": LasVegasIcon,
  Cancun: CancunIcon,
  Gatlinburg: GatlinburgIcon,
  "Myrtle Beach": MyrtleBeachIcon,
  Branson: BransonIcon,
  "Cabo San Lucas": CaboIcon,
  Cabo: CaboIcon,
  "Key West": KeyWestIcon,
  Sedona: SedonaIcon,
  "Hilton Head": HiltonHeadIcon,
  Williamsburg: WilliamsburgIcon,
  "Cocoa Beach": CocoaBeachIcon,
  "Park City": ParkCityIcon,
  Miami: BeachIcon,
  "Daytona Beach": BeachIcon,
  "San Diego": BeachIcon,
  "Punta Cana": BeachIcon,
  "Puerto Vallarta": BeachIcon,
  Nashville: CityIcon,
  "New York City": CityIcon,
  "San Antonio": CityIcon,
  "Lake Tahoe": MountainIcon,
  Galveston: BeachIcon,
};

/**
 * Returns the appropriate city icon component for a given destination name.
 * Falls back to CityIcon (generic skyline) if no specific icon exists.
 */
export function getCityIcon(cityName: string): React.FC<CityIconProps> {
  return cityIconMap[cityName] || CityIcon;
}

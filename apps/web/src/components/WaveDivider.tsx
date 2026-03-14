export function WaveDivider({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`wave-separator ${className}`}
      viewBox="0 0 1200 20"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="wave-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
          <stop offset="50%" stopColor="#10B981" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#2563EB" stopOpacity="0.25" />
        </linearGradient>
      </defs>
      <path
        d="M0 10 Q150 0 300 10 T600 10 T900 10 T1200 10"
        fill="none"
        stroke="url(#wave-grad)"
        strokeWidth="2"
      />
    </svg>
  );
}

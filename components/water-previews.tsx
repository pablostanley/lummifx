// Component to preview water wave patterns
export function WaterPatternPreview({ type }: { type: number }) {
  // SVG patterns to represent different water patterns
  const patterns = [
    // Ripples
    <svg key="ripples" viewBox="0 0 24 24" width="100%" height="100%">
      <defs>
        <radialGradient id="ripple-gradient" cx="0.5" cy="0.5" r="0.5" fx="0.5" fy="0.5">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
          <stop offset="20%" stopColor="currentColor" stopOpacity="0.5" />
          <stop offset="40%" stopColor="currentColor" stopOpacity="0.2" />
          <stop offset="60%" stopColor="currentColor" stopOpacity="0.5" />
          <stop offset="80%" stopColor="currentColor" stopOpacity="0.2" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.5" />
        </radialGradient>
      </defs>
      <rect width="24" height="24" fill="url(#ripple-gradient)" />
    </svg>,

    // Ocean waves
    <svg key="ocean" viewBox="0 0 24 24" width="100%" height="100%">
      <defs>
        <pattern id="ocean-pattern" patternUnits="userSpaceOnUse" width="24" height="8" patternTransform="rotate(0)">
          <path
            d="M0,4 C2,2 4,6 6,4 C8,2 10,6 12,4 C14,2 16,6 18,4 C20,2 22,6 24,4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeOpacity="0.6"
          />
          <path
            d="M0,8 C2,6 4,10 6,8 C8,6 10,10 12,8 C14,6 16,10 18,8 C20,6 22,10 24,8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeOpacity="0.4"
          />
        </pattern>
      </defs>
      <rect width="24" height="24" fill="url(#ocean-pattern)" />
    </svg>,

    // Choppy water
    <svg key="choppy" viewBox="0 0 24 24" width="100%" height="100%">
      <defs>
        <pattern id="choppy-pattern" patternUnits="userSpaceOnUse" width="12" height="12">
          <path d="M0,6 L2,4 L4,7 L6,3 L8,5 L10,2 L12,6" fill="none" stroke="currentColor" strokeWidth="1" />
          <path
            d="M0,12 L2,10 L4,13 L6,9 L8,11 L10,8 L12,12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeOpacity="0.5"
            transform="translate(0, -6)"
          />
        </pattern>
      </defs>
      <rect width="24" height="24" fill="url(#choppy-pattern)" />
    </svg>,

    // Calm pool
    <svg key="calm" viewBox="0 0 24 24" width="100%" height="100%">
      <defs>
        <filter id="calm-water-filter" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="2" seed="5" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
        </filter>
      </defs>
      <rect width="24" height="24" fill="none" />
      <circle
        cx="8"
        cy="8"
        r="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeOpacity="0.3"
        filter="url(#calm-water-filter)"
      />
      <circle
        cx="16"
        cy="16"
        r="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeOpacity="0.3"
        filter="url(#calm-water-filter)"
      />
      <circle
        cx="12"
        cy="10"
        r="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeOpacity="0.3"
        filter="url(#calm-water-filter)"
      />
    </svg>,
  ]

  return patterns[type] || patterns[0]
}

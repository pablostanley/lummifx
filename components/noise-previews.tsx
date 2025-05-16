// Component to preview noise pattern types
export function NoisePatternPreview({ type }: { type: number }) {
  // SVG patterns to represent different noise types
  const patterns = [
    // Random noise
    <svg key="random" viewBox="0 0 24 24" width="100%" height="100%">
      <rect width="24" height="24" fill="none" />
      {Array.from({ length: 100 }).map((_, i) => (
        <circle
          key={i}
          cx={Math.random() * 40}
          cy={Math.random() * 40}
          r={0.5 + Math.random() * 1}
          fill="currentColor"
          opacity={0.5 + Math.random() * 0.5}
        />
      ))}
    </svg>,

    // Perlin noise
    <svg key="perlin" viewBox="0 0 24 24" width="100%" height="100%">
      <defs>
        <filter id="perlin-filter">
          <feTurbulence type="fractalNoise" baseFrequency="0.15" numOctaves="3" seed="1" />
          <feComponentTransfer>
            <feFuncR type="linear" slope="3" intercept="-0.5" />
            <feFuncG type="linear" slope="3" intercept="-0.5" />
            <feFuncB type="linear" slope="3" intercept="-0.5" />
          </feComponentTransfer>
          <feColorMatrix type="matrix" values="1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 0.5 0" />
        </filter>
      </defs>
      <rect width="24" height="24" fill="currentColor" filter="url(#perlin-filter)" />
    </svg>,

    // Warp noise - made more distinct from Perlin
    <svg key="warp" viewBox="0 0 24 24" width="100%" height="100%">
      <defs>
        <filter id="warp-filter">
          <feTurbulence type="turbulence" baseFrequency="0.05" numOctaves="2" seed="2" />
          <feDisplacementMap in="SourceGraphic" scale="15" />
        </filter>
      </defs>
      <rect width="24" height="24" fill="none" />
      <g filter="url(#warp-filter)">
        <rect x="2" y="2" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1" />
        <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1" />
        <line x1="12" y1="2" x2="12" y2="22" stroke="currentColor" strokeWidth="1" />
      </g>
    </svg>,

    // Voronoi
    <svg key="voronoi" viewBox="0 0 24 24" width="100%" height="100%">
      <defs>
        <pattern id="voronoi-pattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M0,0 L10,0 L5,10 Z" fill="currentColor" opacity="0.3" />
          <path d="M10,0 L10,10 L5,10 Z" fill="currentColor" opacity="0.5" />
          <path d="M0,10 L5,10 L0,0 Z" fill="currentColor" opacity="0.7" />
        </pattern>
      </defs>
      <rect width="24" height="24" fill="url(#voronoi-pattern)" />
    </svg>,

    // Cellular noise (new) - fixed with unique ID
    <svg key="cellular" viewBox="0 0 24 24" width="100%" height="100%">
      <defs>
        <filter id="cellular-filter-preview">
          <feTurbulence type="turbulence" baseFrequency="0.1" numOctaves="1" seed="3" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 9 -4" />
          <feComposite operator="arithmetic" k1="0" k2="0.5" k3="0.5" k4="0" />
        </filter>
      </defs>
      <rect width="24" height="24" fill="currentColor" filter="url(#cellular-filter-preview)" />
    </svg>,

    // Simplex noise (new) - fixed with unique ID
    <svg key="simplex" viewBox="0 0 24 24" width="100%" height="100%">
      <defs>
        <filter id="simplex-filter-preview">
          <feTurbulence type="fractalNoise" baseFrequency="0.1" numOctaves="4" seed="5" stitchTiles="stitch" />
          <feComponentTransfer>
            <feFuncR type="linear" slope="2" intercept="-0.3" />
            <feFuncG type="linear" slope="2" intercept="-0.3" />
            <feFuncB type="linear" slope="2" intercept="-0.3" />
          </feComponentTransfer>
        </filter>
      </defs>
      <rect width="24" height="24" fill="currentColor" filter="url(#simplex-filter-preview)" />
    </svg>,
  ]

  return patterns[type] || patterns[0]
}

// Component to preview noise color modes
export function NoiseColorModePreview({ type }: { type: number }) {
  // SVG gradients to represent different color modes
  const colorModes = [
    // Grayscale
    <svg key="grayscale" viewBox="0 0 24 24" width="100%" height="100%">
      <defs>
        <linearGradient id="grayscale-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="black" />
          <stop offset="100%" stopColor="white" />
        </linearGradient>
      </defs>
      <rect width="24" height="24" fill="url(#grayscale-gradient)" />
    </svg>,

    // Heat map
    <svg key="heatmap" viewBox="0 0 24 24" width="100%" height="100%">
      <defs>
        <linearGradient id="heatmap-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="black" />
          <stop offset="40%" stopColor="red" />
          <stop offset="70%" stopColor="yellow" />
          <stop offset="100%" stopColor="white" />
        </linearGradient>
      </defs>
      <rect width="24" height="24" fill="url(#heatmap-gradient)" />
    </svg>,

    // Rainbow
    <svg key="rainbow" viewBox="0 0 24 24" width="100%" height="100%">
      <defs>
        <linearGradient id="rainbow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="red" />
          <stop offset="16.6%" stopColor="orange" />
          <stop offset="33.3%" stopColor="yellow" />
          <stop offset="50%" stopColor="green" />
          <stop offset="66.6%" stopColor="blue" />
          <stop offset="83.3%" stopColor="indigo" />
          <stop offset="100%" stopColor="violet" />
        </linearGradient>
      </defs>
      <rect width="24" height="24" fill="url(#rainbow-gradient)" />
    </svg>,

    // Cyberpunk
    <svg key="cyberpunk" viewBox="0 0 24 24" width="100%" height="100%">
      <defs>
        <linearGradient id="cyberpunk-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#800080" /> {/* Purple */}
          <stop offset="50%" stopColor="#ff00ff" /> {/* Magenta */}
          <stop offset="100%" stopColor="#00cccc" /> {/* Cyan */}
        </linearGradient>
      </defs>
      <rect width="24" height="24" fill="url(#cyberpunk-gradient)" />
    </svg>,

    // Neon (new) - fixed with unique ID
    <svg key="neon" viewBox="0 0 24 24" width="100%" height="100%">
      <defs>
        <linearGradient id="neon-gradient-preview" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00ccff" /> {/* Bright blue */}
          <stop offset="50%" stopColor="#ff33cc" /> {/* Hot pink */}
          <stop offset="100%" stopColor="#00ccff" /> {/* Bright blue again */}
        </linearGradient>
      </defs>
      <rect width="24" height="24" fill="url(#neon-gradient-preview)" />
    </svg>,

    // Earth tones (new) - fixed with unique ID
    <svg key="earth" viewBox="0 0 24 24" width="100%" height="100%">
      <defs>
        <linearGradient id="earth-gradient-preview" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1a4d99" /> {/* Deep blue (water) */}
          <stop offset="30%" stopColor="#336699" /> {/* Light blue (shallow water) */}
          <stop offset="40%" stopColor="#996633" /> {/* Brown (sand/dirt) */}
          <stop offset="60%" stopColor="#336633" /> {/* Green (vegetation) */}
          <stop offset="80%" stopColor="#666633" /> {/* Olive (hills) */}
          <stop offset="100%" stopColor="#999999" /> {/* Gray (mountains) */}
        </linearGradient>
      </defs>
      <rect width="24" height="24" fill="url(#earth-gradient-preview)" />
    </svg>,
  ]

  return colorModes[type] || colorModes[0]
}

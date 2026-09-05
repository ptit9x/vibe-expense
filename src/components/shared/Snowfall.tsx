import { useMemo } from 'react'
import { useTheme } from '@/components/theme-provider'

/** Deterministic pseudo-random generator (stable across StrictMode double-render). */
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const GLYPHS = ['❄', '❅', '❆', '•']

type Flake = {
  key: string
  glyph: string
  left: number // vw %
  size: number // px
  duration: number // fall seconds
  swayDuration: number // sway seconds
  delay: number // negative for immediate spread
  opacity: number
}

function buildFlakes(count: number, seed: number): Flake[] {
  const rand = mulberry32(seed)
  return Array.from({ length: count }, (_, i) => {
    const glyph = GLYPHS[Math.floor(rand() * GLYPHS.length)]
    const size = 6 + rand() * 10
    return {
      key: `flake-${i}`,
      glyph,
      left: rand() * 100,
      size,
      // Larger flakes fall faster (closer to camera)
      duration: (7 + rand() * 9) * (1 - (size - 6) / 40),
      swayDuration: 2.5 + rand() * 3.5,
      delay: -rand() * 16,
      opacity: 0.35 + rand() * 0.5,
    }
  })
}

/**
 * Festive snowfall overlay — rendered only when the Christmas theme is active.
 * CSS animation lives in index.css under `.theme-christmas .snowflake`.
 * Respects prefers-reduced-motion (CSS hides the layers entirely).
 */
export default function Snowfall() {
  const { theme } = useTheme()

  const layers = useMemo(
    () => ({
      back: buildFlakes(24, 20261225),
      front: buildFlakes(14, 12252026),
    }),
    []
  )

  if (theme !== 'christmas') return null

  return (
    <>
      <div className="snow-layer" aria-hidden="true">
        {layers.back.map((f) => (
          <span
            key={f.key}
            className="snowflake"
            style={{
              left: `${f.left}vw`,
              fontSize: `${f.size}px`,
              opacity: f.opacity * 0.6,
              animationDuration: `${f.duration + 4}s, ${f.swayDuration}s`,
              animationDelay: `${f.delay}s, ${f.delay / 2}s`,
            }}
          >
            {f.glyph}
          </span>
        ))}
      </div>
      <div className="snow-layer" aria-hidden="true">
        {layers.front.map((f) => (
          <span
            key={f.key}
            className="snowflake"
            style={{
              left: `${f.left}vw`,
              fontSize: `${f.size}px`,
              opacity: f.opacity,
              animationDuration: `${f.duration}s, ${f.swayDuration}s`,
              animationDelay: `${f.delay}s, ${f.delay / 2}s`,
            }}
          >
            {f.glyph}
          </span>
        ))}
      </div>
    </>
  )
}

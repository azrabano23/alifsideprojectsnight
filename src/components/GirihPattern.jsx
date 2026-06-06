import React from 'react'

// Faint 8-fold girih line pattern, used as a near-invisible texture.
// Built from a tessellation of an 8-pointed star + interlaced ribbons.
// Kept geometric, never decorative.

export default function GirihPattern({ opacity = 0.04, className = '' }) {
  return (
    <svg
      className={className}
      aria-hidden="true"
      width="100%"
      height="100%"
      style={{ position: 'absolute', inset: 0, opacity, pointerEvents: 'none' }}
    >
      <defs>
        <pattern
          id="girih"
          width="160"
          height="160"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(0)"
        >
          {/* central 8-point star */}
          <g stroke="#1B1F3B" strokeWidth="0.7" fill="none" strokeLinecap="round">
            {Array.from({ length: 8 }).map((_, i) => {
              const a = (i * Math.PI) / 4
              const r1 = 6
              const r2 = 38
              const x1 = 80 + Math.cos(a) * r1
              const y1 = 80 + Math.sin(a) * r1
              const x2 = 80 + Math.cos(a) * r2
              const y2 = 80 + Math.sin(a) * r2
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
            })}
            {/* inner & outer octagons */}
            <polygon
              points={octagon(80, 80, 14)}
            />
            <polygon points={octagon(80, 80, 38, Math.PI / 8)} />
            <polygon points={octagon(80, 80, 70)} />
            {/* corner half-stars to interlock */}
            {[[0, 0], [160, 0], [0, 160], [160, 160]].map(([cx, cy], idx) => (
              <g key={idx}>
                {Array.from({ length: 8 }).map((_, i) => {
                  const a = (i * Math.PI) / 4
                  const x1 = cx + Math.cos(a) * 4
                  const y1 = cy + Math.sin(a) * 4
                  const x2 = cx + Math.cos(a) * 24
                  const y2 = cy + Math.sin(a) * 24
                  return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
                })}
                <polygon points={octagon(cx, cy, 24, Math.PI / 8)} />
              </g>
            ))}
            {/* edge connectors */}
            <line x1="80" y1="0" x2="80" y2="14" />
            <line x1="80" y1="146" x2="80" y2="160" />
            <line x1="0" y1="80" x2="14" y2="80" />
            <line x1="146" y1="80" x2="160" y2="80" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#girih)" />
    </svg>
  )
}

function octagon(cx, cy, r, rot = 0) {
  return Array.from({ length: 8 })
    .map((_, i) => {
      const a = rot + (i * Math.PI) / 4
      return `${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`
    })
    .join(' ')
}

import React, { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatHour, formatHourShort, formatDuration } from '../data/cities.js'
import { CATEGORIES } from '../lib/categories.js'

// Vertical 24h ribbon. Time flows top → bottom (00:00 → 24:00).
//
// Visual model:
//   - A vertical "band" centered on the canvas. Its width breathes with the
//     energy curve: wider where alertness is high, narrower where it dips.
//   - Prayer pillars cross the band as engraved horizontal markers.
//   - Recommendation blocks are placed on either side of the band, connected
//     by a thin tick into their time range.
//
// Animation:
//   - The curve animates `d` between recomputes.
//   - Blocks animate position via layout transitions.

const HEIGHT = 660
const WIDTH = 760
const BAND_CENTER = 360 // x of band centerline
const BAND_MIN_HALF = 14
const BAND_MAX_HALF = 50
const CARD_W = 156
const CARD_GAP = 38

export default function DayRibbon({
  plan,
  city,
  ramadan,
  onSelectBlock,
  selectedBlockId,
  activities = [],
  highlightActivityId = null
}) {
  const { curve, blocks } = plan
  const prayers = city.prayers

  // Build curve paths.
  const { ribbonLeftPath, ribbonRightPath, alertnessLinePath } = useMemo(
    () => buildPaths(curve),
    [curve]
  )

  // Order blocks by side (left/right) to avoid collisions.
  const sided = useMemo(() => layoutBlocks(blocks), [blocks])

  return (
    <div className="relative" style={{ width: WIDTH, height: HEIGHT + 60 }}>
      <svg
        width={WIDTH}
        height={HEIGHT + 60}
        viewBox={`0 0 ${WIDTH} ${HEIGHT + 60}`}
        className="absolute inset-0"
      >
        <defs>
          <linearGradient id="bandFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1B1F3B" stopOpacity="0.06" />
            <stop offset="50%" stopColor="#1B1F3B" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#1B1F3B" stopOpacity="0.06" />
          </linearGradient>
        </defs>

        {/* Hour ticks down the left margin */}
        <g transform="translate(0, 30)">
          {Array.from({ length: 25 }).map((_, i) => {
            const y = (i / 24) * HEIGHT
            const isMajor = i % 6 === 0
            return (
              <g key={i}>
                <line
                  x1={isMajor ? 56 : 70}
                  y1={y}
                  x2={88}
                  y2={y}
                  stroke="#1B1F3B"
                  strokeWidth={isMajor ? 0.7 : 0.4}
                  opacity={isMajor ? 0.55 : 0.22}
                />
                {isMajor && (
                  <text
                    x={48}
                    y={y + 3.5}
                    textAnchor="end"
                    fontFamily="Inter"
                    fontSize="9.5"
                    fill="#1B1F3B"
                    opacity="0.55"
                    letterSpacing="0.18em"
                  >
                    {String(i).padStart(2, '0')}:00
                  </text>
                )}
              </g>
            )
          })}
        </g>

        {/* Ribbon band */}
        <g transform="translate(0, 30)">
          <motion.path
            d={`${ribbonLeftPath} ${ribbonRightPath}`}
            fill="url(#bandFill)"
            stroke="#1B1F3B"
            strokeWidth="0.6"
            strokeOpacity="0.35"
            initial={false}
            animate={{ d: `${ribbonLeftPath} ${ribbonRightPath}` }}
            transition={{ duration: 0.85, ease: [0.32, 0.72, 0.24, 1] }}
          />

          {/* Centerline */}
          <line
            x1={BAND_CENTER}
            y1={0}
            x2={BAND_CENTER}
            y2={HEIGHT}
            stroke="#1B1F3B"
            strokeWidth="0.4"
            strokeOpacity="0.25"
            strokeDasharray="1 4"
          />

          {/* Energy curve as a thin ink line, plotted along the right edge */}
          <motion.path
            d={alertnessLinePath}
            fill="none"
            stroke="#C8923D"
            strokeWidth="1.2"
            strokeOpacity="0.85"
            initial={false}
            animate={{ d: alertnessLinePath }}
            transition={{ duration: 0.85, ease: [0.32, 0.72, 0.24, 1] }}
          />

          {/* Prayer pillars — engraved horizontal markers across the band */}
          {Object.entries(prayers).map(([key, hour]) => {
            if (key === 'sunrise') return null // shown subtly elsewhere
            const y = (hour / 24) * HEIGHT
            const label = PRAYER_LABEL[key] || key
            return (
              <g key={key}>
                <line
                  x1={BAND_CENTER - BAND_MAX_HALF - 4}
                  y1={y}
                  x2={BAND_CENTER + BAND_MAX_HALF + 4}
                  y2={y}
                  stroke="#1B1F3B"
                  strokeWidth="0.9"
                  strokeOpacity="0.7"
                />
                {/* small notches */}
                <line x1={BAND_CENTER - BAND_MAX_HALF - 8} y1={y} x2={BAND_CENTER - BAND_MAX_HALF - 4} y2={y} stroke="#1B1F3B" strokeWidth="0.9" />
                <line x1={BAND_CENTER + BAND_MAX_HALF + 4} y1={y} x2={BAND_CENTER + BAND_MAX_HALF + 8} y2={y} stroke="#1B1F3B" strokeWidth="0.9" />
                <text
                  x={BAND_CENTER}
                  y={y - 5}
                  textAnchor="middle"
                  fontFamily="Inter"
                  fontSize="9"
                  letterSpacing="0.22em"
                  fill="#1B1F3B"
                  opacity="0.85"
                  className="engraved"
                >
                  {label.toUpperCase()}
                  <tspan opacity="0.6" dx="6">
                    {formatHourShort(hour)}
                  </tspan>
                </text>
              </g>
            )
          })}

          {/* Sunrise / sunset ghosted ticks */}
          {[['sunrise', prayers.sunrise], ['sunset', city.sunset]].map(([k, h]) => {
            const y = (h / 24) * HEIGHT
            return (
              <g key={k}>
                <line
                  x1={BAND_CENTER - 70}
                  y1={y}
                  x2={BAND_CENTER + 70}
                  y2={y}
                  stroke="#C8923D"
                  strokeWidth="0.5"
                  strokeOpacity="0.4"
                  strokeDasharray="2 3"
                />
              </g>
            )
          })}
        </g>

        {/* Recommendation blocks */}
        <g transform="translate(0, 30)">
          {sided.map((b) => (
            <BlockMarker
              key={b.id}
              block={b}
              selected={selectedBlockId === b.id}
              onSelect={() => onSelectBlock?.(b.id)}
            />
          ))}
        </g>

        {/* Logged activities: small glyphs that animate when re-timed. */}
        <g transform="translate(0, 30)">
          {activities.map((a) => (
            <ActivityGlyph
              key={a.id}
              activity={a}
              highlight={highlightActivityId === a.id}
            />
          ))}
        </g>
      </svg>
    </div>
  )
}

const PRAYER_LABEL = {
  fajr: 'Fajr',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha'
}

function buildPaths(curve) {
  // Map alertness [0..1.3] → half-width [BAND_MIN_HALF..BAND_MAX_HALF].
  const widthOf = (v) => {
    const t = Math.max(0, Math.min(1, v / 1.3))
    return BAND_MIN_HALF + t * (BAND_MAX_HALF - BAND_MIN_HALF)
  }
  const points = curve.map((p) => {
    const y = (p.hour / 24) * HEIGHT
    const w = widthOf(p.value)
    return { y, w, value: p.value }
  })

  // Smooth left + right edges via cubic interpolation.
  const leftEdge = points.map((p) => ({ x: BAND_CENTER - p.w, y: p.y }))
  const rightEdge = points.map((p) => ({ x: BAND_CENTER + p.w, y: p.y }))
  const ribbonLeftPath =
    `M ${leftEdge[0].x},${leftEdge[0].y}` + smoothPath(leftEdge)
  const ribbonRightPath =
    ` L ${rightEdge[rightEdge.length - 1].x},${rightEdge[rightEdge.length - 1].y}` +
    smoothPath([...rightEdge].reverse()) +
    ' Z'

  // Alertness line — plot value along the band's right exterior, slightly outside.
  const alertnessPts = points.map((p) => ({
    x: BAND_CENTER + p.w + 14,
    y: p.y
  }))
  const alertnessLinePath =
    `M ${alertnessPts[0].x},${alertnessPts[0].y}` + smoothPath(alertnessPts)

  return { ribbonLeftPath, ribbonRightPath, alertnessLinePath }
}

// Catmull-Rom-ish smoothing → cubic bezier path (without the initial M).
function smoothPath(points) {
  let d = ''
  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 2] || points[i - 1]
    const p1 = points[i - 1]
    const p2 = points[i]
    const p3 = points[i + 1] || points[i]
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`
  }
  return d
}

function layoutBlocks(blocks) {
  // Right side: focus, caffeine, suhoor. Left side: sleep, wind-down, nap.
  const rightKinds = new Set(['focus', 'caffeine', 'suhoor'])
  return blocks.map((b) => ({ ...b, side: rightKinds.has(b.kind) ? 'right' : 'left' }))
}

function BlockMarker({ block, selected, onSelect }) {
  const { start, end, side, kind, label, meta } = block
  // Block can wrap past midnight (e.g., sleep). Handle by drawing two pieces.
  const segments = []
  if (end < start) {
    segments.push([start, 24])
    segments.push([0, end])
  } else {
    segments.push([start, end])
  }

  return (
    <>
      {segments.map(([s, e], idx) => (
        <BlockPiece
          key={idx}
          block={block}
          start={s}
          end={e}
          side={side}
          selected={selected}
          onSelect={onSelect}
        />
      ))}
    </>
  )
}

function BlockPiece({ block, start, end, side, selected, onSelect }) {
  const yStart = (start / 24) * HEIGHT
  const yEnd = (end / 24) * HEIGHT
  const height = Math.max(yEnd - yStart, 14)
  const isThin = block.kind === 'caffeine'
  // Card geometry
  const cardW = CARD_W
  const x =
    side === 'right'
      ? BAND_CENTER + BAND_MAX_HALF + CARD_GAP
      : BAND_CENTER - BAND_MAX_HALF - CARD_GAP - cardW
  const tickFrom =
    side === 'right' ? BAND_CENTER + BAND_MAX_HALF + 6 : BAND_CENTER - BAND_MAX_HALF - 6
  const tickTo = side === 'right' ? x : x + cardW

  const tone = TONE[block.kind] || TONE.focus
  const showLabel = !isThin

  return (
    <motion.g
      style={{ cursor: 'pointer' }}
      onClick={onSelect}
      initial={false}
      animate={{ opacity: 1 }}
    >
      {/* Connector tick into the band */}
      <motion.line
        initial={false}
        animate={{ x1: tickFrom, y1: yStart + height / 2, x2: tickTo, y2: yStart + height / 2 }}
        transition={{ duration: 0.7, ease: [0.32, 0.72, 0.24, 1] }}
        stroke={tone.line}
        strokeWidth="0.7"
        strokeOpacity="0.6"
      />
      {isThin ? (
        <motion.g
          initial={false}
          animate={{ x: 0, y: 0 }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0.24, 1] }}
        >
          <motion.rect
            initial={false}
            animate={{ x, y: yStart + height / 2 - 11, width: cardW, height: 22 }}
            transition={{ duration: 0.7, ease: [0.32, 0.72, 0.24, 1] }}
            rx="3"
            fill={selected ? tone.fillStrong : tone.fill}
            stroke={tone.stroke}
            strokeWidth="0.7"
          />
          <motion.text
            initial={false}
            animate={{ x: x + 12, y: yStart + height / 2 + 3 }}
            transition={{ duration: 0.7, ease: [0.32, 0.72, 0.24, 1] }}
            fontFamily="Inter"
            fontSize="9"
            letterSpacing="0.22em"
            fill={tone.text}
          >
            {block.label.toUpperCase()}
            <tspan dx="6" opacity="0.6">
              {formatHourShort(block.meta?.cutoffTime ?? start)}
            </tspan>
          </motion.text>
        </motion.g>
      ) : (
        <>
          <motion.rect
            initial={false}
            animate={{ x, y: yStart, width: cardW, height }}
            transition={{ duration: 0.75, ease: [0.32, 0.72, 0.24, 1] }}
            rx="4"
            fill={selected ? tone.fillStrong : tone.fill}
            stroke={tone.stroke}
            strokeWidth={selected ? 1.0 : 0.7}
          />
          {/* Kind eyebrow */}
          <motion.text
            initial={false}
            animate={{ x: x + 12, y: yStart + 16 }}
            transition={{ duration: 0.75, ease: [0.32, 0.72, 0.24, 1] }}
            fontFamily="Inter"
            fontSize="8.5"
            letterSpacing="0.28em"
            fill={tone.eyebrow}
          >
            {EYEBROW[block.kind] || ''}
          </motion.text>
          <motion.text
            initial={false}
            animate={{ x: x + 12, y: yStart + 34 }}
            transition={{ duration: 0.75, ease: [0.32, 0.72, 0.24, 1] }}
            fontFamily="Fraunces"
            fontSize="14"
            fontWeight="500"
            fill={tone.text}
          >
            {block.label}
          </motion.text>
          <motion.text
            initial={false}
            animate={{ x: x + 12, y: yStart + 50 }}
            transition={{ duration: 0.75, ease: [0.32, 0.72, 0.24, 1] }}
            fontFamily="Inter"
            fontSize="10"
            fill={tone.text}
            opacity="0.62"
          >
            {labelTimes(block, start, end)}
          </motion.text>
        </>
      )}
    </motion.g>
  )
}

function labelTimes(block, start, end) {
  if (block.kind === 'caffeine') return `cutoff · ${formatHourShort(block.meta?.cutoffTime ?? start)}`
  if (block.kind === 'nap') return `${formatHourShort(start)} → ${formatHourShort(end)} · ${block.meta?.minutes || 26} min`
  return `${formatHourShort(start)} → ${formatHourShort(end)} · ${formatDuration(end - start)}`
}

const EYEBROW = {
  sleep: 'MAIN SLEEP',
  'wind-down': 'WIND-DOWN',
  nap: 'STRATEGIC NAP',
  focus: 'PEAK FOCUS',
  caffeine: 'CAFFEINE',
  suhoor: 'SUHOOR'
}

const TONE = {
  sleep: {
    fill: '#1B1F3B0A',
    fillStrong: '#1B1F3B16',
    stroke: '#1B1F3B55',
    line: '#1B1F3B',
    text: '#1B1F3B',
    eyebrow: '#1B1F3B99'
  },
  'wind-down': {
    fill: '#1B1F3B08',
    fillStrong: '#1B1F3B14',
    stroke: '#1B1F3B44',
    line: '#1B1F3B',
    text: '#1B1F3B',
    eyebrow: '#1B1F3B88'
  },
  nap: {
    fill: '#C8923D14',
    fillStrong: '#C8923D2A',
    stroke: '#C8923D88',
    line: '#C8923D',
    text: '#1B1F3B',
    eyebrow: '#A8762ACC'
  },
  focus: {
    fill: '#C8923D10',
    fillStrong: '#C8923D24',
    stroke: '#C8923D88',
    line: '#C8923D',
    text: '#1B1F3B',
    eyebrow: '#A8762ACC'
  },
  caffeine: {
    fill: '#F7F3EC',
    fillStrong: '#EFE7D8',
    stroke: '#1B1F3B66',
    line: '#1B1F3B',
    text: '#1B1F3B',
    eyebrow: '#1B1F3B'
  },
  suhoor: {
    fill: '#C8923D14',
    fillStrong: '#C8923D2A',
    stroke: '#C8923D88',
    line: '#C8923D',
    text: '#1B1F3B',
    eyebrow: '#A8762ACC'
  }
}

// Small glyph for a logged activity. Sits on the band centerline at the
// activity's current hour. When the activity's hour changes (after a
// re-time apply), framer-motion smoothly animates the new y.
function ActivityGlyph({ activity, highlight }) {
  const cat = CATEGORIES[activity.category]
  const color = cat?.color || '#1B1F3B'
  const y = (activity.hour / 24) * HEIGHT
  const x = BAND_CENTER

  return (
    <motion.g
      initial={false}
      animate={{ x: 0, y: 0 }}
      transition={{ duration: 0.7, ease: [0.32, 0.72, 0.24, 1] }}
      style={{ pointerEvents: 'none' }}
    >
      {/* halo for highlight (pulses when the moved suggestion fires) */}
      {highlight && (
        <motion.circle
          cx={x}
          cy={y}
          r={14}
          fill="none"
          stroke={color}
          strokeWidth="0.8"
          initial={{ opacity: 0, r: 6 }}
          animate={{ opacity: [0.7, 0], r: [6, 22] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
      <motion.line
        initial={false}
        animate={{ y1: y, y2: y }}
        transition={{ duration: 0.7, ease: [0.32, 0.72, 0.24, 1] }}
        x1={x - 16}
        x2={x + 16}
        stroke={color}
        strokeWidth="0.5"
        strokeOpacity="0.35"
      />
      <motion.circle
        initial={false}
        animate={{ cy: y }}
        transition={{ duration: 0.85, ease: [0.32, 0.72, 0.24, 1] }}
        cx={x}
        r={3.2}
        fill="#F7F3EC"
        stroke={color}
        strokeWidth="1.2"
      />
      <motion.text
        initial={false}
        animate={{ y: y + 3 }}
        transition={{ duration: 0.7, ease: [0.32, 0.72, 0.24, 1] }}
        x={x + 9}
        fontFamily="Inter"
        fontSize="8"
        letterSpacing="0.26em"
        fill={color}
        opacity="0.85"
      >
        {cat?.short || ''}
      </motion.text>
    </motion.g>
  )
}


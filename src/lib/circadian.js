// Two-process sleep regulation model (Borbély-style, simplified).
//
// Process C — endogenous circadian rhythm, a cosine peaking at the
// chronotype-shifted acrophase. Morning types peak earlier (~14h),
// evening types later (~18h).
//
// Process S — homeostatic sleep pressure. Builds toward an asymptote
// while awake (τ ≈ 18.2 h) and discharges exponentially during sleep
// (τ ≈ 4.2 h). Less sleep last night leaves a higher S0 at wake — the
// engine of "next-day grogginess."
//
// Alertness ≈ -S(t) + αC(t), shifted so the curve is meaningful to plot.

const TAU_WAKE = 18.2
const TAU_SLEEP = 4.2
const C_AMPLITUDE = 0.5
const S_UPPER = 1.0
const S_LOWER = 0.17

// chronotype: -1 = morning-leaning, 0 = neutral, +1 = evening-leaning
export function acrophase(chronotype) {
  // Peak alertness time, in hours since midnight.
  return 15 + chronotype * 2.0 // morning: 13h, neutral: 15h, evening: 17h
}

export function suggestedWakeTime(chronotype, fajrHour) {
  // Default wake is chronotype-shifted; in Ramadan mode, fajr drives it.
  const natural = 6.5 + chronotype * 1.0
  if (fajrHour != null) return Math.max(fajrHour - 0.25, 4.0)
  return natural
}

// Pressure remaining at wake, after sleeping `hoursSlept` from a presumed
// near-asymptote at bedtime.
function pressureAtWake(hoursSlept) {
  const sBed = S_UPPER * 0.95
  return S_LOWER + (sBed - S_LOWER) * Math.exp(-hoursSlept / TAU_SLEEP)
}

// Pressure t_awake hours after wake.
function pressureAwake(tAwake, hoursSlept) {
  const s0 = pressureAtWake(hoursSlept)
  return S_UPPER - (S_UPPER - s0) * Math.exp(-tAwake / TAU_WAKE)
}

export function alertnessAt(hour, opts) {
  const { hoursSlept, chronotype, wakeTime } = opts
  const peak = acrophase(chronotype)
  const C = Math.cos((2 * Math.PI * (hour - peak)) / 24)
  // hours awake since wake (wrap so pre-wake = late in previous awake period)
  let tAwake = hour - wakeTime
  if (tAwake < 0) tAwake += 24
  // Pre-wake hours are technically asleep; show them as low alertness (sleep).
  const isAsleep = hour < wakeTime || hour > (wakeTime + 16 + (8 - hoursSlept))
  const S = pressureAwake(tAwake, hoursSlept)
  // Normalize: -S in [-1,-0.17], + αC in [-α,+α]. Shift to roughly [0,1.2].
  const raw = -S + C_AMPLITUDE * C + 1.0
  // Sleep period is depressed (eyes closed, no alertness reading)
  return isAsleep ? Math.max(0.05, raw - 0.4) : Math.max(0.05, raw)
}

export function sampleCurve(opts, samples = 145) {
  // samples = 145 → ~10-min resolution across 24h, smooth curve.
  const points = []
  for (let i = 0; i <= samples; i++) {
    const hour = (i / samples) * 24
    points.push({ hour, value: alertnessAt(hour, opts) })
  }
  return points
}

export function findPeakWindow(curve, avoidRanges = [], minLength = 1.5) {
  // Find the highest sustained window (≥ minLength hours) that doesn't
  // collide with any avoid range.
  let best = { start: 9, end: 11, score: -Infinity }
  const dh = curve[1].hour - curve[0].hour
  const windowSize = Math.round(minLength / dh)
  for (let i = 0; i < curve.length - windowSize; i++) {
    const start = curve[i].hour
    const end = curve[i + windowSize].hour
    if (start < 7 || end > 21) continue // daylight focus only
    if (overlapsAny(start, end, avoidRanges)) continue
    let sum = 0
    for (let j = 0; j < windowSize; j++) sum += curve[i + j].value
    const score = sum / windowSize
    if (score > best.score) best = { start, end, score }
  }
  return best
}

export function findDip(curve, range = [12.5, 16.5]) {
  let best = { hour: 14, value: Infinity }
  for (const p of curve) {
    if (p.hour < range[0] || p.hour > range[1]) continue
    if (p.value < best.value) best = { hour: p.hour, value: p.value }
  }
  return best
}

function overlapsAny(s, e, ranges) {
  return ranges.some((r) => !(e <= r.start || s >= r.end))
}

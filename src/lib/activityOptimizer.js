import { CATEGORIES } from './categories.js'

// Given today's plan + an activity's category, find the best hour for it.
// Returns { hour, rationale, score }.
//
// We honor the fixed pillars (prayers) and the placed recommendation blocks
// (we won't re-time INTO the sleep block, for example).

export function bestSlotFor(activity, plan, city) {
  const cat = CATEGORIES[activity.category]
  if (!cat) return null
  const target = cat.target

  // No-op for fixed devotional — those are immovable, never re-suggested.
  if (target === 'fixed') return null

  const wakeTime = plan.wakeTime
  const bedtime = plan.bedtime
  const focus = plan.focusWindow
  const nap = plan.blocks.find((b) => b.kind === 'nap')

  // Off-limits ranges. Sleep + nap + prayer settle buffers.
  const offLimits = [
    { start: bedtime, end: bedtime + 8, label: 'sleep' },
    { start: nap.start, end: nap.end, label: 'nap' },
    ...['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((k) => ({
      start: city.prayers[k] - 0.1,
      end: city.prayers[k] + 0.5,
      label: k
    }))
  ]

  let suggested = null
  let rationale = ''

  if (target === 'peak') {
    suggested = (focus.start + focus.end) / 2
    rationale = 'lands at today’s alertness peak'
  } else if (target === 'mid') {
    // moderate alertness, late morning preferred
    suggested = 10.5
    rationale = 'moderate-load slot, before the noon dip'
  } else if (target === 'wind-down') {
    suggested = ((bedtime - 0.5) + 24) % 24
    rationale = 'wind-down window before bedtime'
  } else if (target === 'late-afternoon') {
    // Physical: late afternoon at body-temp high.
    // Ramadan-adjusted: prefer the post-iftar window (Maghrib + 1.5h)
    // OR pre-suhoor only if chronotype is morning. Demo defaults to post-iftar.
    if (plan.blocks.some((b) => b.kind === 'suhoor')) {
      suggested = city.prayers.maghrib + 1.5
      rationale = 'post-iftar refueled window, fasting-safe'
    } else {
      suggested = 17.25
      rationale = 'strength peak at the body-temp high'
    }
  } else if (target === 'evening') {
    suggested = city.prayers.maghrib + 0.75
    rationale = 'right after iftar'
  } else if (target === 'dip-or-night') {
    suggested = nap.start + (nap.end - nap.start) / 2
    rationale = 'aligns with the planned dip'
  }

  if (suggested == null) return null
  // Avoid collisions: nudge if it lands in an off-limits range
  suggested = avoid(suggested, offLimits, 0.5)

  return { hour: suggested, rationale }
}

function avoid(hour, ranges, step) {
  let h = hour
  for (let i = 0; i < 6; i++) {
    const hit = ranges.find((r) => h >= r.start && h <= r.end)
    if (!hit) return h
    h = hit.end + 0.1
  }
  return hour
}

// True if the move is meaningfully better than the current placement.
export function shouldSuggestMove(currentHour, suggestedHour) {
  if (suggestedHour == null) return false
  const delta = Math.abs(currentHour - suggestedHour)
  return delta >= 0.75 // at least 45 minutes off
}

// Apply move: returns the activity with its hour shifted.
export function applyMove(activity, suggestedHour) {
  return { ...activity, hour: suggestedHour, movedTo: suggestedHour }
}

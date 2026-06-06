import { sampleCurve, findPeakWindow, findDip, suggestedWakeTime } from './circadian.js'

// Builds the day's plan: sleep block, wind-down, suhoor wake (if Ramadan),
// nap, caffeine cutoff, focus window.
//
// All blocks have { id, label, kind, start, end, meta }.

export function buildPlan({ city, chronotype, hoursSlept, goal, ramadan }) {
  const prayers = city.prayers
  const wakeTime = ramadan
    ? suggestedWakeTime(chronotype, prayers.fajr) - 0.25 // wake just before suhoor cutoff
    : suggestedWakeTime(chronotype, null)

  const curve = sampleCurve({ hoursSlept, chronotype, wakeTime })

  // Sleep block — target 8h, but anchored to what they actually slept.
  // For demo we recommend ~7.5–8h tonight as the "ideal."
  const desiredSleep = 7.75
  const bedtime = ((wakeTime - desiredSleep) + 24) % 24
  const sleepStart = bedtime
  const sleepEnd = wakeTime

  // Wind-down: 45 min before bedtime
  const windDownStart = ((bedtime - 0.75) + 24) % 24
  const windDownEnd = bedtime

  // Caffeine cutoff = 6h before bedtime (Drake 2013 finding).
  const caffeineCutoff = ((bedtime - 6) + 24) % 24

  // Nap: at post-midday circadian dip if predicted alertness is low.
  // Less sleep → longer & earlier nap (push from 26 to 35 min).
  const dip = findDip(curve, [12.5, 16.5])
  const sleepDeficit = Math.max(0, 8 - hoursSlept)
  const napLength = sleepDeficit > 2 ? 0.58 : sleepDeficit > 1 ? 0.45 : 0.43 // ~35/27/26 min
  const napCenter = dip.hour - sleepDeficit * 0.35 // earlier when more deficit
  let napStart = napCenter - napLength / 2
  let napEnd = napCenter + napLength / 2

  // Don't let the nap collide with Asr or Dhuhr — slide it.
  const prayerRanges = [
    { start: prayers.dhuhr - 0.1, end: prayers.dhuhr + 0.4, name: 'Dhuhr' },
    { start: prayers.asr - 0.1, end: prayers.asr + 0.4, name: 'Asr' }
  ]
  for (const r of prayerRanges) {
    if (!(napEnd <= r.start || napStart >= r.end)) {
      // push nap before
      napEnd = r.start - 0.1
      napStart = napEnd - napLength
    }
  }

  // Focus window: highest sustained alertness window, away from prayers + nap.
  const avoid = [
    { start: napStart, end: napEnd },
    { start: prayers.fajr - 0.1, end: prayers.fajr + 0.4 },
    { start: prayers.dhuhr - 0.1, end: prayers.dhuhr + 0.4 },
    { start: prayers.asr - 0.1, end: prayers.asr + 0.4 },
    { start: prayers.maghrib - 0.1, end: prayers.maghrib + 0.4 },
    { start: prayers.isha - 0.1, end: prayers.isha + 0.4 }
  ]
  const focusLen = sleepDeficit > 2 ? 1.5 : 2.0
  const focus = findPeakWindow(curve, avoid, focusLen)

  // Ramadan: add suhoor wake-window and iftar (Maghrib) pillars
  const suhoorEnd = prayers.fajr // suhoor must end by Fajr
  const suhoorStart = suhoorEnd - 0.5 // 30-min eating window

  const blocks = []

  blocks.push({
    id: 'sleep',
    label: 'Main sleep',
    kind: 'sleep',
    start: sleepStart,
    end: sleepEnd,
    meta: { hoursSlept, target: desiredSleep }
  })

  blocks.push({
    id: 'wind-down',
    label: 'Wind-down',
    kind: 'wind-down',
    start: windDownStart,
    end: windDownEnd
  })

  blocks.push({
    id: 'caffeine',
    label: 'Caffeine cutoff',
    kind: 'caffeine',
    start: caffeineCutoff - 0.05,
    end: caffeineCutoff + 0.05,
    meta: { cutoffTime: caffeineCutoff }
  })

  blocks.push({
    id: 'nap',
    label: 'Strategic nap',
    kind: 'nap',
    start: napStart,
    end: napEnd,
    meta: { minutes: Math.round(napLength * 60) }
  })

  blocks.push({
    id: 'focus',
    label: 'Peak focus window',
    kind: 'focus',
    start: focus.start,
    end: focus.end,
    meta: { score: focus.score }
  })

  if (ramadan) {
    blocks.push({
      id: 'suhoor',
      label: 'Suhoor window',
      kind: 'suhoor',
      start: suhoorStart,
      end: suhoorEnd
    })
  }

  // Today's read — one-line synthesis
  let read
  if (sleepDeficit > 2) {
    read = `Last night ran short. Your plan tightens around a longer nap and an earlier wind-down.`
  } else if (sleepDeficit > 0.75) {
    read = `Mild sleep debt. A brief nap at your afternoon dip will recover most of it.`
  } else if (chronotype < 0) {
    read = `Your focus peaks late morning. Protect it.`
  } else if (chronotype > 0) {
    read = `Your focus arrives in the afternoon. Defend the block from meetings.`
  } else {
    read = `A clean baseline day. Light wind-down, no caffeine after late afternoon.`
  }

  return {
    blocks,
    curve,
    wakeTime,
    bedtime,
    caffeineCutoff,
    focusWindow: focus,
    napDip: dip,
    read,
    sleepDeficit
  }
}

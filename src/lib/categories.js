// The seven focus categories. Activities get labeled with one of these.
// The optimizer uses the `target` field to decide where on the day the
// activity should ideally land.
//
// `tone` controls the visual chip — restricted to solar / ink / muted to
// stay inside the editorial palette.

export const CATEGORIES = {
  deep: {
    id: 'deep',
    label: 'Deep Focus',
    short: 'DEEP',
    desc: 'Analytical, high-load. Wants the alertness peak.',
    target: 'peak',
    tone: 'solar',
    color: '#C8923D'
  },
  light: {
    id: 'light',
    label: 'Light Focus',
    short: 'LIGHT',
    desc: 'Routine and admin. Fills moderate zones.',
    target: 'mid',
    tone: 'ink',
    color: '#2A2F52'
  },
  calm: {
    id: 'calm',
    label: 'Calm / Restorative',
    short: 'CALM',
    desc: 'Low-arousal, parasympathetic. Best in wind-down zones.',
    target: 'wind-down',
    tone: 'ink-soft',
    color: '#6E6F84'
  },
  devotional: {
    id: 'devotional',
    label: 'Devotional Presence',
    short: 'DEVOT.',
    desc: 'The five prayers. Fixed walls — never scheduled, only protected.',
    target: 'fixed',
    tone: 'solar-deep',
    color: '#A8762A'
  },
  physical: {
    id: 'physical',
    label: 'Physical / Exertion',
    short: 'PHYS.',
    desc: 'Strength peaks late afternoon at body-temp high.',
    target: 'late-afternoon',
    tone: 'ink',
    color: '#1B1F3B'
  },
  social: {
    id: 'social',
    label: 'Social / Connection',
    short: 'SOCIAL',
    desc: 'Iftar gatherings, family. Evening.',
    target: 'evening',
    tone: 'ink-soft',
    color: '#4A4D6C'
  },
  recovery: {
    id: 'recovery',
    label: 'Recovery',
    short: 'REC.',
    desc: 'Sleep, naps, downtime.',
    target: 'dip-or-night',
    tone: 'ink-mute',
    color: '#8A8B9E'
  }
}

export const CATEGORY_LIST = Object.values(CATEGORIES)

// Seed activities — used to make the demo land on first render.
// Times are in decimal hours.
export const SEED_ACTIVITIES = [
  {
    id: 'a1',
    label: 'Read journal article',
    category: 'deep',
    hour: 15.0,       // 3:00 PM — the biological dip
    duration: 1.5,
    movedTo: null
  },
  {
    id: 'a2',
    label: 'Squat day',
    category: 'physical',
    hour: 19.25,      // 7:15 PM — collides with post-iftar slump
    duration: 1.0,
    movedTo: null
  },
  {
    id: 'a3',
    label: 'Emails + admin',
    category: 'light',
    hour: 9.0,        // 9:00 AM — fine
    duration: 1.0,
    movedTo: null
  },
  {
    id: 'a4',
    label: 'Reflection',
    category: 'calm',
    hour: 11.5,       // 11:30 AM — too high-arousal a slot for restorative
    duration: 0.5,
    movedTo: null
  }
]

// Plausible mock prayer times for a fixed reference date.
// (Hours in decimal: 5.7 == 5:42 AM)
// These are illustrative for a demo and are not source-of-truth.

export const CITIES = {
  'san-francisco': {
    id: 'san-francisco',
    name: 'San Francisco',
    region: 'California',
    coords: '37.77° N · 122.42° W',
    method: 'ISNA',
    methods: ['ISNA', 'MWL', 'Umm al-Qura'],
    sunrise: 6.92, // 6:55
    sunset: 19.50, // 7:30 PM
    prayers: {
      fajr: 5.70,    // 5:42
      sunrise: 6.92, // 6:55
      dhuhr: 13.25,  // 1:15 PM
      asr: 16.58,    // 4:35
      maghrib: 19.50,// 7:30
      isha: 20.75    // 8:45
    }
  },
  'london': {
    id: 'london',
    name: 'London',
    region: 'United Kingdom',
    coords: '51.51° N · 0.13° W',
    method: 'MWL',
    methods: ['ISNA', 'MWL', 'Umm al-Qura'],
    sunrise: 6.00,
    sunset: 18.25,
    prayers: {
      fajr: 4.50,    // 4:30
      sunrise: 6.00, // 6:00
      dhuhr: 12.17,  // 12:10
      asr: 15.33,    // 3:20
      maghrib: 18.25,// 6:15
      isha: 19.75    // 7:45
    }
  },
  'dubai': {
    id: 'dubai',
    name: 'Dubai',
    region: 'United Arab Emirates',
    coords: '25.20° N · 55.27° E',
    method: 'Umm al-Qura',
    methods: ['ISNA', 'MWL', 'Umm al-Qura'],
    sunrise: 6.10,
    sunset: 18.58,
    prayers: {
      fajr: 4.92,    // 4:55
      sunrise: 6.10, // 6:06
      dhuhr: 12.42,  // 12:25
      asr: 15.75,    // 3:45
      maghrib: 18.58,// 6:35
      isha: 19.83    // 7:50
    }
  }
}

// Unified time formatters. Always 12-hour, always uppercase AM/PM.
// `formatHour`  → "5:42 AM"  — default full form.
// `formatHourShort` → "5:42a" — compact form for tight engraved markers.

export const formatHour = (h) => {
  const total = Math.round(h * 60)
  let hh = Math.floor(total / 60) % 24
  if (hh < 0) hh += 24
  const mm = ((total % 60) + 60) % 60
  const ampm = hh >= 12 ? 'PM' : 'AM'
  const display = hh % 12 === 0 ? 12 : hh % 12
  return `${display}:${String(mm).padStart(2, '0')} ${ampm}`
}

export const formatHourShort = (h) => {
  const total = Math.round(h * 60)
  let hh = Math.floor(total / 60) % 24
  if (hh < 0) hh += 24
  const mm = ((total % 60) + 60) % 60
  const ampm = hh >= 12 ? 'p' : 'a'
  const display = hh % 12 === 0 ? 12 : hh % 12
  return `${display}:${String(mm).padStart(2, '0')}${ampm}`
}

export const formatDuration = (hours) => {
  if (hours < 1) {
    return `${Math.round(hours * 60)} min`
  }
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

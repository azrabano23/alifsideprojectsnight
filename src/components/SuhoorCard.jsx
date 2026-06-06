import React from 'react'
import { motion } from 'framer-motion'
import { formatHour, formatHourShort, formatDuration } from '../data/cities.js'

export default function SuhoorCard({ plan, city, ramadan }) {
  const fajr = city.prayers.fajr
  const bedtime = plan.bedtime
  const wakeTime = plan.wakeTime
  const wakeWindowStart = Math.max(0, wakeTime - 0.33) // 20-min light-sleep window

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="border border-ink/15 bg-paper-deep/40 p-7"
    >
      <div className="text-[10px] uppercase tracking-almanac text-solar-deep mb-2">
        {ramadan ? 'Suhoor / Wind-down' : 'Wind-down'}
      </div>
      <div className="font-display text-[22px] leading-[1.15] text-ink mb-5">
        {ramadan
          ? 'A bedtime that pays Fajr forward.'
          : 'A bedtime that pays tomorrow forward.'}
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        <Row
          label="Optimal bedtime"
          value={formatHour(bedtime)}
          note={`asleep within 20 min`}
        />
        <Row
          label="Wake alarm fires"
          value={`${formatHourShort(wakeWindowStart)} → ${formatHourShort(wakeTime)}`}
          note="in a light-sleep moment"
        />
        {ramadan && (
          <>
            <Row
              label="Suhoor window"
              value={`${formatHourShort(fajr - 0.5)} → ${formatHourShort(fajr)}`}
              note="ends at Fajr cutoff"
            />
            <Row
              label="Caffeine cutoff"
              value={formatHour(plan.caffeineCutoff)}
              note="6h before bedtime"
            />
          </>
        )}
        {!ramadan && (
          <Row
            label="Caffeine cutoff"
            value={formatHour(plan.caffeineCutoff)}
            note="6h before bedtime"
          />
        )}
      </div>

      <p className="mt-6 text-[12px] text-ink/55 leading-relaxed">
        Wake-up fires inside a 20-minute window aimed at the lightest predicted
        sleep stage before {ramadan ? 'suhoor cutoff' : 'your alarm'} — to
        soften sleep inertia at the moment it hurts most.
      </p>
    </motion.div>
  )
}

function Row({ label, value, note }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-almanac text-ink/45 mb-1">
        {label}
      </div>
      <div className="font-display text-[18px] text-ink leading-tight">
        {value}
      </div>
      <div className="text-[11px] text-ink/55 mt-0.5">{note}</div>
    </div>
  )
}

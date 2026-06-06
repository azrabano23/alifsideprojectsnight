import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const SCIENCE = {
  nap: {
    eyebrow: 'STRATEGIC NAP',
    title: 'A 26-minute nap, paid back in alertness.',
    body: 'NASA found that a brief nap of about 26 minutes improved pilot alertness by 54% and on-task performance by 34%. The nap lands at the post-midday circadian dip, before sleep inertia can take hold — short enough to skip deep sleep, long enough to discharge homeostatic pressure.',
    citation: 'Rosekind et al., NASA Ames Research Center'
  },
  caffeine: {
    eyebrow: 'CAFFEINE CUTOFF',
    title: '6 hours before bed. Even if you don\'t feel it.',
    body: '400 mg of caffeine taken six hours before bed reduced total sleep by more than one hour — and self-reported sleep quality barely registered the loss. Cutoff is anchored to your computed bedtime, not the clock.',
    citation: 'Drake et al., Journal of Clinical Sleep Medicine, 2013'
  },
  focus: {
    eyebrow: 'PEAK FOCUS',
    title: 'Performance peaks at your chronotype.',
    body: 'Cognitive performance is highest when timed to your internal phase — the synchrony effect. We place a defended focus block at your predicted alertness maximum, slotted into the longest open span between fixed pillars.',
    citation: 'May, Hasher & Healey, on the synchrony effect'
  },
  sleep: {
    eyebrow: 'MAIN SLEEP',
    title: 'Bedtime works backward from when you must wake.',
    body: 'We anchor wake to your earliest fixed obligation — in Ramadan, the suhoor cutoff at Fajr. Bedtime is set ~7h 45m before that. Drift it later and process S carries debt into tomorrow.',
    citation: 'Two-process model, Borbély'
  },
  'wind-down': {
    eyebrow: 'WIND-DOWN',
    title: 'A 45-minute taper before lights out.',
    body: 'The terminal hour of wake is when light exposure most strongly delays sleep onset. We mark a brief, fixed taper — your cue to dim screens and lower the room — so that bedtime arrives, rather than being negotiated for.',
    citation: 'Czeisler & Gooley, on light and circadian phase'
  },
  suhoor: {
    eyebrow: 'SUHOOR WINDOW',
    title: 'A 30-minute eating window before Fajr.',
    body: 'In Ramadan mode, suhoor is treated as a fixed pillar. The wake alarm is tuned to fire in light sleep within the 20 minutes before this window — reducing sleep inertia at a moment when grogginess is most costly.',
    citation: 'Sleep inertia literature, Tassi & Muzet'
  }
}

export default function WhyCard({ blockId, onClose }) {
  const info = SCIENCE[blockId]
  return (
    <AnimatePresence>
      {info && (
        <motion.div
          key={blockId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-30 flex items-center justify-center px-6"
          style={{ backgroundColor: 'rgba(27,31,59,0.18)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 14, rotateX: -8 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, y: 14, rotateX: -8 }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0.24, 1] }}
            className="relative bg-paper border border-ink/15 max-w-[520px] w-full p-10 shadow-[0_30px_60px_-20px_rgba(27,31,59,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-5 right-6 text-[10px] uppercase tracking-almanac text-ink/40">
              tap anywhere to close
            </div>
            <div className="text-[10px] uppercase tracking-almanac text-solar-deep mb-6">
              {info.eyebrow}
            </div>
            <h2 className="font-display text-[34px] leading-[1.1] text-ink mb-6 tracking-tight">
              {info.title}
            </h2>
            <p className="text-[14.5px] leading-[1.65] text-ink/80 mb-8">
              {info.body}
            </p>
            <div className="almanac-rule mb-3" />
            <div className="flex items-end justify-between">
              <span className="text-[11px] uppercase tracking-almanac text-ink/50">
                citation
              </span>
              <span className="font-display italic text-[13px] text-ink/80 text-right max-w-[280px]">
                {info.citation}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

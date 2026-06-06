import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDuration } from '../data/cities.js'

export default function RecomputeSlider({ hoursSlept, onChange }) {
  const display = formatDuration(hoursSlept)
  return (
    <div className="w-full max-w-md">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[10.5px] uppercase tracking-almanac text-ink/70">
          Last night I slept
        </span>
        <AnimatePresence mode="wait">
          <motion.span
            key={display}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.18 }}
            className="font-display text-[28px] text-ink leading-none tabular-nums"
          >
            {display}
          </motion.span>
        </AnimatePresence>
      </div>
      <input
        type="range"
        min="3"
        max="9"
        step="0.25"
        value={hoursSlept}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="fitra-slider"
      />
      <div className="flex justify-between mt-1 text-[10px] uppercase tracking-almanac text-ink/40">
        <span>3h</span>
        <span>6h</span>
        <span>9h</span>
      </div>
      <p className="mt-3 text-[12px] text-ink/55 leading-relaxed">
        Drag to recompute. The plan rewrites itself: nap length, wind-down,
        caffeine cutoff, focus window.
      </p>
    </div>
  )
}

import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatHour } from '../data/cities.js'

// 12-hour time picker styled to match the editorial palette.
// `value` is decimal hours (0–24). `onChange(decimal)` fires on every change.
//
// Layout when open:
//   ┌────────── Hour ───────────┐  ┌──── Minute ────┐  ┌── AM / PM ──┐
//   │  1   2   3   4   5   6    │  │  00   15   30  │  │   AM   PM   │
//   │  7   8   9  10  11  12    │  │  45            │  │             │
//   └───────────────────────────┘  └────────────────┘  └─────────────┘

export default function TimePicker({ value, onChange, compact = false }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    const onDoc = (e) => {
      if (!open) return
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const hh24 = Math.floor(value)
  const rawMin = Math.round((value - hh24) * 60)
  // Snap minute to nearest 5 for display only
  const mm = rawMin
  const ampm = hh24 >= 12 ? 'PM' : 'AM'
  const hh12 = hh24 % 12 === 0 ? 12 : hh24 % 12

  const display = `${hh12}:${String(mm).padStart(2, '0')} ${ampm}`

  const setHour = (h12) => {
    let h24 = h12 % 12
    if (ampm === 'PM') h24 += 12
    onChange(h24 + mm / 60)
  }
  const setMinute = (m) => onChange(hh24 + m / 60)
  const setAmPm = (ap) => {
    let h24 = hh24 % 12
    if (ap === 'PM') h24 += 12
    onChange(h24 + mm / 60)
  }

  return (
    <div className="relative inline-block" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-baseline gap-1.5 border-b border-ink/25 hover:border-ink transition-colors pb-1 min-w-[126px] justify-end"
      >
        <span className="font-display tabular-nums text-ink text-[22px] leading-none">
          {hh12}:{String(mm).padStart(2, '0')}
        </span>
        <span className="uppercase tracking-almanac text-ink/55 text-[10px] leading-none">
          {ampm}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 top-full mt-3 z-30 bg-paper border border-ink/20 shadow-[0_18px_40px_-16px_rgba(27,31,59,0.25)] p-4 w-[280px]"
          >
            <Column label="Hour">
              <div className="grid grid-cols-6 gap-1">
                {Array.from({ length: 12 }).map((_, i) => {
                  const h = i + 1
                  const selected = h === hh12
                  return (
                    <PickButton
                      key={h}
                      selected={selected}
                      onClick={() => setHour(h)}
                    >
                      {h}
                    </PickButton>
                  )
                })}
              </div>
            </Column>

            <div className="mt-3 grid grid-cols-2 gap-4">
              <Column label="Minute">
                <div className="grid grid-cols-4 gap-1">
                  {[0, 15, 30, 45].map((m) => (
                    <PickButton
                      key={m}
                      selected={m === mm}
                      onClick={() => setMinute(m)}
                    >
                      {String(m).padStart(2, '0')}
                    </PickButton>
                  ))}
                </div>
              </Column>
              <Column label="Period">
                <div className="grid grid-cols-2 gap-1">
                  {['AM', 'PM'].map((ap) => (
                    <PickButton
                      key={ap}
                      selected={ap === ampm}
                      onClick={() => setAmPm(ap)}
                    >
                      {ap}
                    </PickButton>
                  ))}
                </div>
              </Column>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Column({ label, children }) {
  return (
    <div>
      <div className="text-[9.5px] uppercase tracking-almanac text-ink/45 mb-2">
        {label}
      </div>
      {children}
    </div>
  )
}

function PickButton({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 text-[11.5px] font-display tabular-nums transition-all ${
        selected
          ? 'bg-ink text-paper'
          : 'text-ink/70 hover:bg-ink/[0.05] hover:text-ink border border-transparent'
      }`}
    >
      {children}
    </button>
  )
}

export const formatTime12 = formatHour

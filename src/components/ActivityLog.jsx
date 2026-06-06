import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CATEGORIES, CATEGORY_LIST } from '../lib/categories.js'
import { bestSlotFor, shouldSuggestMove } from '../lib/activityOptimizer.js'
import { formatHour } from '../data/cities.js'

// Sidebar that lists logged activities and surfaces re-time suggestions.
// Clicking "Apply" on a suggestion shifts the activity's hour, which the
// Day Ribbon picks up and animates the glyph to the new time.

export default function ActivityLog({
  activities,
  plan,
  city,
  onApply,
  onAdd,
  onHighlight
}) {
  const [adding, setAdding] = useState(false)

  // Compute suggestions for each activity given today's plan.
  const rows = useMemo(
    () =>
      activities.map((a) => {
        const slot = bestSlotFor(a, plan, city)
        const suggest =
          slot && shouldSuggestMove(a.hour, slot.hour)
            ? { hour: slot.hour, rationale: slot.rationale }
            : null
        return { activity: a, suggest }
      }),
    [activities, plan, city]
  )

  const suggestionCount = rows.filter((r) => r.suggest).length

  return (
    <div className="border border-ink/15">
      <div className="px-5 py-4 border-b border-ink/10 flex items-baseline justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-almanac text-solar-deep">
            ACTIVITY LOG
          </div>
          <div className="font-display text-[16px] text-ink mt-0.5">
            Today, what you logged
          </div>
        </div>
        <button
          onClick={() => setAdding((v) => !v)}
          className="text-[11px] uppercase tracking-almanac text-ink/70 hover:text-ink"
        >
          {adding ? 'Cancel' : '+ Log'}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {adding && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-b border-ink/10"
          >
            <AddForm
              onAdd={(act) => {
                onAdd(act)
                setAdding(false)
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {suggestionCount > 0 && (
        <div className="px-5 py-3 bg-paper-deep/50 border-b border-ink/10 text-[11px] uppercase tracking-almanac text-ink/70">
          {suggestionCount} re-time{' '}
          {suggestionCount === 1 ? 'suggestion' : 'suggestions'}
        </div>
      )}

      <ul className="divide-y divide-ink/10">
        <AnimatePresence initial={false}>
          {rows.map(({ activity, suggest }) => (
            <Row
              key={activity.id}
              activity={activity}
              suggest={suggest}
              onApply={() => onApply(activity.id, suggest.hour)}
              onHighlight={onHighlight}
            />
          ))}
        </AnimatePresence>
      </ul>

      <div className="px-5 py-3 border-t border-ink/10 text-[10px] uppercase tracking-almanac text-ink/40 leading-relaxed">
        Fitra only labels states. You assign the activity.
      </div>
    </div>
  )
}

function Row({ activity, suggest, onApply, onHighlight }) {
  const cat = CATEGORIES[activity.category]
  return (
    <motion.li
      layout
      onMouseEnter={() => onHighlight?.(activity.id)}
      onMouseLeave={() => onHighlight?.(null)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="px-5 py-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span
            className="mt-1.5 w-2 h-2 rounded-full shrink-0"
            style={{ background: cat.color }}
          />
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-almanac text-ink/55">
              {cat.label}
            </div>
            <div className="font-display text-[16px] text-ink leading-tight mt-0.5 truncate">
              {activity.label}
            </div>
            <div className="text-[11px] text-ink/50 mt-0.5">
              {formatHour(activity.hour)} · {fmtDur(activity.duration)}
              {activity.movedTo != null && (
                <span className="ml-2 text-solar-deep italic font-display">
                  moved
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {suggest && (
          <motion.div
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-3 ml-5 pl-3 border-l border-solar/50"
          >
            <div className="flex items-baseline justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[9.5px] uppercase tracking-almanac text-solar-deep mb-1">
                  SUGGESTED MOVE
                </div>
                <div className="font-display text-[14px] text-ink leading-tight">
                  → {formatHour(suggest.hour)}
                </div>
                <div className="text-[11px] text-ink/60 italic font-display mt-0.5">
                  {suggest.rationale}
                </div>
              </div>
              <button
                onClick={onApply}
                className="text-[10px] uppercase tracking-almanac px-3 py-1.5 border border-ink bg-ink text-paper hover:bg-ink-soft shrink-0"
              >
                Apply
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  )
}

function AddForm({ onAdd }) {
  const [label, setLabel] = useState('')
  const [category, setCategory] = useState('deep')
  const [hour, setHour] = useState(14)
  const [duration, setDuration] = useState(1)

  const submit = (e) => {
    e.preventDefault()
    if (!label.trim()) return
    onAdd({
      id: `a-${Date.now()}`,
      label: label.trim(),
      category,
      hour,
      duration,
      movedTo: null
    })
    setLabel('')
  }

  return (
    <form onSubmit={submit} className="px-5 py-4 space-y-3">
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="What are you doing?"
        className="w-full bg-transparent border-b border-ink/20 focus:border-ink outline-none py-2 font-display text-[16px] text-ink placeholder:text-ink/35"
        autoFocus
      />
      <div>
        <div className="text-[10px] uppercase tracking-almanac text-ink/45 mb-2">
          Category
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_LIST.map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`text-[10px] uppercase tracking-almanac px-2.5 py-1.5 border ${
                category === c.id
                  ? 'border-ink bg-ink text-paper'
                  : 'border-ink/20 text-ink/70 hover:border-ink/45'
              }`}
            >
              {c.short}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <div className="text-[10px] uppercase tracking-almanac text-ink/45 mb-2">
            When · {formatHour(hour)}
          </div>
          <input
            type="range"
            min="5"
            max="23"
            step="0.25"
            value={hour}
            onChange={(e) => setHour(parseFloat(e.target.value))}
            className="fitra-slider"
          />
        </label>
        <label className="block">
          <div className="text-[10px] uppercase tracking-almanac text-ink/45 mb-2">
            Duration · {fmtDur(duration)}
          </div>
          <input
            type="range"
            min="0.25"
            max="3"
            step="0.25"
            value={duration}
            onChange={(e) => setDuration(parseFloat(e.target.value))}
            className="fitra-slider"
          />
        </label>
      </div>
      <button
        type="submit"
        className="w-full text-[11px] uppercase tracking-almanac py-2.5 border border-ink bg-ink text-paper hover:bg-ink-soft"
      >
        Add to log
      </button>
    </form>
  )
}

function fmtDur(h) {
  if (h < 1) return `${Math.round(h * 60)} min`
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return mm === 0 ? `${hh}h` : `${hh}h ${mm}m`
}

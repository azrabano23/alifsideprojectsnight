import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DayRibbon from './DayRibbon.jsx'
import RecomputeSlider from './RecomputeSlider.jsx'
import SuhoorCard from './SuhoorCard.jsx'
import WhyCard from './WhyCard.jsx'
import GirihPattern from './GirihPattern.jsx'
import ActivityLog from './ActivityLog.jsx'
import { CITIES, formatHour } from '../data/cities.js'
import { buildPlan } from '../lib/optimizer.js'
import { SEED_ACTIVITIES } from '../lib/categories.js'

const HIJRI = '24 Ramaḍān 1447' // illustrative for the demo
const GREG = 'Thursday · 12 March'

export default function DayView({ profile, onPresent, onRestart }) {
  const {
    cityId,
    chronotype,
    goal,
    rhythm,
    calendar: initialCalendar = { google: false, apple: false },
    priorities = [],
    methodIdx: initialMethodIdx = 0
  } = profile
  const [hoursSlept, setHoursSlept] = useState(6.5)
  const [ramadan, setRamadan] = useState(true)
  const [methodIdx, setMethodIdx] = useState(initialMethodIdx)
  const [selectedBlock, setSelectedBlock] = useState(null)
  const [activities, setActivities] = useState(SEED_ACTIVITIES)
  const [highlightActivityId, setHighlightActivityId] = useState(null)
  const [calendar, setCalendar] = useState(initialCalendar)

  const handleApplyMove = (id, suggestedHour) => {
    setActivities((list) =>
      list.map((a) =>
        a.id === id ? { ...a, hour: suggestedHour, movedTo: suggestedHour } : a
      )
    )
    setHighlightActivityId(id)
    setTimeout(() => setHighlightActivityId(null), 1600)
  }

  const handleAdd = (a) => setActivities((list) => [a, ...list])

  const city = CITIES[cityId] || CITIES['san-francisco']

  const plan = useMemo(
    () => buildPlan({ city, chronotype, hoursSlept, goal, ramadan }),
    [city, chronotype, hoursSlept, goal, ramadan]
  )

  const method = city.methods[methodIdx % city.methods.length]

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <GirihPattern opacity={0.035} />
      </div>

      <Header
        city={city}
        method={method}
        onMethodCycle={() => setMethodIdx((i) => i + 1)}
        ramadan={ramadan}
        onToggleRamadan={() => setRamadan((r) => !r)}
        onPresent={onPresent}
        onRestart={onRestart}
      />

      <main className="relative max-w-[1240px] mx-auto px-12 pb-24">
        <section className="pt-10 pb-12 grid grid-cols-12 gap-10">
          <div className="col-span-7">
            <div className="text-[10px] uppercase tracking-almanac text-solar-deep mb-3">
              TODAY · {city.name.toUpperCase()}
            </div>
            <div className="flex items-baseline gap-8 mb-4">
              <h1 className="font-display text-[64px] leading-[0.95] tracking-tight text-ink">
                {GREG}
              </h1>
            </div>
            <div className="flex items-baseline gap-4 text-[14px] text-ink/55 font-display italic">
              <span>{HIJRI}</span>
              <span className="text-ink/25">·</span>
              <span>{city.coords}</span>
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={plan.read}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.35 }}
                className="mt-8 font-display text-[22px] leading-[1.35] text-ink/85 max-w-[520px]"
              >
                <span className="text-solar-deep mr-2">‘‘</span>
                {plan.read}
                <span className="text-solar-deep ml-2">’’</span>
              </motion.p>
            </AnimatePresence>

            <div className="mt-12 flex items-center gap-10 text-[11px] uppercase tracking-almanac text-ink/55">
              <div>
                <div className="text-[9px] text-ink/40">SUNRISE</div>
                <div className="text-ink font-display text-[18px] tracking-normal normal-case mt-0.5">
                  {formatHour(city.sunrise)}
                </div>
              </div>
              <div>
                <div className="text-[9px] text-ink/40">SUNSET</div>
                <div className="text-ink font-display text-[18px] tracking-normal normal-case mt-0.5">
                  {formatHour(city.sunset)}
                </div>
              </div>
              <div>
                <div className="text-[9px] text-ink/40">DAYLIGHT</div>
                <div className="text-ink font-display text-[18px] tracking-normal normal-case mt-0.5">
                  {fmtDur(city.sunset - city.sunrise)}
                </div>
              </div>
              <div>
                <div className="text-[9px] text-ink/40">METHOD</div>
                <button
                  onClick={() => setMethodIdx((i) => i + 1)}
                  className="text-ink font-display text-[18px] tracking-normal normal-case mt-0.5 hover:text-solar-deep transition-colors"
                >
                  {method}
                </button>
              </div>
            </div>
          </div>

          <div className="col-span-5 flex flex-col gap-6 items-end">
            <RamadanToggle on={ramadan} onChange={() => setRamadan((r) => !r)} />
            <RecomputeSlider hoursSlept={hoursSlept} onChange={setHoursSlept} />
          </div>
        </section>

        <div className="almanac-rule mb-12" />

        <section className="grid grid-cols-12 gap-10">
          <div className="col-span-8 flex justify-center">
            <DayRibbon
              plan={plan}
              city={city}
              ramadan={ramadan}
              onSelectBlock={(id) => setSelectedBlock(id)}
              selectedBlockId={selectedBlock}
              activities={activities}
              highlightActivityId={highlightActivityId}
            />
          </div>

          <aside className="col-span-4 space-y-6 pt-2">
            <PrioritiesStrip priorities={priorities} />
            <FiqhFirewallNote />
            <ActivityLog
              activities={activities}
              plan={plan}
              city={city}
              onApply={handleApplyMove}
              onAdd={handleAdd}
              onHighlight={setHighlightActivityId}
            />
            <CalendarStatus calendar={calendar} onToggle={(k) => setCalendar((c) => ({ ...c, [k]: !c[k] }))} />
            <SuhoorCard plan={plan} city={city} ramadan={ramadan} />
            <Legend />
            <PrivacyNote />
          </aside>
        </section>
      </main>

      <WhyCard
        blockId={selectedBlock}
        onClose={() => setSelectedBlock(null)}
      />
    </div>
  )
}

function Header({
  city,
  method,
  onMethodCycle,
  ramadan,
  onToggleRamadan,
  onPresent,
  onRestart
}) {
  return (
    <header className="border-b border-ink/10 relative z-10">
      <div className="max-w-[1240px] mx-auto px-12 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mark />
          <div className="font-display text-[20px] tracking-tight text-ink">
            Fitra
          </div>
          <span className="text-[10px] uppercase tracking-almanac text-ink/40 ml-3">
            A CIRCADIAN ALMANAC
          </span>
        </div>
        <div className="flex items-center gap-5 text-[11px] uppercase tracking-almanac text-ink/55">
          <span>{city.name}</span>
          <span className="text-ink/20">·</span>
          <button onClick={onMethodCycle} className="hover:text-ink transition-colors">
            {method}
          </button>
          <span className="text-ink/20">·</span>
          <button onClick={onRestart} className="hover:text-ink transition-colors">
            Restart
          </button>
          <button
            onClick={onPresent}
            className="ml-3 px-3 py-1.5 border border-ink text-ink hover:bg-ink hover:text-paper transition-colors"
          >
            Present mode
          </button>
        </div>
      </div>
    </header>
  )
}

function Mark() {
  // Minimal 8-fold geometric mark — no crescents.
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <g stroke="#1B1F3B" strokeWidth="0.9">
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i * Math.PI) / 4
          const x1 = 11 + Math.cos(a) * 2
          const y1 = 11 + Math.sin(a) * 2
          const x2 = 11 + Math.cos(a) * 9
          const y2 = 11 + Math.sin(a) * 9
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
        })}
        <circle cx="11" cy="11" r="9.5" fill="none" />
      </g>
    </svg>
  )
}

function RamadanToggle({ on, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`flex items-center gap-3 px-4 py-2.5 border transition-all ${
        on
          ? 'border-ink bg-ink text-paper'
          : 'border-ink/25 text-ink/70 hover:border-ink/55'
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          on ? 'bg-solar' : 'bg-ink/30'
        }`}
      />
      <span className="text-[11px] uppercase tracking-almanac">
        Ramadan mode {on ? 'on' : 'off'}
      </span>
    </button>
  )
}

function Legend() {
  const items = [
    ['Prayer pillar', 'engraved'],
    ['Energy curve', 'solar line'],
    ['Sleep / wind-down', 'ink block'],
    ['Nap / focus', 'amber block'],
    ['Caffeine cutoff', 'thin marker']
  ]
  return (
    <div className="border border-ink/15 p-5">
      <div className="text-[10px] uppercase tracking-almanac text-ink/45 mb-3">
        Reading the ribbon
      </div>
      <div className="space-y-1.5">
        {items.map(([k, v]) => (
          <div key={k} className="flex justify-between text-[12px]">
            <span className="text-ink/75">{k}</span>
            <span className="text-ink/45 font-display italic">{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PrivacyNote() {
  return (
    <div className="text-[10.5px] uppercase tracking-almanac text-ink/40 leading-relaxed">
      The plan is computed on this device.
      <br />
      Nothing leaves it.
    </div>
  )
}

function FiqhFirewallNote() {
  return (
    <div className="border border-ink/15 bg-paper-deep/30 px-5 py-4">
      <div className="text-[10px] uppercase tracking-almanac text-solar-deep">
        THE FIQH FIREWALL
      </div>
      <p className="mt-2 text-[12.5px] text-ink/75 leading-[1.55]">
        Fitra only knows public prayer and fasting times. It never prescribes
        worship, never tells you what is or isn’t Islamic. It labels states;
        you assign the activity.
      </p>
    </div>
  )
}

const PRIORITY_LABELS = {
  suhoor: 'Don’t skip suhoor',
  fajr: 'Wake easily for Fajr',
  focus: 'Protect peak focus',
  workout: 'Workout while fasting',
  energy: 'Steady fasting energy',
  sleep: 'Higher-quality sleep',
  caffeine: 'Manage caffeine',
  meal: 'Smarter meal timing'
}

function PrioritiesStrip({ priorities }) {
  if (!priorities || priorities.length === 0) return null
  return (
    <div>
      <div className="text-[10px] uppercase tracking-almanac text-ink/45 mb-2">
        Optimizing for
      </div>
      <div className="flex flex-wrap gap-1.5">
        {priorities.map((id, i) => (
          <span
            key={id}
            className="text-[10.5px] uppercase tracking-almanac px-2.5 py-1 border border-ink/25 text-ink/75 inline-flex items-center gap-1.5"
          >
            <span className="text-solar-deep">{String(i + 1).padStart(2, '0')}</span>
            <span>{PRIORITY_LABELS[id] || id}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function CalendarStatus({ calendar, onToggle }) {
  return (
    <div className="border border-ink/15">
      <div className="px-5 py-3 border-b border-ink/10 flex items-baseline justify-between">
        <div className="text-[10px] uppercase tracking-almanac text-solar-deep">
          CALENDAR SYNC
        </div>
        <span className="text-[10px] uppercase tracking-almanac text-ink/40">
          read-only · times only
        </span>
      </div>
      <ul className="divide-y divide-ink/10">
        <CalendarRow
          provider="Google Calendar"
          connected={calendar.google}
          onToggle={() => onToggle('google')}
        />
        <CalendarRow
          provider="Apple Calendar"
          connected={calendar.apple}
          onToggle={() => onToggle('apple')}
        />
        <CalendarRow provider="Outlook" connected={false} disabled />
      </ul>
    </div>
  )
}

function CalendarRow({ provider, connected, disabled, onToggle }) {
  return (
    <li className="px-5 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            connected ? 'bg-solar' : 'bg-ink/25'
          }`}
        />
        <span className="font-display text-[14px] text-ink">{provider}</span>
        {connected && (
          <span className="text-[9.5px] uppercase tracking-almanac text-solar-deep">
            connected
          </span>
        )}
      </div>
      <button
        onClick={onToggle}
        disabled={disabled}
        className={`text-[10px] uppercase tracking-almanac px-3 py-1 border ${
          disabled
            ? 'border-ink/15 text-ink/30 cursor-not-allowed'
            : connected
            ? 'border-ink/35 text-ink/65 hover:border-ink hover:text-ink'
            : 'border-ink text-ink hover:bg-ink hover:text-paper'
        }`}
      >
        {disabled ? 'Soon' : connected ? 'Disconnect' : 'Connect'}
      </button>
    </li>
  )
}

function fmtDur(h) {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return `${hh}h ${mm}m`
}

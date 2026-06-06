import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CITIES } from '../data/cities.js'
import TimePicker, { formatTime12 } from './TimePicker.jsx'

// 4-step onboarding.
// 1. Place — city + calculation method.
// 2. Rhythm — NASA / MCTQ-style intake. Specific 12-hour times, sleep
//    on free vs. work days, peak alertness, peak strength, caffeine
//    sensitivity, recovery from time-zone shifts, sleep inertia.
// 3. Calendar sync — Google / Apple placeholders (UI only).
// 4. Priorities — multi-select up to 3 + a primary aim.

const STEPS = ['Place', 'Rhythm', 'Calendar', 'Priorities']

// --- Rhythm intake fields ---
const DEFAULT_RHYTHM = {
  freeWake: 8.0,        // 8:00 AM
  freeSleep: 0.5,       // 12:30 AM (next morning)
  workWake: 6.5,        // 6:30 AM
  workSleep: 23.5,      // 11:30 PM
  peakMental: 10.5,     // 10:30 AM
  peakPhysical: 17.5,   // 5:30 PM
  inertia: '10-30',     // sleep inertia (minutes to feel fully awake)
  caffeineSensitivity: 3, // 1-5 (5 = very sensitive)
  spontaneousWake: 'sometimes',
  eastwardRecovery: '4-6', // days
  sleepQuality: 3        // 1-5
}

const INERTIA_OPTIONS = [
  { value: '<10', label: 'Under 10 min', score: -0.4 }, // morning bias
  { value: '10-30', label: '10–30 min', score: 0 },
  { value: '30-60', label: '30–60 min', score: 0.3 },
  { value: '>60', label: 'Over an hour', score: 0.5 }
]

const SPONTANEOUS_OPTIONS = [
  { value: 'rarely', label: 'Rarely', score: 0.3 },
  { value: 'sometimes', label: 'Sometimes', score: 0 },
  { value: 'often', label: 'Often', score: -0.3 },
  { value: 'always', label: 'Always', score: -0.5 }
]

const EASTWARD_OPTIONS = [
  { value: '1', label: '1 day' },
  { value: '2-3', label: '2–3 days' },
  { value: '4-6', label: '4–6 days' },
  { value: '7+', label: 'A week or more' }
]

const PRIORITIES = [
  { id: 'suhoor', label: 'Don’t skip suhoor', desc: 'Land on time without wrecking the next day.' },
  { id: 'fajr', label: 'Wake easily for Fajr', desc: 'Light-sleep alarm aimed before the cutoff.' },
  { id: 'focus', label: 'Protect peak focus', desc: 'Defend the deep-work window from meetings.' },
  { id: 'workout', label: 'Workout performance while fasting', desc: 'Pre-suhoor vs. post-iftar, answered personally.' },
  { id: 'energy', label: 'Steady energy through the fast', desc: 'Flatten the afternoon crash with a strategic nap.' },
  { id: 'sleep', label: 'Higher-quality sleep', desc: 'Anchor bedtime and discharge sleep pressure cleanly.' },
  { id: 'caffeine', label: 'Manage caffeine timing', desc: '6-hour cutoff anchored to your computed bedtime.' },
  { id: 'meal', label: 'Smarter meal timing', desc: 'Iftar load, suhoor composition, hydration windows.' }
]

const GOALS = [
  { id: 'ramadan_first', label: 'First Ramadan-focused day', desc: 'I’m starting Ramadan and want one strong week.' },
  { id: 'long_run', label: 'Year-round chronohealth', desc: 'I want stable rhythm beyond Ramadan.' },
  { id: 'reset', label: 'A reset', desc: 'My rhythm has drifted; I want it back.' }
]

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0)
  const [city, setCity] = useState('san-francisco')
  const [methodIdx, setMethodIdx] = useState(0)
  const [rhythm, setRhythm] = useState(DEFAULT_RHYTHM)
  const [calendar, setCalendar] = useState({ google: false, apple: false })
  const [priorities, setPriorities] = useState(['focus', 'energy', 'fajr'])
  const [goal, setGoal] = useState(GOALS[0].id)

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1))
  const back = () => setStep((s) => Math.max(0, s - 1))

  const updateRhythm = (patch) => setRhythm((r) => ({ ...r, ...patch }))
  const togglePriority = (id) =>
    setPriorities((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : p.length >= 3 ? p : [...p, id]
    )

  const finish = () => {
    onComplete({
      cityId: city,
      methodIdx,
      chronotype: computeChronotype(rhythm),
      rhythm,
      calendar,
      priorities,
      goal
    })
  }

  return (
    <div className="min-h-screen flex items-start justify-center px-8 py-14">
      <div className="w-full max-w-[820px]">
        <StepHeader step={step} onJump={setStep} />

        <AnimatePresence mode="wait">
          {step === 0 && (
            <StepWrap key="place">
              <Eyebrow>STEP 01 — PLACE</Eyebrow>
              <Heading>Where do you keep your day?</Heading>
              <Sub>
                Fitra anchors your plan to the immovable times of your city —
                the five prayers, suhoor cutoff, iftar. Pick a place and the
                calculation method your community uses.
              </Sub>
              <div className="grid grid-cols-1 gap-3 mt-10">
                {Object.values(CITIES).map((c) => (
                  <SelectableRow
                    key={c.id}
                    selected={city === c.id}
                    onClick={() => setCity(c.id)}
                    title={c.name}
                    sub={`${c.region} · ${c.coords}`}
                  />
                ))}
              </div>
              <MethodSelector
                methods={CITIES[city].methods}
                idx={methodIdx}
                onChange={setMethodIdx}
              />
              <Nav onNext={next} canNext canBack={false} />
            </StepWrap>
          )}

          {step === 1 && (
            <StepWrap key="rhythm">
              <Eyebrow>STEP 02 — RHYTHM</Eyebrow>
              <Heading>The clock inside you.</Heading>
              <Sub>
                Adapted from the Munich Chronotype Questionnaire (Roenneberg)
                and the morningness-eveningness work NASA uses for shift and
                crew scheduling. Specific times matter — the midpoint of your
                free-day sleep is the single strongest circadian marker we
                have.
              </Sub>

              <div className="mt-12 space-y-10">
                <RhythmGroup title="Sleep on a free day" subtitle="A day with no alarm and no obligations.">
                  <TimeQ
                    n={1}
                    label="When do you fall asleep?"
                    value={rhythm.freeSleep}
                    onChange={(v) => updateRhythm({ freeSleep: v })}
                    hint="Choose the time you actually drift off, not when you get in bed."
                  />
                  <TimeQ
                    n={2}
                    label="When do you naturally wake up?"
                    value={rhythm.freeWake}
                    onChange={(v) => updateRhythm({ freeWake: v })}
                    hint="No alarm, no pressure."
                  />
                  <MidsleepReadout rhythm={rhythm} />
                </RhythmGroup>

                <RhythmGroup title="Sleep on a workday" subtitle="So we can measure your weekly drift.">
                  <TimeQ
                    n={3}
                    label="Bedtime on a typical workday."
                    value={rhythm.workSleep}
                    onChange={(v) => updateRhythm({ workSleep: v })}
                  />
                  <TimeQ
                    n={4}
                    label="Wake time on a typical workday."
                    value={rhythm.workWake}
                    onChange={(v) => updateRhythm({ workWake: v })}
                  />
                </RhythmGroup>

                <RhythmGroup title="Peak performance" subtitle="The synchrony effect lives here.">
                  <TimeQ
                    n={5}
                    label="Time of day you feel mentally sharpest."
                    value={rhythm.peakMental}
                    onChange={(v) => updateRhythm({ peakMental: v })}
                    hint="When a hard problem feels easiest."
                  />
                  <TimeQ
                    n={6}
                    label="Time of day you feel physically strongest."
                    value={rhythm.peakPhysical}
                    onChange={(v) => updateRhythm({ peakPhysical: v })}
                    hint="Hard exercise feels best at this hour."
                  />
                </RhythmGroup>

                <RhythmGroup title="Calibration" subtitle="Edge cases the model uses to refine the curve.">
                  <ChoiceQ
                    n={7}
                    label="Once you wake, how long until you feel fully alert?"
                    options={INERTIA_OPTIONS}
                    value={rhythm.inertia}
                    onChange={(v) => updateRhythm({ inertia: v })}
                  />
                  <ChoiceQ
                    n={8}
                    label="How often do you wake spontaneously before your alarm?"
                    options={SPONTANEOUS_OPTIONS}
                    value={rhythm.spontaneousWake}
                    onChange={(v) => updateRhythm({ spontaneousWake: v })}
                  />
                  <ChoiceQ
                    n={9}
                    label="After flying 3+ time zones east, how long until you feel normal?"
                    options={EASTWARD_OPTIONS}
                    value={rhythm.eastwardRecovery}
                    onChange={(v) => updateRhythm({ eastwardRecovery: v })}
                  />
                  <ScaleQ
                    n={10}
                    label="Caffeine after 2 pm noticeably worsens my sleep."
                    leftLabel="Strongly disagree"
                    rightLabel="Strongly agree"
                    value={rhythm.caffeineSensitivity}
                    onChange={(v) => updateRhythm({ caffeineSensitivity: v })}
                  />
                  <ScaleQ
                    n={11}
                    label="On most days, my sleep quality is…"
                    leftLabel="Poor"
                    rightLabel="Excellent"
                    value={rhythm.sleepQuality}
                    onChange={(v) => updateRhythm({ sleepQuality: v })}
                  />
                </RhythmGroup>
              </div>

              <Nav onBack={back} onNext={next} canBack canNext />
            </StepWrap>
          )}

          {step === 2 && (
            <StepWrap key="calendar">
              <Eyebrow>STEP 03 — CALENDAR</Eyebrow>
              <Heading>Sync the obligations you’ve already promised.</Heading>
              <Sub>
                Fitra schedules <em>around</em> what already exists. Connect a
                calendar so the optimizer can route focus, nap, and workout
                blocks into your real open windows — not your theoretical ones.
                Skip for now if you’d rather log manually.
              </Sub>

              <div className="mt-10 space-y-3">
                <CalendarCard
                  provider="Google Calendar"
                  desc="Two-way: Fitra reads event times; suggested blocks can be written back as private events tagged Fitra."
                  connected={calendar.google}
                  onToggle={() =>
                    setCalendar((c) => ({ ...c, google: !c.google }))
                  }
                  iconHue="#4285F4"
                />
                <CalendarCard
                  provider="Apple Calendar"
                  desc="Read-only via CalDAV. iCloud account stays on this device."
                  connected={calendar.apple}
                  onToggle={() =>
                    setCalendar((c) => ({ ...c, apple: !c.apple }))
                  }
                  iconHue="#1B1F3B"
                />
                <CalendarCard
                  provider="Outlook · Microsoft 365"
                  desc="Coming soon."
                  connected={false}
                  disabled
                  iconHue="#9AA0B0"
                />
              </div>

              <div className="mt-8 border-l-2 border-solar/60 pl-4 py-1">
                <div className="text-[10px] uppercase tracking-almanac text-solar-deep mb-1">
                  WHAT FITRA READS
                </div>
                <p className="text-[12.5px] text-ink/65 leading-relaxed">
                  Only event <em>start times</em>, <em>end times</em>, and a
                  busy/free flag. Never event titles, attendees, locations, or
                  descriptions. The calendar token stays in the device
                  keychain.
                </p>
              </div>

              <Nav
                onBack={back}
                onNext={next}
                canBack
                canNext
                nextLabel="Continue"
                secondaryLabel="Skip for now"
                onSecondary={next}
              />
            </StepWrap>
          )}

          {step === 3 && (
            <StepWrap key="priorities">
              <Eyebrow>STEP 04 — PRIORITIES</Eyebrow>
              <Heading>What should Fitra optimize first?</Heading>
              <Sub>
                Pick up to three. We weight the optimizer toward what you
                actually care about — the rest still gets computed, just with
                less aggression.
              </Sub>

              <div className="mt-10 grid grid-cols-2 gap-2.5">
                {PRIORITIES.map((p) => {
                  const sel = priorities.includes(p.id)
                  const idx = priorities.indexOf(p.id)
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePriority(p.id)}
                      className={`text-left px-4 py-3.5 border transition-all relative ${
                        sel
                          ? 'border-ink bg-ink/[0.04]'
                          : 'border-ink/15 hover:border-ink/45'
                      }`}
                    >
                      {sel && (
                        <span className="absolute top-2.5 right-3 text-[9px] uppercase tracking-almanac text-solar-deep">
                          #{idx + 1}
                        </span>
                      )}
                      <div className="font-display text-[15px] text-ink leading-tight">
                        {p.label}
                      </div>
                      <div className="text-[11.5px] text-ink/55 mt-1 leading-snug">
                        {p.desc}
                      </div>
                    </button>
                  )
                })}
              </div>
              <div className="mt-2 text-[10px] uppercase tracking-almanac text-ink/40">
                {priorities.length}/3 selected
              </div>

              <div className="mt-12">
                <Eyebrow>PRIMARY AIM</Eyebrow>
                <div className="mt-3 space-y-2.5">
                  {GOALS.map((g) => (
                    <SelectableRow
                      key={g.id}
                      selected={goal === g.id}
                      onClick={() => setGoal(g.id)}
                      title={g.label}
                      sub={g.desc}
                    />
                  ))}
                </div>
              </div>

              <Nav
                onBack={back}
                onNext={finish}
                canBack
                canNext={priorities.length > 0}
                nextLabel="See the plan"
              />
            </StepWrap>
          )}
        </AnimatePresence>

        <div className="mt-16 text-[10px] uppercase tracking-almanac text-ink/30">
          The data stays on this device. Calendar tokens stay in the keychain.
          The optimizer runs locally.
        </div>
      </div>
    </div>
  )
}

// -- chronotype from rhythm intake --
function computeChronotype(r) {
  // Midsleep on free days (MSF) is the gold-standard circadian marker
  // (Roenneberg). It's the midpoint between sleep onset and natural wake.
  // We compute MSF in "hours past midnight," handling the next-day rollover.
  const sleepOnset = r.freeSleep // can be 22 (10pm) or 1.5 (1:30am)
  const wake = r.freeWake
  // Bring onset into the [12, 36) range relative to midnight before wake.
  const onset = sleepOnset >= 18 ? sleepOnset : sleepOnset + 24
  const wakeAbs = wake + 24 // same day as wake-up morning
  const msf = ((onset + wakeAbs) / 2) % 24
  // Center on 04:30 free-day midsleep (population median).
  // Scale so MSF 02:30 → -1 (strong morning), MSF 06:30 → +1 (strong evening).
  let chronotype = (msf - 4.5) / 2

  // Refinement signals
  const peakBias = (r.peakMental - 14) / 10 // < 14 → morning, > 14 → evening
  const inertia = (INERTIA_OPTIONS.find((o) => o.value === r.inertia) || {})
    .score || 0
  const spont = (SPONTANEOUS_OPTIONS.find((o) => o.value === r.spontaneousWake) || {})
    .score || 0
  // Mild caffeine sensitivity correlates with morningness (Drake et al.)
  const caf = (3 - r.caffeineSensitivity) * 0.05

  chronotype = chronotype * 0.65 + peakBias * 0.2 + inertia * 0.1 + spont * 0.1 + caf
  return Math.max(-1, Math.min(1, chronotype))
}

// --- UI building blocks ---

function StepHeader({ step, onJump }) {
  return (
    <div className="flex items-center gap-2 mb-10">
      {STEPS.map((label, i) => (
        <React.Fragment key={label}>
          <button
            type="button"
            disabled={i > step}
            onClick={() => onJump?.(i)}
            className={`text-[10px] uppercase tracking-almanac transition-colors ${
              i === step
                ? 'text-ink'
                : i < step
                ? 'text-ink/55 hover:text-ink'
                : 'text-ink/30 cursor-not-allowed'
            }`}
          >
            {String(i + 1).padStart(2, '0')} · {label}
          </button>
          {i < STEPS.length - 1 && <span className="text-ink/15">·</span>}
        </React.Fragment>
      ))}
    </div>
  )
}

function StepWrap({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: [0.32, 0.72, 0.24, 1] }}
    >
      {children}
    </motion.div>
  )
}

function Eyebrow({ children }) {
  return (
    <div className="text-[10px] uppercase tracking-almanac text-solar-deep mb-4">
      {children}
    </div>
  )
}
function Heading({ children }) {
  return (
    <h1 className="font-display text-[44px] leading-[1.05] tracking-tight text-ink">
      {children}
    </h1>
  )
}
function Sub({ children }) {
  return (
    <p className="mt-4 text-[14px] text-ink/65 leading-[1.6] max-w-[640px]">
      {children}
    </p>
  )
}

function SelectableRow({ selected, onClick, title, sub, meta }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left flex items-center justify-between px-5 py-4 border transition-all ${
        selected
          ? 'border-ink bg-ink/[0.04]'
          : 'border-ink/15 hover:border-ink/45'
      }`}
    >
      <div>
        <div className="font-display text-[18px] text-ink leading-tight">
          {title}
        </div>
        {sub && <div className="text-[12px] text-ink/55 mt-0.5">{sub}</div>}
      </div>
      {meta && (
        <div className="text-[10px] uppercase tracking-almanac text-ink/40">
          {meta}
        </div>
      )}
    </button>
  )
}

function MethodSelector({ methods, idx, onChange }) {
  return (
    <div className="mt-8">
      <div className="text-[10px] uppercase tracking-almanac text-ink/45 mb-3">
        CALCULATION METHOD
      </div>
      <div className="flex gap-1.5">
        {methods.map((m, i) => (
          <button
            key={m}
            type="button"
            onClick={() => onChange(i)}
            className={`text-[11px] uppercase tracking-almanac px-3 py-2 border ${
              i === idx
                ? 'border-ink bg-ink text-paper'
                : 'border-ink/20 text-ink/65 hover:border-ink/55'
            }`}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  )
}

// --- Rhythm intake atoms ---

function RhythmGroup({ title, subtitle, children }) {
  return (
    <div>
      <div className="flex items-baseline justify-between border-b border-ink/10 pb-3 mb-6">
        <div>
          <div className="font-display text-[20px] text-ink tracking-tight">
            {title}
          </div>
          {subtitle && (
            <div className="text-[12px] text-ink/55 mt-1 italic font-display">
              {subtitle}
            </div>
          )}
        </div>
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  )
}

function TimeQ({ n, label, value, onChange, hint }) {
  return (
    <div className="grid grid-cols-[36px_1fr_auto] items-center gap-x-6 gap-y-1">
      <div className="text-[10px] uppercase tracking-almanac text-ink/35 self-center">
        Q{String(n).padStart(2, '0')}
      </div>
      <div className="self-center">
        <div className="font-display text-[16px] text-ink leading-snug">
          {label}
        </div>
        {hint && (
          <div className="text-[11.5px] text-ink/50 mt-0.5 italic font-display">
            {hint}
          </div>
        )}
      </div>
      <div className="self-center">
        <TimePicker value={normalizeTime(value)} onChange={onChange} />
      </div>
    </div>
  )
}

function normalizeTime(v) {
  let t = v
  while (t >= 24) t -= 24
  while (t < 0) t += 24
  return t
}

function ChoiceQ({ n, label, options, value, onChange }) {
  return (
    <div className="grid grid-cols-[36px_1fr] items-baseline gap-x-6 gap-y-3">
      <div className="text-[10px] uppercase tracking-almanac text-ink/35 pt-2">
        Q{String(n).padStart(2, '0')}
      </div>
      <div>
        <div className="font-display text-[16px] text-ink leading-snug mb-3">
          {label}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              className={`text-[11.5px] px-3 py-1.5 border transition-all ${
                value === o.value
                  ? 'border-ink bg-ink text-paper'
                  : 'border-ink/20 text-ink/70 hover:border-ink/45'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function ScaleQ({ n, label, leftLabel, rightLabel, value, onChange }) {
  return (
    <div className="grid grid-cols-[36px_1fr] items-baseline gap-x-6 gap-y-3">
      <div className="text-[10px] uppercase tracking-almanac text-ink/35 pt-2">
        Q{String(n).padStart(2, '0')}
      </div>
      <div>
        <div className="font-display text-[16px] text-ink leading-snug mb-3">
          {label}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-almanac text-ink/45 w-32">
            {leftLabel}
          </span>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => onChange(v)}
                className={`w-8 h-8 text-[12px] font-display border transition-all ${
                  value === v
                    ? 'border-ink bg-ink text-paper'
                    : 'border-ink/20 text-ink/65 hover:border-ink/45'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <span className="text-[10px] uppercase tracking-almanac text-ink/45 w-32 text-right">
            {rightLabel}
          </span>
        </div>
      </div>
    </div>
  )
}

function MidsleepReadout({ rhythm }) {
  const onset = rhythm.freeSleep >= 18 ? rhythm.freeSleep : rhythm.freeSleep + 24
  const wakeAbs = rhythm.freeWake + 24
  const msf = ((onset + wakeAbs) / 2) % 24
  return (
    <div className="ml-[60px] mt-2 px-4 py-3 bg-paper-deep/40 border-l-2 border-solar/50">
      <div className="text-[10px] uppercase tracking-almanac text-solar-deep">
        FREE-DAY MIDSLEEP
      </div>
      <div className="flex items-baseline gap-3 mt-1">
        <span className="font-display text-[22px] text-ink tabular-nums">
          {formatTime12(msf)}
        </span>
        <span className="text-[11.5px] text-ink/55 italic font-display">
          your strongest circadian marker
        </span>
      </div>
    </div>
  )
}

// --- Calendar cards ---

function CalendarCard({ provider, desc, connected, onToggle, disabled, iconHue }) {
  return (
    <div
      className={`w-full flex items-center justify-between px-5 py-4 border transition-all ${
        connected
          ? 'border-ink bg-ink/[0.04]'
          : disabled
          ? 'border-ink/10 opacity-50'
          : 'border-ink/15 hover:border-ink/45'
      }`}
    >
      <div className="flex items-center gap-4 min-w-0">
        <CalendarGlyph hue={iconHue} />
        <div className="min-w-0">
          <div className="font-display text-[17px] text-ink leading-tight flex items-center gap-2">
            {provider}
            {connected && (
              <span className="text-[9px] uppercase tracking-almanac text-solar-deep">
                · connected
              </span>
            )}
          </div>
          <div className="text-[12px] text-ink/55 mt-0.5 leading-snug">
            {desc}
          </div>
        </div>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={onToggle}
        className={`text-[11px] uppercase tracking-almanac px-4 py-2 border shrink-0 ml-4 ${
          disabled
            ? 'border-ink/15 text-ink/30 cursor-not-allowed'
            : connected
            ? 'border-ink/40 text-ink/70 hover:border-ink hover:text-ink'
            : 'border-ink bg-ink text-paper hover:bg-ink-soft'
        }`}
      >
        {disabled ? 'Soon' : connected ? 'Disconnect' : 'Connect'}
      </button>
    </div>
  )
}

function CalendarGlyph({ hue }) {
  return (
    <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
      <rect x="3" y="6" width="32" height="28" rx="2" stroke={hue} strokeWidth="1" />
      <line x1="3" y1="13" x2="35" y2="13" stroke={hue} strokeWidth="1" />
      <line x1="11" y1="3" x2="11" y2="9" stroke={hue} strokeWidth="1.2" />
      <line x1="27" y1="3" x2="27" y2="9" stroke={hue} strokeWidth="1.2" />
      <circle cx="11" cy="20" r="1.4" fill={hue} />
      <circle cx="19" cy="20" r="1.4" fill={hue} opacity="0.5" />
      <circle cx="27" cy="20" r="1.4" fill={hue} opacity="0.3" />
      <circle cx="11" cy="27" r="1.4" fill={hue} opacity="0.3" />
      <circle cx="19" cy="27" r="1.4" fill={hue} />
      <circle cx="27" cy="27" r="1.4" fill={hue} opacity="0.5" />
    </svg>
  )
}

function Nav({
  onBack,
  onNext,
  canBack,
  canNext,
  nextLabel = 'Continue',
  secondaryLabel,
  onSecondary
}) {
  return (
    <div className="flex items-center justify-between mt-12 pt-6 border-t border-ink/10">
      <button
        type="button"
        onClick={onBack}
        disabled={!canBack}
        className={`text-[12px] uppercase tracking-almanac ${
          canBack ? 'text-ink/65 hover:text-ink' : 'text-ink/20'
        }`}
      >
        ← Back
      </button>
      <div className="flex items-center gap-5">
        {secondaryLabel && (
          <button
            type="button"
            onClick={onSecondary}
            className="text-[11px] uppercase tracking-almanac text-ink/55 hover:text-ink"
          >
            {secondaryLabel}
          </button>
        )}
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          className={`px-6 py-3 text-[12px] uppercase tracking-almanac border transition-all ${
            canNext
              ? 'border-ink bg-ink text-paper hover:bg-ink-soft'
              : 'border-ink/15 text-ink/30'
          }`}
        >
          {nextLabel} →
        </button>
      </div>
    </div>
  )
}

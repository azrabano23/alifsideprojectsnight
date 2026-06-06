import React, { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DayRibbon from './DayRibbon.jsx'
import GirihPattern from './GirihPattern.jsx'
import { CITIES, formatHour } from '../data/cities.js'
import { buildPlan } from '../lib/optimizer.js'
import { CATEGORIES, SEED_ACTIVITIES } from '../lib/categories.js'
import { bestSlotFor } from '../lib/activityOptimizer.js'

// Seven slides for a stage walk-through. Arrow keys / on-screen next.
const SLIDE_COUNT = 7

export default function PresentMode({ cityId, chronotype, goal, onExit }) {
  const [slide, setSlide] = useState(0)
  const [hoursSlept, setHoursSlept] = useState(7.5)
  const [ramadan, setRamadan] = useState(false)
  const [activities, setActivities] = useState(SEED_ACTIVITIES)
  const [highlightActivityId, setHighlightActivityId] = useState(null)

  const city = CITIES[cityId] || CITIES['san-francisco']

  useEffect(() => {
    // Ramadan auto-toggles on the Ramadan slide.
    if (slide === 4) setRamadan(true)
    if (slide === 0) setRamadan(false)
    // Reset the re-time demo activities when slide 5 enters.
    if (slide === 5) setActivities(SEED_ACTIVITIES)
  }, [slide])

  const plan = useMemo(
    () => buildPlan({ city, chronotype, hoursSlept, goal, ramadan }),
    [city, chronotype, hoursSlept, goal, ramadan]
  )

  // Apply the deep-focus re-time demo on slide 5.
  const applyDeepFocusMove = () => {
    const deepAct = activities.find((a) => a.category === 'deep')
    if (!deepAct) return
    const slot = bestSlotFor(deepAct, plan, city)
    if (!slot) return
    setActivities((list) =>
      list.map((a) =>
        a.id === deepAct.id ? { ...a, hour: slot.hour, movedTo: slot.hour } : a
      )
    )
    setHighlightActivityId(deepAct.id)
    setTimeout(() => setHighlightActivityId(null), 2200)
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') setSlide((s) => Math.min(SLIDE_COUNT - 1, s + 1))
      else if (e.key === 'ArrowLeft') setSlide((s) => Math.max(0, s - 1))
      else if (e.key === 'Escape') onExit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onExit])

  return (
    <div className="fixed inset-0 z-40 bg-paper overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <GirihPattern opacity={0.04} />
      </div>

      <div className="absolute top-6 left-8 flex items-center gap-3 z-10">
        <Mark />
        <div className="font-display text-[18px] text-ink">Fitra</div>
        <span className="text-[10px] uppercase tracking-almanac text-ink/40 ml-2">
          PRESENT MODE
        </span>
      </div>
      <div className="absolute top-6 right-8 flex items-center gap-4 z-10">
        <div className="text-[10px] uppercase tracking-almanac text-ink/40">
          {String(slide + 1).padStart(2, '0')} / {String(SLIDE_COUNT).padStart(2, '0')}
        </div>
        <button
          onClick={onExit}
          className="text-[11px] uppercase tracking-almanac text-ink/55 hover:text-ink"
        >
          Exit ✕
        </button>
      </div>

      <div className="absolute bottom-6 right-8 flex items-center gap-3 z-10">
        <button
          onClick={() => setSlide((s) => Math.max(0, s - 1))}
          className="px-3 py-1.5 border border-ink/25 text-[11px] uppercase tracking-almanac text-ink/65 hover:border-ink hover:text-ink"
        >
          ← Prev
        </button>
        <button
          onClick={() => setSlide((s) => Math.min(SLIDE_COUNT - 1, s + 1))}
          className="px-4 py-1.5 border border-ink bg-ink text-paper text-[11px] uppercase tracking-almanac hover:bg-ink-soft"
        >
          Next →
        </button>
      </div>

      <AnimatePresence mode="wait">
        {slide === 0 && (
          <Slide key="s0">
            <SlideTitle eyebrow="Fitra · A circadian almanac">
              The Ramadan productivity slump isn’t a cost of fasting. It’s a
              scheduling problem.
            </SlideTitle>
            <SlideBody>
              The five prayers, suhoor cutoff, and iftar are fixed. The rest of
              the day — sleep, the nap, the focus window, caffeine, the wake
              alarm — can be tuned around them. Fitra is the tuning.
            </SlideBody>
          </Slide>
        )}

        {slide === 1 && (
          <Slide key="s1" wide>
            <SlideEyebrow>THE DAY VIEW · {city.name.toUpperCase()}</SlideEyebrow>
            <div className="grid grid-cols-12 gap-12 items-start mt-4">
              <div className="col-span-5">
                <h2 className="font-display text-[42px] leading-[1.05] text-ink tracking-tight">
                  Immovable anchors. Movable rest.
                </h2>
                <p className="mt-6 text-[14.5px] text-ink/70 leading-[1.65]">
                  Five prayers are engraved into the day as pillars. The energy
                  curve flows through them. Blocks for sleep, nap, caffeine,
                  and focus settle in the gaps.
                </p>
                <ul className="mt-6 text-[12.5px] text-ink/55 space-y-2">
                  <li>Prayer times treated as constraints, never reminders.</li>
                  <li>Energy curve sampled at 10-minute resolution.</li>
                  <li>One block per intent. No clutter.</li>
                </ul>
              </div>
              <div className="col-span-7 flex justify-center -ml-8">
                <div style={{ transform: 'scale(0.82)', transformOrigin: 'top center' }}>
                  <DayRibbon plan={plan} city={city} ramadan={ramadan} />
                </div>
              </div>
            </div>
          </Slide>
        )}

        {slide === 2 && (
          <Slide key="s2" wide>
            <SlideEyebrow>THE LIVE RECOMPUTE</SlideEyebrow>
            <div className="grid grid-cols-12 gap-12 items-start mt-4">
              <div className="col-span-5">
                <h2 className="font-display text-[42px] leading-[1.05] text-ink tracking-tight">
                  Drag last night’s sleep. Watch the plan rewrite itself.
                </h2>
                <p className="mt-6 text-[14.5px] text-ink/70 leading-[1.65]">
                  Less sleep raises homeostatic pressure. The nap grows and
                  moves earlier. Wind-down slides forward. Caffeine cutoff
                  shifts. The focus window flattens and narrows.
                </p>
                <div className="mt-10 w-full max-w-[320px]">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-[10.5px] uppercase tracking-almanac text-ink/70">
                      Last night
                    </span>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={hoursSlept}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        className="font-display text-[34px] text-ink leading-none tabular-nums"
                      >
                        {hoursSlept.toFixed(2)}h
                      </motion.span>
                    </AnimatePresence>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="9"
                    step="0.25"
                    value={hoursSlept}
                    onChange={(e) => setHoursSlept(parseFloat(e.target.value))}
                    className="fitra-slider"
                  />
                  <div className="flex justify-between mt-1 text-[10px] uppercase tracking-almanac text-ink/40">
                    <span>3h</span>
                    <span>6h</span>
                    <span>9h</span>
                  </div>
                </div>
              </div>
              <div className="col-span-7 flex justify-center -ml-8">
                <div style={{ transform: 'scale(0.78)', transformOrigin: 'top center' }}>
                  <DayRibbon plan={plan} city={city} ramadan={ramadan} />
                </div>
              </div>
            </div>
          </Slide>
        )}

        {slide === 3 && (
          <Slide key="s3">
            <SlideEyebrow>THE SCIENCE</SlideEyebrow>
            <h2 className="font-display text-[44px] leading-[1.05] text-ink tracking-tight max-w-[820px]">
              Three citations the recommendations are built on.
            </h2>
            <div className="grid grid-cols-3 gap-8 mt-12">
              <Cite
                eyebrow="STRATEGIC NAP"
                claim="A 26-minute nap improved alertness 54% and performance 34% in pilots."
                source="Rosekind et al., NASA Ames"
              />
              <Cite
                eyebrow="CAFFEINE CUTOFF"
                claim="400 mg caffeine, 6h before bed, cut total sleep by >1 hour — undetected by the sleeper."
                source="Drake et al., J. Clinical Sleep Medicine, 2013"
              />
              <Cite
                eyebrow="PEAK FOCUS"
                claim="Cognitive performance peaks when timed to your chronotype — the synchrony effect."
                source="May, Hasher & Healey"
              />
            </div>
            <p className="mt-12 text-[13px] text-ink/55 max-w-[760px] leading-relaxed">
              Fitra suggests states, not content. The peak focus window is a
              defended block — what you put inside it is yours.
            </p>
          </Slide>
        )}

        {slide === 4 && (
          <Slide key="s4" wide>
            <SlideEyebrow>RAMADAN MODE</SlideEyebrow>
            <div className="grid grid-cols-12 gap-12 items-start mt-4">
              <div className="col-span-5">
                <h2 className="font-display text-[42px] leading-[1.05] text-ink tracking-tight">
                  Suhoor and iftar enter the plan as pillars.
                </h2>
                <p className="mt-6 text-[14.5px] text-ink/70 leading-[1.65]">
                  The wake alarm is aimed inside a light-sleep window before
                  the suhoor cutoff. Main sleep retreats; a midday nap is
                  added. The plan never tells you what to do during a fixed
                  pillar — only how to use the gaps between them.
                </p>
                <div className="mt-8 grid grid-cols-2 gap-4">
                  <Stat label="Bedtime" value={formatHour(plan.bedtime)} />
                  <Stat label="Wake" value={formatHour(plan.wakeTime)} />
                  <Stat label="Nap length" value={`${plan.blocks.find((b) => b.kind === 'nap').meta.minutes} min`} />
                  <Stat label="Focus block" value={`${formatHour(plan.focusWindow.start)} → ${formatHour(plan.focusWindow.end)}`} />
                </div>
              </div>
              <div className="col-span-7 flex justify-center -ml-8">
                <div style={{ transform: 'scale(0.78)', transformOrigin: 'top center' }}>
                  <DayRibbon plan={plan} city={city} ramadan={ramadan} />
                </div>
              </div>
            </div>
          </Slide>
        )}

        {slide === 5 && (
          <Slide key="s5" wide>
            <SlideEyebrow>THE RE-TIME MOMENT — SEVEN CATEGORIES</SlideEyebrow>
            <div className="grid grid-cols-12 gap-12 items-start mt-2">
              <div className="col-span-5">
                <h2 className="font-display text-[42px] leading-[1.04] text-ink tracking-tight">
                  You log <em className="italic">deep focus</em> at 3 pm.
                  <br />
                  But that’s your biological dip.
                </h2>
                <p className="mt-6 text-[14.5px] text-ink/70 leading-[1.65]">
                  Activities arrive in seven categories — deep focus, light
                  focus, calm, devotional, physical, social, recovery — each
                  with its own ideal state. Fitra reads the curve and suggests
                  the move.
                </p>
                <CategoryGrid />
                <div className="mt-6 flex items-center gap-3">
                  <button
                    onClick={applyDeepFocusMove}
                    className="px-5 py-2.5 border border-ink bg-ink text-paper text-[11px] uppercase tracking-almanac hover:bg-ink-soft"
                  >
                    Apply the suggested move
                  </button>
                  <span className="text-[11px] uppercase tracking-almanac text-ink/45">
                    watch the glyph slide
                  </span>
                </div>
              </div>
              <div className="col-span-7 flex justify-center -ml-8">
                <div style={{ transform: 'scale(0.78)', transformOrigin: 'top center' }}>
                  <DayRibbon
                    plan={plan}
                    city={city}
                    ramadan={ramadan}
                    activities={activities}
                    highlightActivityId={highlightActivityId}
                  />
                </div>
              </div>
            </div>
          </Slide>
        )}

        {slide === 6 && (
          <Slide key="s6" wide>
            <SlideEyebrow>THE PLATFORM — ONE CIRCADIAN ENGINE, TWO MARKETS</SlideEyebrow>
            <h2 className="font-display text-[44px] leading-[1.05] text-ink tracking-tight max-w-[920px]">
              We already run the first. Fitra is the second.
            </h2>
            <div className="grid grid-cols-12 gap-10 mt-12">
              <PlatformColumn
                eyebrow="LEVEL 02 — HARDWARE"
                title="Chronotherapy band, already shipped."
                copy="A circadian wearable deployed across 25+ hospitals and clinics in Africa. Times diabetes medication. Offline-capable — no wifi, no phone. The clinical vertical."
                stats={[
                  ['Deployments', '25+'],
                  ['Continent', 'Africa'],
                  ['Indication', 'Type-2 diabetes'],
                  ['Connectivity', 'Offline-capable']
                ]}
              />
              <Intersection />
              <PlatformColumn
                eyebrow="LEVEL 01 — SOFTWARE"
                title="Fitra, the consumer wedge."
                copy="A circadian almanac for Muslims. Self-logging, optional Apple Watch, no Islamic prescription. The fiqh firewall. Ramadan as the acquisition moment."
                stats={[
                  ['TAM', '~2B Muslims'],
                  ['Adjacency', '~500M diabetics'],
                  ['Wedge', 'Ramadan B2C'],
                  ['Trust posture', 'On-device']
                ]}
              />
            </div>
            <p className="mt-10 text-[13.5px] text-ink/60 max-w-[920px] leading-relaxed italic font-display">
              Every competitor — Muslim Pro, Rise, Whoop — is software-only. The
              combination of hardware data layer, offline capability, existing
              manufacturing, and live clinical distribution is not replicable by
              an app team.
            </p>
          </Slide>
        )}
      </AnimatePresence>

      {/* Progress dots */}
      <div className="absolute bottom-8 left-8 flex gap-1.5">
        {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
          <button
            key={i}
            onClick={() => setSlide(i)}
            className={`w-6 h-[2px] transition-all ${
              i === slide ? 'bg-ink' : 'bg-ink/20'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

function Slide({ children, wide }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.45, ease: [0.32, 0.72, 0.24, 1] }}
      className={`absolute inset-0 flex flex-col justify-center ${
        wide ? 'px-16' : 'px-24'
      }`}
    >
      <div className={wide ? 'w-full max-w-[1240px] mx-auto' : 'max-w-[920px] mx-auto'}>
        {children}
      </div>
    </motion.div>
  )
}

function SlideEyebrow({ children }) {
  return (
    <div className="text-[10px] uppercase tracking-almanac text-solar-deep mb-6">
      {children}
    </div>
  )
}

function SlideTitle({ children, eyebrow }) {
  return (
    <div>
      {eyebrow && <SlideEyebrow>{eyebrow}</SlideEyebrow>}
      <h1 className="font-display text-[72px] leading-[1.02] tracking-tight text-ink max-w-[940px]">
        {children}
      </h1>
    </div>
  )
}

function SlideBody({ children }) {
  return (
    <p className="mt-10 text-[18px] text-ink/65 leading-[1.55] max-w-[720px]">
      {children}
    </p>
  )
}

function Cite({ eyebrow, claim, source }) {
  return (
    <div className="border-t border-ink/20 pt-5">
      <div className="text-[10px] uppercase tracking-almanac text-solar-deep mb-3">
        {eyebrow}
      </div>
      <div className="font-display text-[20px] leading-[1.25] text-ink mb-4">
        {claim}
      </div>
      <div className="font-display italic text-[12.5px] text-ink/60">
        {source}
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="border border-ink/15 p-4">
      <div className="text-[10px] uppercase tracking-almanac text-ink/45">
        {label}
      </div>
      <div className="font-display text-[20px] text-ink mt-1">{value}</div>
    </div>
  )
}

function Mark() {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
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

function CategoryGrid() {
  return (
    <div className="mt-7 grid grid-cols-2 gap-x-6 gap-y-2.5">
      {Object.values(CATEGORIES).map((c) => (
        <div key={c.id} className="flex items-center gap-2.5 text-[11.5px]">
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: c.color }}
          />
          <span className="text-ink/85 font-display">{c.label}</span>
        </div>
      ))}
    </div>
  )
}

function PlatformColumn({ eyebrow, title, copy, stats }) {
  return (
    <div className="col-span-4">
      <div className="text-[10px] uppercase tracking-almanac text-solar-deep mb-4">
        {eyebrow}
      </div>
      <h3 className="font-display text-[26px] leading-[1.15] text-ink mb-4">
        {title}
      </h3>
      <p className="text-[13.5px] text-ink/70 leading-[1.6] mb-6">{copy}</p>
      <div className="grid grid-cols-2 gap-3">
        {stats.map(([k, v]) => (
          <div key={k} className="border border-ink/15 px-3 py-2">
            <div className="text-[9.5px] uppercase tracking-almanac text-ink/45">
              {k}
            </div>
            <div className="font-display text-[15px] text-ink mt-0.5">{v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Intersection() {
  return (
    <div className="col-span-4 flex flex-col items-center justify-start pt-6">
      <svg
        width="220"
        height="220"
        viewBox="0 0 220 220"
        className="opacity-90"
      >
        <defs>
          <pattern
            id="dotty"
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="0.7" fill="#1B1F3B" />
          </pattern>
        </defs>
        <circle
          cx="80"
          cy="110"
          r="68"
          fill="#1B1F3B"
          fillOpacity="0.08"
          stroke="#1B1F3B"
          strokeWidth="0.7"
          strokeOpacity="0.5"
        />
        <circle
          cx="140"
          cy="110"
          r="68"
          fill="#C8923D"
          fillOpacity="0.10"
          stroke="#A8762A"
          strokeWidth="0.7"
          strokeOpacity="0.6"
        />
        <text
          x="40"
          y="40"
          fontFamily="Inter"
          fontSize="9"
          letterSpacing="0.22em"
          fill="#1B1F3B"
          opacity="0.7"
        >
          DIABETES
        </text>
        <text
          x="142"
          y="40"
          fontFamily="Inter"
          fontSize="9"
          letterSpacing="0.22em"
          fill="#A8762A"
        >
          RAMADAN
        </text>
        <text
          x="110"
          y="116"
          textAnchor="middle"
          fontFamily="Fraunces"
          fontSize="14"
          fontStyle="italic"
          fill="#1B1F3B"
        >
          the diabetic
        </text>
        <text
          x="110"
          y="134"
          textAnchor="middle"
          fontFamily="Fraunces"
          fontSize="14"
          fontStyle="italic"
          fill="#1B1F3B"
        >
          Muslim fasting
        </text>
      </svg>
      <div className="text-center max-w-[260px] mt-4">
        <div className="text-[10px] uppercase tracking-almanac text-solar-deep mb-2">
          THE KILLER INTERSECTION
        </div>
        <p className="text-[12.5px] text-ink/70 leading-[1.55] font-display italic">
          Hypoglycemia risk, medication-timing chaos during the fast.
          The MENA region has among the world’s highest diabetes rates.
          Both assets fire at once.
        </p>
      </div>
    </div>
  )
}

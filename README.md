# Fitra

**A circadian scheduling engine for Muslims — it optimizes sleep, naps, caffeine, training, and peak-focus work around the five daily prayers and the Ramadan fasting window.**

Fitra doesn't tell you what to pray. The only religious facts it knows are the times of the five prayers, the suhoor cutoff, and iftar — which are public solar astronomy. It treats those as **fixed walls** in the day and uses a two-process model of human sleep to place everything else where your biology actually wants it.

Built for **Alif Side Project Night**. This repo is the working prototype.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Stack](https://img.shields.io/badge/stack-Vite%20%C2%B7%20React%20%C2%B7%20Tailwind-blue)

---

## The problem

Two real, evidenced problems sit on top of each other.

**1. Ramadan systematically degrades sleep and daytime function — and the cause is *scheduling*, not the fast.**
Polysomnography studies of fasting Muslims show that during Ramadan nocturnal **total sleep time shortens by ~40 minutes**, sleep latency rises, and **slow-wave and REM sleep decrease**, with measurably **increased daytime sleepiness** as the month progresses (Roky et al., *Journal of Sleep Research*, 2001/2003).¹ Crucially, the most careful review of the literature concludes that well-controlled studies find **no intrinsic disruption of sleep architecture or circadian rhythm from the fast itself** — the damage comes from the *shift in eating, sleeping, and activity timing* around it (Qasrawi, Pandi-Perumal & BaHammam, *Sleep & Breathing*, 2017).² In other words: this is a **scheduling problem**, which is exactly the kind of problem software can solve.

**2. Circadian misalignment carries a real cognitive and metabolic cost.**
"Social jetlag" — the gap between your body clock and your imposed schedule — accumulates sleep debt and is associated with worse mood, metabolic, and performance outcomes, especially for late chronotypes (Wittmann, Merrow & Roenneberg, *Chronobiology International*, 2006).³ People differ: chronotype is a measurable trait, and scheduling demanding work against your own clock — not a generic "wake at 6am" template — is what the chronobiology literature actually supports.

**Who has this problem.** Pew Research projects the global Muslim population at **~1.6 billion in 2010 rising to ~2.8 billion (≈30% of the world) by 2050**, growing roughly twice as fast as the overall population.⁴ The incumbent apps that serve this group (Muslim Pro alone has **100M+ downloads**)⁵ do prayer times, Qibla, and Quran — **none of them touch sleep, energy, or circadian scheduling.** That gap is the opening.

---

## The solution

Fitra asks eleven questions, derives your chronotype, then builds a single day plan that respects the prayer times as immovable anchors and places everything else at the biologically right moment:

- **Bedtime** worked backward from when you need to wake.
- **Caffeine cutoff** six hours before bed (the evidence-based threshold).⁶
- **A nap** at your real post-midday alertness dip, lengthened automatically if you slept badly.
- **Your hardest focus block** at the day's predicted alertness peak — routed around prayers and your nap.
- In **Ramadan mode**, a suhoor window before Fajr and a wind-down that accounts for the shifted schedule.

Move the "last night I slept ___ hours" slider and the entire plan re-runs live — less sleep produces a longer, earlier nap, an earlier wind-down, and a flatter focus window. Every recommendation opens a **science card with a real citation** — no AI hand-waving.

---

## Features

- **11-question chronotype intake** based on the Munich ChronoType Questionnaire (MCTQ), the validated standard from Roenneberg's lab.⁷
- **A personalized 24-hour alertness curve** from a two-process sleep model, rendered as a living ribbon.
- **Prayer-aware block placement** — sleep, wind-down, nap, deep-focus, caffeine cutoff, suhoor — that never collides with a prayer.
- **Activity re-timing**: log what you're doing and Fitra flags work scheduled against your biology (e.g. deep focus parked in your afternoon dip) and proposes a better slot.
- **Live re-computation** on a sleep-debt slider.
- **Three cities** (San Francisco, London, Dubai) with their correct prayer-calculation conventions.
- **Present mode**: a built-in 7-slide deck for demoing the science and the product.

---

## Technical design — how it's built

This is the core of the project: the scheduling is driven by an actual implementation of established sleep science, not heuristics dressed up as one.

### 1. Two-process sleep model (`src/lib/circadian.js`)

Fitra implements a Borbély-style **two-process model**: alertness is the interaction of a circadian oscillation (**Process C**) and homeostatic sleep pressure (**Process S**).⁸

**Process C** is a 24-hour cosine whose peak (acrophase) is shifted by your chronotype:

```js
acrophase(chronotype) = 15 + chronotype * 2      // hours (13:00 morning → 17:00 evening)
C(t) = cos(2π · (t − acrophase) / 24)
```

**Process S** builds while awake and discharges during sleep as opposing exponentials, so last night's sleep debt cascades into today's alertness:

```js
τ_wake  = 18.2 h     τ_sleep = 4.2 h
S_awake(t)  = S_upper − (S_upper − s₀) · exp(−t / τ_wake)
S_asleep(t) = S_lower + (s_bed − S_lower) · exp(−t / τ_sleep)
```

**Alertness** combines them (pressure suppresses, circadian lifts), sampled at ~10-minute resolution (145 points/day) for a smooth curve and for peak/dip finding:

```js
A(t) = −S(t) + 0.5 · C(t) + 1.0
```

`findPeakWindow()` locates the longest sustained high-alertness window that avoids prayer times; `findDip()` finds the post-midday trough for the nap.

### 2. Chronotype derivation (`src/components/Onboarding.jsx`)

The 11-question intake is scored into a chronotype in **[−1, +1]**. The primary signal is **midsleep on a free day (MSF)** — the gold-standard MCTQ marker — refined by weighted secondary signals:

```js
χ = (MSF − 4.5) / 2                              // MSF centered on the 4:30am population median
χ_final = 0.65·χ + 0.20·peakMental + 0.10·inertia + 0.10·spontaneousWake + 0.05·caffeine
```

So the clock comes mostly from *when you actually sleep when free*, nudged by self-reported sharpness, sleep inertia, spontaneous waking, and caffeine sensitivity — all known morningness/eveningness correlates.

### 3. Block-placement optimizer (`src/lib/optimizer.js`)

`buildPlan({ city, chronotype, hoursSlept, goal, ramadan })` assembles the day:

- **Bedtime** = wake − 7.75h target sleep; **wind-down** 45 min before bed.
- **Caffeine cutoff** = bedtime − 6h, the threshold at which a fixed caffeine dose still measurably cuts total sleep time.⁶
- **Nap** centered on the alertness dip, with length and earliness scaling to sleep deficit (`deficit = max(0, 8 − hoursSlept)`), then slid clear of Dhuhr/Asr if it overlaps.
- **Focus block** = longest sustained alertness peak, with prayers *and* the nap subtracted from the candidate windows; shortened under heavy sleep debt.
- **Ramadan mode** anchors wake just before the suhoor cutoff and inserts a 30-minute suhoor window before Fajr.

### 4. Activity re-timer (`src/lib/activityOptimizer.js`, `categories.js`)

Activities fall into seven categories, each mapped to a circadian target — deep focus → alertness peak, calm/restorative → pre-bed parasympathetic window, physical → late-afternoon body-temperature peak (post-iftar in Ramadan), devotional → fixed/never moved. `bestSlotFor()` computes the ideal time, avoids collisions, and only surfaces a suggestion when the activity is **≥45 minutes** off — so the demo's "move your 3pm deep-reading to your 10am peak" falls out of the model, not a hardcode.

### 5. Stack

Vite 5 · React 18 · Tailwind 3 · Framer Motion 11. The alertness ribbon, prayer pillars, and the background **girih pattern** are hand-built SVG. Fonts: Fraunces (display) + Inter.

### What's real vs. mocked

| Real (the engine) | Mocked (demo scaffolding) |
|---|---|
| Two-process circadian model & alertness curve | Prayer times hardcoded per city (no live API) |
| Chronotype derivation from MCTQ intake | Calendar sync is UI-only (no OAuth) |
| Block-placement optimizer + prayer avoidance | Header date is a static string |
| Activity re-timing logic & collision handling | Goals/priorities not persisted to a backend |
| Time-picker and 12/24h rollover math | |

---

## Why it matters

Prayer already imposes a five-point daily rhythm on ~1.8 billion people — a structure chronobiology would *recommend building a schedule around*. Fitra is the first tool to treat those anchors as the scaffolding for evidence-based sleep, recovery, and focus, instead of just reminding you they exist. For the most disrupted month of the year (Ramadan), where the harm is demonstrably about timing, that's a concrete, testable intervention.

---

## Competitors & positioning

| Product | What it does | The gap Fitra fills |
|---|---|---|
| **RISE Science** ($15.5M raised) | Same scientific core — sleep debt + circadian rhythm — but religiously/culturally agnostic.⁹ | No prayer-time or Ramadan awareness. |
| **Timeshifter** (NASA-derived, 1.6M+ users) | Circadian scheduling for jet lag & shift work.¹⁰ | Travel-focused, not daily life around prayer. |
| **Sleep Cycle** (~75M downloads, public co.) | Sleep *tracking* and smart alarm.¹¹ | Measures sleep; doesn't model the circadian clock or schedule the day. |
| **Muslim Pro / Athan** (100M+ downloads)⁵ | Prayer times, Qibla, Quran. | Religious utility only — zero health/sleep optimization. |

The two markets exist separately: the **wellness-app market is ~$11B (2024), projected ~$45B by 2034**,¹² and Muslim lifestyle apps have hundreds of millions of users. **No product identified (as of 2026) sits in the intersection** — a circadian engine anchored to the prayer schedule.

**Business model.** Freemium consumer app (premium = multi-day planning, wearable import, full city/prayer-method coverage), with a natural Ramadan acquisition spike. Longer term: B2B2C through Muslim-lifestyle platforms that own the audience but lack a health engine.

---

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
```

**Demo flow:** onboard (pick a city, answer the 11 chronotype questions, choose priorities) → the day ribbon loads with prayer pillars and your alertness curve → Fitra spots the deep-focus task sitting in your afternoon dip and offers to move it to your morning peak → click any block for its science card → top-right "present mode" runs the pitch deck.

```
src/
  components/   onboarding, day ribbon, activity log, present mode, time picker, science card, suhoor card
  lib/          circadian.js (two-process model) · optimizer.js (block placement) · activityOptimizer.js · categories.js
  data/         cities.js (prayer times per city)
```

---

## References

1. Roky R. et al. "Sleep during Ramadan intermittent fasting" / "Daytime sleepiness during Ramadan." *Journal of Sleep Research*, 2001; 2003. doi:10.1046/j.1365-2869.2003.00341.x
2. Qasrawi S.O., Pandi-Perumal S.R., BaHammam A.S. "The effect of intermittent fasting during Ramadan on sleep, sleepiness, cognitive function, and circadian rhythm." *Sleep & Breathing*, 2017. doi:10.1007/s11325-017-1473-x
3. Wittmann M., Dinich J., Merrow M., Roenneberg T. "Social jetlag: misalignment of biological and social time." *Chronobiology International*, 2006. doi:10.1080/07420520500545979
4. Pew Research Center. "The Future of World Religions: Population Growth Projections, 2010–2050." 2015.
5. Muslim Pro, Google Play listing (100M+ downloads).
6. Drake C. et al. "Caffeine effects on sleep taken 0, 3, or 6 hours before going to bed." *Journal of Clinical Sleep Medicine*, 2013. doi:10.5664/jcsm.3170 (caffeine 6h before bed still significantly reduces total sleep time).
7. Roenneberg T., Wirz-Justice A., Merrow M. "Life between clocks: daily temporal patterns of human chronotypes" (MCTQ). *Journal of Biological Rhythms*, 2003.
8. Borbély A.A. "A two-process model of sleep regulation." *Human Neurobiology*, 1982; Daan, Beersma & Borbély, *Am. J. Physiol.*, 1984.
9. RISE Science funding: Crunchbase / company reporting ($10M Series A + $5.5M seed).
10. Timeshifter — circadian jet-lag app developed from NASA fatigue-management research; company reporting (1.6M+ users).
11. Sleep Cycle AB (Nasdaq Stockholm: SLEEP), company/Crunchbase figures (~75M downloads).
12. Wellness apps market size: Precedence Research / Grand View Research (~$11B in 2024).

*Market-size and download figures are from the cited commercial/company sources and are best read as directional. Citations marked above reflect the strongest available sources as of 2026; see commit history for any later corrections.*

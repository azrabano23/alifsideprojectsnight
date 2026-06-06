# fitra

a circadian app for muslims. it doesn't tell you what to pray. the only islamic thing it knows about is the time of the five prayers, suhoor cutoff, and iftar (which is just public solar astronomy anyway). everything else, sleep, nap, caffeine, peak focus, when to train, gets optimized around those fixed walls.

it's the prototype i built for a pitch.

## why i made this

every ramadan i'd fall apart by week 2. sleep got weird, focus collapsed, i'd either skip suhoor or wake up so wrecked i couldn't function the next day. it always felt like a scheduling problem nobody had bothered to solve properly. so i tried to.

## how it actually works

there's a small two-process sleep model under the hood. process C is the circadian cosine (peaks at a time shifted by your chronotype). process S is homeostatic pressure that builds while you're awake and pays down while you sleep. that gives an alertness curve across 24 hours. the optimizer then places blocks: bedtime works backward from when you need to wake, caffeine cutoff is 6h before bed (drake et al. 2013), the nap lands at the post-midday dip, focus block at the day's predicted alertness peak that doesn't collide with a prayer.

drag the "last night i slept" slider on the day view and the whole plan re-runs. less sleep means a longer earlier nap, an earlier wind-down, a flatter focus window. it's the one moment in the demo that has to feel alive.

## running it

```
npm install
npm run dev
```

open http://localhost:5173.

## the demo flow 

1. onboarding: pick a city (SF, London, or Dubai), answer 11 chronotype questions (this is basically the MCTQ from roenneberg's lab, the gold standard for chronotype), pick up to 3 priorities, pick an aim.
2. the day view loads. vertical ribbon. prayer pillars engraved across it. energy curve as a thin solar line. sleep, wind-down, nap, focus, caffeine cutoff sitting in the gaps. on the right is the activity log with 4 things you "logged" today.
3. one of them, "read journal article" tagged as deep focus, is at 3pm. fitra sees that's your biological dip and suggests moving it to your peak around 10am. click apply, the glyph slides up the ribbon.
4. click any block for the science card. real citations, no AI hallucinations.
5. top right: "present mode." 7 slides, arrow keys to navigate. that's the pitch deck.

## stack

vite, react, tailwind, framer-motion. that's it. fonts are fraunces (display) and inter (sans), pulled from google fonts. everything else is custom SVG, including the girih pattern in the background.

## what's mocked vs. real

mocked: prayer times are hardcoded per city, calendar sync is just UI state (no oauth), the date in the header is a string.

real: the circadian model. the block-placement optimizer. the activity re-time logic. the time picker maths. the chronotype derivation from your intake answers.

## structure

```
src/
  components/   onboarding, day ribbon, activity log, present mode, time picker, why card, suhoor card
  lib/          circadian.js (two-process model), optimizer.js (block placement), activityOptimizer.js, categories.js
  data/         cities.js with mock prayer times
```


import React, { useState } from 'react'
import Onboarding from './components/Onboarding.jsx'
import DayView from './components/DayView.jsx'
import PresentMode from './components/PresentMode.jsx'

export default function App() {
  const [profile, setProfile] = useState(null)
  const [present, setPresent] = useState(false)

  if (!profile) {
    return <Onboarding onComplete={setProfile} />
  }

  return (
    <>
      <DayView
        profile={profile}
        onPresent={() => setPresent(true)}
        onRestart={() => setProfile(null)}
      />
      {present && (
        <PresentMode
          cityId={profile.cityId}
          chronotype={profile.chronotype}
          goal={profile.goal}
          onExit={() => setPresent(false)}
        />
      )}
    </>
  )
}

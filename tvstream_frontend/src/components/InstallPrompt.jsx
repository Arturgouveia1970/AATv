// src/components/InstallPrompt.jsx
import React, { useEffect, useState } from 'react'

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null)

  useEffect(() => {
    const onBeforeInstall = (e) => { e.preventDefault(); setDeferred(e) }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  if (!deferred) return null

  return (
    <button className="primary" onClick={async () => {
      deferred.prompt()
      await deferred.userChoice
      setDeferred(null)
    }}>
      Install AATv
    </button>
  )
}

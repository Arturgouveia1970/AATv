// src/components/IosInstallTip.jsx
import React, { useEffect, useState } from 'react'

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent)
const inStandalone = () => window.matchMedia('(display-mode: standalone)').matches || ('standalone' in navigator && navigator.standalone)

export default function IosInstallTip() {
  const [show, setShow] = useState(false)
  useEffect(() => { setShow(isIOS() && !inStandalone()) }, [])
  if (!show) return null
  return (
    <div style={{background:'#111', color:'#fff', padding:'8px 12px', borderRadius:8, fontSize:13, margin:'8px 0'}}>
      On iPhone: tap <span style={{fontWeight:600}}>Share</span> → <span style={{fontWeight:600}}>Add to Home Screen</span> to install AATv.
    </div>
  )
}

import { useEffect, useState } from 'react'

const API_BASE = (import.meta.env?.VITE_API_BASE_URL as string | undefined) ?? '/api/v1'

/**
 * Thin ribbon shown when the API reports demoMode. Demo mode means the AI
 * layer is a deterministic script, no messages are sent and all data is
 * synthetic — this makes sure nobody mistakes a demo for a live deployment.
 */
export function DemoBanner() {
  const [demo, setDemo] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`${API_BASE}/health`, { headers: { Accept: 'application/json' } })
      .then(res => (res.ok ? res.json() : null))
      .then((data: { demoMode?: boolean } | null) => {
        if (!cancelled && data?.demoMode) setDemo(true)
      })
      .catch(() => { /* API unreachable — nothing to show */ })
    return () => { cancelled = true }
  }, [])

  if (!demo) return null
  return (
    <div
      role="status"
      style={{ background: '#FFF4D6', color: '#7A4B00', borderBottom: '1px solid #F2D48A' }}
      className="px-4 py-1.5 text-center text-xs font-semibold"
    >
      Demo mode: synthetic data, scripted AI replies, no messages are sent.
    </div>
  )
}

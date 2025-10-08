'use client'

import React, { useEffect, useMemo, useState } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_QUEUE_API || ''
const EVENT_ID = process.env.NEXT_PUBLIC_EVENT_ID || ''

type Ticket = {
  code: string
  order: number
  status: 'QUEUED'|'CALLED'|'IN_PROCESS'|'DONE'|'NO_SHOW'
  email: string | null
  name: string | null
  wa: string | null
}

const CALL_NEXT_URL = '/api/call-next' // ganti sesuai endpoint kamu yang sekarang dipakai tombol "Call Next 6" di admin lama

function fmt(code: string) {
  // tampil AH001 (tanpa dash), tetap kompatibel dengan kode 'AH-001'
  return code.replace('AH-', 'AH')
}

function chunk6<T>(arr: T[]) {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += 6) out.push(arr.slice(i, i + 6))
  return out
}

export default function FlowPage() {
  const [active, setActive] = useState<Ticket[]>([])   // CALLED + IN_PROCESS (panel Active)
  const [queued, setQueued] = useState<Ticket[]>([])   // QUEUED (panel Queue)
  const [deferred, setDeferred] = useState<Ticket[]>([]) // DEFERRED (opsional dipakai recall cepat)
  const [loading, setLoading] = useState(false)
  const [recallCode, setRecallCode] = useState('')

  const eventId = useMemo(() => {
    if (typeof window === 'undefined') return EVENT_ID
    const u = new URL(window.location.href)
    return u.searchParams.get('event') || EVENT_ID
  }, [])

  async function load() {
    if (!API_BASE || !eventId) return
    setLoading(true)
    try {
      const q1 = new URLSearchParams({ eventId, status: 'CALLED', limit: '100' })
      const q2 = new URLSearchParams({ eventId, status: 'IN_PROCESS', limit: '100' })
      const q3 = new URLSearchParams({ eventId, status: 'QUEUED', limit: '120' })
      const q4 = new URLSearchParams({ eventId, status: 'DEFERRED', limit: '60' })

      const [r1, r2, r3, r4] = await Promise.all([
        fetch(`${API_BASE}/api/tickets?${q1.toString()}`),
        fetch(`${API_BASE}/api/tickets?${q2.toString()}`),
        fetch(`${API_BASE}/api/tickets?${q3.toString()}`),
        fetch(`${API_BASE}/api/tickets?${q4.toString()}`),
      ])
      const j1 = await r1.json()
      const j2 = await r2.json()
      const j3 = await r3.json()
      const j4 = await r4.json()

      const act: Ticket[] = [...(j1.items || []), ...(j2.items || [])]
      act.sort((a: Ticket, b: Ticket) => a.order - b.order)
      setActive(act.slice(0, 6)) // Active panel maksimal 6

      const qd: Ticket[] = (j3.items || []) // ambil antrian banyak biar tampil 4–5 baris
      setQueued(qd)

      setDeferred(j4.items || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 2500) // auto refresh ringan
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function callNext6(times = 1) {
    for (let i = 0; i < times; i++) {
      try {
        await fetch(`${API_BASE}${CALL_NEXT_URL}?eventId=${encodeURIComponent(eventId)}&count=6`, {
          method: 'POST',
        })
        // jika endpoint kamu bentuknya lain, sesuaikan saja URL di atas
      } catch {}
      await new Promise((r) => setTimeout(r, 300))
    }
    load()
  }

  async function recallByCode() {
    const code = recallCode.trim().toUpperCase()
    if (!code) return
    try {
      await fetch(`${API_BASE}/api/tickets/${encodeURIComponent(code)}/call`, { method: 'PATCH' })
      setRecallCode('')
      load()
    } catch {}
  }

  const queuedRows = chunk6(queued)
  const activeRows = chunk6(active)

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-[#fff6f3] to-white text-[#7a0f2b]">
      <div className="mx-auto w-full max-w-6xl px-4 py-5">
        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button
            className="rounded-xl bg-[#7a0f2b] px-4 py-3 text-sm font-semibold text-white"
            onClick={() => callNext6(5)}
          >
            Prime 30 (Call Next 6 ×5)
          </button>
          <button
            className="rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold"
            onClick={() => callNext6(1)}
          >
            Call Next 6
          </button>
          <div className="flex gap-2">
            <input
              className="w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm"
              placeholder="Recall kode (mis. AH-123)"
              value={recallCode}
              onChange={(e) => setRecallCode(e.target.value)}
            />
            <button
              className="rounded-xl border px-3 py-2 text-sm"
              onClick={recallByCode}
            >
              Recall
            </button>
          </div>
        </div>

        {/* ACTIVE */}
        <section className="mb-5">
          <h2 className="mb-2 text-base font-bold">Active</h2>
          <div className="rounded-2xl border border-rose-100 bg-white p-3 shadow-sm">
            {activeRows.length === 0 && (
              <div className="py-6 text-center text-sm text-slate-500">
                {loading ? 'Memuat…' : 'Belum ada yang aktif'}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {active.map((t) => (
                <div
                  key={t.code}
                  className="rounded-xl border border-emerald-200 bg-emerald-50/40 px-3 py-3 text-center font-bold text-emerald-800"
                >
                  {fmt(t.code)}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* QUEUE (Grouped 6 per baris) */}
        <section>
          <h2 className="mb-2 text-base font-bold">Queue</h2>
          <div className="rounded-2xl border border-rose-100 bg-white p-3 shadow-sm">
            {queuedRows.length === 0 && (
              <div className="py-6 text-center text-sm text-slate-500">
                {loading ? 'Memuat…' : 'Tidak ada dalam antrian'}
              </div>
            )}
            <div className="space-y-2">
              {queuedRows.map((row, idx) => (
                <div key={idx} className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {row.map((t) => (
                    <div
                      key={t.code}
                      className="rounded-xl border border-rose-200 bg-rose-50/40 px-3 py-3 text-center font-semibold text-[#7a0f2b]"
                    >
                      {fmt(t.code)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

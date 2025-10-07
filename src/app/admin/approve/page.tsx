'use client'

import React, { useEffect, useMemo, useState } from 'react'

/**
 * ENV:
 * NEXT_PUBLIC_QUEUE_API
 * NEXT_PUBLIC_EVENT_ID
 */
const API_BASE = process.env.NEXT_PUBLIC_QUEUE_API || ''
const EVENT_ID = process.env.NEXT_PUBLIC_EVENT_ID || ''

type Source = 'MASTER' | 'WALKIN' | 'GIMMICK' | 'ALL'
type ReqStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'ALL'

type Registrant = {
  id: string
  eventId: string
  email: string
  name: string
  wa: string | null
  source: 'MASTER' | 'WALKIN' | 'GIMMICK'
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
  isMasterMatch: boolean | null
  masterQuota: number | null
  issuedBefore: number | null
  quotaRemaining: number
  createdAt: string
  updatedAt?: string
}

type RegistrantsResponse = {
  ok: boolean
  items: Array<
    Omit<Registrant, 'quotaRemaining'> & { quotaRemaining?: number | null }
  >
  total: number
  limit: number
  offset: number
}

type PoolResponse = { ok: boolean; poolRemaining?: number | null }

function Toast({
  open,
  type = 'info',
  message,
  onClose,
}: {
  open: boolean
  type?: 'info' | 'success' | 'error'
  message?: string
  onClose?: () => void
}) {
  if (!open) return null
  const base =
    'fixed left-1/2 -translate-x-1/2 bottom-5 z-50 w-[92%] max-w-sm rounded-2xl px-4 py-3 shadow-lg border'
  const theme =
    type === 'success'
      ? 'bg-green-50 border-green-200 text-green-800'
      : type === 'error'
      ? 'bg-rose-50 border-rose-200 text-rose-800'
      : 'bg-slate-50 border-slate-200 text-slate-700'
  return (
    <div className={`${base} ${theme}`}>
      <div className="flex items-start gap-3">
        <div className="grow">
          <p className="text-sm leading-5">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-2 rounded-full px-2 py-1 text-xs hover:bg-black/5"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export default function ApprovePage() {
  const [items, setItems] = useState<Registrant[]>([])
  const [total, setTotal] = useState(0)
  const [limit, setLimit] = useState(10)
  const [offset, setOffset] = useState(0)

  const [status, setStatus] = useState<ReqStatus>('PENDING')
  const [source, setSource] = useState<Source>('ALL')
  const [q, setQ] = useState('')

  const [poolRemaining, setPoolRemaining] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [useCount, setUseCount] = useState<number>(1)

  const [toastOpen, setToastOpen] = useState(false)
  const [toastType, setToastType] = useState<'info' | 'success' | 'error'>('info')
  const [toastMsg, setToastMsg] = useState<string>('')

  const eventId = useMemo(() => {
    if (typeof window === 'undefined') return EVENT_ID
    const u = new URL(window.location.href)
    return u.searchParams.get('event') || EVENT_ID
  }, [])

  async function fetchPool() {
    try {
      const res = await fetch(`${API_BASE}/api/pool?eventId=${encodeURIComponent(eventId)}`)
      const json: PoolResponse = await res.json()
      if (json?.ok)
        setPoolRemaining(
          typeof json.poolRemaining === 'number' ? json.poolRemaining : null
        )
    } catch {
      /* silent */
    }
  }

  async function fetchData() {
    if (!API_BASE || !eventId) return
    setLoading(true)
    try {
      const p = new URLSearchParams()
      p.set('eventId', eventId)
      p.set('status', status)
      p.set('source', source)
      p.set('limit', String(limit))
      p.set('offset', String(offset))
      if (q.trim()) p.set('q', q.trim())

      const res = await fetch(`${API_BASE}/api/registrants?` + p.toString())
      const json: RegistrantsResponse = await res.json()
      if (json?.ok) {
        const mapped: Registrant[] = json.items.map((it) => ({
          ...it,
          quotaRemaining:
            it.quotaRemaining ??
            Math.max(0, Number(it.masterQuota ?? 0) - Number(it.issuedBefore ?? 0)),
        }))
        setItems(mapped)
        setTotal(json.total ?? 0)
        setLimit(json.limit ?? 10)
        setOffset(json.offset ?? 0)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    fetchPool()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, source, limit, offset])

  function onSearch(e: React.FormEvent) {
    e.preventDefault()
    setOffset(0)
    fetchData()
  }

  function openConfirm(id: string, defCount = 1) {
    setConfirmId(id)
    setUseCount(defCount)
  }

  async function doConfirm() {
    if (!confirmId) return
    try {
      const res = await fetch(`${API_BASE}/api/register-confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: confirmId, useCount }),
      })
      const json: { ok?: boolean; error?: string; message?: string } = await res.json()
      if (json?.ok) {
        setToastType('success')
        setToastMsg('Berhasil dikonfirmasi. Tiket QUEUED dibuat.')
        setToastOpen(true)
        setConfirmId(null)
        await fetchData()
        await fetchPool()
      } else {
        setToastType('error')
        setToastMsg(json?.error || json?.message || 'Gagal konfirmasi.')
        setToastOpen(true)
      }
    } catch {
      setToastType('error')
      setToastMsg('Gagal menghubungi server.')
      setToastOpen(true)
    }
  }

  const maxPage = Math.max(1, Math.ceil(total / limit))
  const page = Math.floor(offset / limit) + 1

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-[#fff6f3] to-white text-[#7a0f2b]">
      <div className="mx-auto w-full max-w-5xl px-4 py-5">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-xl font-extrabold">Approve Registrasi</h1>
          <div className="rounded-xl border border-rose-100 bg-white px-3 py-1.5 text-xs">
            Pool sisa: <b>{poolRemaining ?? '—'}</b>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <select
            className="w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as ReqStatus)
              setOffset(0)
            }}
          >
            <option value="PENDING">PENDING</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="ALL">ALL</option>
          </select>

          <select
            className="w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm"
            value={source}
            onChange={(e) => {
              setSource(e.target.value as Source)
              setOffset(0)
            }}
          >
            <option value="ALL">ALL SOURCE</option>
            <option value="MASTER">MASTER</option>
            <option value="WALKIN">WALKIN</option>
            <option value="GIMMICK">GIMMICK</option>
          </select>

          <form onSubmit={onSearch} className="flex w-full gap-2">
            <input
              className="w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm"
              placeholder="Cari email/nama/wa…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button className="rounded-xl bg-[#7a0f2b] px-4 py-2 text-sm font-semibold text-white">
              Cari
            </button>
          </form>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-sm">
          <div className="max-h-[65vh] overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-rose-50 text-rose-900/80">
                <tr>
                  <th className="px-3 py-2 text-left">Nama</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Quota</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td className="px-3 py-6 text-center text-slate-500" colSpan={6}>
                      {loading ? 'Memuat…' : 'Tidak ada data'}
                    </td>
                  </tr>
                )}
                {items.map((it) => (
                  <tr key={it.id} className="border-t border-rose-50">
                    <td className="px-3 py-2">
                      <div className="font-medium text-[#7a0f2b]">{it.name}</div>
                      {it.wa && <div className="text-xs text-slate-500">{it.wa}</div>}
                      <div className="text-[10px] text-slate-400">
                        {new Date(it.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-3 py-2 align-top">{it.email}</td>
                    <td className="px-3 py-2 align-top text-center">{it.source}</td>
                    <td className="px-3 py-2 align-top text-center">
                      {it.source === 'MASTER' ? it.quotaRemaining : '—'}
                    </td>
                    <td className="px-3 py-2 align-top text-center">{it.status}</td>
                    <td className="px-3 py-2 align-top text-right">
                      {it.status === 'PENDING' ? (
                        <button
                          className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:opacity-95"
                          onClick={() => openConfirm(it.id, 1)}
                        >
                          Confirm
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-rose-100 px-3 py-2 text-xs">
            <div>
              Total: <b>{total}</b> • Page {page}/{maxPage}
            </div>
            <div className="flex items-center gap-1">
              <button
                className="rounded-lg border px-2 py-1 disabled:opacity-40"
                disabled={page <= 1}
                onClick={() => setOffset(Math.max(0, offset - limit))}
              >
                ‹ Prev
              </button>
              <select
                className="rounded-lg border px-2 py-1"
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value))
                  setOffset(0)
                }}
              >
                {[10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}/page
                  </option>
                ))}
              </select>
              <button
                className="rounded-lg border px-2 py-1 disabled:opacity-40"
                disabled={page >= maxPage}
                onClick={() => setOffset(offset + limit)}
              >
                Next ›
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      {confirmId && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-rose-100 bg-white p-5 shadow-xl">
            <h3 className="mb-2 text-base font-bold">Konfirmasi Registrasi</h3>
            <p className="mb-3 text-sm text-slate-600">
              Tentukan jumlah slot yang dipakai (<code>useCount</code>).
            </p>
            <input
              type="number"
              min={1}
              step={1}
              value={useCount}
              onChange={(e) => setUseCount(Math.max(1, Number(e.target.value || 1)))}
              className="mb-4 w-full rounded-xl border border-rose-200 px-3 py-2 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button
                className="rounded-xl border px-3 py-2 text-sm"
                onClick={() => setConfirmId(null)}
              >
                Batal
              </button>
              <button
                className="rounded-xl bg-[#7a0f2b] px-3 py-2 text-sm font-semibold text-white"
                onClick={doConfirm}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast
        open={toastOpen}
        type={toastType}
        message={toastMsg}
        onClose={() => setToastOpen(false)}
      />
    </main>
  )
}

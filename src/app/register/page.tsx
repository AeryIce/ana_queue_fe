'use client'

import React, { useMemo, useState } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_QUEUE_API || ''
const EVENT_ID = process.env.NEXT_PUBLIC_EVENT_ID || ''

type Source = 'MASTER'|'WALKIN'|'GIMMICK'
type ReqStatus = 'PENDING'|'CONFIRMED'|'CANCELLED'
type ReqResp = {
  ok?: boolean
  dedup?: boolean
  alreadyRegistered?: boolean
  request?: {
    id: string
    eventId: string
    email: string
    name: string
    wa: string | null
    source: Source
    status: ReqStatus
    isMasterMatch?: boolean | null
  }
  poolRemaining?: number
  error?: string
  message?: string
}

function Toast({
  open, type='info',
  onClose,
  children,
}: {
  open: boolean
  type?: 'info'|'success'|'error'
  onClose?: () => void
  children?: React.ReactNode
}) {
  if (!open) return null
  const base = 'fixed left-1/2 -translate-x-1/2 bottom-5 z-50 w-[92%] max-w-md rounded-2xl px-4 py-3 shadow-lg border'
  const theme =
    type === 'success' ? 'bg-green-50 border-green-200 text-green-800'
    : type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800'
    : 'bg-slate-50 border-slate-200 text-slate-700'
  return (
    <div className={`${base} ${theme}`}>
      <div className="flex items-start gap-3">
        <div className="grow text-sm leading-5">{children}</div>
        <button onClick={onClose} className="ml-2 rounded-full px-2 py-1 text-xs hover:bg-black/5">✕</button>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [name, setName]   = useState('')
  const [wa, setWa]       = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)
  const [toastType, setToastType] = useState<'info'|'success'|'error'>('info')
  const [toastBody, setToastBody] = useState<React.ReactNode>(null)

  const eventId = useMemo(() => {
    if (typeof window === 'undefined') return EVENT_ID
    const u = new URL(window.location.href)
    return u.searchParams.get('event') || EVENT_ID
  }, [])

  const RUN_URL = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/tv?event=${encodeURIComponent(eventId)}`
  }, [eventId])

  function periplusUrl(tag: 'master'|'walkin'|'pending') {
    const base = 'https://www.periplus.com/recommendations/Ana+Huang'
    const u = new URL(base)
    u.searchParams.set('utm_source', 'anaqueue')
    u.searchParams.set('utm_medium', 'web')
    u.searchParams.set('utm_campaign', 'ah_event')
    u.searchParams.set('utm_content', tag)
    return u.toString()
  }

  async function fetchMyTickets(emailAddr: string): Promise<string[]> {
    if (!API_BASE || !eventId) return []
    try {
      const res = await fetch(`${API_BASE}/api/tickets?eventId=${encodeURIComponent(eventId)}&status=ALL&email=${encodeURIComponent(emailAddr)}`)
      const json = await res.json()
      if (json?.ok) {
        return (json.items || []).map((it: any) => String(it.code || ''))
      }
    } catch {}
    return []
  }

  function openToast(node: React.ReactNode, type: 'info'|'success'|'error'='info') {
    setToastType(type)
    setToastBody(node)
    setToastOpen(true)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !name.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/api/register-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, email, name, wa }),
      })
      const json: ReqResp = await res.json()

      // BE success but dengan sinyal existing/dedup
      if (json?.ok && json.request) {
        const src = json.request.source
        const stat = json.request.status

        // 1) CONFIRMED (already registered)
        if (json.alreadyRegistered || stat === 'CONFIRMED') {
          if (src === 'MASTER' || json.request.isMasterMatch) {
            // MASTER → tampilkan nomor antrean miliknya
            const codes = await fetchMyTickets(json.request.email)
            openToast(
              <div>
                <div className="font-semibold">Terima kasih! Email kamu sudah terdaftar.</div>
                {codes.length > 0 ? (
                  <div className="mt-1">
                    Nomor antreanmu:
                    <div className="mt-1 flex flex-wrap gap-1">
                      {codes.map((c) => (
                        <span key={c} className="inline-block rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[12px] font-semibold text-emerald-800">
                          {String(c).replace('AH-', 'AH')}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-1 text-slate-600">Nomor antreanmu akan tampil di layar saat giliran mendekat.</div>
                )}
                <div className="mt-3 flex flex-col gap-2">
                  <a href={RUN_URL} className="inline-block rounded-xl bg-[#7a0f2b] px-3 py-2 text-center text-xs font-semibold text-white">Cek Running Queue</a>
                  <a href={periplusUrl('master')} className="inline-block rounded-xl border border-rose-200 bg-white px-3 py-2 text-center text-xs">Belanja buku di Periplus</a>
                </div>
              </div>,
              'success'
            )
          } else {
            // WALKIN yang sudah dipakai
            openToast(
              <div>
                <div className="font-semibold">Terima kasih! Email kamu sudah digunakan.</div>
                <div className="mt-1 text-slate-600">Panitia akan mengarahkanmu sesuai ketersediaan slot.</div>
                <div className="mt-3">
                  <a href={periplusUrl('walkin')} className="inline-block rounded-xl border border-rose-200 bg-white px-3 py-2 text-center text-xs">Belanja buku di Periplus</a>
                </div>
              </div>,
              'info'
            )
          }
          return
        }

        // 2) Masih PENDING (dedup)
        if (json.dedup || stat === 'PENDING') {
          openToast(
            <div>
              <div className="font-semibold">Terima kasih! Permintaan registrasimu sudah kami terima.</div>
              <div className="mt-1 text-slate-600">Mohon tunggu konfirmasi panitia.</div>
              <div className="mt-3">
                <a href={periplusUrl('pending')} className="inline-block rounded-xl border border-rose-200 bg-white px-3 py-2 text-center text-xs">Belanja buku di Periplus</a>
              </div>
            </div>,
            'success'
          )
          return
        }

        // 3) Baru dibuat PENDING (pertama kali)
        openToast(
          <div>
            <div className="font-semibold">Terima kasih! Permintaan registrasimu sudah kami terima.</div>
            <div className="mt-1 text-slate-600">Panitia akan memverifikasi sesuai ketersediaan slot.</div>
          </div>,
          'success'
        )
        setEmail(''); setName(''); setWa('')
        return
      }

      // BE error (ok === false)
      openToast(<div>{json?.error || json?.message || 'Gagal memproses pendaftaran.'}</div>, 'error')
    } catch {
      openToast(<div>Gagal menghubungi server.</div>, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen w-full bg-[#fff6f3]">
      {/* ... (header/hero/featured book kamu tetap) ... */}

      {/* Form registrasi */}
      <form onSubmit={onSubmit} className="mx-auto mt-6 w-full max-w-xl rounded-2xl border border-rose-100 bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-center text-lg font-extrabold text-[#7a0f2b]">Registrasi Antrean</h2>
        <p className="mb-4 text-center text-xs text-slate-500">Isi data di bawah. Panitia akan memproses sesuai ketersediaan slot.</p>

        <label className="mb-1 block text-xs font-medium">Email</label>
        <input className="mb-3 w-full rounded-xl border border-rose-200 px-3 py-2 text-sm" type="email" placeholder="nama@email.com" value={email} onChange={(e)=>setEmail(e.target.value)} required />

        <label className="mb-1 block text-xs font-medium">Nama Lengkap</label>
        <input className="mb-3 w-full rounded-xl border border-rose-200 px-3 py-2 text-sm" placeholder="Nama lengkap" value={name} onChange={(e)=>setName(e.target.value)} required />

        <label className="mb-1 block text-xs font-medium">WhatsApp (opsional)</label>
        <input className="mb-5 w-full rounded-xl border border-rose-200 px-3 py-2 text-sm" placeholder="08xxxxxxxxxx" value={wa} onChange={(e)=>setWa(e.target.value)} />

        <button disabled={submitting} className="w-full rounded-xl bg-[#7a0f2b] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {submitting ? 'Mengirim…' : 'Daftar'}
        </button>
      </form>

      {/* Toast */}
      <Toast open={toastOpen} type={toastType} onClose={()=>setToastOpen(false)}>
        {toastBody}
      </Toast>
    </main>
  )
}

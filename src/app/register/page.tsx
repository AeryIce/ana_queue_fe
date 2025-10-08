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

/** TOAST */
function Toast({ open, type = 'info', onClose, children }: {
  open: boolean
  type?: 'info' | 'success' | 'error'
  onClose?: () => void
  children?: React.ReactNode
}) {
  if (!open) return null
  const base =
    'fixed left-1/2 -translate-x-1/2 top-6 z-50 w-[92%] max-w-lg rounded-2xl px-4 py-3 shadow-lg border'
  const theme =
    type === 'success'
      ? 'bg-green-50 border-green-200 text-green-800'
      : type === 'error'
      ? 'bg-rose-50 border-rose-200 text-rose-800'
      : 'bg-slate-50 border-slate-200 text-slate-700'
  return (
    <div className={`${base} ${theme}`}>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[11px] font-semibold tracking-wide uppercase opacity-75">
          Ana Huang — Book Signing • by Periplus
        </div>
        <button
          onClick={onClose}
          className="rounded-full px-2 py-1 text-xs hover:bg-black/5"
        >
          ✕
        </button>
      </div>
      <div className="text-sm leading-5">{children}</div>
    </div>
  )
}

/** Promo */
function PromoNote() {
  return (
    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-[12px] leading-5 text-emerald-900">
      <div className="mb-1 font-semibold">Promo khusus di SBO:</div>
      <ul className="list-disc space-y-0.5 pl-4">
        <li>Pembelian 3–5 buku: <b>diskon 10%</b></li>
        <li>Pembelian 6 buku atau lebih: <b>diskon 20%</b></li>
      </ul>
    </div>
  )
}

/** Books */
function FeaturedBooks() {
  const covers = [
    '/ana/cover-king-of-greed.jpg',
    '/ana/cover-king-of-sloth.jpg',
    '/ana/cover-king-of-wrath.jpg',
    '/ana/cover-king-of-pride.jpg',
    '/ana/cover-twisted-love.png',
    '/ana/cover-twisted-games.png',
    '/ana/cover-twisted-hate.png',
    '/ana/cover-twisted-lies.png',
  ]
  return (
    <div className="rounded-2xl border border-rose-100/60 bg-white/70 p-3 shadow-sm backdrop-blur-md">
      <div className="mb-2 text-xs font-semibold text-rose-900/80">Featured Books</div>
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
        {covers.map((src) => (
          <img key={src} src={src} alt="Ana Huang Book"
            className="h-28 w-auto shrink-0 snap-start rounded-xl border border-rose-100 bg-white object-cover" />
        ))}
      </div>
    </div>
  )
}

/** Sponsor */
function SponsorStrip() {
  return (
    <div className="flex items-center justify-center gap-3 rounded-2xl border border-rose-100 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-md">
      <img src="/brand/periplus-blog.png" alt="Periplus Blog" className="h-7 w-auto" />
      <span className="text-xs text-rose-900/60">Dipersiapkan oleh</span>
      <img src="/brand/periplus.png" alt="Periplus" className="h-8 w-auto" />
    </div>
  )
}

/** Hero */
function Hero() {
  return (
    <section className="relative mx-auto w-full max-w-6xl px-4 pt-6">
      <div className="relative grid grid-cols-1 items-center gap-5 md:grid-cols-[1.2fr,0.8fr]">
        <div className="space-y-4">
          <div className="max-w-xl rounded-2xl border border-rose-100 bg-white/85 p-4 shadow-sm backdrop-blur-lg">
            <h1 className="text-2xl font-extrabold text-[#7a0f2b] md:text-3xl">
              Ana Huang — Book Signing
            </h1>
            <p className="mt-1 text-sm text-rose-900/90">
              Selamat datang! Silakan registrasi antrean. Panitia akan memproses sesuai ketersediaan slot.
            </p>
          </div>
          <SponsorStrip />
          <div className="hidden md:block"><FeaturedBooks /></div>
        </div>
        <div className="flex items-center justify-center">
          <img src="/ana/ana-hero.jpg" alt="Ana Huang"
            className="h-40 w-40 rounded-2xl border border-rose-100 bg-white/70 object-cover shadow-sm backdrop-blur-md md:h-48 md:w-48" />
        </div>
      </div>
      <div className="mt-4 md:hidden"><FeaturedBooks /></div>
    </section>
  )
}

/** Main page */
export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [wa, setWa] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)
  const [toastType, setToastType] = useState<'info' | 'success' | 'error'>('info')
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

  function periplusUrl(tag: 'master' | 'walkin' | 'pending') {
    const base = 'https://www.periplus.com/recommendations/Ana+Huang'
    const u = new URL(base)
    u.searchParams.set('utm_source', 'anaqueue')
    u.searchParams.set('utm_medium', 'web')
    u.searchParams.set('utm_campaign', 'ah_event')
    u.searchParams.set('utm_content', tag)
    return u.toString()
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
      if (json?.ok) {
        setToastType('success')
        setToastBody(<div>Registrasi berhasil! 🎉</div>)
        setToastOpen(true)
        setEmail(''); setName(''); setWa('')
      } else {
        setToastType('error')
        setToastBody(<div>{json?.error || 'Gagal mendaftar.'}</div>)
        setToastOpen(true)
      }
    } catch {
      setToastType('error'); setToastBody(<div>Server tidak merespons.</div>); setToastOpen(true)
    } finally { setSubmitting(false) }
  }

  return (
    <main
      className="relative min-h-screen w-full text-[#7a0f2b]"
      style={{
        backgroundImage: "url('/brand/feed-bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* BLUR SEBERAT TV tapi CERAH */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-white/85 backdrop-blur-[45px] backdrop-saturate-150" />
        <div className="absolute inset-0 bg-gradient-to-b from-rose-50/60 via-white/60 to-white/80" />
      </div>

      <Hero />

      {/* Form */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-10">
        <form
          onSubmit={onSubmit}
          className="mx-auto mt-6 w-full max-w-md rounded-2xl border border-rose-100 bg-white/75 p-6 shadow-sm backdrop-blur-md"
        >
          <h2 className="mb-2 text-center text-lg font-extrabold text-[#7a0f2b]">Registrasi Antrean</h2>
          <p className="mb-4 text-center text-xs text-rose-900/80">
            Isi data di bawah. Panitia akan memproses sesuai ketersediaan slot.
          </p>
          <label className="mb-1 block text-xs font-medium">Email</label>
          <input className="mb-3 w-full rounded-xl border border-rose-200 bg-white/85 px-3 py-2 text-sm backdrop-blur-sm"
            type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label className="mb-1 block text-xs font-medium">Nama Lengkap</label>
          <input className="mb-3 w-full rounded-xl border border-rose-200 bg-white/85 px-3 py-2 text-sm backdrop-blur-sm"
            value={name} onChange={(e) => setName(e.target.value)} required />
          <label className="mb-1 block text-xs font-medium">WhatsApp (opsional)</label>
          <input className="mb-5 w-full rounded-xl border border-rose-200 bg-white/85 px-3 py-2 text-sm backdrop-blur-sm"
            value={wa} onChange={(e) => setWa(e.target.value)} />
          <button disabled={submitting}
            className="w-full rounded-xl bg-[#7a0f2b] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {submitting ? 'Mengirim…' : 'Daftar'}
          </button>
        </form>
      </section>

      <Toast open={toastOpen} type={toastType} onClose={() => setToastOpen(false)}>{toastBody}</Toast>
    </main>
  )
}

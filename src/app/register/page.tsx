'use client'

import React, { useMemo, useState } from 'react'
import Image from 'next/image'

/**
 * ENV (FE):
 * NEXT_PUBLIC_QUEUE_API = https://anaqueuebe-production.up.railway.app
 * NEXT_PUBLIC_EVENT_ID  = seed-event   ← disembunyikan dari UI
 */
const API_BASE = process.env.NEXT_PUBLIC_QUEUE_API || ''
const EVENT_ID = process.env.NEXT_PUBLIC_EVENT_ID || ''

// =============== Toast mini ===============
function Toast({
  open,
  type = 'info',
  message,
  actionLabel,
  onAction,
  onClose,
}: {
  open: boolean
  type?: 'info' | 'success' | 'error'
  message?: string
  actionLabel?: string
  onAction?: () => void
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
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="mt-2 inline-flex items-center gap-1 rounded-lg border border-current/20 px-3 py-1.5 text-xs font-medium hover:bg-white/50"
            >
              {actionLabel}
            </button>
          )}
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

// =============== Data assets ===============
const featuredCovers = [
  '/ana/cover-king-of-greed.jpg',
  '/ana/cover-king-of-pride.jpg',
  '/ana/cover-king-of-sloth.jpg',
  '/ana/cover-king-of-wrath.jpg',
  '/ana/cover-twisted-love.png',
  '/ana/cover-twisted-games.png',
  '/ana/cover-twisted-hate.png',
  '/ana/cover-twisted-lies.png',
]

// =============== Page ===============
export default function RegisterPage() {
  // form state
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [wa, setWa] = useState('')

  // UI
  const [loading, setLoading] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState<string>()
  const [toastType, setToastType] = useState<'info' | 'success' | 'error'>('info')
  const [toastAction, setToastAction] = useState<null | { label: string; url: string }>(null)

  const closeToast = () => {
    setToastOpen(false)
    setToastAction(null)
  }

  // EventId: hidden, dari ENV (boleh override ?event= untuk internal ops)
  const effectiveEventId = useMemo(() => {
    if (typeof window === 'undefined') return EVENT_ID
    const u = new URL(window.location.href)
    return u.searchParams.get('event') || EVENT_ID
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!API_BASE || !effectiveEventId) {
      setToastType('error')
      setToastMsg('Konfigurasi belum lengkap.')
      setToastOpen(true)
      return
    }
    if (!email || !name) {
      setToastType('error')
      setToastMsg('Mohon isi email & nama.')
      setToastOpen(true)
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/register-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: effectiveEventId,
          email,
          name,
          wa: wa || undefined,
        }),
      })
      const json = await res.json()

      if (json?.ok) {
        setToastType('success')
        setToastMsg('Terima kasih! Permintaan registrasimu sudah kami terima.')
        setToastAction(null)
        setToastOpen(true)
        setEmail(''); setName(''); setWa('')
      } else {
        const nextUrl = json?.next?.url as string | undefined
        const nextLabel = (json?.next?.label as string | undefined) || 'Kunjungi Periplus'
        setToastType('error')
        setToastMsg(json?.message || 'Registrasi tidak dapat diproses saat ini.')
        setToastAction(nextUrl ? { label: nextLabel, url: nextUrl } : null)
        setToastOpen(true)
      }
    } catch {
      setToastType('error')
      setToastMsg('Gagal menghubungi server. Coba beberapa saat lagi.')
      setToastOpen(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-[#fff6f3] to-white text-[#7a0f2b]">
      {/* HEADER */}
      <div className="mx-auto w-full max-w-2xl px-4 pt-5 sm:pt-7">
        <div className="overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-sm">
          <Image
            src="/ana/ana-hero.jpg"
            alt="Ana Huang — Book Signing"
            width={1200}
            height={600}
            priority
            className="h-auto w-full"
          />
        </div>
      </div>

      {/* FEATURED BOOKS — auto scroll */}
      <section className="mx-auto w-full max-w-2xl px-4">
        <div className="mt-4 rounded-2xl border border-rose-100 bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm font-semibold">Featured Books</p>
          <div className="relative overflow-x-hidden">
            <div className="flex gap-3 animate-[marquee_22s_linear_infinite] will-change-transform">
              {[...featuredCovers, ...featuredCovers].map((src, i) => (
                <div
                  key={`${src}-${i}`}
                  className="flex min-w-[90px] items-center justify-center rounded-xl border border-rose-100 bg-rose-50/40 p-2"
                >
                  <Image
                    src={src}
                    alt="Book cover"
                    width={90}
                    height={130}
                    className="h-[130px] w-[90px] object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FORM — mobile-first */}
      <section className="mx-auto w-full max-w-md px-4 py-6">
        <div className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm">
          <h1 className="mb-1 text-center text-xl font-extrabold tracking-tight">
            Registrasi Antrean
          </h1>
          <p className="mb-5 text-center text-xs text-rose-800/70">
            Isi data di bawah. Panitia akan memproses sesuai ketersediaan slot.
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input
                type="email"
                required
                inputMode="email"
                autoComplete="email"
                className="w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm text-[#111] outline-none ring-rose-300 placeholder:text-slate-400 focus:ring"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Nama Lengkap</label>
              <input
                required
                className="w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm text-[#111] outline-none ring-rose-300 placeholder:text-slate-400 focus:ring"
                placeholder="Nama lengkap"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">WhatsApp (opsional)</label>
              <input
                inputMode="tel"
                autoComplete="tel"
                className="w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm text-[#111] outline-none ring-rose-300 placeholder:text-slate-400 focus:ring"
                placeholder="08xxxxxxxxxx"
                value={wa}
                onChange={(e) => setWa(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-[#7a0f2b] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-50"
            >
              {loading ? 'Memproses…' : 'Daftar'}
            </button>

            <p className="pt-1 text-center text-[11px] text-rose-900/60">
              Dengan menekan “Daftar”, Anda menyetujui penggunaan data untuk antrian & komunikasi acara.
            </p>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <div className="mx-auto w-full max-w-2xl px-4 pb-8">
        <div className="flex items-center justify-between rounded-2xl border border-rose-100 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Image src="/brand/periplus-blog.png" alt="Periplus Blog" width={120} height={28} />
            <span className="hidden text-xs text-rose-900/60 sm:inline">Dipersembahkan oleh</span>
          </div>
          <Image src="/brand/periplus.png" alt="Periplus" width={110} height={30} />
        </div>
      </div>

      {/* keyframes for marquee */}
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      {/* TOAST */}
      <Toast
        open={toastOpen}
        type={toastType}
        message={toastMsg}
        actionLabel={toastAction?.label}
        onAction={() => toastAction?.url && (window.location.href = toastAction.url)}
        onClose={closeToast}
      />
    </main>
  )
}

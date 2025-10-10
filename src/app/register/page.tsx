'use client';

import React, { useMemo, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_QUEUE_API || '';
const EVENT_ID = process.env.NEXT_PUBLIC_EVENT_ID || '';

type Source = 'MASTER' | 'WALKIN' | 'GIMMICK';
type ReqStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';
type ReqResp = {
  ok?: boolean;
  dedup?: boolean;
  alreadyRegistered?: boolean;
  request?: {
    id: string;
    eventId: string;
    email: string;
    name: string;
    wa: string | null;
    source: Source;
    status: ReqStatus;
    isMasterMatch?: boolean | null;
  };
  poolRemaining?: number;
  error?: string;
  message?: string;
};

/** TOAST – muncul di ATAS + ada header brand */
function Toast({
  open,
  type = 'info',
  onClose,
  children,
}: {
  open: boolean;
  type?: 'info' | 'success' | 'error';
  onClose?: () => void;
  children?: React.ReactNode;
}) {
  if (!open) return null;
  const base =
    'fixed left-1/2 -translate-x-1/2 top-6 z-50 w-[92%] max-w-lg rounded-2xl px-4 py-3 shadow-lg border';
  const theme =
    type === 'success'
      ? 'bg-green-50 border-green-200 text-green-800'
      : type === 'error'
      ? 'bg-rose-50 border-rose-200 text-rose-800'
      : 'bg-slate-50 border-slate-200 text-slate-700';
  return (
    <div className={`${base} ${theme}`}>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[11px] font-semibold tracking-wide uppercase opacity-75">
          Ana Huang — Book Signing • by Periplus
        </div>
        <button
          onClick={onClose}
          className="rounded-full px-2 py-1 text-xs hover:bg-black/5"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
      <div className="text-sm leading-5">{children}</div>
    </div>
  );
}

/** Banner promo (gambar) untuk disisipkan di toast */
function PromoBanner({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 block"
    >
      <img
        src="/brand/promosbo.png"
        alt="Promo khusus di Periplus Setiabudhi One"
        className="w-full rounded-xl border border-amber-200 shadow-sm"
      />
    </a>
  );
}

/** Strip cover buku (scrollable di HP) */
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
  ];
  return (
    <div className="rounded-2xl border border-rose-100/70 bg-white/60 p-3 shadow-sm backdrop-blur-md">
      <div className="mb-2 text-xs font-semibold text-rose-900/80">Featured Books</div>
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
        {covers.map((src) => (
          <img
            key={src}
            src={src}
            alt="Ana Huang Book"
            className="h-28 w-auto shrink-0 snap-start rounded-xl border border-rose-100 bg-white object-cover"
          />
        ))}
      </div>
    </div>
  );
}

/** Sponsor strip – SELALU tampil (mobile & desktop) */
function SponsorStrip() {
  return (
    <div className="flex items-center justify-center gap-3 rounded-2xl border border-rose-100 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-md">
      <img src="/brand/periplus-blog.png" alt="Periplus Blog" className="h-7 w-auto" />
      <span className="text-xs text-rose-900/60">Dipersiapkan oleh</span>
      <img src="/brand/periplus.png" alt="Periplus" className="h-8 w-auto" />
    </div>
  );
}

/* =========================
   Helpers kecil
   ========================= */

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

type Ticket = { code: string };
type RegisterServiceResp = {
  message?: string;
  tickets?: Ticket[];
  issued?: number;
  quota?: number;
  remaining?: number;
};

function looksLikeRegisterServiceResp(j: unknown): j is RegisterServiceResp {
  if (!isObject(j)) return false;
  if ('tickets' in j && Array.isArray((j as Record<string, unknown>).tickets)) return true;
  return false;
}

/** Hero cantik: Judul, foto Ana, sponsor, featured — glassier */
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
              Selamat datang! Silakan registrasi antrean. Panitia akan memproses sesuai
              ketersediaan slot.
            </p>
          </div>
          <SponsorStrip />
          <div className="hidden md:block">
            <FeaturedBooks />
          </div>
        </div>

        <div className="flex items-center justify-center">
          <img
            src="/ana/ana-hero.jpg"
            alt="Ana Huang"
            className="h-40 w-40 rounded-2xl border border-rose-100 bg-white/70 object-cover shadow-sm backdrop-blur-md md:h-48 md:w-48"
          />
        </div>
      </div>

      <div className="mt-4 md:hidden">
        <FeaturedBooks />
      </div>
    </section>
  );
}

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [wa, setWa] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastType, setToastType] = useState<'info' | 'success' | 'error'>('info');
  const [toastBody, setToastBody] = useState<React.ReactNode>(null);

  const eventId = useMemo(() => {
    if (typeof window === 'undefined') return EVENT_ID;
    const u = new URL(window.location.href);
    return u.searchParams.get('event') || EVENT_ID;
  }, []);

  const RUN_URL = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/tv?event=${encodeURIComponent(eventId)}`;
  }, [eventId]);

  function periplusUrl(tag: 'master' | 'walkin' | 'pending') {
    const base = 'https://www.periplus.com/recommendations/Ana+Huang';
    const u = new URL(base);
    u.searchParams.set('utm_source', 'anaqueue');
    u.searchParams.set('utm_medium', 'web');
    u.searchParams.set('utm_campaign', 'ah_event');
    u.searchParams.set('utm_content', tag);
    return u.toString();
  }

  async function fetchMyTickets(emailAddr: string): Promise<string[]> {
    if (!API_BASE || !eventId) return [];
    try {
      const res = await fetch(
        `${API_BASE}/api/tickets?eventId=${encodeURIComponent(
          eventId,
        )}&status=ALL&email=${encodeURIComponent(emailAddr)}`,
      );
      const json: { ok?: boolean; items?: Array<{ code: string }> } = await res.json();
      if (json?.ok) {
        const arr = (json.items ?? []) as Array<{ code: string }>;
        return arr.map((it) => String(it.code || ''));
      }
    } catch {
      /* noop */
    }
    return [];
  }

  function openToast(
    node: React.ReactNode,
    type: 'info' | 'success' | 'error' = 'info',
  ) {
    setToastType(type);
    setToastBody(node);
    setToastOpen(true);
  }

 async function onSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!email.trim() || !name.trim()) return;
  setSubmitting(true);

  try {
    // Flow Team A: daftar → masuk daftar tunggu (RegistrationRequest)
    const payload = {
      eventId,
      email: email.trim().toLowerCase(),
      name: name.trim(),
      ...(wa.trim() ? { wa: wa.trim() } : {}),
    };

    if (!API_BASE || !payload.eventId || !payload.email || !payload.name) {
      openToast(<div>Konfigurasi tidak lengkap (API/EVENT/Email/Nama).</div>, 'error');
      setSubmitting(false);
      return;
    }

    const res = await fetch(`${API_BASE}/api/register-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let msg = 'Gagal memproses pendaftaran.';
      try {
        const t = await res.text();
        if (t) msg = t;
      } catch { /* noop */ }

      if (res.status === 404) {
        msg = 'Event atau data tidak ditemukan.';
      } else if (res.status === 400) {
        msg = 'Data tidak valid. Periksa email/nama/event.';
      } else if (res.status === 409) {
        msg = 'Email sudah terdaftar / request sudah ada.';
      }
      openToast(<div>{msg}</div>, 'error');
      setSubmitting(false);
      return;
    }

    // Respons mengikuti tipe lama (ReqResp) → sesuai UI kamu
    const json: ReqResp = await res.json();

    if (json?.ok && json.request) {
      const src = json.request.source;
      const stat = json.request.status;

      // 1) Sudah terkonfirmasi / pernah terdaftar
      if (json.alreadyRegistered || stat === 'CONFIRMED') {
        if (src === 'MASTER' || json.request.isMasterMatch) {
          const codes = await fetchMyTickets(json.request.email);
          openToast(
            <div>
              <div className="font-semibold">Terima kasih! Email kamu sudah terdaftar.</div>
              {codes.length > 0 ? (
                <div className="mt-1">
                  Nomor antreanmu:
                  <div className="mt-1 flex flex-wrap gap-1">
                    {codes.map((c) => (
                      <span
                        key={c}
                        className="inline-block rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[12px] font-semibold text-emerald-800"
                      >
                        {String(c).replace('AH-', 'AH')}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-1 text-slate-600">
                  Nomor antreanmu akan tampil di layar saat giliran mendekat.
                </div>
              )}
              <div className="mt-3 flex flex-col gap-2">
                <a
                  href={RUN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-xl bg-[#7a0f2b] px-3 py-2 text-center text-xs font-semibold text-white"
                >
                  Cek Running Queue
                </a>
                <a
                  href={periplusUrl('master')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-xl border border-rose-200 bg-white px-3 py-2 text-center text-xs"
                >
                  Belanja buku di Periplus
                </a>
              </div>
              <PromoBanner href={periplusUrl('master')} />
            </div>,
            'success',
          );
        } else {
          // WALKIN yang sudah pernah dipakai
          openToast(
            <div>
              <div className="font-semibold">Terima kasih! Email kamu sudah digunakan.</div>
              <div className="mt-1 text-slate-600">
                Panitia akan mengarahkanmu sesuai ketersediaan slot.
              </div>
              <div className="mt-3">
                <a
                  href={periplusUrl('walkin')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-xl border border-rose-200 bg-white px-3 py-2 text-center text-xs"
                >
                  Belanja buku di Periplus
                </a>
              </div>
              <PromoBanner href={periplusUrl('walkin')} />
            </div>,
            'info',
          );
        }
        setSubmitting(false);
        return;
      }

      // 2) Sudah pernah request dan masih pending (dedup)
      if (json.dedup === true) {
        openToast(
          <div>
            <div className="font-semibold">Terima kasih! Email ini sudah digunakan untuk pendaftaran.</div>
            <div className="mt-1 text-slate-600">
              Permintaanmu <b>sudah ada di daftar tunggu</b> dan menunggu konfirmasi panitia.
            </div>
            <div className="mt-3">
              <a
                href={periplusUrl('pending')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-xl border border-rose-200 bg-white px-3 py-2 text-center text-xs"
              >
                Belanja buku di Periplus
              </a>
            </div>
            <PromoBanner href={periplusUrl('pending')} />
          </div>,
          'info',
        );
        setSubmitting(false);
        return;
      }

      // 3) Baru daftar pertama kali → pending baru
      if (!json.dedup && stat === 'PENDING') {
        openToast(
          <div>
            <div className="font-semibold">Terima kasih! Permintaan registrasimu sudah kami terima.</div>
            <div className="mt-1 text-slate-600">
              Panitia akan memverifikasi sesuai ketersediaan slot.
            </div>
            <PromoBanner href={periplusUrl('pending')} />
          </div>,
          'success',
        );
        setEmail('');
        setName('');
        setWa('');
        setSubmitting(false);
        return;
      }
    }

    // fallback – bentuk respons tidak sesuai yang diharapkan
    openToast(
      <div>{json?.error || json?.message || 'Gagal memproses pendaftaran.'}</div>,
      'error',
    );
  } catch {
    openToast(<div>Gagal menghubungi server.</div>, 'error');
  } finally {
    setSubmitting(false);
  }
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
      {/* DREAMY FROSTED LAYER */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-white/85 backdrop-blur-[45px] backdrop-saturate-150" />
        <div className="absolute inset-0 bg-gradient-to-b from-rose-50/60 via-white/60 to-white/80" />
      </div>

      <Hero />

      {/* Form registrasi */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-10">
        <form
          onSubmit={onSubmit}
          className="mx-auto mt-6 w-full max-w-md rounded-2xl border border-rose-100 bg-white/75 p-6 shadow-sm backdrop-blur-md"
        >
          <h2 className="mb-2 text-center text-lg font-extrabold text-[#7a0f2b]">
            Registrasi Antrean
          </h2>
          <p className="mb-4 text-center text-xs text-rose-900/80">
            Isi data di bawah. Panitia akan memproses sesuai ketersediaan slot.
          </p>

          <label className="mb-1 block text-xs font-medium">Email</label>
          <input
            className="mb-3 w-full rounded-xl border border-rose-200 bg-white/85 px-3 py-2 text-sm backdrop-blur-sm"
            type="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className="mb-1 block text-xs font-medium">Nama Lengkap</label>
          <input
            className="mb-3 w-full rounded-xl border border-rose-200 bg-white/85 px-3 py-2 text-sm backdrop-blur-sm"
            placeholder="Nama lengkap"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label className="mb-1 block text-xs font-medium">WhatsApp (opsional)</label>
          <input
            className="mb-5 w-full rounded-xl border border-rose-200 bg-white/85 px-3 py-2 text-sm backdrop-blur-sm"
            placeholder="08xxxxxxxxxx"
            value={wa}
            onChange={(e) => setWa(e.target.value)}
          />

          <button
            disabled={submitting}
            className="w-full rounded-xl bg-[#7a0f2b] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? 'Mengirim…' : 'Daftar'}
          </button>
        </form>
      </section>

      <Toast open={toastOpen} type={toastType} onClose={() => setToastOpen(false)}>
        {toastBody}
      </Toast>
    </main>
  );
}

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  getPendingRequests,
  approveRequest,
  rejectRequest,
} from '@/lib/approveApi';
import type { GetPendingParams, Registrant, RegistrantList } from '@/lib/approveApi';

const API_BASE = process.env.NEXT_PUBLIC_QUEUE_API || '';
const EVENT_ID = process.env.NEXT_PUBLIC_EVENT_ID || '';

type Source = 'MASTER' | 'WALKIN' | 'GIMMICK' | 'ALL';
type ReqStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'ALL';

type UIRegistrant = {
  id: string;
  eventId?: string;
  email: string;
  name: string;
  wa: string | null;
  source: 'MASTER' | 'WALKIN' | 'GIMMICK' | 'ALL' | string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'ALL' | string;
  isMasterMatch: boolean | null;
  masterQuota: number | null;
  issuedBefore: number | null;
  quotaRemaining: number;
  createdAt: string;
  updatedAt?: string;
};

type RegistrantsResponseNormalized = {
  items: UIRegistrant[];
  total: number;
  limit: number;
  offset: number;
};

type PoolResponse = { ok: boolean; poolRemaining?: number | null };

function Toast({
  open,
  type = 'info',
  message,
  onClose,
}: {
  open: boolean;
  type?: 'info' | 'success' | 'error';
  message?: string;
  onClose?: () => void;
}) {
  if (!open) return null;
  const base =
    'fixed left-1/2 -translate-x-1/2 bottom-5 z-50 w-[92%] max-w-sm rounded-2xl px-4 py-3 shadow-lg border';
  const theme =
    type === 'success'
      ? 'bg-green-50 border-green-200 text-green-800'
      : type === 'error'
      ? 'bg-rose-50 border-rose-200 text-rose-800'
      : 'bg-slate-50 border-slate-200 text-slate-700';
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
  );
}

function fmtCode(code: string) {
  return code.replace('AH-', 'AH');
}

// ——— helpers ———
function buildName(r: Registrant): string {
  const name =
    typeof r.name === 'string' && r.name.trim().length > 0 ? r.name.trim() : null;
  if (name) return name;
  const first = typeof r.firstName === 'string' ? r.firstName.trim() : '';
  const last = typeof r.lastName === 'string' ? r.lastName.trim() : '';
  const composed = [first, last].filter(Boolean).join(' ');
  return composed || (r.email ?? r.id ?? '').toString();
}

function toUI(reg: Registrant): UIRegistrant {
  const masterQuota = typeof reg.masterQuota === 'number' ? reg.masterQuota : 0;
  const issuedBefore = typeof reg.issuedBefore === 'number' ? reg.issuedBefore : 0;
  const computedRemaining = Math.max(0, masterQuota - issuedBefore);

  return {
    id: reg.id,
    eventId: (reg as any)?.eventId, // opsional jika BE kirim
    email: reg.email ?? '',
    name: buildName(reg),
    wa: reg.wa ?? null,
    source: (reg.source as any) ?? 'MASTER',
    status: (reg.status as any) ?? 'PENDING',
    isMasterMatch: reg.isMasterMatch ?? null,
    masterQuota: reg.masterQuota ?? null,
    issuedBefore: reg.issuedBefore ?? null,
    quotaRemaining: reg.quotaRemaining ?? computedRemaining,
    createdAt: reg.createdAt ?? new Date().toISOString(),
    updatedAt: reg.updatedAt ?? undefined,
  };
}

export default function ApprovePage() {
  const [items, setItems] = useState<UIRegistrant[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);

  const [status, setStatus] = useState<ReqStatus>('PENDING');
  const [source, setSource] = useState<Source>('MASTER'); // default MASTER
  const [q, setQ] = useState('');

  const [poolRemaining, setPoolRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const [counts, setCounts] = useState<Record<string, number>>({});

  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [useCount, setUseCount] = useState<number>(1);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastType, setToastType] = useState<'info' | 'success' | 'error'>('info');
  const [toastMsg, setToastMsg] = useState<string>('');

  const [issuedCodes, setIssuedCodes] = useState<string[] | null>(null);

  const eventId = useMemo(() => {
    if (typeof window === 'undefined') return EVENT_ID;
    const u = new URL(window.location.href);
    return u.searchParams.get('event') || EVENT_ID;
  }, []);

  async function fetchPool() {
    try {
      // coba /api/pool dulu
      const res = await fetch(`${API_BASE}/api/pool?eventId=${encodeURIComponent(eventId)}`);
      if (res.ok) {
        const json: PoolResponse = await res.json();
        if (json?.ok) {
          setPoolRemaining(typeof json.poolRemaining === 'number' ? json.poolRemaining : null);
          return;
        }
      }
      // fallback ke /api/snapshot (kamu laporkan 200)
      const snap = await fetch(`${API_BASE}/api/snapshot?eventId=${encodeURIComponent(eventId)}`);
      if (snap.ok) {
        const j = await snap.json();
        // tidak ada poolRemaining di snapshot; tampilkan jumlah next+active jika mau
        const count =
          (Array.isArray(j?.active) ? j.active.length : 0) +
          (Array.isArray(j?.next) ? j.next.length : 0);
        setPoolRemaining(Number.isFinite(count) ? count : null);
      }
    } catch {
      // diam2 aja, UI tetap jalan
    }
  }

  function normalizeResponse(list: RegistrantList, limitIn: number, offsetIn: number): RegistrantsResponseNormalized {
    const rows = (list.data ?? []).map(toUI);
    const totalN = typeof list.total === 'number' ? list.total : rows.length;
    return {
      items: rows,
      total: totalN,
      limit: typeof list.limit === 'number' ? list.limit : limitIn,
      offset: typeof list.offset === 'number' ? list.offset : offsetIn,
    };
  }

  async function fetchData(opts?: { append?: boolean; customOffset?: number }) {
    if (!API_BASE || !eventId) return;
    setLoading(true);
    try {
      const params: GetPendingParams = {
        eventId,
        status,
        source,
        limit,
        offset: typeof opts?.customOffset === 'number' ? opts.customOffset : offset,
        q: q.trim() || undefined,
      };
      const list = await getPendingRequests(params);
      const n = normalizeResponse(list, limit, params.offset ?? 0);
      setItems((prev) => (opts?.append ? [...prev, ...n.items] : n.items));
      setTotal(n.total);
      setLimit(n.limit);
      setOffset(n.offset);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchData();
    void fetchPool();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, source]);

  function incCount(id: string, max?: number) {
    setCounts((m) => {
      const cur = m[id] ?? 1;
      const next = Math.max(0, Math.min((max ?? 9999), cur + 1));
      return { ...m, [id]: next };
    });
  }
  function decCount(id: string) {
    setCounts((m) => {
      const cur = m[id] ?? 1;
      const next = Math.max(0, cur - 1);
      return { ...m, [id]: next };
    });
  }

  async function confirmOne(id: string) {
    const count = Math.max(0, counts[id] ?? 1);
    try {
      const json: { ok?: boolean; error?: string; message?: string; tickets?: { code: string }[] } =
        await approveRequest(id, count);
      if (json?.ok) {
        const codes = Array.isArray(json.tickets) ? json.tickets.map((t) => t.code) : [];
        if (codes.length > 0) {
          setIssuedCodes(codes);
        } else {
          setIssuedCodes(null);
          setToastType('success');
          setToastMsg('Konfirmasi dicatat. Kuota didonasikan (tanpa tiket).');
          setToastOpen(true);
        }
        await fetchData();
        await fetchPool();
      } else {
        setToastType('error');
        setToastMsg(json?.error || json?.message || 'Gagal konfirmasi.');
        setToastOpen(true);
      }
    } catch {
      setToastType('error');
      setToastMsg('Gagal menghubungi server.');
      setToastOpen(true);
    }
  }

  async function loadMore() {
    const nextOffset = offset + limit;
    await fetchData({ append: true, customOffset: nextOffset });
    setOffset(nextOffset);
  }

  const stillHasMore = items.length < total;

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
            onChange={(e) => { setStatus(e.target.value as ReqStatus); setOffset(0); setItems([]); }}
          >
            <option value="PENDING">PENDING</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="ALL">ALL</option>
          </select>

          <select
            className="w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm"
            value={source}
            onChange={(e) => { setSource(e.target.value as Source); setOffset(0); setItems([]); }}
          >
            <option value="MASTER">MASTER</option>
            <option value="ALL">ALL SOURCE</option>
            <option value="WALKIN">WALKIN</option>
            <option value="GIMMICK">GIMMICK</option>
          </select>

          <form onSubmit={(e) => { e.preventDefault(); setOffset(0); setItems([]); void fetchData(); }} className="flex w-full gap-2">
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

        {/* Cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.length === 0 && !loading && (
            <div className="col-span-full rounded-2xl border border-rose-100 bg-white p-6 text-center text-sm text-slate-500">
              Tidak ada data
            </div>
          )}

          {items.map((it) => {
            const def = Math.max(0, Math.min(it.source === 'MASTER' ? (it.quotaRemaining || 0) : 0, counts[it.id] ?? 1));
            const isPending = it.status === 'PENDING';
            return (
              <div key={it.id} className="rounded-2xl border border-rose-100 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#7a0f2b]">{it.name}</div>
                    <div className="text-xs text-slate-500">{it.email}</div>
                    {it.wa && <div className="text-[11px] text-slate-400">WA: {it.wa}</div>}
                  </div>
                  <span className="rounded-lg border border-rose-200 bg-rose-50/60 px-2 py-1 text-[11px]">{it.source}</span>
                </div>

                <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
                  <div> Dibuat: <b className="text-slate-700">{new Date(it.createdAt).toLocaleString()}</b></div>
                  <div>Status: <b className="text-slate-700">{it.status}</b></div>
                </div>

                <div className="mb-3 flex items-center justify-between">
                  <div className="text-xs text-slate-600">
                    Quota MASTER: <b>{it.source === 'MASTER' ? it.quotaRemaining : '—'}</b>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" className="h-8 w-8 rounded-lg border border-rose-200 text-sm" onClick={() => decCount(it.id)} disabled={!isPending}>–</button>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={def}
                      onChange={(e) => setCounts((m) => ({ ...m, [it.id]: Math.max(0, Number(e.target.value || 0)) }))}
                      className="w-14 rounded-lg border border-rose-200 px-2 py-1 text-center text-sm"
                      disabled={!isPending}
                    />
                    <button
                      type="button"
                      className="h-8 w-8 rounded-lg border border-rose-200 text-sm"
                      onClick={() => incCount(it.id, it.source === 'MASTER' ? it.quotaRemaining ?? undefined : 9999)}
                      disabled={!isPending}
                    >+</button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  {isPending ? (
                    <button
                      className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:opacity-95"
                      onClick={() => confirmOne(it.id)}
                    >
                      Confirm
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400">Sudah diproses</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {stillHasMore && (
          <div className="mt-4 flex justify-center">
            <button onClick={loadMore} className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm" disabled={loading}>
              {loading ? 'Memuat…' : 'Load more'}
            </button>
          </div>
        )}
      </div>

      {/* Fallback dialog (desktop) */}
      {confirmId && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-rose-100 bg-white p-5 shadow-xl">
            <h3 className="mb-2 text-base font-bold">Konfirmasi Registrasi</h3>
            <p className="mb-3 text-sm text-slate-600">Tentukan jumlah slot yang dipakai (<code>useCount</code>).</p>
            <input
              type="number"
              min={0}
              step={1}
              value={useCount}
              onChange={(e) => setUseCount(Math.max(0, Number(e.target.value || 0)))}
              className="mb-4 w-full rounded-xl border border-rose-200 px-3 py-2 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button className="rounded-xl border px-3 py-2 text-sm" onClick={() => setConfirmId(null)}>Batal</button>
              <button
                className="rounded-xl bg-[#7a0f2b] px-3 py-2 text-sm font-semibold text-white"
                onClick={() => { if (!confirmId) return; void confirmOne(confirmId); setConfirmId(null); }}
              >Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nomor Antrean */}
      {issuedCodes && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-rose-100 bg-white p-6 shadow-xl">
            <h3 className="mb-3 text-base font-bold">Nomor Antrean</h3>
            <div className="grid grid-cols-3 gap-2">
              {issuedCodes.map((c) => (
                <div key={c} className="rounded-xl border border-rose-200 bg-rose-50/40 px-3 py-2 text-center font-semibold text-[#7a0f2b]">
                  {fmtCode(c)}
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded-xl border px-3 py-2 text-sm" onClick={() => { try { void navigator.clipboard?.writeText(issuedCodes.join(', ')); } catch {} }}>
                Salin
              </button>
              <button className="rounded-xl bg-[#7a0f2b] px-3 py-2 text-sm font-semibold text-white" onClick={() => setIssuedCodes(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast open={toastOpen} type={toastType} message={toastMsg} onClose={() => setToastOpen(false)} />
    </main>
  );
}

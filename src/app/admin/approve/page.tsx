'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { getPendingRequests } from '@/lib/approveApi'; // tetap pakai list dari approveApi
import type { GetPendingParams, Registrant, RegistrantList } from '@/lib/approveApi';

import { confirmRequest, fetchPool } from '@/lib/queueApi';

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

// ---------- Safe access helpers (hindari `any`) ----------
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function getString(obj: unknown, key: string): string | undefined {
  if (isRecord(obj)) {
    const v = obj[key];
    if (typeof v === 'string') return v;
  }
  return undefined;
}

function getNumber(obj: unknown, key: string): number | undefined {
  if (isRecord(obj)) {
    const v = obj[key];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
  }
  return undefined;
}

function getBoolean(obj: unknown, key: string): boolean | undefined {
  if (isRecord(obj)) {
    const v = obj[key];
    if (typeof v === 'boolean') return v;
  }
  return undefined;
}

function getOptionalString(obj: unknown, key: string): string | undefined {
  return getString(obj, key);
}

// ---------- error helper ----------
type ApiError = { message?: string; reason?: string; toString?: () => string };
function toErrorMessage(err: unknown): string {
  if (typeof err === 'string') return err;
  if (isRecord(err)) {
    const e = err as ApiError;
    return e.message || e.reason || e.toString?.() || 'Unknown error';
  }
  return 'Unknown error';
}

// ---------- types agar longgar ----------
type RegistrantLite = Registrant & {
  createdAt?: string | null;
  updatedAt?: string | null;
  quotaRemaining?: number | null;
  masterQuota?: number | null;
  issuedBefore?: number | null;
  eventId?: string | null;
  wa?: string | null;
  source?: string | null;
  status?: string | null;
  id?: string | null;
  email?: string | null;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

function buildName(r: Registrant | RegistrantLite): string {
  const byName = typeof r.name === 'string' && r.name.trim().length > 0 ? r.name.trim() : null;
  if (byName) return byName;

  const first = getString(r, 'firstName')?.trim() || '';
  const last = getString(r, 'lastName')?.trim() || '';
  const composed = [first, last].filter(Boolean).join(' ');
  if (composed) return composed;

  const email = typeof r.email === 'string' ? r.email : getString(r, 'email');
  const id = typeof r.id === 'string' ? r.id : getString(r, 'id');
  return email || id || '';
}

function safeIso(d?: string | null): string {
  try {
    if (!d) return new Date().toISOString();
    const t = new Date(d);
    if (isNaN(t.getTime())) return new Date().toISOString();
    return t.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function toUI(reg: Registrant | RegistrantLite): UIRegistrant {
  const masterQuota = getNumber(reg, 'masterQuota') ?? 0;
  const issuedBefore = getNumber(reg, 'issuedBefore') ?? 0;
  const computedRemaining = Math.max(0, masterQuota - issuedBefore);
  const evId = getOptionalString(reg, 'eventId');

  const idRaw =
    (typeof (reg as Registrant).id === 'string' ? (reg as Registrant).id : undefined) ||
    getString(reg, 'id') ||
    '';

  const emailRaw =
    (typeof (reg as Registrant).email === 'string' ? (reg as Registrant).email : undefined) ||
    getString(reg, 'email') ||
    '';

  const createdAtRaw =
    (typeof (reg as RegistrantLite).createdAt === 'string' ? (reg as RegistrantLite).createdAt : undefined) ||
    getOptionalString(reg, 'createdAt') ||
    null;

  const updatedAtRaw =
    (typeof (reg as RegistrantLite).updatedAt === 'string' ? (reg as RegistrantLite).updatedAt : undefined) ||
    getOptionalString(reg, 'updatedAt');

  const waRaw =
    (typeof (reg as RegistrantLite).wa === 'string' ? (reg as RegistrantLite).wa : undefined) ||
    getString(reg, 'wa') ||
    null;

  const sourceRaw =
    (typeof (reg as RegistrantLite).source === 'string' ? (reg as RegistrantLite).source : undefined) ||
    getString(reg, 'source') ||
    'MASTER';

  const statusRaw =
    (typeof (reg as RegistrantLite).status === 'string' ? (reg as RegistrantLite).status : undefined) ||
    getString(reg, 'status') ||
    'PENDING';

  const isMasterMatchRaw =
    (typeof getBoolean(reg, 'isMasterMatch') === 'boolean' ? getBoolean(reg, 'isMasterMatch') : undefined) ?? null;

  const quotaRemainingRaw =
    (typeof (reg as RegistrantLite).quotaRemaining === 'number' ? (reg as RegistrantLite).quotaRemaining : undefined) ??
    getNumber(reg, 'quotaRemaining');

  return {
    id: idRaw,
    eventId: evId,
    email: emailRaw,
    name: buildName(reg),
    wa: waRaw,
    source: sourceRaw,
    status: statusRaw,
    isMasterMatch: isMasterMatchRaw,
    masterQuota: masterQuota ?? null,
    issuedBefore: issuedBefore ?? null,
    quotaRemaining: typeof quotaRemainingRaw === 'number' ? quotaRemainingRaw : computedRemaining,
    createdAt: safeIso(createdAtRaw),
    updatedAt: updatedAtRaw,
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

  const [toastOpen, setToastOpen] = useState(false);
  const [toastType, setToastType] = useState<'info' | 'success' | 'error'>('info');
  const [toastMsg, setToastMsg] = useState<string>('');

  const [issuedCodes, setIssuedCodes] = useState<string[] | null>(null);

  const eventId = useMemo(() => {
    if (typeof window === 'undefined') return EVENT_ID;
    const u = new URL(window.location.href);
    return u.searchParams.get('event') || EVENT_ID;
  }, []);

  async function refreshPool() {
    try {
      const r = await fetchPool();
      setPoolRemaining(typeof r.pool === 'number' ? r.pool : null);
    } catch {
      // diam
    }
  }

  function normalizeResponse(list: RegistrantList, limitIn: number, offsetIn: number): RegistrantsResponseNormalized {
    const rows = (list.data ?? []).map((reg) => toUI(reg as RegistrantLite));
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
    void refreshPool();
    const t = setInterval(() => {
      void refreshPool();
    }, 3000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, source]);

  function incCount(id: string, max?: number) {
    setCounts((m) => {
      const cur = m[id] ?? 1;
      const next = Math.max(0, Math.min(max ?? 9999, cur + 1));
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
    const count = Math.max(1, counts[id] ?? 1);
    try {
      const res = await confirmRequest(id, count);
      if (res?.ok && res.ticket?.code) {
        setIssuedCodes([res.ticket.code]);
        setToastType('success');
        setToastMsg(`Approved: ${res.ticket.code}`);
        setToastOpen(true);
        await fetchData();
        await refreshPool();
      } else {
        setToastType('error');
        setToastMsg('Konfirmasi tercatat tapi tiket tidak terbaca.');
        setToastOpen(true);
      }
    } catch (e: unknown) {
      setToastType('error');
      setToastMsg(toErrorMessage(e) || 'Gagal konfirmasi.');
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
            onChange={(e) => {
              setStatus(e.target.value as ReqStatus);
              setOffset(0);
              setItems([]);
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
              setSource(e.target.value as Source);
              setOffset(0);
              setItems([]);
            }}
          >
            <option value="MASTER">MASTER</option>
            <option value="ALL">ALL SOURCE</option>
            <option value="WALKIN">WALKIN</option>
            <option value="GIMMICK">GIMMICK</option>
          </select>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setOffset(0);
              setItems([]);
              void fetchData();
            }}
            className="flex w-full gap-2"
          >
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
            const def = Math.max(1, counts[it.id] ?? 1);
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
                  <div>
                    {' '}
                    Dibuat:{' '}
                    <b className="text-slate-700">{new Date(it.createdAt).toLocaleString()}</b>
                  </div>
                  <div>
                    Status: <b className="text-slate-700">{it.status}</b>
                  </div>
                </div>

                <div className="mb-3 flex items-center justify-between">
                  <div className="text-xs text-slate-600">
                    Quota MASTER: <b>{it.source === 'MASTER' ? it.quotaRemaining : '—'}</b>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="h-8 w-8 rounded-lg border border-rose-200 text-sm"
                      onClick={() => decCount(it.id)}
                      disabled={!isPending}
                    >
                      –
                    </button>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={def}
                      onChange={(e) =>
                        setCounts((m) => ({
                          ...m,
                          [it.id]: Math.max(1, Number(e.target.value || 1)),
                        }))
                      }
                      className="w-14 rounded-lg border border-rose-200 px-2 py-1 text-center text-sm"
                      disabled={!isPending}
                    />
                    <button
                      type="button"
                      className="h-8 w-8 rounded-lg border border-rose-200 text-sm"
                      onClick={() =>
                        incCount(it.id, it.source === 'MASTER' ? it.quotaRemaining ?? undefined : 9999)
                      }
                      disabled={!isPending}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  {isPending ? (
                    <button
                      className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:opacity-95"
                      onClick={() => void confirmOne(it.id)}
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
            <button
              onClick={loadMore}
              className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm"
              disabled={loading}
            >
              {loading ? 'Memuat…' : 'Load more'}
            </button>
          </div>
        )}
      </div>

      {/* Modal Nomor Antrean */}
      {issuedCodes && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-rose-100 bg-white p-6 shadow-xl">
            <h3 className="mb-3 text-base font-bold">Nomor Antrean</h3>
            <div className="grid grid-cols-3 gap-2">
              {issuedCodes.map((c) => (
                <div
                  key={c}
                  className="rounded-xl border border-rose-200 bg-rose-50/40 px-3 py-2 text-center font-semibold text-[#7a0f2b]"
                >
                  {fmtCode(c)}
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="rounded-xl border px-3 py-2 text-sm"
                onClick={() => {
                  try {
                    void navigator.clipboard?.writeText(issuedCodes.join(', '));
                  } catch {
                    // ignore
                  }
                }}
              >
                Salin
              </button>
              <button
                className="rounded-xl bg-[#7a0f2b] px-3 py-2 text-sm font-semibold text-white"
                onClick={() => setIssuedCodes(null)}
              >
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

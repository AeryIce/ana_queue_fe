// src/lib/approveApi.ts

const RAW_BASE = process.env.NEXT_PUBLIC_QUEUE_API ?? '';
const BASE = RAW_BASE.replace(/\/+$/, '');
const EVENT = process.env.NEXT_PUBLIC_EVENT_ID || 'seed-event';

export interface Registrant {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  source?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RegistrantList {
  data: Registrant[];
  total?: number;
}

type HttpOk<T> = { ok: true; data: T };
type HttpErr = { ok: false; status: number; msg: string };

async function httpGet<T>(url: string): Promise<HttpOk<T> | HttpErr> {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) return { ok: false, status: r.status, msg: await safeText(r) };
  return { ok: true, data: (await r.json()) as T };
}

async function safeText(r: Response) {
  try { return await r.text(); } catch { return ''; }
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function pickArray(v: unknown, key: 'data' | 'items'): unknown[] | null {
  if (!isObj(v)) return null;
  const val = v[key];
  return Array.isArray(val) ? val : null;
}

function pickNum(v: unknown, key: 'total' | 'count'): number | undefined {
  if (!isObj(v)) return undefined;
  const n = v[key];
  return typeof n === 'number' ? n : undefined;
}

function normalizeRegistrantList(input: unknown): RegistrantList {
  // 1) Bentuk { data: [] }
  const asData = pickArray(input, 'data');
  if (asData) {
    return {
      data: asData as Registrant[],
      total: pickNum(input, 'total') ?? pickNum(input, 'count') ?? asData.length,
    };
  }
  // 2) Bentuk { items: [] }
  const asItems = pickArray(input, 'items');
  if (asItems) {
    return {
      data: asItems as Registrant[],
      total: pickNum(input, 'total') ?? pickNum(input, 'count') ?? asItems.length,
    };
  }
  // 3) Bentuk [] langsung
  if (Array.isArray(input)) {
    return { data: input as Registrant[], total: input.length };
  }
  // 4) Default kosong
  return { data: [], total: 0 };
}

/** Get pending requests (Approve List) dengan fallback beberapa route. */
export async function getPendingRequests(): Promise<RegistrantList> {
  const qs = new URLSearchParams({
    eventId: EVENT,
    status: 'PENDING',
    source: 'MASTER',
    limit: String(10),
    offset: String(0),
  });

  const candidates = [
    '/api/registrants',        // lama (saat ini 404 di env kamu)
    '/api/register-request',   // kemungkinan baru
    '/api/register/requests',  // variasi
    '/api/registrations',      // variasi lain
    '/api/register-queue',     // fallback sesuai file lama
  ];

  let lastErr: HttpErr | null = null;

  for (const path of candidates) {
    const url = `${BASE}${path}?${qs.toString()}`;
    const res = await httpGet<unknown>(url);
    if (res.ok) {
      return normalizeRegistrantList(res.data);
    }
    lastErr = res;
    if (res.status === 401 || res.status === 403) break;
  }

  const s = lastErr?.status ?? 0;
  const m = lastErr?.msg ?? 'No route matched';
  throw new Error(`[getPendingRequests] failed (${s}): ${m}`);
}

/** Approve request */
export async function approveRequest(id: string, useCount: number = 1) {
  const res = await fetch(`${BASE}/api/register-confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ requestId: id, useCount, eventId: EVENT }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '<no body>');
    throw new Error(`${res.status} ${res.statusText} → ${text}`);
  }
  return res.json();
}

/** Reject request (akan throw jika route BE belum ada) */
export async function rejectRequest(id: string) {
  const res = await fetch(`${BASE}/api/register-reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId: id, eventId: EVENT, reason: 'Rejected from UI' }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '<no body>');
    throw new Error(`${res.status} ${res.statusText} → ${text}`);
  }
  return res.json();
}

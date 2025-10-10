// src/lib/approveApi.ts
/**
 * Catatan:
 * - Tetap expose tiga fungsi yang dipakai page.tsx:
 *   getPendingRequests, approveRequest, rejectRequest
 * - getPendingRequests sekarang punya fallback berantai (beberapa kandidat route),
 *   agar tidak 404 ketika BE rename endpoint.
 * - approveRequest menambahkan eventId (sesuai catatanmu).
 * - rejectRequest dibiarkan hit /api/register-reject; kalau 404/501 akan throw
 *   dan nanti UI bisa tangani (tidak bikin build gagal).
 */

const RAW_BASE = process.env.NEXT_PUBLIC_QUEUE_API ?? '';
const BASE = RAW_BASE.replace(/\/+$/, '');
const EVENT = process.env.NEXT_PUBLIC_EVENT_ID || 'seed-event';

type HttpOk<T> = { ok: true; data: T };
type HttpErr = { ok: false; status: number; msg: string };

async function httpGet<T>(url: string): Promise<HttpOk<T> | HttpErr> {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) return { ok: false, status: r.status, msg: await safeText(r) };
  return { ok: true, data: (await r.json()) as T };
}

async function httpPost<T>(url: string, body: unknown): Promise<HttpOk<T> | HttpErr> {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) return { ok: false, status: r.status, msg: await safeText(r) };
  return { ok: true, data: (await r.json()) as T };
}

async function safeText(r: Response) {
  try { return await r.text(); } catch { return ''; }
}

async function throwWithBody(res: Response) {
  const text = await res.text().catch(() => '<no body>');
  throw new Error(`${res.status} ${res.statusText} → ${text}`);
}

/** =========================
 *  GET pending requests (Approve List)
 *  ========================= */
export async function getPendingRequests() {
  // kandidat route untuk kompatibilitas BE lama/baru
  const qs = new URLSearchParams({
    eventId: EVENT,
    status: 'PENDING',
    source: 'MASTER',
    limit: String(10),
    offset: String(0),
  });

  const candidates = [
    '/api/registrants',        // lama (saat ini 404 di env-mu)
    '/api/register-request',   // kemungkinan baru
    '/api/register/requests',  // variasi
    '/api/registrations',      // variasi lain
    '/api/register-queue',     // fallback sesuai file aslimu
  ];

  let lastErr: HttpErr | null = null;

  for (const path of candidates) {
    const url = `${BASE}${path}?${qs.toString()}`;
    const res = await httpGet<any>(url);
    if (res.ok) {
      const raw = res.data as any;

      // Normalisasi payload → { data, total }
      const data =
        raw?.data ??
        raw?.items ??
        raw?.results ??
        raw?.rows ??
        (Array.isArray(raw) ? raw : []);

      const total =
        raw?.total ??
        raw?.count ??
        (Array.isArray(data) ? data.length : undefined);

      return { data, total };
    }
    // simpan error & lanjut kandidat berikut
    lastErr = res;
    if (res.status === 401 || res.status === 403) break;
  }

  const s = lastErr?.status ?? 0;
  const m = lastErr?.msg ?? 'No route matched';
  throw new Error(`[getPendingRequests] failed (${s}): ${m}`);
}

/** =========================
 *  POST approve request
 *  ========================= */
export async function approveRequest(id: string, useCount: number = 1) {
  const res = await fetch(`${BASE}/api/register-confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ requestId: id, useCount, eventId: EVENT }),
  });
  if (!res.ok) await throwWithBody(res);
  return res.json();
}

/** =========================
 *  POST reject request
 *  =========================
 *  Biarkan throw kalau BE belum menyediakan route ini.
 */
export async function rejectRequest(id: string) {
  const res = await fetch(`${BASE}/api/register-reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId: id, eventId: EVENT, reason: 'Rejected from UI' }),
  });
  if (!res.ok) await throwWithBody(res);
  return res.json();
}

// Normalisasi base URL & event dari ENV
const RAW_BASE = process.env.NEXT_PUBLIC_QUEUE_API ?? '';
const BASE = RAW_BASE.replace(/\/+$/, ''); // trim trailing slash
const EVENT = process.env.NEXT_PUBLIC_EVENT_ID || 'seed-event';

// Helper untuk melempar error dengan isi response BE (biar gampang debug)
async function throwWithBody(res: Response) {
  const text = await res.text().catch(() => '<no body>');
  throw new Error(`${res.status} ${res.statusText} → ${text}`);
}

/**
 * Ambil daftar request berstatus PENDING dari BE
 * BE route: GET /api/register-queue?eventId=...&status=PENDING
 */
export async function getPendingRequests() {
  const url = `${BASE}/api/register-queue?eventId=${encodeURIComponent(
    EVENT
  )}&status=PENDING`;

  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) await throwWithBody(r);
  // BE bisa balikin array langsung atau { items: [] } — biarin page yang normalize
  return r.json();
}

/**
 * Approve satu request
 * BE route: POST /api/register-confirm
 * Body: { requestId, useCount }
 */
export async function approveRequest(id: string) {
  const r = await fetch(`${BASE}/api/register-confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId: id, useCount: 1 }),
  });
  if (!r.ok) await throwWithBody(r);
  return r.json();
}

/**
 * Reject request (opsional)
 * Catatan: kalau endpoint belum ada di BE, ini akan throw
 * → Page kamu sudah menampilkan error message kok, jadi aman.
 * Kalau nanti tersedia, samakan payload { requestId, reason }
 */
export async function rejectRequest(id: string) {
  const r = await fetch(`${BASE}/api/register-reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId: id, reason: 'Rejected from UI' }),
  });
  if (!r.ok) await throwWithBody(r);
  return r.json();
}

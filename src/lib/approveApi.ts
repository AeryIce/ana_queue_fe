// src/lib/approveApi.ts
const RAW_BASE = process.env.NEXT_PUBLIC_QUEUE_API ?? '';
const BASE = RAW_BASE.replace(/\/+$/, '');
const EVENT = process.env.NEXT_PUBLIC_EVENT_ID || 'seed-event';

async function throwWithBody(res: Response) {
  const text = await res.text().catch(() => '<no body>');
  throw new Error(`${res.status} ${res.statusText} → ${text}`);
}

export async function getPendingRequests() {
  const url = `${BASE}/api/register-queue?eventId=${encodeURIComponent(EVENT)}&status=PENDING`;
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) await throwWithBody(r);
  return r.json();
}

export async function approveRequest(id: string, useCount: number = 1) {
  const r = await fetch(`${BASE}/api/register-confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    // ⬅️ sertakan eventId juga
    body: JSON.stringify({ requestId: id, useCount, eventId: EVENT }),
  });
  if (!r.ok) await throwWithBody(r);
  return r.json();
}

export async function rejectRequest(id: string) {
  // kalau belum ada di BE, ini akan throw → tertangkap di UI
  const r = await fetch(`${BASE}/api/register-reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId: id, eventId: EVENT, reason: 'Rejected from UI' }),
  });
  if (!r.ok) await throwWithBody(r);
  return r.json();
}

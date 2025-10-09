// src/lib/queueApi.ts

const BASE = process.env.NEXT_PUBLIC_QUEUE_API!;
const ENV_EVENT_ID = process.env.NEXT_PUBLIC_EVENT_ID!;

// ---- Types used by FE (ringan, fleksibel)
export type Ticket = {
  id: string;
  code?: string | null;
  name?: string | null;
  status?: string | null;
  order?: number | null;
  slotNo?: number | null;
  batchNo?: number | null;
  posInBatch?: number | null;
};

// ---- Board (pakai alias lama /api/pool supaya kompatibel TV/FE lama)
export async function getBoard(eventId?: string) {
  const eid = eventId ?? ENV_EVENT_ID;
  const r = await fetch(`${BASE}/api/pool?eventId=${eid}`, { cache: 'no-store' });
  if (!r.ok) throw new Error(`getBoard failed: ${r.status}`);
  return r.json();
}

// ---- Team B actions (pakai alias lama /api/* yg sudah dimirroring ke /ops/*)
export async function callNext6() {
  const r = await fetch(`${BASE}/api/call-next?eventId=${ENV_EVENT_ID}`, { method: 'POST' });
  if (!r.ok) throw new Error(`callNext6 failed: ${r.status}`);
  return r.json();
}

export async function promoteToActive() {
  const r = await fetch(`${BASE}/api/promote?eventId=${ENV_EVENT_ID}`, { method: 'POST' });
  if (!r.ok) throw new Error(`promote failed: ${r.status}`);
  return r.json();
}

export async function skipTicket(id: string) {
  const r = await fetch(`${BASE}/api/skip/${encodeURIComponent(id)}?eventId=${ENV_EVENT_ID}`, { method: 'POST' });
  if (!r.ok) throw new Error(`skip failed: ${r.status}`);
  return r.json();
}

export async function recallTicket(id: string) {
  const r = await fetch(`${BASE}/api/recall/${encodeURIComponent(id)}?eventId=${ENV_EVENT_ID}`, { method: 'POST' });
  if (!r.ok) throw new Error(`recall failed: ${r.status}`);
  return r.json();
}

export async function doneTicket(id: string) {
  const r = await fetch(`${BASE}/api/done/${encodeURIComponent(id)}?eventId=${ENV_EVENT_ID}`, { method: 'POST' });
  if (!r.ok) throw new Error(`done failed: ${r.status}`);
  return r.json();
}

// ---- Legacy Admin actions by CODE (dipakai Admin page lama)
// Endpoint ini tersedia di AppController legacy: /api/tickets/:code/...
export async function setInProcess(code: string) {
  const r = await fetch(`${BASE}/api/tickets/${encodeURIComponent(code)}/in-process`, { method: 'PATCH' });
  if (!r.ok) throw new Error(`setInProcess failed: ${r.status}`);
  return r.json();
}

export async function setDone(code: string) {
  const r = await fetch(`${BASE}/api/tickets/${encodeURIComponent(code)}/done`, { method: 'PATCH' });
  if (!r.ok) throw new Error(`setDone failed: ${r.status}`);
  return r.json();
}

export async function setSkip(code: string) {
  const r = await fetch(`${BASE}/api/tickets/${encodeURIComponent(code)}/skip`, { method: 'PATCH' });
  if (!r.ok) throw new Error(`setSkip failed: ${r.status}`);
  return r.json();
}

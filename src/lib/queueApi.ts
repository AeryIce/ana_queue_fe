// src/lib/queueApi.ts

// --- ENV ---
const RAW_BASE = process.env.NEXT_PUBLIC_QUEUE_API ?? '';
const BASE = RAW_BASE.replace(/\/+$/, ''); // trim trailing slash
const ENV_EVENT_ID = process.env.NEXT_PUBLIC_EVENT_ID || 'seed-event';

// ---- Types used by FE (ringan, fleksibel)
export type TicketStatus =
  | 'PENDING'
  | 'QUEUED'
  | 'ACTIVE'
  | 'DONE'
  | 'SKIPPED'
  | 'CALLED'
  | (string & {});

export type Ticket = {
  id?: string;
  code?: string | null;
  name?: string | null;
  status?: TicketStatus | null;
  order?: number | null;
};

export type BoardResponse = {
  active?: Ticket[];
  queue?: Ticket[];
  next?: Ticket[];
  skipGrid?: Ticket[];
  nextCount?: number;
  totals?: Record<string, unknown>;
  [k: string]: unknown;
};

export type NormalizedBoard = {
  active: Ticket[];
  next: Ticket[];
  queue: Ticket[];
  skipGrid: Ticket[];
  nextCount: number;
  totals: Record<string, unknown>;
} & BoardResponse;

export function normalizeBoard(b?: BoardResponse | null): NormalizedBoard {
  const board = b ?? {};
  const nextArr = board.next ?? [];
  return {
    active: board.active ?? [],
    next: nextArr,
    queue: board.queue ?? [],
    skipGrid: board.skipGrid ?? [],
    nextCount: typeof board.nextCount === 'number'
      ? board.nextCount
      : Array.isArray(nextArr) ? nextArr.length : 0,
    totals: (board.totals ?? {}) as Record<string, unknown>,
    ...board,
  };
}

// ---- Pool
export async function fetchPool() {
  const EVENT = ENV_EVENT_ID;
  const res = await fetch(`${BASE}/api/pool?eventId=${encodeURIComponent(EVENT)}`, { cache: 'no-store' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.reason || 'Gagal memuat pool');
  // BE kita mengembalikan { ok, eventId, pool }
  return data as { ok: boolean; eventId: string; pool: number; method?: string };
}

// ---- Confirm (legacy payload)
export async function confirmRequest(requestId: string, useCount = 1) {
  const EVENT = ENV_EVENT_ID;

  const res = await fetch(`${BASE}/api/register-confirm`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      requestId,
      useCount,
      eventId: EVENT,
      source: 'MASTER',
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data?.message || 'Approve gagal').toString();
    throw new Error(msg);
  }
  return data as {
    ok: boolean;
    ticket: { code: string; status: string; name: string; email: string };
    allocatedRange: { from: number; to: number };
    count: number;
  };
}

// ---- (Opsional) Board snapshot sederhana
export async function getBoard(eventId?: string): Promise<BoardResponse> {
  const eid = eventId ?? ENV_EVENT_ID;
  const r = await fetch(`${BASE}/api/board?eventId=${encodeURIComponent(eid)}`, { cache: 'no-store' });
  if (!r.ok) throw new Error(`getBoard failed: ${r.status}`);
  return r.json();
}

// ---- Ops ringan (tanpa batch)
export async function promoteToActive() {
  const r = await fetch(`${BASE}/api/promote?eventId=${encodeURIComponent(ENV_EVENT_ID)}`, { method: 'POST' });
  if (!r.ok) throw new Error(`promote failed: ${r.status}`);
  return r.json();
}
export async function doneTicket(id: string) {
  const r = await fetch(`${BASE}/api/done/${encodeURIComponent(id)}?eventId=${encodeURIComponent(ENV_EVENT_ID)}`, { method: 'POST' });
  if (!r.ok) throw new Error(`done failed: ${r.status}`);
  return r.json();
}
export async function skipTicket(id: string) {
  const r = await fetch(`${BASE}/api/skip/${encodeURIComponent(id)}?eventId=${encodeURIComponent(ENV_EVENT_ID)}`, { method: 'POST' });
  if (!r.ok) throw new Error(`skip failed: ${r.status}`);
  return r.json();
}
export async function recallTicket(id: string) {
  const r = await fetch(`${BASE}/api/recall/${encodeURIComponent(id)}?eventId=${encodeURIComponent(ENV_EVENT_ID)}`, { method: 'POST' });
  if (!r.ok) throw new Error(`recall failed: ${r.status}`);
  return r.json();
}

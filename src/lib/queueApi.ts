// src/lib/queueApi.ts

// --- ENV ---
const RAW_BASE = process.env.NEXT_PUBLIC_QUEUE_API ?? '';
const BASE = RAW_BASE.replace(/\/+$/, ''); // trim trailing slash
const ENV_EVENT_ID = process.env.NEXT_PUBLIC_EVENT_ID || 'seed-event';

// ---- Types used by FE (ringan, fleksibel)
export type Ticket = {
  id: string;
  code?: string | null;
  name?: string | null;
  status?: TicketStatus | null;
  order?: number | null;
  slotNo?: number | null;
  batchNo?: number | null;
  posInBatch?: number | null;
};

// Struktur respons board
export type BoardResponse = {
  active?: Ticket[];
  next?: Ticket[];
  queue?: Ticket[];
  queued?: Ticket[];          // beberapa BE pakai "queued"
  skipGrid?: Ticket[];
  nextCount?: number;
  totals?: Record<string, unknown>;
  ts?: string;
  lastUpdate?: string;
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
    queue: board.queue ?? board.queued ?? [],
    skipGrid: board.skipGrid ?? [],
    nextCount:
      typeof board.nextCount === 'number'
        ? board.nextCount
        : Array.isArray(nextArr)
        ? nextArr.length
        : 0,
    totals: (board.totals ?? {}) as Record<string, unknown>,
    ...board,
  };
}

// ---- Board (alias lama /api/pool untuk kompat FE/TV lama)
export async function getBoard(eventId?: string): Promise<BoardResponse> {
  const eid = eventId ?? ENV_EVENT_ID;
  const r = await fetch(`${BASE}/api/pool?eventId=${encodeURIComponent(eid)}`, {
    cache: 'no-store',
  });
  if (!r.ok) throw new Error(`getBoard failed: ${r.status}`);
  return r.json();
}

// ---- Actions
export async function callNext(count?: number, eventId?: string) {
  const n =
    Number.isFinite(count as number) && (count as number)! > 0
      ? Math.floor(count as number)
      : undefined;
  const eid = eventId ?? ENV_EVENT_ID;
  const url =
    `${BASE}/api/call-next?eventId=${encodeURIComponent(eid)}` +
    (n ? `&count=${n}` : '');
  const r = await fetch(url, { method: 'POST' });
  if (!r.ok) throw new Error(`callNext failed: ${r.status}`);
  return r.json();
}

export async function callNext6() {
  return callNext(6);
}

export async function promoteToActive() {
  const r = await fetch(
    `${BASE}/api/promote?eventId=${encodeURIComponent(ENV_EVENT_ID)}`,
    { method: 'POST' },
  );
  if (!r.ok) throw new Error(`promote failed: ${r.status}`);
  return r.json();
}

export async function skipTicket(id: string) {
  const r = await fetch(
    `${BASE}/api/skip/${encodeURIComponent(id)}?eventId=${encodeURIComponent(
      ENV_EVENT_ID,
    )}`,
    { method: 'POST' },
  );
  if (!r.ok) throw new Error(`skip failed: ${r.status}`);
  return r.json();
}

export async function recallTicket(id: string) {
  const r = await fetch(
    `${BASE}/api/recall/${encodeURIComponent(id)}?eventId=${encodeURIComponent(
      ENV_EVENT_ID,
    )}`,
    { method: 'POST' },
  );
  if (!r.ok) throw new Error(`recall failed: ${r.status}`);
  return r.json();
}

export async function doneTicket(id: string) {
  const r = await fetch(
    `${BASE}/api/done/${encodeURIComponent(id)}?eventId=${encodeURIComponent(
      ENV_EVENT_ID,
    )}`,
    { method: 'POST' },
  );
  if (!r.ok) throw new Error(`done failed: ${r.status}`);
  return r.json();
}

// ---- Legacy Admin actions by CODE (dipakai Admin lama)
export async function setInProcess(code: string) {
  const r = await fetch(
    `${BASE}/api/tickets/${encodeURIComponent(code)}/in-process`,
    { method: 'PATCH' },
  );
  if (!r.ok) throw new Error(`setInProcess failed: ${r.status}`);
  return r.json();
}

export async function setDone(code: string) {
  const r = await fetch(
    `${BASE}/api/tickets/${encodeURIComponent(code)}/done`,
    { method: 'PATCH' },
  );
  if (!r.ok) throw new Error(`setDone failed: ${r.status}`);
  return r.json();
}

export async function setSkip(code: string) {
  const r = await fetch(
    `${BASE}/api/tickets/${encodeURIComponent(code)}/skip`,
    { method: 'PATCH' },
  );
  if (!r.ok) throw new Error(`setSkip failed: ${r.status}`);
  return r.json();
}

// ==== Compatibility aliases (biar UI lama tak diubah) ====

// AdminToolbar masih import fetchBoard → alias ke getBoard
export { getBoard as fetchBoard };

// AdminToolbar panggil callNext(N, eventId) → terima parameter opsional
// (sudah di-handle di callNext di atas)

// AdminToolbar panggil callByCode(t.code) meski bisa null → terima nullable
export async function callByCode(code?: string | null) {
  if (!code) throw new Error('Missing ticket code');
  return setInProcess(code);
}
// status tiket (longgar + cover enum yang umum di BE kita)
export type TicketStatus =
  | 'PENDING'
  | 'QUEUED'
  | 'ACTIVE'
  | 'IN_PROCESS'
  | 'DONE'
  | 'SKIPPED'
  | 'DEFERRED'
  | 'CALLED'
  | 'CANCELLED'
  | (string & {}); // fallback agar aman kalau BE kirim status lain

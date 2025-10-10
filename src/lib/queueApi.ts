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
  | 'IN_PROCESS'
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

// Snapshot board dari BE (longgar: field bisa bertambah)
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

// Respons generic untuk operasi mutasi (promote/done/skip/recall/dll)
export type MutateResponse = {
  ok?: boolean;
  message?: string;
  [k: string]: unknown;
};

// Respons spesifik pool & confirm
export type PoolResponse = {
  ok: boolean;
  eventId: string;
  pool: number;
  method?: string;
};

export type ConfirmResponse = {
  ok: boolean;
  ticket: { code: string; status: string; name: string; email: string };
  allocatedRange: { from: number; to: number };
  count: number;
};

// Util: normalisasi board
export function normalizeBoard(b?: BoardResponse | null): NormalizedBoard {
  const board = b ?? {};
  const nextArr = board.next ?? [];
  return {
    active: board.active ?? [],
    next: Array.isArray(nextArr) ? nextArr : [],
    queue: Array.isArray(board.queue) ? board.queue : [],
    skipGrid: Array.isArray(board.skipGrid) ? board.skipGrid : [],
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

// ---- Helper aman json tanpa `any`
async function safeJson<T>(res: Response): Promise<T> {
  const data = (await res.json()) as unknown;
  return data as T;
}

// ---- Pool
export async function fetchPool(): Promise<PoolResponse> {
  const EVENT = ENV_EVENT_ID;
  const res = await fetch(
    `${BASE}/api/pool?eventId=${encodeURIComponent(EVENT)}`,
    { cache: 'no-store' }
  );
  const data = await safeJson<PoolResponse>(res).catch(() => {
    return { ok: false, eventId: EVENT, pool: 0 } as PoolResponse;
  });
  if (!res.ok) throw new Error((data as { message?: string })?.message ?? 'Gagal memuat pool');
  return data;
}

// ---- Confirm (legacy payload)
export async function confirmRequest(
  requestId: string,
  useCount = 1
): Promise<ConfirmResponse> {
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

  const data = await safeJson<ConfirmResponse>(res).catch(() => {
    return {
      ok: false,
      ticket: { code: '', status: '', name: '', email: '' },
      allocatedRange: { from: 0, to: 0 },
      count: 0,
    } as unknown as ConfirmResponse;
  });

  if (!res.ok) {
    const msg = ((data as { message?: string })?.message || 'Approve gagal').toString();
    throw new Error(msg);
  }
  return data;
}

// ---- Board snapshot sederhana
export async function getBoard(eventId?: string): Promise<BoardResponse> {
  const eid = eventId ?? ENV_EVENT_ID;
  const r = await fetch(
    `${BASE}/api/board?eventId=${encodeURIComponent(eid)}`,
    { cache: 'no-store' }
  );
  if (!r.ok) throw new Error(`getBoard failed: ${r.status}`);
  return safeJson<BoardResponse>(r);
}

// ---- Ops ringan (tanpa batch)
export async function promoteToActive(): Promise<MutateResponse | BoardResponse> {
  const r = await fetch(
    `${BASE}/api/promote?eventId=${encodeURIComponent(ENV_EVENT_ID)}`,
    { method: 'POST' }
  );
  if (!r.ok) throw new Error(`promote failed: ${r.status}`);
  return safeJson<MutateResponse | BoardResponse>(r);
}

export async function doneTicket(id: string): Promise<MutateResponse> {
  const r = await fetch(
    `${BASE}/api/done/${encodeURIComponent(id)}?eventId=${encodeURIComponent(
      ENV_EVENT_ID
    )}`,
    { method: 'POST' }
  );
  if (!r.ok) throw new Error(`done failed: ${r.status}`);
  return safeJson<MutateResponse>(r);
}

export async function skipTicket(id: string): Promise<MutateResponse> {
  const r = await fetch(
    `${BASE}/api/skip/${encodeURIComponent(id)}?eventId=${encodeURIComponent(
      ENV_EVENT_ID
    )}`,
    { method: 'POST' }
  );
  if (!r.ok) throw new Error(`skip failed: ${r.status}`);
  return safeJson<MutateResponse>(r);
}

export async function recallTicket(id: string): Promise<MutateResponse> {
  const r = await fetch(
    `${BASE}/api/recall/${encodeURIComponent(id)}?eventId=${encodeURIComponent(
      ENV_EVENT_ID
    )}`,
    { method: 'POST' }
  );
  if (!r.ok) throw new Error(`recall failed: ${r.status}`);
  return safeJson<MutateResponse>(r);
}

// ---- ALIASES untuk kompatibilitas komponen lama ----

// 1) Komponen lama import "fetchBoard" → arahkan ke getBoard
export const fetchBoard = getBoard;

// 2) Komponen lama import "callNext" → arahkan ke promoteToActive
export async function callNext(): Promise<MutateResponse | BoardResponse> {
  return promoteToActive();
}

// 2b) Beberapa file lama pakai "callNext6" → tetap panggil promoteToActive
export async function callNext6(): Promise<MutateResponse | BoardResponse> {
  return promoteToActive();
}

// 3) Komponen lama import "callByCode" → coba recall-by-code jika endpoint ada; jika tidak, fallback ke promote
export async function callByCode(code: string): Promise<MutateResponse | BoardResponse> {
  const url = `${BASE}/api/recall-by-code/${encodeURIComponent(
    code
  )}?eventId=${encodeURIComponent(ENV_EVENT_ID)}`;
  try {
    const r = await fetch(url, { method: 'POST' });
    if (r.ok) return safeJson<MutateResponse | BoardResponse>(r);
  } catch {
    // ignore
  }
  // fallback: panggil callNext agar tidak mematahkan alur lama
  return promoteToActive();
}

// ---- Donate to Walk-in (tambah pool dari registrant) ----
export async function donateToWalkin(
  requestId: string,
  donateCount = 1,
  eventId?: string
): Promise<MutateResponse> {
  const eid = eventId ?? ENV_EVENT_ID;
  const r = await fetch(`${BASE}/api/register-donate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ requestId, donateCount, eventId: eid }),
  });
  if (!r.ok) {
    let msg = `donate failed: ${r.status}`;
    try {
      const data = (await r.json()) as { message?: string };
      if (data?.message) msg = data.message;
    } catch {}
    throw new Error(msg);
  }
  return safeJson<MutateResponse>(r);
}

// 4) Kompat untuk AdminToolbar lama:
// setDone(id)   → DONE (alias doneTicket)
// setSkip(id)   → SKIP (alias skipTicket)
// setInProcess(id) → recall ke ACTIVE (mendekati "in process")
export const setDone = doneTicket;
export const setSkip = skipTicket;
export const setInProcess = recallTicket;

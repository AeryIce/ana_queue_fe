// src/lib/queueApi.ts
const API_BASE = (process.env.NEXT_PUBLIC_QUEUE_API || '').replace(/\/$/, '');
const EVENT_ID = process.env.NEXT_PUBLIC_EVENT_ID || 'seed-event';

type HttpOk<T> = { ok: true; data: T };
type HttpErr = { ok: false; status: number; msg: string };

export type Registrant = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  source?: string;            // MASTER | WALKIN | GIMMICK | ...
  status?: string;            // PENDING | CONFIRMED | CANCELLED | ...
  createdAt?: string;
  updatedAt?: string;
};

export type RegistrantList = {
  total?: number;
  data: Registrant[];
};

export type PoolBoard = {
  active?: any[];
  next?: any[];
  nextCount?: number;
  skipGrid?: any[];
  totals?: {
    active?: number;
    queueBatches?: number;
    next?: number;
    skip?: number;
    siapAntri?: number;
  };
};

async function httpGet<T>(url: string): Promise<HttpOk<T> | HttpErr> {
  const r = await fetch(url, { credentials: 'include' });
  if (!r.ok) {
    return { ok: false, status: r.status, msg: await safeText(r) };
  }
  return { ok: true, data: (await r.json()) as T };
}

async function safeText(r: Response) {
  try { return await r.text(); } catch { return ''; }
}

// ---------- Registrants (Approve List) ----------
type RegistrantQuery = {
  eventId?: string;
  status?: string;   // default: PENDING
  source?: string;   // default: MASTER
  limit?: number;    // default: 10
  offset?: number;   // default: 0
};

/**
 * Mencoba beberapa endpoint secara berurutan untuk kompatibilitas BE lama/baru.
 * Urutan kandidat bisa ditambah kalau perlu.
 */
export async function fetchRegistrants(q: RegistrantQuery = {}): Promise<RegistrantList> {
  const params = new URLSearchParams({
    eventId: q.eventId || EVENT_ID,
    status: q.status || 'PENDING',
    source: q.source || 'MASTER',
    limit: String(q.limit ?? 10),
    offset: String(q.offset ?? 0),
  });

  const candidates = [
    `/api/registrants`,        // lama
    `/api/register-request`,   // kemungkinan baru
    `/api/register/requests`,  // variasi
    `/api/registrations`,      // variasi lain
  ];

  let lastErr: HttpErr | null = null;

  for (const path of candidates) {
    const url = `${API_BASE}${path}?${params.toString()}`;
    const res = await httpGet<any>(url);
    if (res.ok) {
      // Normalisasi berbagai bentuk payload -> { data, total }
      const raw = res.data as any;

      const data: Registrant[] =
        raw?.data ??
        raw?.items ??
        raw?.results ??
        raw?.rows ??
        raw ?? [];

      const total: number | undefined =
        raw?.total ??
        raw?.count ??
        (Array.isArray(data) ? data.length : undefined);

      return { data: Array.isArray(data) ? data : [], total };
    }
    // 404/500 → coba kandidat berikutnya
    lastErr = res;
    if (res.status === 401 || res.status === 403) break; // auth issue → jangan lanjut
  }

  // Gagal semua kandidat
  const s = lastErr?.status ?? 0;
  const m = lastErr?.msg ?? 'No route matched';
  throw new Error(`[fetchRegistrants] failed (${s}): ${m}`);
}

// ---------- Pool / Board ----------
export async function fetchPool(eventId = EVENT_ID): Promise<PoolBoard> {
  // Coba endpoint lama: /api/pool
  {
    const url = `${API_BASE}/api/pool?eventId=${encodeURIComponent(eventId)}`;
    const res = await httpGet<any>(url);
    if (res.ok) return normalizeBoard(res.data);
  }
  // Fallback ke /api/snapshot (yang kamu laporkan sudah 200)
  {
    const url = `${API_BASE}/api/snapshot?eventId=${encodeURIComponent(eventId)}`;
    const res = await httpGet<any>(url);
    if (res.ok) return normalizeSnapshot(res.data);
  }
  // Kalau tetap gagal, minimal kembalikan bentuk kosong supaya UI tidak blank.
  return {
    active: [],
    next: [],
    totals: { active: 0, queueBatches: 0, next: 0, skip: 0, siapAntri: 0 },
  };
}

function normalizeBoard(raw: any): PoolBoard {
  // Asumsi sudah punya properti yang mirip board()
  return {
    active: raw?.active ?? [],
    next: raw?.next ?? [],
    nextCount: raw?.nextCount ?? (raw?.next ? raw.next.length : 0),
    skipGrid: raw?.skipGrid ?? raw?.skip ?? [],
    totals: raw?.totals ?? {
      active: raw?.active?.length ?? 0,
      queueBatches: raw?.queueBatches ?? 0,
      next: raw?.next?.length ?? 0,
      skip: (raw?.skipGrid ?? raw?.skip ?? []).length ?? 0,
      siapAntri:
        (raw?.active?.length ?? 0) +
        (raw?.next?.length ?? 0) +
        ((raw?.queued?.length ?? 0)) +
        ((raw?.skipGrid ?? raw?.skip ?? []).length ?? 0),
    },
  };
}

function normalizeSnapshot(raw: any): PoolBoard {
  // /api/snapshot minimal punya { active, next }
  return {
    active: raw?.active ?? [],
    next: raw?.next ?? [],
    nextCount: raw?.next?.length ?? 0,
    skipGrid: [],
    totals: {
      active: raw?.active?.length ?? 0,
      queueBatches: 0,
      next: raw?.next?.length ?? 0,
      skip: 0,
      siapAntri: (raw?.active?.length ?? 0) + (raw?.next?.length ?? 0),
    },
  };
}

export type Ticket = {
  id: string;
  code: string;
  name: string;
  status: 'QUEUED' | 'CALLED' | 'IN_PROCESS' | 'DONE' | 'DEFERRED' | 'NO_SHOW';
  order: number;
  updatedAt?: string;
};
export type Board = { eventId: string; active: Ticket[]; next: Ticket[] };

const RAW = (process.env.NEXT_PUBLIC_QUEUE_API ?? 'http://localhost:4000').trim();

// Pastikan absolut + tanpa trailing slash
const API_BASE = (() => {
  let u = RAW;
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  return u.replace(/\/+$/, '');
})();

const EVENT = 'seed-event';

async function j(res: Response) {
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${txt.slice(0, 200)}`);
  }
  return res.json();
}

export const queueApi = {
  board: async (): Promise<Board> =>
    j(await fetch(`${API_BASE}/api/board?eventId=${EVENT}`, { cache: 'no-store' })),
  snapshot: async () =>
    j(await fetch(`${API_BASE}/api/snapshot?eventId=${EVENT}`, { cache: 'no-store' })),
  getTicket: async (code: string): Promise<Ticket> =>
    j(await fetch(`${API_BASE}/api/tickets/${code}`, { cache: 'no-store' })),
  call: async (code: string, counterName = 'Counter A') =>
    j(
      await fetch(`${API_BASE}/api/tickets/${code}/call`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ counterName }),
      }),
    ),
  inProcess: async (code: string) =>
    j(await fetch(`${API_BASE}/api/tickets/${code}/in-process`, { method: 'PATCH' })),
  done: async (code: string) =>
    j(await fetch(`${API_BASE}/api/tickets/${code}/done`, { method: 'PATCH' })),
  skip: async (code: string) =>
    j(await fetch(`${API_BASE}/api/tickets/${code}/skip`, { method: 'PATCH' })),
  callNext: async () => {
    const b = await (await fetch(`${API_BASE}/api/board?eventId=${EVENT}`, { cache: 'no-store' })).json();
    const nextCode = b?.next?.[0]?.code as string | undefined;
    if (!nextCode) throw new Error('Tidak ada antrean QUEUED.');
    return j(
      await fetch(`${API_BASE}/api/tickets/${nextCode}/call`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ counterName: 'Counter A' }),
      }),
    );
  },
};

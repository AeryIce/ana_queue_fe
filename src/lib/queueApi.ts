export type Ticket = { id: string; code: string; name: string; status: 'QUEUED'|'CALLED'|'IN_PROCESS'|'DONE'|'DEFERRED'|'NO_SHOW'; order: number; updatedAt?: string };
export type Board = { eventId: string; active: Ticket[]; next: Ticket[] };

const API = process.env.NEXT_PUBLIC_QUEUE_API ?? 'http://localhost:4000';
const EVENT = 'seed-event';

async function j(res: Response) {
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const queueApi = {
  board: async (): Promise<Board> => j(await fetch(`${API}/api/board?eventId=${EVENT}`, { cache: 'no-store' })),
  snapshot: async () => j(await fetch(`${API}/api/snapshot?eventId=${EVENT}`, { cache: 'no-store' })),
  getTicket: async (code: string): Promise<Ticket> => j(await fetch(`${API}/api/tickets/${code}`, { cache: 'no-store' })),
  call: async (code: string, counterName = 'Counter A') => j(await fetch(`${API}/api/tickets/${code}/call`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ counterName }) })),
  inProcess: async (code: string) => j(await fetch(`${API}/api/tickets/${code}/in-process`, { method: 'PATCH' })),
  done: async (code: string) => j(await fetch(`${API}/api/tickets/${code}/done`, { method: 'PATCH' })),
  skip: async (code: string) => j(await fetch(`${API}/api/tickets/${code}/skip`, { method: 'PATCH' })),
  callNext: async () => {
    const b = await queueApi.board();
    const nextCode = b.next[0]?.code;
    if (!nextCode) throw new Error('Tidak ada antrean QUEUED.');
    return queueApi.call(nextCode);
  },
};

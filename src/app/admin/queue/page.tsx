'use client';

import { useBoard } from '@/hooks/useBoard';
import {
  callNext6,
  promoteToActive,
  skipTicket,
  recallTicket,
  doneTicket,
  normalizeBoard,
  type Ticket,
} from '@/lib/queueApi';

const EVENT_ID = process.env.NEXT_PUBLIC_EVENT_ID || 'seed-event';

// helper aman untuk ambil angka dari totals
function num(obj: unknown, key: string): number {
  if (obj && typeof obj === 'object' && key in (obj as Record<string, unknown>)) {
    const v = (obj as Record<string, unknown>)[key];
    return typeof v === 'number' ? v : 0;
  }
  return 0;
}

// group Ticket[] jadi [{batchNo, items}] jika queue belum berbentuk batch
function toDisplayBatches(q: unknown): { batchNo?: number | null; items: Ticket[] }[] {
  if (!Array.isArray(q)) return [];
  const first = q[0] as unknown;

  // case: sudah batchy (punya items)
  if (first && typeof first === 'object' && 'items' in (first as Record<string, unknown>)) {
    // pastikan items selalu array
    return (q as Array<{ batchNo?: number | null; items?: Ticket[] }>).map(b => ({
      batchNo: b.batchNo ?? null,
      items: Array.isArray(b.items) ? b.items : [],
    }));
  }

  // case: flat Ticket[]
  const byBatch = new Map<number | null | undefined, Ticket[]>();
  (q as Ticket[]).forEach((t) => {
    const key = t.batchNo ?? null; // null & undefined disatukan
    const arr = byBatch.get(key) ?? [];
    arr.push(t);
    byBatch.set(key, arr);
  });

  return Array.from(byBatch.entries()).map(([batchNo, items]) => ({
    batchNo,
    items,
  }));
}

export default function QueuePage() {
  const { data, loading, error, refresh } = useBoard(EVENT_ID, 2500);

  if (loading || !data) return <div className="p-4">Loading…</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  const safe = normalizeBoard(data);
  const { active, queue, skipGrid, nextCount, totals } = safe;

  const displayBatches = toDisplayBatches(queue).slice(0, 5);

  return (
    <div className="p-4 space-y-6">
      {/* Header / Controls */}
      <div className="flex items-center gap-2">
        <button
          className="px-3 py-2 rounded bg-black text-white"
          onClick={async () => { await callNext6(); await refresh(); }}
        >
          Call Next 6
        </button>
        <button
          className="px-3 py-2 rounded border"
          onClick={async () => { await promoteToActive(); await refresh(); }}
        >
          Promote
        </button>
        <div className="ml-auto text-sm opacity-70">
          Active: {num(totals, 'active')} · Batches: {num(totals, 'queueBatches')} · Next: {nextCount} · Skip: {num(totals, 'skip')}
        </div>
      </div>

      {/* Active (6 slot) */}
      <section>
        <h2 className="font-semibold mb-2">Active</h2>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {Array.from({ length: 6 }, (_, i) => i + 1).map((slot) => {
            const t = active.find((x) => x.slotNo === slot);
            return (
              <div key={slot} className="border rounded p-3">
                <div className="text-xs opacity-60 mb-1">Slot {slot}</div>
                {t ? (
                  <>
                    <div className="font-medium">{t.code ?? t.name ?? (t.id ? t.id.slice(0, 6) : '-')}</div>
                    <div className="text-xs mt-1">IN PROCESS</div>
                    <div className="flex gap-2 mt-3">
                      <button
                        className="text-xs px-2 py-1 rounded border"
                        onClick={async () => { await skipTicket(t.id); await refresh(); }}
                      >
                        Skip
                      </button>
                      <button
                        className="text-xs px-2 py-1 rounded bg-black text-white"
                        onClick={async () => { await doneTicket(t.id); await refresh(); }}
                      >
                        Done
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="opacity-50 text-sm">Empty</div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Queue per batch (max 5 batch) */}
      <section>
        <h2 className="font-semibold mb-2">Queue</h2>
        <div className="grid md:grid-cols-5 gap-3">
          {displayBatches.map((b, index) => (
            <div key={b.batchNo ?? `batch-${index}`} className="border rounded p-3">
              <div className="font-semibold mb-2">Batch {b.batchNo ?? index + 1}</div>
              <ol className="space-y-1 text-sm">
                {b.items.map((t) => (
                  <li key={t.id} className="flex justify-between">
                    <span>{t.code ?? t.name ?? (t.id ? t.id.slice(0, 6) : '-')}</span>
                    <span className="opacity-60">#{t.posInBatch}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      {/* Skip Grid */}
      <section>
        <h2 className="font-semibold mb-2">Skipped</h2>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {skipGrid.map((t) => (
            <div key={t.id} className="border rounded p-2">
              <div className="text-sm">{t.code ?? t.name ?? (t.id ? t.id.slice(0, 6) : '-')}</div>
              <button
                className="text-xs mt-2 px-2 py-1 rounded border"
                onClick={async () => { await recallTicket(t.id); await refresh(); }}
              >
                Recall
              </button>
            </div>
          ))}
          {skipGrid.length === 0 && <div className="opacity-60 text-sm">Tidak ada yang di-skip.</div>}
        </div>
      </section>
    </div>
  );
}

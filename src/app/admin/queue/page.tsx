'use client';

import { useBoard } from '@/hooks/useBoard';
import { callNext6, promoteToActive, skipTicket, recallTicket, doneTicket } from '@/lib/queueApi';

export default function QueuePage() {
  const { data, loading, error, reload } = useBoard(2500);
  if (loading || !data) return <div className="p-4">Loading…</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  const { active = [], queue = [], skipGrid = [], nextCount = 0, totals = {} } = data;

  return (
    <div className="p-4 space-y-6">
      {/* Header / Controls */}
      <div className="flex items-center gap-2">
        <button
          className="px-3 py-2 rounded bg-black text-white"
          onClick={async () => { await callNext6(); await reload(); }}
        >
          Call Next 6
        </button>
        <button
          className="px-3 py-2 rounded border"
          onClick={async () => { await promoteToActive(); await reload(); }}
        >
          Promote
        </button>
        <div className="ml-auto text-sm opacity-70">
          Active: {totals.active ?? 0} · Batches: {totals.queueBatches ?? 0} · Next: {nextCount} · Skip: {totals.skip ?? 0}
        </div>
      </div>

      {/* Active (6 slot) */}
      <section>
        <h2 className="font-semibold mb-2">Active</h2>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {Array.from({ length: 6 }, (_, i) => i + 1).map((slot) => {
            const t = active.find((x: any) => x.slotNo === slot);
            return (
              <div key={slot} className="border rounded p-3">
                <div className="text-xs opacity-60 mb-1">Slot {slot}</div>
                {t ? (
                  <>
                    <div className="font-medium">{t.code ?? t.name ?? t.id.slice(0, 6)}</div>
                    <div className="text-xs mt-1">IN PROCESS</div>
                    <div className="flex gap-2 mt-3">
                      <button
                        className="text-xs px-2 py-1 rounded border"
                        onClick={async () => { await skipTicket(t.id); await reload(); }}
                      >
                        Skip
                      </button>
                      <button
                        className="text-xs px-2 py-1 rounded bg-black text-white"
                        onClick={async () => { await doneTicket(t.id); await reload(); }}
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
          {(queue as any[]).slice(0, 5).map((b: any) => (
            <div key={b.batchNo} className="border rounded p-3">
              <div className="font-semibold mb-2">Batch {b.batchNo}</div>
              <ol className="space-y-1 text-sm">
                {b.items.map((t: any) => (
                  <li key={t.id} className="flex justify-between">
                    <span>{t.code ?? t.name ?? t.id.slice(0, 6)}</span>
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
          {skipGrid.map((t: any) => (
            <div key={t.id} className="border rounded p-2">
              <div className="text-sm">{t.code ?? t.name ?? t.id.slice(0, 6)}</div>
              <button
                className="text-xs mt-2 px-2 py-1 rounded border"
                onClick={async () => { await recallTicket(t.id); await reload(); }}
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

'use client';

import { useEffect, useState } from 'react';
import { getBoard, normalizeBoard, type Ticket, type BoardResponse } from '@/lib/queueApi';

export default function TvPage() {
  const [data, setData] = useState<BoardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let t: number | null = null;

    const load = async () => {
      try {
        const res = await getBoard();
        setData(res);
        setError(null);
      } catch (e: unknown) {
        const msg =
          e && typeof e === 'object' && 'message' in e
            ? String((e as { message?: unknown }).message)
            : 'fetch error';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    load();
    t = window.setInterval(load, 2500);
    return () => {
      if (t) clearInterval(t);
    };
  }, []);

  if (loading || !data) return <div className="p-4">Loading…</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  const board = normalizeBoard(data);

  return (
    <div className="p-4 space-y-4">
      <section>
        <h3 className="text-sm font-semibold">Active</h3>
        <ul className="mt-2 grid grid-cols-2 md:grid-cols-6 gap-2">
          {board.active.map((t: Ticket) => (
            <li key={t.id} className="rounded-xl p-3 bg-white/5 border border-white/10">
              <div className="text-lg font-bold tabular-nums">{t.code ?? t.name ?? t.id.slice(0, 6)}</div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-semibold">Next</h3>
        <ul className="mt-2 grid grid-cols-2 md:grid-cols-6 gap-2">
          {board.next.map((t: Ticket) => (
            <li key={t.id} className="rounded-xl p-3 bg-white/5 border border-white/10">
              <div className="text-base font-bold tabular-nums">{t.code ?? t.name ?? t.id.slice(0, 6)}</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

'use client';

import type { BoardResponse, Ticket } from '@/lib/queueApi';

export default function BoardView({ board }: { board: BoardResponse | null }) {
  if (!board) return null;

  return (
    <div className="space-y-4">
      <section>
        <h3 className="text-sm font-semibold">Active</h3>
        <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {board.active.map((t: Ticket) => (
            <li key={t.code} className="rounded-xl p-3 bg-white/5 border border-white/10">
              <div className="text-lg font-bold tabular-nums">{t.code}</div>
              {t.name && <div className="text-xs opacity-80">{t.name}</div>}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-semibold">Next</h3>
        <ul className="mt-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {board.next.map((t: Ticket) => (
            <li key={t.code} className="rounded-xl p-3 bg-white/5 border border-white/10">
              <div className="text-base font-bold tabular-nums">{t.code}</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

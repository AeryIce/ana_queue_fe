'use client';
import type { Board } from '@/lib/queueApi';

export default function BoardView({ board }: { board: Board | null }) {
  if (!board) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <section className="p-4 rounded-2xl shadow bg-white/80">
        <h3 className="font-bold mb-2">Active (IN_PROCESS → CALLED)</h3>
        <ul className="space-y-2">
          {board.active.map(t => (
            <li key={t.id} className="flex items-center justify-between rounded-xl px-3 py-2 border">
              <span className="font-semibold">{t.code}</span>
              <span className="text-xs px-2 py-1 rounded bg-green-100">{t.status}</span>
            </li>
          ))}
          {board.active.length === 0 && <li className="text-sm text-gray-500">Belum ada panggilan.</li>}
        </ul>
      </section>
      <section className="p-4 rounded-2xl shadow bg-white/80">
        <h3 className="font-bold mb-2">Next (QUEUED)</h3>
        <ol className="space-y-2 list-decimal list-inside">
          {board.next.map(t => (
            <li key={t.id} className="flex items-center justify-between rounded-xl px-3 py-2 border">
              <span className="font-medium">{t.code} — {t.name}</span>
              <span className="text-xs text-gray-500">#{t.order}</span>
            </li>
          ))}
          {board.next.length === 0 && <li className="text-sm text-gray-500">Tidak ada antrean.</li>}
        </ol>
      </section>
    </div>
  );
}

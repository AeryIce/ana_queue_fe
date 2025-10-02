'use client';
import { useBoard } from '@/lib/useBoard';
import BoardView from '@/components/BoardView';

export default function TVPage() {
  const { data } = useBoard(1500);
  return (
    <main className="min-h-dvh p-6 bg-gradient-to-br from-orange-50 to-amber-100">
      <h1 className="text-3xl font-bold mb-4">Ana Huang — Live Queue</h1>
      <BoardView board={data ?? null} />
      <div className="text-xs text-gray-500 mt-4">Auto-refresh ~1.5s</div>
    </main>
  );
}

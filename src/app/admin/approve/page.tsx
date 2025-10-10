'use client';

import { useEffect, useRef, useState } from 'react';
import { getPendingRequests, approveRequest, rejectRequest } from '@/lib/approveApi';

type Req = {
  id: string;
  name?: string | null;
  email?: string | null;
  code?: string | null;
  createdAt?: string | null;
};

function errorMessage(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e) {
    const m = (e as { message?: unknown }).message;
    return typeof m === 'string' ? m : 'error';
  }
  return 'error';
}

export default function ApprovePage() {
  const [list, setList] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  const load = async (): Promise<void> => {
    try {
      const payload = await getPendingRequests();
      const data = (payload as any)?.data ?? (payload as any)?.items ?? payload ?? [];
      const items: Req[] = Array.isArray(data) ? data : [];
      const total: number = (payload as any)?.total ?? items.length;

setList(items);

      setError(null);
    } catch (e: unknown) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    timer.current = window.setInterval(() => { void load(); }, 2500);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  if (loading) return <div className="p-4">Loading…</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold">Approve Registrations</h1>
        <span className="ml-2 text-sm opacity-70">Pending: {list.length}</span>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {list.map((r) => (
          <div key={r.id} className="border rounded-lg p-3 bg-white">
            <div className="font-medium">{r.name ?? r.code ?? r.email ?? r.id.slice(0, 6)}</div>
            <div className="text-sm opacity-70">{r.email ?? '-'}</div>
            <div className="text-xs opacity-60 mt-1">
              Created: {r.createdAt ? new Date(r.createdAt).toLocaleString() : '-'}
            </div>

            <div className="flex gap-2 mt-3">
              <button
                className="px-3 py-1 rounded bg-black text-white text-sm"
                onClick={async () => {
                  await approveRequest(r.id);
                  await load(); // refresh list
                }}
              >
                Approve
              </button>
              <button
                className="px-3 py-1 rounded border text-sm"
                onClick={async () => {
                  await rejectRequest(r.id);
                  await load();
                }}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>

      {list.length === 0 && (
        <div className="opacity-70 text-sm">Tidak ada pending request.</div>
      )}
    </div>
  );
}

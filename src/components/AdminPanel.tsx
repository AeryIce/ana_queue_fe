'use client';
import { useState } from 'react';
import BoardView from './BoardView';
import { queueApi } from '@/lib/queueApi';
import { useBoard } from '@/lib/useBoard';

export default function AdminPanel() {
  const { data, loading, err, refresh } = useBoard(1500);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Generic runner tanpa 'any'
  async function run<T>(fn: () => Promise<T>): Promise<T | undefined> {
    try {
      setBusy(true);
      setMsg(null);
      const r = await fn();
      setMsg('OK');
      await refresh();
      return r;
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : String(e));
      return undefined;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          className="px-4 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-50"
          disabled={busy || loading}
          onClick={() => void run(() => queueApi.callNext())}
        >
          Call Next
        </button>

        <input id="code" placeholder="AH-123" className="px-3 py-2 rounded border" />

        <button
          className="px-3 py-2 rounded-xl bg-indigo-600 text-white disabled:opacity-50"
          disabled={busy || loading}
          onClick={() => {
            const code = (document.getElementById('code') as HTMLInputElement | null)?.value?.trim();
            if (!code) {
              setMsg('Masukkan code tiket.');
              return;
            }
            void run(() => queueApi.call(code));
          }}
        >
          Call by Code
        </button>

        {loading && <span className="text-sm text-gray-500">Refreshing…</span>}
        {msg && <span className="text-sm text-gray-600">{msg}</span>}
        {err && <span className="text-sm text-red-600">{err}</span>}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="p-4 rounded-2xl border bg-white/70">
          <h3 className="font-bold mb-3">Active Tickets</h3>
          <div className="space-y-3">
            {data?.active.map((t) => (
              <div key={t.id} className="p-3 rounded-xl border flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold">
                    {t.code}{' '}
                    <span className="text-xs px-2 py-0.5 rounded bg-green-100">{t.status}</span>
                  </div>
                  <div className="text-xs text-gray-500">{t.name}</div>
                </div>
                <div className="flex items-center gap-2">
                  {t.status === 'CALLED' && (
                    <button
                      className="px-3 py-1 rounded bg-amber-500 text-white disabled:opacity-50"
                      disabled={busy || loading}
                      onClick={() => void run(() => queueApi.inProcess(t.code))}
                    >
                      In-Process
                    </button>
                  )}
                  {(t.status === 'CALLED' || t.status === 'IN_PROCESS') && (
                    <button
                      className="px-3 py-1 rounded bg-emerald-600 text-white disabled:opacity-50"
                      disabled={busy || loading}
                      onClick={() => void run(() => queueApi.done(t.code))}
                    >
                      Done
                    </button>
                  )}
                  {t.status === 'CALLED' && (
                    <button
                      className="px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
                      disabled={busy || loading}
                      onClick={() => void run(() => queueApi.skip(t.code))}
                    >
                      Skip
                    </button>
                  )}
                </div>
              </div>
            ))}
            {(!data || data.active.length === 0) && (
              <div className="text-sm text-gray-500">Belum ada yang dipanggil.</div>
            )}
          </div>
        </section>

        <section className="p-4 rounded-2xl border bg-white/70">
          <h3 className="font-bold mb-3">Next (Queue)</h3>
          <div className="space-y-2">
            {data?.next.map((t) => (
              <div key={t.id} className="p-3 rounded-xl border flex items-center justify-between">
                <div className="font-medium">
                  {t.code} — {t.name}
                </div>
                <button
                  className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50"
                  disabled={busy || loading}
                  onClick={() => void run(() => queueApi.call(t.code))}
                >
                  Call
                </button>
              </div>
            ))}
            {(!data || data.next.length === 0) && (
              <div className="text-sm text-gray-500">Tidak ada antrean.</div>
            )}
          </div>
        </section>
      </div>

      <div className="opacity-70">
        <BoardView board={data ?? null} />
      </div>
    </div>
  );
}

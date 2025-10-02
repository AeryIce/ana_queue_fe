'use client';
import { useEffect, useState } from 'react';
import { queueApi, type Board } from './queueApi';

export function useBoard(pollMs = 2000) {
  const [data, setData] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function refresh() {
    try {
      const b = await queueApi.board();
      setData(b);
      setErr(null);
    } catch (e: any) {
      setErr(e?.message ?? 'Error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let stop = false;
    const tick = async () => { if (!stop) await refresh(); };
    tick();
    const id = setInterval(tick, pollMs);
    return () => { stop = true; clearInterval(id); };
  }, [pollMs]);

  return { data, loading, err, refresh };
}

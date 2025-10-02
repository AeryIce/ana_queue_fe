'use client';
import { useEffect, useState } from 'react';
import { queueApi, type Board } from './queueApi';

export function useBoard(pollMs = 2000) {
  const [data, setData] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const refresh = async (): Promise<void> => {
    try {
      const b = await queueApi.board();
      setData(b);
      setErr(null);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let stop = false;
    const tick = async () => {
      if (!stop) {
        await refresh();
      }
    };
    void tick();
    const id = setInterval(() => void tick(), pollMs);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [pollMs]);

  return { data, loading, err, refresh };
}

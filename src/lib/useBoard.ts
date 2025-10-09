'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getBoard, normalizeBoard, type BoardResponse } from '@/lib/queueApi';

// BoardData fleksibel: queue boleh Ticket[] atau Batch[], totals bebas
export type BoardData = ReturnType<typeof normalizeBoard>;

type State = {
  data: BoardData;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

/**
 * Hook polling board event (flex)
 * @param eventId event identifier (wajib)
 * @param pollMs interval ms (opsional, default 2500)
 */
export function useBoard(eventId: string, pollMs: number = 2500): State {
  const [data, setData] = useState<BoardData>(
    normalizeBoard({ active: [], next: [], queue: [] } as BoardResponse),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await getBoard(eventId);
      setData(normalizeBoard(res));
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
  }, [eventId]);

  useEffect(() => {
    // first load
    refresh();
    // polling
    timer.current = window.setInterval(refresh, pollMs);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [refresh, pollMs]);

  return { data, loading, error, refresh };
}

export default useBoard;

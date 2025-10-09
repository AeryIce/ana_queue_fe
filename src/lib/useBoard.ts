'use client';

import { useCallback, useEffect, useState } from 'react';
import { getBoard, type Ticket } from '@/lib/queueApi';

export type Board = {
  active: Ticket[];
  next: Ticket[];
  queue: Array<{ batchNo: number; items: Ticket[] }>;
  skipGrid: Ticket[];
  nextCount: number;
  totals: Record<string, number>;
};

const EMPTY: Board = {
  active: [],
  next: [],
  queue: [],
  skipGrid: [],
  nextCount: 0,
  totals: {},
};

/**
 * useBoard(eventId?, pollMs?)
 * contoh: useBoard("seed-event", 1800)
 */
export function useBoard(eventId?: string, pollMs = 1500) {
  const [data, setData] = useState<Board>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await getBoard(eventId);
      setData({
        active: res?.active ?? [],
        next: res?.next ?? [],
        queue: res?.queue ?? [],
        skipGrid: res?.skipGrid ?? [],
        nextCount: res?.nextCount ?? 0,
        totals: res?.totals ?? {},
      });
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? 'fetch error');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, pollMs);
    return () => clearInterval(t);
  }, [refresh, pollMs]);

  return { data, loading, error, refresh };
}

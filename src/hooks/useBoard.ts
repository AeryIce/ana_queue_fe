// src/hooks/useBoard.ts — replace-full (no-any, deps fixed)
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { BoardResponse } from "@/lib/queueApi";
import { fetchBoard } from "@/lib/queueApi";

export function useBoard(eventId = "seed-event", intervalMs = 1800) {
  const [data, setData] = useState<BoardResponse>({ active: [], next: [] });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // Browser-safe timer type
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const r: BoardResponse = await fetchBoard(eventId);
      setData(r);
      setError(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void load();
    timer.current = setInterval(() => {
      void load();
    }, intervalMs);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [load, intervalMs]);

  return { data, loading, error, refresh: load };
}

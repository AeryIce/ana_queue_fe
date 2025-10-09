"use client";
import { useEffect, useState, useCallback } from "react";

export function useBoard(eventId: string, pollMs = 1500) {
  const [data, setData] = useState({ active: [], next: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBoard = useCallback(async () => {
    try {
      const r = await fetch(
        `${process.env.NEXT_PUBLIC_QUEUE_API}/api/board?eventId=${eventId}`,
        { cache: "no-store" }
      );
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const json = await r.json();
      setData(json);
      setError(null);
    } catch (err: any) {
      console.error("fetchBoard error:", err);
      setError(err.message || "network error");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  // auto refresh (polling)
  useEffect(() => {
    fetchBoard();
    const timer = setInterval(fetchBoard, pollMs);
    return () => clearInterval(timer);
  }, [fetchBoard, pollMs]);

  return {
    data,
    loading,
    error,
    refresh: fetchBoard,
  };
}

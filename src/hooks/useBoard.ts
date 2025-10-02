"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { BoardResponse } from "@/lib/queueApi";
import { fetchBoard } from "@/lib/queueApi";


export function useBoard(eventId = "seed-event", intervalMs = 1800) {
const [data, setData] = useState<BoardResponse>({ active: [], next: [] });
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const timer = useRef<NodeJS.Timeout | null>(null);


const load = useCallback(async () => {
try {
const r = await fetchBoard(eventId);
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
timer.current = setInterval(() => void load(), intervalMs);
return () => {
if (timer.current) clearInterval(timer.current);
};
}, [load, intervalMs]);


return { data, loading, error, refresh: load };
}
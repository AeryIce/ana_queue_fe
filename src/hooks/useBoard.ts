"use client";
import { useEffect, useRef, useState } from "react";
import type { BoardResponse } from "@/lib/queueApi";
import { fetchBoard } from "@/lib/queueApi";


export function useBoard(eventId = "seed-event", intervalMs = 1800) {
const [data, setData] = useState<BoardResponse>({ active: [], next: [] });
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const timer = useRef<NodeJS.Timeout | null>(null);


const load = async () => {
try {
const r = await fetchBoard(eventId);
setData(r);
setError(null);
} catch (e: any) {
setError(e?.message || "Error");
} finally {
setLoading(false);
}
};


useEffect(() => {
load();
timer.current = setInterval(load, intervalMs);
return () => {
if (timer.current) clearInterval(timer.current);
};
}, [eventId, intervalMs]);


return { data, loading, error, refresh: load };
}


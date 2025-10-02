"use client";
import { createContext, useContext, useMemo, useState } from "react";


export type Toast = { id: number; title?: string; message: string };


const ToastCtx = createContext<{ push: (m: string, title?: string) => void } | null>(null);


export function ToastProvider({ children }: { children: React.ReactNode }) {
const [items, setItems] = useState<Toast[]>([]);
const push = (message: string, title?: string) => {
const id = Date.now() + Math.random();
setItems((s) => [...s, { id, message, title }]);
setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 2500);
};
const value = useMemo(() => ({ push }), []);
return (
<ToastCtx.Provider value={value}>
{children}
<div className="fixed z-[100] bottom-4 left-0 right-0 px-4 flex flex-col items-center gap-2 pointer-events-none">
{items.map((t) => (
<div key={t.id} className="pointer-events-auto w-full max-w-sm rounded-2xl border border-white/10 bg-black/70 backdrop-blur px-4 py-3 shadow-lg">
{t.title && <div className="text-xs font-semibold opacity-80 mb-0.5">{t.title}</div>}
<div className="text-sm">{t.message}</div>
</div>
))}
</div>
</ToastCtx.Provider>
);
}


export function useToast() {
const ctx = useContext(ToastCtx);
if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
return ctx;
}
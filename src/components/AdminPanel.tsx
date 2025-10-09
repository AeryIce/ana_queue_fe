// src/components/AdminPanel.tsx — replace-full
"use client";

import React, { useState } from "react";
import { useBoard } from "@/hooks/useBoard";
import { AdminToolbar } from "@/components/AdminToolbar";
import type { Ticket } from "@/lib/queueApi";
import { setDone, setInProcess, setSkip } from "@/lib/queueApi";

export default function AdminPanel() {
  const { data, loading, error, refresh } = useBoard("seed-event", 1600);
  const [tab, setTab] = useState<"active" | "next">("active");

  return (
    <div className="container-page">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="h1">Admin Panel — Ana Huang</h1>
          <p className="subtle">Quick controls & queue overview</p>
        </div>
        <div className="inline-flex rounded-xl overflow-hidden border border-white/10">
          <button
            className={`px-3 py-1 text-sm ${tab === "active" ? "bg-white/10" : "bg-transparent"}`}
            onClick={() => setTab("active")}
          >
            Active
          </button>
          <button
            className={`px-3 py-1 text-sm ${tab === "next" ? "bg-white/10" : "bg-transparent"}`}
            onClick={() => setTab("next")}
          >
            Next
          </button>
        </div>
      </div>

      <AdminToolbar onSuccess={refresh} />

      {error && <div className="mt-3 text-sm text-rose-300">{error}</div>}

      {tab === "active" ? (
        <section className="mt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {loading
              ? Array.from({ length: 3 }).map((_, i: number) => (
                  <div key={`sk-act-${i}`} className="rounded-2xl p-3 bg-white/5 border border-white/10">
                    <div className="h-16 animate-pulse bg-white/5 rounded-xl" />
                  </div>
                ))
              : data.active.map((t: Ticket) => {
  const code = t.code ?? t.id; // ← aman: selalu string
  return (
    <div key={t.id ?? t.code} className="rounded-2xl p-3 bg-white/5 border border-white/10">
      <div className="flex items-center justify-between">
        <div className="text-2xl font-black tabular-nums">{code}</div>
        <div className="flex gap-2">
          <button
            className="btn-secondary"
            onClick={async () => { await setInProcess(code); await refresh(); }}
          >In-Process</button>
          <button
            className="btn-secondary"
            onClick={async () => { await setDone(code); await refresh(); }}
          >Done</button>
          <button
            className="btn-secondary"
            onClick={async () => { await setSkip(code); await refresh(); }}
          >Skip</button>
        </div>
      </div>
      {t.name && <div className="text-sm opacity-80 mt-1 line-clamp-1">{t.name}</div>}
    </div>
  );
})}

          </div>
        </section>
      ) : (
        <section className="mt-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {loading
              ? Array.from({ length: 6 }).map((_, i: number) => (
                  <div key={`sk-next-${i}`} className="rounded-xl p-3 bg-white/5 border border-white/10">
                    <div className="h-14 animate-pulse bg-white/5 rounded-lg" />
                  </div>
                ))
              : data.next.map((t: Ticket) => (
                  <div key={t.code} className="rounded-xl p-3 bg-white/5 border border-white/10">
                    <div className="text-2xl font-black tabular-nums">{t.code}</div>
                    {t.name && <div className="text-sm opacity-80 mt-1 line-clamp-1">{t.name}</div>}
                  </div>
                ))}
          </div>
        </section>
      )}
    </div>
  );
}

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

  // amanin array (hindari undefined)
  const active: Ticket[] = (data?.active ?? []) as Ticket[];
  const next: Ticket[] = (data?.next ?? []) as Ticket[];

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
                  <div
                    key={`sk-act-${i}`}
                    className="rounded-2xl p-3 bg-white/5 border border-white/10"
                  >
                    <div className="h-16 animate-pulse bg-white/5 rounded-xl" />
                  </div>
                ))
              : active.map((t: Ticket, idx: number) => {
                  const code = (t.code ?? t.id) ?? "";
                  const hasCode = code.length > 0;
                  const key = (t.id ?? t.code) ?? `act-${idx}`;

                  return (
                    <div
                      key={key}
                      className="rounded-2xl p-3 bg-white/5 border border-white/10"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-black tabular-nums">
                          {hasCode ? code : "—"}
                        </div>
                        <div className="flex gap-2">
                          <button
                            className="btn-secondary"
                            disabled={!hasCode}
                            title={!hasCode ? "Kode tiket tidak tersedia" : undefined}
                            onClick={async () => {
                              if (!hasCode) return;
                              await setInProcess(code);
                              await refresh();
                            }}
                          >
                            In-Process
                          </button>
                          <button
                            className="btn-secondary"
                            disabled={!hasCode}
                            title={!hasCode ? "Kode tiket tidak tersedia" : undefined}
                            onClick={async () => {
                              if (!hasCode) return;
                              await setDone(code);
                              await refresh();
                            }}
                          >
                            Done
                          </button>
                          <button
                            className="btn-secondary"
                            disabled={!hasCode}
                            title={!hasCode ? "Kode tiket tidak tersedia" : undefined}
                            onClick={async () => {
                              if (!hasCode) return;
                              await setSkip(code);
                              await refresh();
                            }}
                          >
                            Skip
                          </button>
                        </div>
                      </div>
                      {t.name && (
                        <div className="text-sm opacity-80 mt-1 line-clamp-1">
                          {t.name}
                        </div>
                      )}
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
                  <div
                    key={`sk-next-${i}`}
                    className="rounded-xl p-3 bg-white/5 border border-white/10"
                  >
                    <div className="h-14 animate-pulse bg-white/5 rounded-lg" />
                  </div>
                ))
              : next.map((t: Ticket, idx: number) => {
                  const key = (t.code ?? t.id) ?? `next-${idx}`;
                  const label = t.code ?? (t.id ? t.id.slice(0, 6) : "—");
                  return (
                    <div
                      key={key}
                      className="rounded-xl p-3 bg-white/5 border border-white/10"
                    >
                      <div className="text-2xl font-black tabular-nums">{label}</div>
                      {t.name && (
                        <div className="text-sm opacity-80 mt-1 line-clamp-1">
                          {t.name}
                        </div>
                      )}
                    </div>
                  );
                })}
          </div>
        </section>
      )}
    </div>
  );
}

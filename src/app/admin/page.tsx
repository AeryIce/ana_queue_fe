"use client";
import { useBoard } from "@/hooks/useBoard";
import { setDone, setInProcess, setSkip } from "@/lib/queueApi";
import type { Ticket } from "@/lib/queueApi";
import { QueueCard } from "@/components/QueueCard";
import { AdminToolbar } from "@/components/AdminToolbar";


export default function AdminPage() {
const { data, loading, error, refresh } = useBoard("seed-event", 1600);


return (
<div className="container-page">
<header className="mb-2">
<h1 className="h1">Admin Antrian — Ana Huang</h1>
<p className="subtle">Mobile friendly controls for live queue</p>
</header>


<AdminToolbar onSuccess={refresh} />


{error && <div className="mt-3 text-sm text-rose-300">{error}</div>}


{/* ACTIVE SECTION */}
<section className="mt-3">
  <h2 className="text-base font-semibold mb-2">Active</h2>
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
    {loading
      ? Array.from({ length: 3 }).map((_, i: number) => (
          <div key={`sk-act-${i}`} className="rounded-2xl p-3 bg-white/5 border border-white/10">
            <div className="h-16 animate-pulse bg-white/5 rounded-xl" />
          </div>
        ))
      : (data.active ?? []).map((t: Ticket) => {
          const code = t.code ?? t.id; // fallback aman
          return (
            <div key={t.id ?? t.code} className="rounded-2xl p-3 bg-white/5 border border-white/10">
              <div className="flex items-center justify-between">
                <div className="text-2xl font-black tabular-nums">{code}</div>
                <div className="flex gap-2">
                  <button
                    className="btn-secondary"
                    onClick={async () => { await setInProcess(code); await refresh(); }}
                  >
                    In-Process
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={async () => { await setDone(code); await refresh(); }}
                  >
                    Done
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={async () => { await setSkip(code); await refresh(); }}
                  >
                    Skip
                  </button>
                </div>
              </div>
              {t.name && <div className="text-sm opacity-80 mt-1 line-clamp-1">{t.name}</div>}
            </div>
          );
        })}
  </div>
</section>



{/* NEXT SECTION */}
<section className="mt-6">
<h2 className="text-base font-semibold mb-2">Next</h2>
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
{loading
? Array.from({ length: 6 }).map((_, i: number) => (
<div key={`sk-next-${i}`} className="rounded-xl p-3 bg-white/5 border border-white/10">
<div className="h-14 animate-pulse bg-white/5 rounded-lg" />
</div>
))
: data.next.map((t: Ticket) => (
<div key={t.code} className="rounded-xl p-3 bg-white/5 border border-white/10">
<QueueCard t={t} />
</div>
))}
</div>
</section>


<footer className="mt-8 text-xs opacity-70">Dipersembahkan oleh Periplus • v-02102025</footer>
</div>
);
}


"use client";
import Image from "next/image";
import { useBoard } from "@/hooks/useBoard";
import { QueueCard } from "@/components/QueueCard";
import { NextTicker } from "@/components/NextTicker";
import type { Ticket } from "@/lib/queueApi";

const N = Number(process.env.NEXT_PUBLIC_ACTIVE_SLOT_SIZE) || 6;

export default function TVPage() {
  // interval 1800ms seperti versi cantikmu; event bisa disesuaikan via env kalau perlu
  const { data, loading, error } = useBoard("seed-event", 1800);

  // fallback aman untuk array (hindari undefined)
  const active: Ticket[] = (data?.active ?? []) as Ticket[];
  const next: Ticket[] = (data?.next ?? []) as Ticket[];

  return (
    <div className="min-h-dvh text-white bg-[url('/brand/feed-bg.png')] bg-cover bg-center">
      <div className="min-h-dvh backdrop-blur-sm bg-gradient-to-b from-black/70 via-black/60 to-black/80 px-4 py-5">
        {/* HERO */}
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-18 sm:w-20 sm:h-28">
            <Image
              src="/ana/ana-hero.jpg"
              alt="Ana Huang"
              fill
              className="object-cover rounded-xl"
              priority
            />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Book Signing — Ana Huang
            </h1>
            <p className="text-sm opacity-80">
              Dipersembahkan oleh <span className="font-semibold">Periplus</span>
            </p>
          </div>
          <div className="hidden sm:block">
            <div className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur animate-[brandFloat_3s_ease-in-out_infinite]">
              <div className="text-xs opacity-80">Active Slots</div>
              <div className="text-2xl font-black text-right tabular-nums">{N}</div>
            </div>
          </div>
        </div>

        {/* STATE BAR (optional loading/error tanpa ubah layout) */}
        {(loading || error) && (
          <div className="mt-3 text-xs">
            {loading && <span className="opacity-70">Loading…</span>}
            {error && <span className="text-rose-300"> Error: {String(error)}</span>}
          </div>
        )}

        {/* ACTIVE GRID */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {active.length === 0 && (
            Array.from({ length: Math.max(3, N) }).map((_, i) => (
              <div
                key={`sk-act-${i}`}
                className="rounded-2xl p-3 bg-white/5 border border-white/10"
              >
                <div className="h-16 animate-pulse bg-white/5 rounded-xl" />
              </div>
            ))
          )}
          {active.map((t: Ticket, idx: number) => {
            // key & display aman (hindari id undefined)
            const key = String(t.code ?? t.id ?? `act-${idx}`);
            return (
              <QueueCard key={key} t={t} big />
            );
          })}
        </div>

        {/* NEXT STRIP */}
        <div className="mt-5 border-t border-white/10 pt-3">
          <div className="text-sm font-semibold mb-1">Next</div>
          <NextTicker items={next} />
        </div>

        {/* FOOTER BRAND */}
        <div className="mt-6 flex items-center gap-3">
          <Image
            src="/brand/periplus.png"
            alt="Periplus"
            width={88}
            height={24}
            className="opacity-90"
          />
          <span className="text-xs opacity-80">
            Terima kasih telah mendukung acara ini.
          </span>
        </div>
      </div>
    </div>
  );
}

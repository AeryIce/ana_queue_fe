"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";

const covers = [
  "/ana/cover-twisted-love.png",
  "/ana/cover-twisted-games.png",
  "/ana/cover-twisted-hate.png",
  "/ana/cover-twisted-lies.png",
  "/ana/cover-king-of-wrath.jpg",
  "/ana/cover-king-of-pride.jpg",
  "/ana/cover-king-of-greed.jpg",
  "/ana/cover-king-of-sloth.jpg",
];

function takeWindow<T>(arr: T[], start: number, size: number) {
  return Array.from({ length: size }, (_, i) => arr[(start + i) % arr.length]);
}

export default function TVPage() {
  const CARD_W = 112;
  const CARD_H = 160;
  const GAP = 16;
  const VISIBLE = 4;

  const [start, setStart] = useState(0);
  const [sliding, setSliding] = useState(false);

  const frame5 = useMemo(() => takeWindow(covers, start, VISIBLE + 1), [start]);

  useEffect(() => {
    const id = setInterval(() => setSliding(true), 2500);
    return () => clearInterval(id);
  }, []);

  const onTransitionEnd = () => {
    if (!sliding) return;
    setStart((s) => (s + 1) % covers.length);
    setSliding(false);
  };

  return (
    <main
      className="
        min-h-dvh p-8 text-gray-800 
        bg-gradient-to-b from-pink-50 via-rose-50 to-white
      "
      style={{
        backgroundImage:
          "radial-gradient(50rem 30rem at 30% -10%, rgba(255,192,203,0.15), transparent 60%), radial-gradient(50rem 30rem at 70% -20%, rgba(186,230,253,0.2), transparent 60%)",
        backgroundBlendMode: "screen, normal",
      }}
    >
      {/* HERO — kiri (teks/strip/brand), kanan (foto) */}
      <section className="rounded-3xl bg-white/70 border border-rose-200 shadow-sm backdrop-blur-sm p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_280px] lg:grid-cols-[minmax(0,1fr)_320px] items-start">
          {/* kiri */}
          <div className="relative">
            <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-rose-800">
              Ana Huang — Book Signing
            </h1>
            <p className="mt-3 text-rose-700/80 max-w-3xl">
              Selamat datang! Silakan perhatikan nomor antrian Anda pada layar.
              Nikmati juga deretan novel hits dari seri{" "}
              <span className="font-semibold">Twisted</span> dan{" "}
              <span className="font-semibold">Kings of Sin</span>.
            </p>

            {/* strip: 4 kartu terlihat, geser 1 kartu */}
            <div className="mt-6">
              <div className="text-sm text-rose-700/80 mb-3 font-semibold">
                Featured Books:
              </div>
              <div
                className="overflow-hidden"
                style={{ width: VISIBLE * CARD_W + (VISIBLE - 1) * GAP }}
              >
                <div
                  className="flex"
                  style={{
                    gap: GAP,
                    width: (VISIBLE + 1) * CARD_W + VISIBLE * GAP,
                    transform: `translateX(${sliding ? -(CARD_W + GAP) : 0}px)`,
                    transition: sliding ? "transform 320ms ease" : "none",
                  }}
                  onTransitionEnd={onTransitionEnd}
                >
                  {frame5.map((src) => (
                    <div
                      key={`${src}-${start}`}
                      className="relative rounded-lg border border-rose-200 bg-white/70"
                      style={{ width: CARD_W, height: CARD_H, flex: "0 0 auto" }}
                      title={src.split("/").pop() ?? "cover"}
                    >
                      <Image
                        src={src}
                        alt={src.split("/").pop() || "cover"}
                        fill
                        className="object-contain rounded-lg"
                        sizes={`${CARD_W}px`}
                        priority
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* BRAND: ukuran sama dengan foto & animasi float */}
            <div className="hidden md:flex absolute right-0 top-[60%] -translate-y-1/2 z-10">

              <div
                className="
                  relative mx-auto w-48 md:w-60 lg:w-72 aspect-[3/4]
                  rounded-2xl border border-rose-200/70 bg-white/85 backdrop-blur-sm
                  shadow-md overflow-hidden
                  animate-[brandFloat_6s_ease-in-out_infinite]
                "
              >
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-4">
                  <Image
                    src="/brand/periplus.png"
                    alt="Periplus"
                    width={320}
                    height={96}
                    className="w-4/5 h-auto"
                    priority
                  />
                  <span className="font-serif text-xl md:text-2xl font-semibold text-rose-800">
                    Official Host
                  </span>
                </div>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-rose-50/40 to-transparent" />
              </div>
            </div>
          </div>

          {/* kanan: foto portrait */}
          <div className="relative mx-auto w-48 md:w-60 lg:w-72 aspect-[3/4] rounded-2xl border border-rose-200/70 bg-white/70 shadow-sm overflow-hidden">
            <Image
              src="/ana/ana-hero.jpg"
              alt="Ana Huang portrait"
              fill
              className="object-cover select-none pointer-events-none"
              priority
            />
          </div>
        </div>
      </section>

      {/* ACTIVE SLOTS — background kolase tipis */}
      <section className="relative mt-8 rounded-3xl border border-rose-200/60 bg-white/60 p-4 overflow-hidden">
        <div className="absolute inset-0 -z-10 pointer-events-none select-none">
          <Image
            src="/brand/feed-bg.png"
            alt=""
            fill
            className="object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-white/10" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card
              key={i}
              className="
                border-rose-200 bg-rose-50/60 
                backdrop-blur-sm p-6 rounded-2xl
                shadow-[0_10px_25px_-10px_rgba(0,0,0,0.1)]
                transition hover:shadow-lg
              "
            >
              <div className="text-4xl md:text-5xl font-serif font-extrabold tabular-nums text-rose-800">
                AH-{String(101 + i).padStart(3, "0")}
              </div>
              <div className="mt-2 text-rose-700/80 font-medium">
                Nama Peserta {i + 1}
              </div>
              <div className="mt-1 text-xs uppercase tracking-wider text-rose-400">
                queued
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* NEXT LIST */}
      <div className="mt-8 border-t border-rose-200 pt-4">
        <div className="text-sm text-rose-700/80 mb-2 font-semibold">Next 5:</div>
        <div className="flex flex-wrap gap-3">
          {["AH-106", "AH-107", "AH-108", "AH-109", "AH-110"].map((n) => (
            <span
              key={n}
              className="
                px-4 py-2 rounded-full
                bg-rose-100 border border-rose-200 
                text-rose-700 font-semibold text-sm
              "
            >
              {n}
            </span>
          ))}
        </div>
      </div>

      {/* CREDIT */}
      <footer className="mt-12">
  <div className="flex justify-end items-center gap-4">
    <Image
      src="/brand/periplus-blog.jpg"
      alt="Periplus Blog"
      width={220}
      height={55}
      className="h-10 w-auto drop-shadow-sm"
      priority
    />
    <div
      className="
        inline-flex items-center gap-3
        rounded-full border border-rose-300
        bg-gradient-to-r from-rose-50 to-pink-50
        px-6 py-3 shadow-sm
      "
    >
      <span className="text-sm text-rose-600">Dipersembahkan oleh</span>
      <span className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-rose-900">
        Periplus
      </span>
    </div>
  </div>
</footer>

    </main>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Play, SkipForward, RotateCcw } from "lucide-react";

export default function AdminQueuePage() {
  return (
    <main
      className="
        min-h-dvh p-8
        bg-gradient-to-b from-rose-50 via-pink-50 to-white
        text-rose-900
      "
      style={{
        backgroundImage:
          "radial-gradient(40rem 25rem at 20% -10%, rgba(255,192,203,0.15), transparent 60%), radial-gradient(40rem 25rem at 80% -20%, rgba(186,230,253,0.2), transparent 60%)",
        backgroundBlendMode: "screen, normal",
      }}
    >
      <h1 className="text-3xl font-serif font-bold tracking-tight text-rose-800">
        Admin — Queue Control
      </h1>

      <Card className="mt-6 p-4 bg-rose-50/70 border-rose-200">
        <div className="flex flex-wrap gap-3">
          <Button
            className="bg-rose-600 hover:bg-rose-700"
            onClick={() => toast.success("Call Next 5 (mock)")}
          >
            <Play className="mr-2 h-4 w-4" />
            Call Next 5
          </Button>
          <Button
            variant="secondary"
            className="bg-rose-100 text-rose-900 hover:bg-rose-200"
            onClick={() => toast.message("Skip Selected (mock)")}
          >
            <SkipForward className="mr-2 h-4 w-4" />
            Skip Selected
          </Button>
          <Button
            variant="outline"
            className="border-rose-300 text-rose-800 hover:bg-rose-50"
            onClick={() => toast.info("Recall Deferred (mock)")}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Recall Deferred
          </Button>
        </div>
      </Card>

      <Card className="mt-6 border-rose-200 bg-rose-50/60">
        <div className="px-4 py-3 text-sm text-rose-700/80 border-b border-rose-200">
          Active Slots
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-rose-200 bg-white/60 p-4"
            >
              <div className="text-3xl font-serif font-extrabold tabular-nums text-rose-800">
                AH-{String(101 + i).padStart(3, "0")}
              </div>
              <div className="text-rose-700 mt-1">Nama Peserta {i + 1}</div>
              <div className="text-xs uppercase tracking-wider text-rose-400 mt-1">
                called
              </div>
            </div>
          ))}
        </div>
      </Card>
    </main>
  );
}

"use client";

import React, { useState } from "react";
import type { Ticket } from "@/lib/queueApi";
import { callByCode, callNext, fetchBoard } from "@/lib/queueApi";
import { useToast } from "@/components/Toast";

type Props = {
  onSuccess?: () => void;
  eventId?: string; // default "seed-event"
};

export function AdminToolbar({ onSuccess, eventId = "seed-event" }: Props) {
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const N = Number(process.env.NEXT_PUBLIC_ACTIVE_SLOT_SIZE) || 6;
  const { push } = useToast();

  const doCallNext = async () => {
    setBusy(true);
    try {
      // 1) Coba endpoint resmi BE
      await callNext(N, eventId);
      onSuccess?.();
      push(`Dipanggil ${N} nomor ke slot aktif`, "Sukses");
      return;
    } catch {
      // 2) Fallback: ambil NEXT dari /api/board, lalu panggil N tiket satu per satu
      try {
        const board = await fetchBoard(eventId);
        const pick: Ticket[] = (board.next ?? []).slice(0, N);

        if (pick.length === 0) {
          push("Tidak ada tiket di NEXT untuk dipanggil.", "Info");
          return;
        }

        for (const t of pick) {
          await callByCode(t.code);
        }

        onSuccess?.();
        push(`Fallback: panggil ${pick.length} dari NEXT`, "Sukses");
      } catch {
        push("Fallback gagal memanggil NEXT.", "Gagal");
      }
    } finally {
      setBusy(false);
    }
  };

  const doCallByCode = async () => {
    const c = code.trim().toUpperCase();
    if (!c) return;
    setBusy(true);
    try {
      await callByCode(c);
      setCode("");
      onSuccess?.();
      push(`Nomor ${c} dipanggil`, "Sukses");
    } catch {
      push("Gagal memanggil nomor.", "Gagal");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sticky top-0 z-30 -mx-4 px-4 pt-3 pb-2 bg-gradient-to-b from-black/40 to-transparent backdrop-blur">
      <div className="flex flex-col sm:flex-row gap-2">
        <button onClick={doCallNext} disabled={busy} className="btn-primary">
          {busy ? "Processing…" : `Call Next ${N}`}
        </button>
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(ev: React.ChangeEvent<HTMLInputElement>) =>
              setCode(ev.target.value.toUpperCase())
            }
            placeholder="AH-123"
            className="input"
            inputMode="text"
            autoCapitalize="characters"
            autoCorrect="off"
          />
          <button
            onClick={doCallByCode}
            disabled={busy || !code.trim()}
            className="btn-secondary"
          >
            Call by Code
          </button>
        </div>
      </div>
    </div>
  );
}

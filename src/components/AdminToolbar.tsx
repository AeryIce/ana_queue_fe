"use client";

import React, { useState } from "react";
import type { Ticket } from "@/lib/queueApi";
import { callByCode, callNext } from "@/lib/queueApi";
import { useToast } from "@/components/Toast";

export function AdminToolbar({
  onSuccess,
  next = [],
}: {
  onSuccess?: () => void;
  next?: Ticket[];
}) {
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const N = Number(process.env.NEXT_PUBLIC_ACTIVE_SLOT_SIZE) || 6;
  const { push } = useToast();

  const doCallNext = async () => {
    try {
      setBusy(true);
      // 1) Coba endpoint resmi BE
      await callNext(N);
      onSuccess?.();
      push(`Dipanggil ${N} nomor ke slot aktif`, "Sukses");
      return;
    } catch (e: unknown) {
      // 2) Fallback: panggil dari NEXT list via callByCode
      const pick = next.slice(0, N);
      try {
        for (const t of pick) {
          await callByCode(t.code);
        }
        onSuccess?.();
        push(`Fallback: panggil ${pick.length} dari NEXT`, "Sukses");
      } catch (e2: unknown) {
        const msg =
          e2 instanceof Error ? e2.message : "Fallback gagal memanggil NEXT";
        push(msg, "Gagal");
      }
    } finally {
      setBusy(false);
    }
  };

  const doCallByCode = async () => {
    if (!code.trim()) return;
    try {
      setBusy(true);
      const c = code.trim().toUpperCase();
      await callByCode(c);
      setCode("");
      onSuccess?.();
      push(`Nomor ${c} dipanggil`, "Sukses");
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : `Gagal memanggil ${code.trim()}`;
      push(msg, "Gagal");
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
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="AH-123"
            className="input"
          />
          <button
            onClick={doCallByCode}
            disabled={busy || !code}
            className="btn-secondary"
          >
            Call by Code
          </button>
        </div>
      </div>
    </div>
  );
}

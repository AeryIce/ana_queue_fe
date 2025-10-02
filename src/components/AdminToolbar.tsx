"use client";
import { useState } from "react";
import { callByCode, callNext } from "@/lib/queueApi";
import { useToast } from "@/components/Toast";


export function AdminToolbar({ onSuccess }: { onSuccess?: () => void }) {
const [busy, setBusy] = useState(false);
const [code, setCode] = useState("");
const N = Number(process.env.NEXT_PUBLIC_ACTIVE_SLOT_SIZE) || 6;
const { push } = useToast();


const doCallNext = async () => {
try {
setBusy(true);
await callNext(N);
onSuccess?.();
push(`Dipanggil ${N} nomor ke slot aktif`, "Sukses");
} catch (e: any) {
push(e?.message || "Gagal memanggil berikutnya", "Gagal");
} finally {
setBusy(false);
}
};


const doCallByCode = async () => {
if (!code.trim()) return;
try {
setBusy(true);
await callByCode(code.trim());
setCode("");
onSuccess?.();
push(`Nomor ${code.trim()} dipanggil`, "Sukses");
} catch (e: any) {
push(e?.message || `Gagal memanggil ${code.trim()}`, "Gagal");
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
<button onClick={doCallByCode} disabled={busy || !code} className="btn-secondary">Call by Code</button>
</div>
</div>
</div>
);
}


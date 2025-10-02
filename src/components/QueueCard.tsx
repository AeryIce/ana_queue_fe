import { motion } from "framer-motion";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Ticket } from "@/lib/queueApi";


export function QueueCard({ t, big = false }: { t: Ticket; big?: boolean }) {
const Code = (
<div className={"font-black tracking-tight tabular-nums leading-none " + (big ? "text-5xl sm:text-6xl" : "text-2xl")}>{t.code}</div>
);
return (
<motion.div
layout
initial={{ opacity: 0, y: 8 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: -8 }}
transition={{ type: "spring", stiffness: 120, damping: 14 }}
className="rounded-2xl p-4 sm:p-5 bg-white/5 backdrop-blur border border-white/10 shadow-lg shadow-rose-900/10"
>
<div className="flex items-center justify-between gap-2">
{Code}
<StatusBadge status={t.status} />
</div>
{t.name && <div className="mt-1 text-sm opacity-90 line-clamp-1">{t.name}</div>}
</motion.div>
);
}
import { cn } from "@/lib/cn";
import type { TicketStatus } from "@/lib/queueApi";


const styles: Record<TicketStatus, string> = {
QUEUED: "bg-slate-800 text-slate-100",
CALLED: "bg-amber-500 text-zinc-900",
IN_PROCESS: "bg-emerald-500 text-zinc-900",
DONE: "bg-slate-600 text-white",
DEFERRED: "bg-rose-600 text-white",
NO_SHOW: "bg-zinc-700 text-zinc-100",
};


export function StatusBadge({ status, className }: { status: TicketStatus; className?: string }) {
return (
<span className={cn("px-2.5 py-1 rounded-md text-xs font-bold tracking-tight tabular-nums", styles[status], className)}>
{status.replace(/_/g, " ")}
</span>
);
}


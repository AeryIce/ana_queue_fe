import { useEffect, useRef } from "react";
import type { Ticket } from "@/lib/queueApi";


export function NextTicker({ items }: { items: Ticket[] }) {
const ref = useRef<HTMLDivElement>(null);
useEffect(() => {
if (!ref.current) return;
const el = ref.current;
const total = el.scrollWidth;
const keyframes = [ { transform: "translateX(0)" }, { transform: `translateX(-${total}px)` } ];
const anim = el.animate(keyframes, { duration: Math.max(15000, total * 30), iterations: Infinity, easing: "linear" });
return () => anim.cancel();
}, [items]);
return (
<div className="w-full overflow-hidden">
<div ref={ref} className="flex gap-3 py-2 min-w-max">
{items.map((t) => (
<span key={t.code} className="px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur text-sm tabular-nums">
{t.code}
</span>
))}
</div>
</div>
);
}
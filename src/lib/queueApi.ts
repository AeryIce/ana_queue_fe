export type TicketStatus = "QUEUED" | "CALLED" | "IN_PROCESS" | "DONE" | "DEFERRED" | "NO_SHOW";
export interface Ticket {
code: string;
name?: string;
status: TicketStatus;
order?: number;
updatedAt?: string;
}
export interface BoardResponse {
active: Ticket[]; // IN_PROCESS -> CALLED (maks N)
next: Ticket[]; // QUEUED (maks N)
}


const BASE = (() => {
let u = process.env.NEXT_PUBLIC_QUEUE_API || "";
if (u && !/^https?:\/\//.test(u)) u = `https://${u}`;
return u.replace(/\/$/, "");
})();


export async function fetchBoard(eventId: string): Promise<BoardResponse> {
const r = await fetch(`${BASE}/api/board?eventId=${encodeURIComponent(eventId)}`, { cache: "no-store" });
if (!r.ok) throw new Error(`Board fetch failed: ${r.status}`);
return r.json();
}


export async function callNext(count = Number(process.env.NEXT_PUBLIC_ACTIVE_SLOT_SIZE) || 6, eventId = "seed-event") {
const r = await fetch(`${BASE}/api/call-next?count=${count}&eventId=${encodeURIComponent(eventId)}`, { method: "POST" });
if (!r.ok) throw new Error(`CallNext failed: ${r.status}`);
return r.json();
}


export async function callByCode(code: string) {
const r = await fetch(`${BASE}/api/tickets/${encodeURIComponent(code)}/call`, { method: "PATCH" });
if (!r.ok) throw new Error(`CallByCode failed: ${r.status}`);
return r.json();
}


export async function setInProcess(code: string) {
const r = await fetch(`${BASE}/api/tickets/${encodeURIComponent(code)}/in-process`, { method: "PATCH" });
if (!r.ok) throw new Error(`InProcess failed: ${r.status}`);
return r.json();
}


export async function setDone(code: string) {
const r = await fetch(`${BASE}/api/tickets/${encodeURIComponent(code)}/done`, { method: "PATCH" });
if (!r.ok) throw new Error(`Done failed: ${r.status}`);
return r.json();
}


export async function setSkip(code: string) {
const r = await fetch(`${BASE}/api/tickets/${encodeURIComponent(code)}/skip`, { method: "PATCH" });
if (!r.ok) throw new Error(`Skip failed: ${r.status}`);
return r.json();
}
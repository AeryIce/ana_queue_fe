const BASE = process.env.NEXT_PUBLIC_QUEUE_API!;

export async function getPendingRequests() {
  const r = await fetch(`${BASE}/api/register-request?status=PENDING`, { cache: 'no-store' });
  if (!r.ok) throw new Error('getPending failed');
  return r.json(); // expected: array atau {items:[]}
}

export async function approveRequest(id: string) {
  const r = await fetch(`${BASE}/api/register-request/${id}/approve`, { method: 'POST' });
  if (!r.ok) throw new Error('approve failed');
  return r.json();
}

export async function rejectRequest(id: string) {
  const r = await fetch(`${BASE}/api/register-request/${id}/reject`, { method: 'POST' });
  if (!r.ok) throw new Error('reject failed');
  return r.json();
}
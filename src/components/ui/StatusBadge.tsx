'use client';

import React from 'react';
import { type TicketStatus } from '@/lib/queueApi';

// Label & style map — partial saja; sisanya fallback
const LABELS: Partial<Record<TicketStatus, string>> = {
  PENDING: 'Pending',
  QUEUED: 'Queued',
  ACTIVE: 'Active',
  CALLED: 'Called',
  IN_PROCESS: 'In Process',
  DONE: 'Done',
  DEFERRED: 'Deferred',
  SKIPPED: 'Skipped',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No Show',
} as const;

const STYLES: Partial<Record<TicketStatus, string>> = {
  PENDING: 'bg-gray-200 text-gray-800',
  QUEUED: 'bg-blue-100 text-blue-800',
  ACTIVE: 'bg-indigo-100 text-indigo-800',
  CALLED: 'bg-cyan-100 text-cyan-800',
  IN_PROCESS: 'bg-amber-100 text-amber-800',
  DONE: 'bg-green-100 text-green-800',
  DEFERRED: 'bg-violet-100 text-violet-800',
  SKIPPED: 'bg-orange-100 text-orange-800',
  CANCELLED: 'bg-rose-100 text-rose-800',
  NO_SHOW: 'bg-zinc-200 text-zinc-800',
} as const;

export default function StatusBadge({ status }: { status?: TicketStatus | null }) {
  const s = (status ?? 'PENDING') as TicketStatus;
  const label = LABELS[s] ?? (typeof s === 'string' ? s.replace(/_/g, ' ') : 'UNKNOWN');
  const style = STYLES[s] ?? 'bg-gray-200 text-gray-800';

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}

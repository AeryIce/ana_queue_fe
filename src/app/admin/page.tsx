'use client';
import AdminPanel from '@/components/AdminPanel';

export default function AdminPage() {
  return (
    <main className="p-6 max-w-5xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Queue Admin</h1>
      <p className="text-sm text-gray-600">Klik tombol untuk panggil / proses tiket. Data auto-refresh tiap ~1.5s.</p>
      <AdminPanel />
    </main>
  );
}

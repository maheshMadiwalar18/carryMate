'use client';

import { useEffect, useState } from 'react';
import { useRequireAuth } from '@/lib/hooks';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { timeAgo, cn } from '@/lib/utils';
import type { AppNotification } from '@/lib/types';
import { Bell } from 'lucide-react';

export default function NotificationsPage() {
  const { token, loading } = useRequireAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setBusy(true);
      try {
        const res = await api.get<{ data: AppNotification[] }>('/notifications', token);
        setNotifications(res.data);
      } finally {
        setBusy(false);
      }
    })();
  }, [token]);

  async function markRead(id: string) {
    await api.post(`/notifications/${id}/read`, {}, token);
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
  }

  if (loading || busy) return <div className="flex justify-center py-24"><Spinner className="h-6 w-6 text-navy-700" /></div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-navy-950 mb-6 flex items-center gap-2"><Bell className="h-5 w-5" /> Notifications</h1>
      {notifications.length === 0 ? (
        <p className="text-sm text-neutral-500">You&apos;re all caught up.</p>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card key={n._id} className={cn(!n.read && 'border-navy-300 bg-navy-50/40')}>
              <CardContent className="p-4 flex items-start justify-between gap-3 cursor-pointer" onClick={() => !n.read && markRead(n._id)}>
                <div>
                  <p className="text-sm font-medium text-navy-950">{n.title}</p>
                  <p className="text-sm text-neutral-500">{n.body}</p>
                </div>
                <span className="text-xs text-neutral-400 whitespace-nowrap">{timeAgo(n.createdAt)}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRequireAuth } from '@/lib/hooks';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { StatusPill } from '@/components/status-pill';
import { formatINR, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Analytics {
  totalUsers: number;
  activeTravelers: number;
  activeRequests: number;
  completedDeliveries: number;
  totalGMV: number;
  platformRevenue: number;
  completionRate: number;
  cancellationRate: number;
  averageRating: number;
  totalTransactions: number;
}

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  verificationStatus: string;
  isSuspended: boolean;
}

interface AdminReport {
  _id: string;
  reason: string;
  status: string;
  createdAt: string;
  reporterId?: { name: string };
}

interface AdminVerification {
  _id: string;
  documentType: string;
  userId?: { name: string };
}

export default function AdminDashboardPage() {
  const { user, token, loading } = useRequireAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [verifications, setVerifications] = useState<AdminVerification[]>([]);
  const [settings, setSettings] = useState<{ platformFeePercent: number } | null>(null);
  const [feeInput, setFeeInput] = useState('');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !user || user.role !== 'ADMIN') return;
    (async () => {
      setBusy(true);
      try {
        const [a, u, r, v, s] = await Promise.all([
          api.get<{ data: Analytics }>('/admin/analytics', token),
          api.get<{ data: AdminUser[] }>('/admin/users?limit=20', token),
          api.get<{ data: AdminReport[] }>('/admin/reports', token),
          api.get<{ data: AdminVerification[] }>('/admin/verifications', token),
          api.get<{ data: { platformFeePercent: number } }>('/admin/settings', token),
        ]);
        setAnalytics(a.data);
        setUsers(u.data);
        setReports(r.data);
        setVerifications(v.data);
        setSettings(s.data);
        setFeeInput(String(s.data.platformFeePercent));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load admin data');
      } finally {
        setBusy(false);
      }
    })();
  }, [token, user]);

  async function updateFee() {
    if (!token) return;
    await api.put('/admin/settings', { platformFeePercent: Number(feeInput) }, token);
    setSettings({ platformFeePercent: Number(feeInput) });
  }

  async function reviewVerification(id: string, approve: boolean) {
    if (!token) return;
    await api.post(`/admin/verifications/${id}/review`, { approve }, token);
    setVerifications((prev) => prev.filter((v) => v._id !== id));
  }

  async function toggleSuspend(id: string, suspend: boolean) {
    if (!token) return;
    await api.post(`/admin/users/${id}/suspend`, { suspended: suspend }, token);
    setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, isSuspended: suspend } : u)));
  }

  if (loading) return <div className="flex justify-center py-24"><Spinner className="h-6 w-6 text-navy-700" /></div>;

  if (!user || user.role !== 'ADMIN') {
    return <div className="mx-auto max-w-md px-4 py-24 text-center text-neutral-500">Admin access required.</div>;
  }

  if (busy) return <div className="flex justify-center py-24"><Spinner className="h-6 w-6 text-navy-700" /></div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 space-y-8">
      <h1 className="text-2xl font-bold text-navy-950">Admin dashboard</h1>
      {error && <Alert variant="danger">{error}</Alert>}

      {analytics && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Metric label="Total Users" value={analytics.totalUsers} />
          <Metric label="Active Travelers" value={analytics.activeTravelers} />
          <Metric label="Active Requests" value={analytics.activeRequests} />
          <Metric label="Completed Deliveries" value={analytics.completedDeliveries} />
          <Metric label="Total GMV" value={formatINR(analytics.totalGMV)} />
          <Metric label="Platform Revenue" value={formatINR(analytics.platformRevenue)} />
          <Metric label="Completion Rate" value={`${analytics.completionRate}%`} />
          <Metric label="Cancellation Rate" value={`${analytics.cancellationRate}%`} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Platform settings</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-sm text-neutral-500">Platform fee (%) — current: {settings?.platformFeePercent ?? '—'}%</label>
              <Input type="number" min={0} max={50} value={feeInput} onChange={(e) => setFeeInput(e.target.value)} />
            </div>
            <Button onClick={updateFee} className="mt-5">Save</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Pending verifications</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {verifications.length === 0 && <p className="text-sm text-neutral-500">No pending verification requests.</p>}
            {verifications.map((v) => (
              <div key={v._id} className="flex items-center justify-between rounded-md border border-border-subtle p-2 text-sm">
                <span>{v.userId?.name} — {v.documentType}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="success" onClick={() => reviewVerification(v._id, true)}>Approve</Button>
                  <Button size="sm" variant="danger" onClick={() => reviewVerification(v._id, false)}>Reject</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Users</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {users.map((u) => (
            <div key={u._id} className="flex items-center justify-between rounded-md border border-border-subtle p-2 text-sm">
              <div>
                <span className="font-medium">{u.name}</span> <span className="text-neutral-400">{u.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill state={u.verificationStatus} />
                {u.isSuspended ? (
                  <Button size="sm" variant="outline" onClick={() => toggleSuspend(u._id, false)}>Unsuspend</Button>
                ) : (
                  <Button size="sm" variant="danger" onClick={() => toggleSuspend(u._id, true)}>Suspend</Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Reports & disputes</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {reports.length === 0 && <p className="text-sm text-neutral-500">No reports filed.</p>}
          {reports.map((r) => (
            <div key={r._id} className="rounded-md border border-border-subtle p-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">{r.reason}</span>
                <StatusPill state={r.status} />
              </div>
              <p className="text-xs text-neutral-500">{r.reporterId?.name} · {formatDate(r.createdAt)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-neutral-500">{label}</p>
        <p className="text-xl font-bold text-navy-950 mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}

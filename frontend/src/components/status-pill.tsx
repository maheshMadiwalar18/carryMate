import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, Truck, PackageCheck, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

const STATE_CONFIG: Record<string, { label: string; variant: 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'navy'; icon?: React.ReactNode }> = {
  REQUESTED: { label: 'Requested', variant: 'neutral', icon: <Clock className="h-3 w-3" /> },
  MATCHED: { label: 'Matched', variant: 'info', icon: <ShieldCheck className="h-3 w-3" /> },
  TRAVELER_ACCEPTED: { label: 'Traveler Accepted', variant: 'info' },
  PAYMENT_PENDING: { label: 'Payment Pending', variant: 'warning', icon: <Clock className="h-3 w-3" /> },
  PAYMENT_CONFIRMED: { label: 'Payment Confirmed', variant: 'success' },
  PICKUP_PENDING: { label: 'Awaiting Pickup', variant: 'warning' },
  ITEM_PICKED_UP: { label: 'Picked Up', variant: 'info', icon: <PackageCheck className="h-3 w-3" /> },
  IN_TRANSIT: { label: 'In Transit', variant: 'info', icon: <Truck className="h-3 w-3" /> },
  DELIVERY_PENDING: { label: 'Awaiting Drop-off', variant: 'warning' },
  DELIVERED: { label: 'Delivered', variant: 'success', icon: <CheckCircle2 className="h-3 w-3" /> },
  COMPLETED: { label: 'Completed', variant: 'success', icon: <CheckCircle2 className="h-3 w-3" /> },
  CANCELLED: { label: 'Cancelled', variant: 'danger', icon: <XCircle className="h-3 w-3" /> },
  DISPUTED: { label: 'Disputed', variant: 'danger', icon: <AlertTriangle className="h-3 w-3" /> },
  EXPIRED: { label: 'Expired', variant: 'neutral' },
  OPEN: { label: 'Open', variant: 'neutral' },
  ACCEPTED: { label: 'Accepted', variant: 'info' },
  IN_PROGRESS: { label: 'In Progress', variant: 'info' },
  ACTIVE: { label: 'Active', variant: 'success' },
  VERIFIED: { label: 'Verified', variant: 'success', icon: <ShieldCheck className="h-3 w-3" /> },
  PENDING: { label: 'Pending', variant: 'warning' },
  UNVERIFIED: { label: 'Unverified', variant: 'neutral' },
  REJECTED: { label: 'Rejected', variant: 'danger' },
};

export function StatusPill({ state }: { state: string }) {
  const cfg = STATE_CONFIG[state] || { label: state, variant: 'neutral' as const };
  return (
    <Badge variant={cfg.variant}>
      {cfg.icon}
      {cfg.label}
    </Badge>
  );
}

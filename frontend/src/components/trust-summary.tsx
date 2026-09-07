import { Star, ShieldCheck, Package } from 'lucide-react';
import type { User } from '@/lib/types';

export function TrustSummary({ user, compact = false }: { user: Partial<User>; compact?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${compact ? 'text-xs' : 'text-sm'} text-neutral-600`}>
      <span className="flex items-center gap-1 font-medium text-navy-950">
        <Star className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
        {user.rating?.toFixed(1) ?? '—'}
      </span>
      {user.verificationStatus === 'VERIFIED' && (
        <span className="flex items-center gap-1 text-emerald-600 font-medium">
          <ShieldCheck className="h-3.5 w-3.5" /> Verified
        </span>
      )}
      {typeof user.completedDeliveries === 'number' && (
        <span className="flex items-center gap-1">
          <Package className="h-3.5 w-3.5" /> {user.completedDeliveries} deliveries
        </span>
      )}
      {typeof user.trustScore === 'number' && !compact && (
        <span className="text-neutral-500">Trust {user.trustScore}</span>
      )}
    </div>
  );
}

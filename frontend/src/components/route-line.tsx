import { MapPin } from 'lucide-react';

export function RouteLine({
  origin,
  destination,
  rewardLabel,
}: {
  origin: string;
  destination: string;
  rewardLabel?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col items-center">
        <div className="h-2.5 w-2.5 rounded-full bg-navy-900" />
        <div className="route-line w-10 my-1" />
        <MapPin className="h-3.5 w-3.5 text-orange-600" />
      </div>
      <div className="flex flex-col gap-4 py-0.5">
        <span className="text-sm font-semibold text-navy-950">{origin}</span>
        <span className="text-sm font-semibold text-navy-950 flex items-center gap-2">
          {destination}
          {rewardLabel && <span className="text-xs font-medium text-orange-600">{rewardLabel}</span>}
        </span>
      </div>
    </div>
  );
}

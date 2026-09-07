import { ShieldAlert, ShieldCheck, Flag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const PROHIBITED = [
  'Weapons & Ammunition',
  'Explosives & Flammables',
  'Illegal Drugs & Narcotics',
  'Hazardous / Toxic Substances',
  'Stolen or Counterfeit Goods',
  'Currency & Financial Instruments',
  'Live Animals & Human Remains',
  'Other Legally Restricted Items',
];

export default function SafetyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-navy-950 mb-2">Safety & item policy</h1>
      <p className="text-neutral-500 mb-8">Because strangers are transporting real, physical items, trust is built into every stage of CarryMate.</p>

      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="font-semibold text-navy-950 flex items-center gap-2 mb-3"><ShieldAlert className="h-5 w-5 text-red-600" /> Prohibited items</h2>
          <p className="text-sm text-neutral-600 mb-4">
            The following categories can never be transported through CarryMate. Every request is screened automatically, and
            attempting to disguise a prohibited item through its description is itself a policy violation.
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {PROHIBITED.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-neutral-700 rounded-md bg-red-50 px-3 py-2">
                <ShieldAlert className="h-3.5 w-3.5 text-red-500 shrink-0" /> {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="mb-8" id="verification">
        <CardContent className="p-6">
          <h2 className="font-semibold text-navy-950 flex items-center gap-2 mb-3"><ShieldCheck className="h-5 w-5 text-emerald-600" /> Verification & trust</h2>
          <p className="text-sm text-neutral-600">
            Travelers can submit ID verification to earn a Verified badge. Every completed delivery contributes to a visible rating and
            trust score, and both pickup and delivery are confirmed with one-time codes so no handoff can be falsely claimed.
          </p>
        </CardContent>
      </Card>

      <Card id="disputes">
        <CardContent className="p-6">
          <h2 className="font-semibold text-navy-950 flex items-center gap-2 mb-3"><Flag className="h-5 w-5 text-orange-600" /> Reporting & disputes</h2>
          <p className="text-sm text-neutral-600">
            If something goes wrong — a mismatched item, a safety concern, or a delivery dispute — report it from the delivery page
            and our team will review it. Deliveries under dispute are held from final settlement until resolved.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

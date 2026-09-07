import Link from 'next/link';
import { Package } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-navy-950 text-neutral-300">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 font-bold text-white text-lg mb-3">
              <Package className="h-5 w-5 text-orange-500" /> CarryMate
            </div>
            <p className="text-sm text-neutral-400">Going there anyway? CarryMate it.</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/trips" className="hover:text-white">Browse Trips</Link></li>
              <li><Link href="/requests" className="hover:text-white">Browse Requests</Link></li>
              <li><Link href="/register" className="hover:text-white">Become a Traveler</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Trust & Safety</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/safety" className="hover:text-white">Item Safety Policy</Link></li>
              <li><Link href="/safety#verification" className="hover:text-white">Verification</Link></li>
              <li><Link href="/safety#disputes" className="hover:text-white">Report / Dispute</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="text-neutral-500">About</span></li>
              <li><span className="text-neutral-500">Careers</span></li>
              <li><span className="text-neutral-500">Contact</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-white/10 pt-6 text-xs text-neutral-500">
          © {new Date().getFullYear()} CarryMate. Peer-to-peer delivery network powered by people already on the move.
        </div>
      </div>
    </footer>
  );
}

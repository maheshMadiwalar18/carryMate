'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Package, Bell, Menu, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';

const NAV_LINKS = [
  { href: '/trips', label: 'Browse Trips' },
  { href: '/requests', label: 'Browse Requests' },
  { href: '/dashboard', label: 'Dashboard' },
];

export function Navbar() {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-navy-950 text-lg">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-navy-900 text-white">
            <Package className="h-4.5 w-4.5" />
          </span>
          CarryMate
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-600">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={pathname === link.href ? 'text-navy-950' : 'hover:text-navy-900'}>
              {link.label}
            </Link>
          ))}
          {user?.role === 'ADMIN' && (
            <Link href="/admin" className={pathname?.startsWith('/admin') ? 'text-navy-950' : 'hover:text-navy-900'}>
              Admin
            </Link>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {loading ? null : user ? (
            <>
              <Link href="/notifications" className="text-neutral-500 hover:text-navy-900">
                <Bell className="h-5 w-5" />
              </Link>
              <Link href={`/profile/${user._id}`} className="text-sm font-medium text-navy-950">
                {user.name.split(' ')[0]}
              </Link>
              <Button variant="outline" size="sm" onClick={() => logout().then(() => router.push('/'))}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link href="/register">
                <Button variant="accent" size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border-subtle bg-white px-4 py-3 space-y-3">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="block text-sm font-medium text-neutral-700" onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link href={`/profile/${user._id}`} className="block text-sm font-medium text-navy-950" onClick={() => setOpen(false)}>
                My Profile
              </Link>
              <Button variant="outline" size="sm" className="w-full" onClick={() => logout().then(() => router.push('/'))}>
                Log out
              </Button>
            </>
          ) : (
            <div className="flex gap-2">
              <Link href="/login" className="flex-1"><Button variant="outline" size="sm" className="w-full">Log in</Button></Link>
              <Link href="/register" className="flex-1"><Button variant="accent" size="sm" className="w-full">Get Started</Button></Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

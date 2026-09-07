'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { Package } from 'lucide-react';

function RegisterForm() {
  const { registerWithEmail, loginWithGoogle, isFirebaseMode } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const role = params.get('role');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await registerWithEmail(name, email, password, phone || undefined);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to register');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-6 flex flex-col items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-navy-900 text-white">
          <Package className="h-5 w-5" />
        </span>
        <h1 className="text-xl font-bold text-navy-950">
          {role === 'traveler' ? 'Start earning on your trips' : role === 'requester' ? 'Get your item delivered' : 'Create your account'}
        </h1>
        <p className="text-sm text-neutral-500 text-center">One account lets you both travel and request — switch anytime.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sign up</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <Alert variant="danger">{error}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Mahesh Kumar" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 90000 00000" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Spinner className="h-4 w-4" /> : 'Create account'}
            </Button>
          </form>

          {isFirebaseMode && (
            <>
              <div className="relative text-center text-xs text-neutral-400">
                <span className="bg-white px-2 relative z-10">or</span>
                <div className="absolute inset-x-0 top-1/2 h-px bg-border-subtle" />
              </div>
              <Button variant="outline" className="w-full" onClick={() => loginWithGoogle().then(() => router.push('/dashboard'))}>
                Continue with Google
              </Button>
            </>
          )}

          <p className="text-center text-sm text-neutral-500">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-navy-900 hover:underline">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}

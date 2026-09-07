'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { Package } from 'lucide-react';

export default function LoginPage() {
  const { loginWithEmail, loginWithGoogle, isFirebaseMode } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to log in');
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
        <h1 className="text-xl font-bold text-navy-950">Welcome back</h1>
        <p className="text-sm text-neutral-500">Log in to continue with CarryMate</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Log in</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <Alert variant="danger">{error}</Alert>}
          {!isFirebaseMode && (
            <Alert variant="info">
              Running in demo auth mode. Try <strong>mahesh@example.com</strong> / <strong>password123</strong> after seeding.
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Spinner className="h-4 w-4" /> : 'Log in'}
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
            New to CarryMate?{' '}
            <Link href="/register" className="font-medium text-navy-900 hover:underline">
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

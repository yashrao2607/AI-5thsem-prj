'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { useAuth } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleGoogleLogin = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/dashboard');
    } catch (error) {
      console.error('Google login error', error);
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Could not log in with Google. Please try again.',
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
       <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-background" />
            <div className="absolute bottom-0 left-[-20%] right-[-20%] top-[-10%] h-[500px] w-full rounded-full bg-[radial-gradient(circle_farthest-side,rgba(var(--primary-rgb),0.15),rgba(255,255,255,0))]" />
            <div className="absolute bottom-[-20%] right-[0%] top-[-10%] h-[500px] w-full rounded-full bg-[radial-gradient(circle_farthest-side,rgba(var(--accent-rgb),0.1),rgba(255,255,255,0))]" />
          </div>
      <Card className="w-full max-w-sm glass z-10">
        <CardHeader className="text-center">
          <Logo className="justify-center mb-4" />
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Enter your email below to login to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" required />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Link href="#" className="ml-auto inline-block text-sm underline">
                  Forgot your password?
                </Link>
              </div>
              <Input id="password" type="password" required />
            </div>
            <Button type="submit" className="w-full" disabled>
              Login
            </Button>
            <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
              Login with Google
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

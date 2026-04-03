import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useApp } from '@/context/AppContext';
import Navbar from '@/components/layout/Navbar';

export default function Login() {
  const [searchParams] = useSearchParams();
  const initialRole = (searchParams.get('role') as 'user' | 'seller') || 'user';
  const [role, setRole] = useState<'user' | 'seller'>(initialRole);
  const { login } = useApp();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(role);
    navigate(role === 'seller' ? '/seller' : '/dashboard');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome Back</CardTitle>
              <CardDescription>Log in to your Star Purpose account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex rounded-lg bg-muted p-1 mb-6">
                <button onClick={() => setRole('user')} className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${role === 'user' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}>
                  User
                </button>
                <button onClick={() => setRole('seller')} className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${role === 'seller' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}>
                  Seller
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" defaultValue="alex@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="••••••••" defaultValue="password123" />
                </div>
                <Button type="submit" className="w-full gradient-primary text-primary-foreground">
                  Log In as {role === 'user' ? 'User' : 'Seller'}
                </Button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or continue with</span></div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Button variant="outline" type="button" className="text-sm">Google</Button>
                  <Button variant="outline" type="button" className="text-sm">GitHub</Button>
                </div>
              </div>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Don't have an account?{' '}
                <a href="/signup" className="text-primary hover:underline">Sign up</a>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

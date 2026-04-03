import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useApp } from '@/context/AppContext';
import Navbar from '@/components/layout/Navbar';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loginUser } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const u = await loginUser(email.trim(), password);
    if (!u) return;
    if (u.role === 'admin') navigate('/admin', { replace: true });
    else if (u.role === 'seller') navigate('/seller', { replace: true });
    else navigate('/dashboard', { replace: true });
  };

  return (
    <div className="relative z-10 min-h-screen">
      <Navbar />
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 pb-16 pt-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Card className="border-border shadow-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Sign in</CardTitle>
              <CardDescription>Use the email and password for your account. Your role determines which dashboard opens.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
                <Button type="submit" className="w-full gradient-primary text-primary-foreground">
                  Continue
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                No account?{' '}
                <Link to="/signup" className="font-medium text-primary hover:underline">
                  Create one
                </Link>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';

export default function AdminSignin() {
  const { loginUser, logout } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const u = await loginUser(email.trim(), password);
    if (!u) return;
    if (u.role !== 'admin') {
      toast.error('This account is not an administrator.');
      logout();
      return;
    }
    navigate('/admin', { replace: true });
  };

  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-24">
      <Card className="w-full max-w-md border-border bg-card shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Admin access</CardTitle>
          <CardDescription>Authorized operators only.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-signin-email">Email</Label>
              <Input
                id="admin-signin-email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-signin-pass">Password</Label>
              <Input
                id="admin-signin-pass"
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
        </CardContent>
      </Card>
    </div>
  );
}

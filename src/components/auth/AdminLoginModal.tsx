import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useState } from 'react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AdminLoginModal({ open, onOpenChange }: Props) {
  const { login } = useApp();
  const navigate = useNavigate();
  const [code, setCode] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login('admin');
    onOpenChange(false);
    navigate('/admin');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-2">
            <Shield className="w-6 h-6 text-accent-foreground" />
          </div>
          <DialogTitle className="text-center">Admin Access</DialogTitle>
          <DialogDescription className="text-center">Enter your admin credentials</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email">Email</Label>
            <Input id="admin-email" type="email" placeholder="admin@starpurpose.com" defaultValue="admin@starpurpose.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-pass">Password</Label>
            <Input id="admin-pass" type="password" placeholder="••••••••" defaultValue="admin123" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-code">Access Code</Label>
            <Input id="admin-code" placeholder="Enter access code" value={code} onChange={e => setCode(e.target.value)} />
          </div>
          <Button type="submit" className="w-full gradient-primary text-primary-foreground">
            Access Admin Panel
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

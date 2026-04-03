import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/context/AppContext';
import Navbar from '@/components/layout/Navbar';

const skillOptions = ['Surveys', 'Data Entry', 'Writing', 'QA Testing', 'Design', 'Transcription', 'Moderation'];

export default function Signup() {
  const [searchParams] = useSearchParams();
  const initialRole = (searchParams.get('role') as 'user' | 'seller') || 'user';
  const [role, setRole] = useState<'user' | 'seller'>(initialRole);
  const [step, setStep] = useState(1);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const { login } = useApp();
  const navigate = useNavigate();

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1 && role === 'user') {
      setStep(2);
      return;
    }
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
              <CardTitle className="text-2xl">{step === 1 ? 'Create Account' : 'Pick Your Skills'}</CardTitle>
              <CardDescription>{step === 1 ? 'Join STAR PURPOSE and start earning' : 'Help us match you with the right tasks'}</CardDescription>
            </CardHeader>
            <CardContent>
              {step === 1 && (
                <>
                  <div className="flex rounded-lg bg-muted p-1 mb-6">
                    <button onClick={() => setRole('user')} className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${role === 'user' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}>User</button>
                    <button onClick={() => setRole('seller')} className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${role === 'seller' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}>Seller</button>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" placeholder="Your name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="you@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input id="password" type="password" placeholder="••••••••" />
                    </div>
                    <Button type="submit" className="w-full gradient-primary text-primary-foreground">
                      {role === 'user' ? 'Continue' : 'Create Seller Account'}
                    </Button>
                  </form>
                </>
              )}

              {step === 2 && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex flex-wrap gap-2">
                    {skillOptions.map(skill => (
                      <Badge key={skill} variant={selectedSkills.includes(skill) ? 'default' : 'outline'}
                        className={`cursor-pointer transition-colors ${selectedSkills.includes(skill) ? 'gradient-primary text-primary-foreground' : ''}`}
                        onClick={() => toggleSkill(skill)}>
                        {skill}
                      </Badge>
                    ))}
                  </div>
                  <Button type="submit" className="w-full gradient-primary text-primary-foreground">
                    Start Earning
                  </Button>
                </form>
              )}

              {step === 1 && (
                <p className="text-center text-sm text-muted-foreground mt-6">
                  Already have an account? <a href="/login" className="text-primary hover:underline">Log in</a>
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

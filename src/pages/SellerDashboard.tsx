import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, BarChart3, List, CheckCircle, DollarSign, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useApp } from '@/context/AppContext';
import Navbar from '@/components/layout/Navbar';

const statusColor: Record<string, string> = {
  available: 'bg-primary/10 text-primary',
  'in-progress': 'bg-warning/10 text-warning',
  completed: 'bg-success/10 text-success',
};

export default function SellerDashboard() {
  const { sellerTasks, postTask } = useApp();
  const [tab, setTab] = useState<'tasks' | 'post' | 'analytics' | 'payments'>('tasks');
  const [form, setForm] = useState({ title: '', description: '', timeEstimate: 10, reward: 5, category: 'Survey', difficulty: 'Easy' as const });

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    postTask({ ...form, timeEstimate: Number(form.timeEstimate), reward: Number(form.reward) });
    setForm({ title: '', description: '', timeEstimate: 10, reward: 5, category: 'Survey', difficulty: 'Easy' });
    setTab('tasks');
  };

  const completedCount = sellerTasks.filter(t => t.status === 'completed').length;
  const totalSpent = sellerTasks.reduce((s, t) => s + t.reward, 0);
  const chartData = [
    { day: 'Mon', tasks: 3 }, { day: 'Tue', tasks: 5 }, { day: 'Wed', tasks: 4 },
    { day: 'Thu', tasks: 7 }, { day: 'Fri', tasks: 6 }, { day: 'Sat', tasks: 2 }, { day: 'Sun', tasks: 1 },
  ];

  const tabs = [
    { id: 'tasks' as const, label: 'My Tasks', icon: List },
    { id: 'post' as const, label: 'Post Task', icon: Plus },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
    { id: 'payments' as const, label: 'Payments', icon: DollarSign },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-2xl font-bold mb-6 text-foreground">Seller Dashboard</motion.h1>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card><CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{sellerTasks.length}</p>
              <p className="text-xs text-muted-foreground">Total Tasks</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{completedCount}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">${totalSpent.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Total Spent</p>
            </CardContent></Card>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  tab === t.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                }`}>
                <t.icon className="w-4 h-4" /> {t.label}
              </button>
            ))}
          </div>

          {/* Tasks */}
          {tab === 'tasks' && (
            <div className="space-y-3">
              {sellerTasks.map((task, i) => (
                <motion.div key={task.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-foreground">{task.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{task.timeEstimate}min</span>
                          <span className="text-xs text-muted-foreground">${task.reward.toFixed(2)}</span>
                        </div>
                      </div>
                      <Badge className={statusColor[task.status] || ''}>{task.status}</Badge>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              {sellerTasks.length === 0 && <div className="text-center py-12 text-muted-foreground">No tasks posted yet</div>}
            </div>
          )}

          {/* Post task form */}
          {tab === 'post' && (
            <Card>
              <CardHeader><CardTitle>Post a New Task</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handlePost} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Task Title</Label>
                    <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g., Complete a quick survey" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe what the user needs to do..." required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Time Estimate (min)</Label>
                      <Input type="number" value={form.timeEstimate} onChange={e => setForm(f => ({ ...f, timeEstimate: Number(e.target.value) }))} min={1} max={30} />
                    </div>
                    <div className="space-y-2">
                      <Label>Reward ($)</Label>
                      <Input type="number" step="0.5" value={form.reward} onChange={e => setForm(f => ({ ...f, reward: Number(e.target.value) }))} min={0.5} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['Survey', 'Data Entry', 'Writing', 'QA Testing', 'Design', 'Transcription', 'Moderation'].map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Difficulty</Label>
                      <Select value={form.difficulty} onValueChange={v => setForm(f => ({ ...f, difficulty: v as any }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Easy">Easy</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" className="w-full gradient-primary text-primary-foreground">Post Task</Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Analytics */}
          {tab === 'analytics' && (
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle className="text-lg">Tasks Completed This Week</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Bar dataKey="tasks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <div className="grid grid-cols-2 gap-4">
                <Card><CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">8.5 min</p>
                  <p className="text-xs text-muted-foreground">Avg Completion Time</p>
                </CardContent></Card>
                <Card><CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">94%</p>
                  <p className="text-xs text-muted-foreground">Success Rate</p>
                </CardContent></Card>
              </div>
            </div>
          )}

          {/* Payments */}
          {tab === 'payments' && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
                  <p className="text-3xl font-bold gradient-text">${totalSpent.toFixed(2)}</p>
                  <Button className="mt-4 gradient-primary text-primary-foreground">Add Funds</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg">Payment History</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {sellerTasks.map(t => (
                    <div key={t.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-foreground">{t.title}</p>
                        <p className="text-xs text-muted-foreground">{t.createdAt}</p>
                      </div>
                      <span className="text-sm font-semibold text-destructive">-${t.reward.toFixed(2)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

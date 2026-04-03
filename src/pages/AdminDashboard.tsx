import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, ListTodo, DollarSign, TrendingUp, Search, Flag, Ban, BarChart3, Shield, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { mockUsers, mockSellers, mockTasks, chartData } from '@/data/mockData';
import Navbar from '@/components/layout/Navbar';
import { toast } from 'sonner';

const COLORS = ['hsl(239,84%,67%)', 'hsl(263,70%,58%)', 'hsl(142,71%,45%)', 'hsl(38,92%,50%)', 'hsl(0,84%,60%)', 'hsl(210,40%,70%)'];

function AnimatedCounter({ value, prefix = '' }: { value: number; prefix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{prefix}{display.toLocaleString()}</span>;
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<'overview' | 'users' | 'tasks' | 'transactions' | 'analytics'>('overview');
  const [search, setSearch] = useState('');

  const allUsers = [...mockUsers, ...mockSellers];
  const filteredUsers = allUsers.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
    { id: 'users' as const, label: 'Users', icon: Users },
    { id: 'tasks' as const, label: 'Tasks', icon: ListTodo },
    { id: 'transactions' as const, label: 'Transactions', icon: DollarSign },
    { id: 'analytics' as const, label: 'Analytics', icon: Activity },
  ];

  const handleFlag = (name: string) => toast.warning(`User ${name} has been flagged for review`);
  const handleSuspend = (name: string) => toast.error(`User ${name} has been suspended`);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Platform control center</p>
            </div>
          </div>

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

          {/* Overview */}
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Users', value: 10482, icon: Users, color: 'text-primary' },
                  { label: 'Active Tasks', value: 1247, icon: ListTodo, color: 'text-secondary' },
                  { label: 'Revenue', value: 32000, icon: DollarSign, prefix: '$', color: 'text-success' },
                  { label: 'Growth', value: 23, suffix: '%', icon: TrendingUp, color: 'text-warning' },
                ].map((stat, i) => (
                  <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                        <p className="text-2xl font-bold text-foreground">
                          <AnimatedCounter value={stat.value} prefix={stat.prefix || ''} />{stat.suffix || ''}
                        </p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <Card>
                <CardHeader><CardTitle className="text-lg">Weekly Task Activity</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData.weeklyTasks}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Bar dataKey="tasks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Users */}
          {tab === 'users' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-10" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map(u => (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-foreground">{u.avatar}</div>
                              <div>
                                <p className="text-sm font-medium text-foreground">{u.name}</p>
                                <p className="text-xs text-muted-foreground">{u.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
                          <TableCell>
                            <Badge className={u.status === 'active' ? 'bg-success/10 text-success' : u.status === 'flagged' ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive'}>
                              {u.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{u.rating}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => handleFlag(u.name)}><Flag className="w-3 h-3" /></Button>
                              <Button size="sm" variant="ghost" onClick={() => handleSuspend(u.name)}><Ban className="w-3 h-3" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tasks */}
          {tab === 'tasks' && (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reward</TableHead>
                      <TableHead>Posted By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockTasks.map(t => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium text-foreground">{t.title}</TableCell>
                        <TableCell><Badge variant="outline">{t.category}</Badge></TableCell>
                        <TableCell>
                          <Badge className={t.status === 'available' ? 'bg-primary/10 text-primary' : t.status === 'completed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}>
                            {t.status}
                          </Badge>
                        </TableCell>
                        <TableCell>${t.reward.toFixed(2)}</TableCell>
                        <TableCell className="text-muted-foreground">{t.postedBy}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Transactions */}
          {tab === 'transactions' && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Recent Transactions</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { id: 'TXN-001', type: 'Task Payment', amount: 5.00, desc: 'Survey completion', status: 'completed' },
                      { id: 'TXN-002', type: 'Withdrawal', amount: 50.00, desc: 'PayPal withdrawal', status: 'completed' },
                      { id: 'TXN-003', type: 'Task Payment', amount: 3.75, desc: 'Image tagging', status: 'completed' },
                      { id: 'TXN-004', type: 'Deposit', amount: 200.00, desc: 'Seller deposit', status: 'completed' },
                      { id: 'TXN-005', type: 'Task Payment', amount: 8.00, desc: 'Logo concept', status: 'pending' },
                      { id: 'TXN-006', type: 'Refund', amount: 4.50, desc: 'Disputed task', status: 'completed' },
                    ].map(tx => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-mono text-sm text-foreground">{tx.id}</TableCell>
                        <TableCell>{tx.type}</TableCell>
                        <TableCell className="font-semibold text-foreground">${tx.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-muted-foreground">{tx.desc}</TableCell>
                        <TableCell>
                          <Badge className={tx.status === 'completed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}>
                            {tx.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Analytics */}
          {tab === 'analytics' && (
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle className="text-lg">Monthly Revenue</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData.monthlyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle className="text-lg">Task Categories</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={chartData.taskCategories} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {chartData.taskCategories.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-lg">Platform Health</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { label: 'Avg Task Completion', value: '8.3 min', pct: 83 },
                      { label: 'User Satisfaction', value: '4.7/5', pct: 94 },
                      { label: 'Task Success Rate', value: '96%', pct: 96 },
                      { label: 'Platform Uptime', value: '99.9%', pct: 99 },
                    ].map(m => (
                      <div key={m.label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">{m.label}</span>
                          <span className="font-medium text-foreground">{m.value}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-muted">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${m.pct}%` }} transition={{ duration: 1, delay: 0.2 }}
                            className="h-full rounded-full gradient-primary" />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, ListTodo, DollarSign, TrendingUp, Search, Flag, Ban, BarChart3, Shield, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import Navbar from '@/components/layout/Navbar';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import type { SessionUser } from '@/context/AppContext';
import { apiPath, getAuthHeaders } from '@/lib/api';

type ApiEnvelope<T> = { success?: boolean; data?: T; error?: string };
function unwrap<T>(payload: ApiEnvelope<T> | T): T {
  if (payload && typeof payload === 'object' && 'data' in (payload as ApiEnvelope<T>)) {
    return ((payload as ApiEnvelope<T>).data ?? payload) as T;
  }
  return payload as T;
}

type ApiTaskRow = {
  id: number;
  title: string;
  price: number;
  status: string;
  category?: string;
  postedBy?: string;
  timeEstimateMinutes?: number;
  createdAt?: string;
  userEarning?: number;
  adminRevenue?: number;
  commission?: number;
};

type FinancePayload = {
  platformWalletBalance: number;
  listingPayments: Array<{
    id: string;
    taskId: number;
    amount: number;
    sellerEmail: string;
    type: string;
    createdAt: string;
  }>;
  commissionFromTasks: number;
};

const COLORS = ['hsl(152,65%,42%)', 'hsl(160,45%,38%)', 'hsl(142,71%,45%)', 'hsl(38,92%,50%)', 'hsl(210,40%,55%)', 'hsl(262,45%,58%)'];

function AnimatedCounter({ value, prefix = '' }: { value: number; prefix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const duration = 800;
    const steps = 24;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else setDisplay(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{prefix}{display.toLocaleString()}</span>;
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<'overview' | 'users' | 'tasks' | 'transactions' | 'analytics'>('overview');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<SessionUser[]>([]);
  const [tasks, setTasks] = useState<ApiTaskRow[]>([]);
  const [finance, setFinance] = useState<FinancePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const { commissionPct, fetchConfig } = useApp();
  const [localCommission, setLocalCommission] = useState(15);
  useEffect(() => { setLocalCommission(commissionPct); }, [commissionPct]);

  const saveCommission = async () => {
    try {
      const res = await fetch(apiPath('/api/config'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ commissionPct: localCommission }),
      });
      if (res.ok) {
        toast.success("Platform commission updated globally.");
        await fetchConfig();
      } else {
        toast.error("Failed to update commission.");
      }
    } catch {
      toast.error('Network error');
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const auth = getAuthHeaders();
      const [uRes, tRes, fRes] = await Promise.all([
        fetch(apiPath('/api/users'), { headers: { ...auth } }),
        fetch(apiPath('/api/tasks'), { headers: { ...auth } }),
        fetch(apiPath('/api/admin/finance'), { headers: { ...auth } }),
      ]);
      const uRaw = await uRes.json().catch(() => ({}));
      const tRaw = await tRes.json().catch(() => ({}));
      const fRaw = await fRes.json().catch(() => ({}));
      if (!uRes.ok) {
        setLoadError((uRaw as ApiEnvelope<unknown>).error || 'Failed to load users');
        setUsers([]);
      } else {
        setUsers((unwrap(uRaw) as SessionUser[]) || []);
      }
      if (!tRes.ok) {
        setLoadError((tRaw as ApiEnvelope<unknown>).error || 'Failed to load tasks');
        setTasks([]);
      } else {
        setTasks((unwrap(tRaw) as ApiTaskRow[]) || []);
      }
      if (fRes.ok) {
        setFinance(unwrap(fRaw) as FinancePayload);
      } else {
        setFinance(null);
      }
    } catch {
      setLoadError('Cannot reach the API. Is the server running?');
      setUsers([]);
      setTasks([]);
      setFinance(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredUsers = useMemo(
    () =>
      users.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase()),
      ),
    [users, search],
  );

  const stats = useMemo(() => {
    const totalUsers = users.length;
    const activeTasks = tasks.filter((t) => t.status === 'OPEN').length;
    const paid = tasks.filter((t) => t.status === 'PAID');
    const revenue = paid.reduce((s, t) => s + (Number(t.adminRevenue) || 0), 0);
    const buyers = users.filter((u) => u.role === 'user').length;
    const growthPct = totalUsers > 0 ? Math.min(100, Math.round((buyers / totalUsers) * 100)) : 0;
    return { totalUsers, activeTasks, revenue, growthPct };
  }, [users, tasks]);

  const weeklyFromTasks = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = days.map((day) => ({ day, tasks: 0 }));
    for (const t of tasks) {
      if (!t.createdAt) continue;
      const d = new Date(t.createdAt);
      if (Number.isNaN(d.getTime())) continue;
      const idx = d.getDay();
      counts[idx].tasks += 1;
    }
    const monFirst = [1, 2, 3, 4, 5, 6, 0].map((i) => counts[i]);
    return monFirst;
  }, [tasks]);

  const categoryPie = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tasks) {
      const c = t.category || 'General';
      map.set(c, (map.get(c) || 0) + 1);
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [tasks]);

  const monthlyRevenue = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tasks) {
      if (t.status !== 'PAID' || !t.createdAt) continue;
      const d = new Date(t.createdAt);
      if (Number.isNaN(d.getTime())) continue;
      const key = d.toLocaleString('en', { month: 'short' });
      map.set(key, (map.get(key) || 0) + (Number(t.adminRevenue) || 0));
    }
    const rows = Array.from(map.entries()).map(([month, revenue]) => ({ month, revenue }));
    return rows.length ? rows : [{ month: '—', revenue: 0 }];
  }, [tasks]);

  const txRows = useMemo(() => {
    const fromTasks = tasks
      .filter((t) => t.status === 'PAID')
      .map((t) => ({
        id: `PAYOUT-${t.id}`,
        type: 'Commission (approved task)',
        amount: Number(t.adminRevenue) || 0,
        desc: t.title,
        status: 'completed' as const,
      }));
    const fromListings =
      finance?.listingPayments.map((p) => ({
        id: p.id,
        type: 'Listing payment',
        amount: p.amount,
        desc: `Task #${p.taskId} — ${p.sellerEmail}`,
        status: 'completed' as const,
      })) ?? [];
    return [...fromListings, ...fromTasks];
  }, [tasks, finance]);

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
    { id: 'users' as const, label: 'Users', icon: Users },
    { id: 'tasks' as const, label: 'Tasks', icon: ListTodo },
    { id: 'transactions' as const, label: 'Transactions', icon: DollarSign },
    { id: 'analytics' as const, label: 'Analytics', icon: Activity },
  ];

  const patchUserStatus = async (id: string, status: 'flagged' | 'suspended') => {
    try {
      const res = await fetch(apiPath(`/api/users/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status }),
      });
      const raw = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error((raw as ApiEnvelope<unknown>).error || 'Update failed');
        return;
      }
      const updated = unwrap(raw) as SessionUser;
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updated } : u)));
      toast.success(status === 'flagged' ? 'User flagged for review' : 'User suspended');
    } catch {
      toast.error('Network error');
    }
  };

  const uiStatus = (t: ApiTaskRow) => {
    if (t.status === 'OPEN') return 'live';
    if (t.status === 'PENDING_PAYMENT') return 'awaiting pay';
    if (t.status === 'ASSIGNED') return 'assigned';
    if (t.status === 'SUBMITTED') return 'review';
    if (t.status === 'PAID') return 'paid';
    if (t.status === 'REJECTED') return 'rejected';
    return t.status;
  };

  return (
    <div className="relative z-10 min-h-screen bg-primary/[0.02]">
      <Navbar />
      <div className="border-b border-primary/10 bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto max-w-6xl px-4 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">Operations</h1>
                <p className="text-sm text-muted-foreground">Users, tasks, and platform controls</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => void loadData()} disabled={loading}>
              {loading ? 'Refreshing…' : 'Refresh'}
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 pb-8 pt-6">
        <div className="container mx-auto max-w-6xl">
          {loadError && (
            <p className="text-sm text-destructive mb-4">{loadError}</p>
          )}

          <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  tab === t.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <t.icon className="w-4 h-4" /> {t.label}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-primary', prefix: '', suffix: '' },
                  { label: 'Open Tasks', value: stats.activeTasks, icon: ListTodo, color: 'text-secondary', prefix: '', suffix: '' },
                  { label: 'Commission (approved tasks)', value: Math.round(stats.revenue * 100) / 100, icon: DollarSign, prefix: '$', suffix: '' },
                  { label: 'Buyer share (of all users)', value: stats.growthPct, icon: TrendingUp, prefix: '', suffix: '%' },
                ].map((stat, i) => (
                  <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                        <p className="text-2xl font-bold text-foreground">
                          <AnimatedCounter value={stat.value} prefix={stat.prefix} />
                          {stat.suffix}
                        </p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <Card>
                <CardHeader><CardTitle className="text-lg">Global Platform Settings</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2 max-w-xl">
                      <Label>Platform Commission Rate ({localCommission}%)</Label>
                      <Slider
                        value={[localCommission]}
                        onValueChange={([v]) => setLocalCommission(v ?? 15)}
                        min={10}
                        max={20}
                        step={1}
                        className="py-2"
                      />
                      <p className="text-xs text-muted-foreground mb-4">Set the global commission taken from sellers. Applied to all new task payments.</p>
                      <Button onClick={() => void saveCommission()} disabled={localCommission === commissionPct} className="bg-primary text-primary-foreground">
                        {localCommission === commissionPct ? 'Saved' : 'Save Changes'}
                      </Button>
                    </div>
                </CardContent>
              </Card>

              {finance && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">Platform wallet (mock listings)</p>
                      <p className="text-2xl font-bold text-foreground">${finance.platformWalletBalance.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">Commission recorded on tasks</p>
                      <p className="text-2xl font-bold text-foreground">${finance.commissionFromTasks.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              <Card>
                <CardHeader><CardTitle className="text-lg">Tasks created by weekday</CardTitle></CardHeader>
                <CardContent>
                  {tasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">No tasks yet — data appears when sellers post tasks.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={weeklyFromTasks}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                        <Bar dataKey="tasks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {tab === 'users' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-10" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Card>
                <CardContent className="p-0">
                  {filteredUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-8 text-center">No registered users yet.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Balance</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((u) => (
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
                            <TableCell>${u.balance.toFixed(2)}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" type="button" onClick={() => void patchUserStatus(u.id, 'flagged')} disabled={u.role === 'admin'}><Flag className="w-3 h-3" /></Button>
                                <Button size="sm" variant="ghost" type="button" onClick={() => void patchUserStatus(u.id, 'suspended')} disabled={u.role === 'admin'}><Ban className="w-3 h-3" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {tab === 'tasks' && (
            <Card>
              <CardContent className="p-0">
                {tasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-8 text-center">No tasks in the system yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Est.</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reward</TableHead>
                        <TableHead>Posted By</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasks.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium text-foreground max-w-[200px] truncate">{t.title}</TableCell>
                          <TableCell><Badge variant="outline">{t.category || '—'}</Badge></TableCell>
                          <TableCell className="text-muted-foreground text-sm">{t.timeEstimateMinutes ?? '—'} min</TableCell>
                          <TableCell>
                            <Badge className={uiStatus(t) === 'live' ? 'bg-primary/10 text-primary' : uiStatus(t) === 'paid' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}>
                              {uiStatus(t)}
                            </Badge>
                          </TableCell>
                          <TableCell>${Number(t.price).toFixed(2)}</TableCell>
                          <TableCell className="text-muted-foreground">{t.postedBy || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {tab === 'transactions' && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Completed task payments</CardTitle></CardHeader>
              <CardContent className="p-0">
                {txRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-8 text-center">No completed tasks yet.</p>
                ) : (
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
                      {txRows.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="font-mono text-sm text-foreground">{tx.id}</TableCell>
                          <TableCell>{tx.type}</TableCell>
                          <TableCell className="font-semibold text-foreground">${tx.amount.toFixed(2)}</TableCell>
                          <TableCell className="text-muted-foreground max-w-[240px] truncate">{tx.desc}</TableCell>
                          <TableCell>
                            <Badge className="bg-success/10 text-success">{tx.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {tab === 'analytics' && (
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle className="text-lg">Commission by month (paid tasks)</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={monthlyRevenue}>
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
                  <CardHeader><CardTitle className="text-lg">Tasks by category</CardTitle></CardHeader>
                  <CardContent>
                    {categoryPie.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-8 text-center">No category data yet.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie data={categoryPie} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                            {categoryPie.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-lg">Summary</CardTitle></CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Registered users</span><span className="font-medium">{users.length}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Total tasks</span><span className="font-medium">{tasks.length}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Open</span><span className="font-medium">{tasks.filter((t) => t.status === 'OPEN').length}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Paid out</span><span className="font-medium">{tasks.filter((t) => t.status === 'PAID').length}</span></div>
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

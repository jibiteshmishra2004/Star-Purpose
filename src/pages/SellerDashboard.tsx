import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, BarChart3, List, DollarSign, Clock, Bell, CreditCard, Gavel } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useApp } from '@/context/AppContext';
import Navbar from '@/components/layout/Navbar';
import { publicAssetUrl } from '@/lib/api';

const statusColor: Record<string, string> = {
  available: 'bg-primary/10 text-primary',
  'pending-payment': 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  'in-progress': 'bg-warning/10 text-warning',
  submitted: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  completed: 'bg-success/10 text-success',
  rejected: 'bg-destructive/10 text-destructive',
};

export default function SellerDashboard() {
  const [searchParams] = useSearchParams();
  const {
    sellerTasks,
    postTask,
    postingTask,
    notifications,
    markNotificationRead,
    payListing,
    payingTaskId,
    approveSubmission,
    rejectSubmission,
    commissionPct,
  } = useApp();
  const [tab, setTab] = useState<'tasks' | 'post' | 'reviews' | 'analytics' | 'payments' | 'notifications'>('tasks');

  useEffect(() => {
    if (searchParams.get('tab') === 'notifications') setTab('notifications');
  }, [searchParams]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    timeEstimate: 60,
    reward: 5,
    category: 'Survey',
    difficulty: 'Easy' as const,
    contactInfo: '',
    requiresContact: false,
  });
  const [paymentTaskId, setPaymentTaskId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await postTask({
      ...form,
      timeEstimate: Number(form.timeEstimate),
      reward: Number(form.reward),
      commissionRate: commissionPct / 100,
    });
    setForm({
      title: '',
      description: '',
      timeEstimate: 60,
      reward: 5,
      category: 'Survey',
      difficulty: 'Easy',
      contactInfo: '',
      requiresContact: false,
    });
    if (created?.id) {
      setPaymentTaskId(created.id);
      setPaymentAmount(created.reward);
      setTab('tasks');
    }
  };

  const completedCount = sellerTasks.filter((t) => t.status === 'completed').length;
  const pendingPay = sellerTasks.filter((t) => t.backendStatus === 'PENDING_PAYMENT');
  const toReview = sellerTasks.filter((t) => t.backendStatus === 'SUBMITTED');
  const totalSpent = sellerTasks.reduce((s, t) => s + t.reward, 0);
  const chartData = [
    { day: 'Mon', tasks: 3 }, { day: 'Tue', tasks: 5 }, { day: 'Wed', tasks: 4 },
    { day: 'Thu', tasks: 7 }, { day: 'Fri', tasks: 6 }, { day: 'Sat', tasks: 2 }, { day: 'Sun', tasks: 1 },
  ];

  const unread = notifications.filter((n) => !n.read).length;
  const tabs = [
    { id: 'tasks' as const, label: 'My Tasks', icon: List },
    { id: 'post' as const, label: 'Post Task', icon: Plus },
    { id: 'reviews' as const, label: `Reviews${toReview.length ? ` (${toReview.length})` : ''}`, icon: Gavel },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
    { id: 'payments' as const, label: 'Payments', icon: DollarSign },
    { id: 'notifications' as const, label: `Alerts${unread ? ` (${unread})` : ''}`, icon: Bell },
  ];

  return (
    <div className="relative z-10 min-h-screen border-l-[3px] border-amber-600/35 bg-background">
      <Navbar />
      <div className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Seller</p>
            <h1 className="text-2xl font-bold text-foreground">Task studio</h1>
            <p className="text-sm text-muted-foreground mt-1">Create listings and track what you have posted.</p>
          </motion.div>

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

          <Dialog open={!!paymentTaskId} onOpenChange={(o) => !o && setPaymentTaskId(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Listing payment (mock)</DialogTitle>
                <DialogDescription>
                  Pay the task reward to publish it to the marketplace. Funds go to the platform wallet until the earner is paid after your approval.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 text-center">
                <p className="text-3xl font-bold text-foreground">${paymentAmount.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">Simulated charge — click Pay to continue.</p>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setPaymentTaskId(null)}>Cancel</Button>
                <Button
                  type="button"
                  className="gradient-primary text-primary-foreground gap-2"
                  disabled={!paymentTaskId || payingTaskId === paymentTaskId}
                  onClick={() => {
                    if (paymentTaskId) void payListing(paymentTaskId).then(() => setPaymentTaskId(null));
                  }}
                >
                  <CreditCard className="w-4 h-4" />
                  {payingTaskId === paymentTaskId ? 'Processing…' : 'Pay & publish'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Tasks */}
          {tab === 'tasks' && (
            <div className="space-y-3">
              {pendingPay.length > 0 && (
                <p className="text-xs text-orange-700 dark:text-orange-400 font-medium">
                  {pendingPay.length} task(s) awaiting listing payment — open the Pay dialog from each row or post a new task.
                </p>
              )}
              {sellerTasks.map((task, i) => (
                <motion.div key={task.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card>
                    <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-foreground">{task.title}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{task.timeEstimate}min</span>
                          <span className="text-xs text-muted-foreground">${task.reward.toFixed(2)}</span>
                          {task.commissionRate != null && (
                            <span className="text-xs text-muted-foreground">Fee {(task.commissionRate * 100).toFixed(0)}%</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={statusColor[task.status] || ''}>{task.status}</Badge>
                        {task.backendStatus === 'PENDING_PAYMENT' && (
                          <Button
                            size="sm"
                            className="gradient-primary text-primary-foreground"
                            onClick={() => {
                              setPaymentTaskId(task.id);
                              setPaymentAmount(task.reward);
                            }}
                          >
                            Pay
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              {sellerTasks.length === 0 && <div className="text-center py-12 text-muted-foreground">No tasks posted yet</div>}
            </div>
          )}

          {tab === 'reviews' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Approve or reject work after an earner submits it.</p>
              {toReview.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">Nothing waiting for review</div>
              ) : (
                toReview.map((task) => (
                  <Card key={task.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{task.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      {task.submission?.text && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                          <p className="text-foreground whitespace-pre-wrap">{task.submission.text}</p>
                        </div>
                      )}
                      {task.submission?.link && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Link</p>
                          <a href={task.submission.link} target="_blank" rel="noreferrer" className="text-primary underline break-all">
                            {task.submission.link}
                          </a>
                        </div>
                      )}
                      {task.submission?.file && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">File</p>
                          <a href={publicAssetUrl(task.submission.file)} target="_blank" rel="noreferrer" className="text-primary underline">
                            Download
                          </a>
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90" onClick={() => void approveSubmission(task.id)}>
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive border-destructive/30" onClick={() => void rejectSubmission(task.id)}>
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
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
                      <Input type="number" value={form.timeEstimate} onChange={e => setForm(f => ({ ...f, timeEstimate: Number(e.target.value) }))} min={1} max={480} />
                    </div>
                    <div className="space-y-2">
                      <Label>Reward ($)</Label>
                      <Input type="number" step="0.5" value={form.reward} onChange={e => setForm(f => ({ ...f, reward: Number(e.target.value) }))} min={0.5} />
                    </div>
                  </div>
                    <div className="space-y-2">
                      <Label>Platform commission</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-base rounded-md px-3 py-1 bg-secondary shadow-sm">
                          {commissionPct}%
                        </Badge>
                        <p className="text-xs text-muted-foreground w-full">Taken from the task reward when you approve a submission.</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact">Contact info (optional)</Label>
                      <Textarea
                        id="contact"
                        value={form.contactInfo}
                        onChange={(e) => setForm((f) => ({ ...f, contactInfo: e.target.value }))}
                        placeholder="Phone, email, Telegram — shown to the earner after they accept (if enabled below)"
                        rows={2}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="reqc"
                        checked={form.requiresContact}
                        onCheckedChange={(c) => setForm((f) => ({ ...f, requiresContact: Boolean(c) }))}
                      />
                      <Label htmlFor="reqc" className="text-sm font-normal cursor-pointer">
                        Require contact — show the field above only after the earner accepts
                      </Label>
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
                  <Button type="submit" disabled={postingTask} aria-busy={postingTask} className="w-full gradient-primary text-primary-foreground">
                    {postingTask ? 'Saving…' : 'Save & continue to payment'}
                  </Button>
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

          {/* Notifications (same feed as user — task & payout events) */}
          {tab === 'notifications' && (
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">No notifications yet.</p>
              ) : (
                notifications.map((n) => (
                  <Card
                    key={n.id}
                    className={`cursor-pointer transition-colors ${!n.read ? 'border-primary/25 bg-accent/30' : ''}`}
                    onClick={() => markNotificationRead(n.id)}
                  >
                    <CardContent className="flex items-start gap-3 p-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Bell className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{n.title}</p>
                        <p className="text-xs text-muted-foreground">{n.message}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{n.time}</p>
                      </div>
                      {!n.read && <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    </CardContent>
                  </Card>
                ))
              )}
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

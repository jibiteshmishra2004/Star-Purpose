import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, DollarSign, Zap, CheckCircle, Wallet, History, User, Bell, Timer, Star, ArrowRight, X, PartyPopper } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import Navbar from '@/components/layout/Navbar';

const difficultyColor: Record<string, string> = {
  Easy: 'bg-success/10 text-success',
  Medium: 'bg-warning/10 text-warning',
  Hard: 'bg-destructive/10 text-destructive',
};

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const {
    tenMinMode, toggleTenMinMode, tasks, activeTask, taskTimer,
    acceptTask, submitWork, balance, transactions, notifications,
    markNotificationRead, showPaymentSuccess, setShowPaymentSuccess, tasksLoading, tasksError,
    acceptingTaskId, submittingTask, currentUser,
  } = useApp();
  const [tab, setTab] = useState<'tasks' | 'wallet' | 'history' | 'profile' | 'notifications'>('tasks');
  const [timer, setTimer] = useState(taskTimer);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'notifications') setTab('notifications');
  }, [searchParams]);

  useEffect(() => { setTimer(taskTimer); }, [taskTimer]);

  useEffect(() => {
    if (!activeTask) {
      setSubmitText('');
      setSubmitLink('');
      setSubmitFile(null);
    }
  }, [activeTask]);

  useEffect(() => {
    if (!activeTask || timer <= 0) return;
    const interval = setInterval(() => setTimer(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(interval);
  }, [activeTask, timer]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const [submitText, setSubmitText] = useState('');
  const [submitLink, setSubmitLink] = useState('');
  const [submitFile, setSubmitFile] = useState<File | null>(null);

  const availableTasks = tasks.filter((t) => {
    if (t.backendStatus !== 'OPEN') return false;
    if (tenMinMode && t.timeEstimate > 15) return false;
    return true;
  });
  const unread = notifications.filter(n => !n.read).length;

  const tabs = [
    { id: 'tasks' as const, label: 'Tasks', icon: Zap },
    { id: 'wallet' as const, label: 'Wallet', icon: Wallet },
    { id: 'history' as const, label: 'History', icon: History },
    { id: 'notifications' as const, label: `Alerts${unread ? ` (${unread})` : ''}`, icon: Bell },
    { id: 'profile' as const, label: 'Profile', icon: User },
  ];

  return (
    <div className="relative z-10 min-h-screen border-l-[3px] border-emerald-600/35 bg-background">
      <Navbar />

      {/* Payment Success Overlay */}
      <AnimatePresence>
        {showPaymentSuccess && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm"
            onClick={() => setShowPaymentSuccess(false)}>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
              className="bg-card border border-border rounded-2xl p-8 text-center max-w-sm mx-4 shadow-lg" onClick={e => e.stopPropagation()}>
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <PartyPopper className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-foreground">Payment Received!</h2>
              <p className="text-muted-foreground mb-1">You just earned</p>
              <p className="text-3xl font-bold gradient-text mb-4">${transactions[0]?.amount.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground mb-6">New balance: ${balance.toFixed(2)}</p>
              <Button onClick={() => setShowPaymentSuccess(false)} className="gradient-primary text-primary-foreground">
                Awesome!
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Earner</p>
            <h1 className="text-2xl font-bold text-foreground">Your tasks</h1>
            <p className="text-sm text-muted-foreground mt-1">Accept open work, run the timer, and mark complete when you are done.</p>
          </div>
          {/* Quick-task filter */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <button onClick={toggleTenMinMode}
              className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                tenMinMode
                  ? 'border-primary bg-accent shadow-lg animate-pulse-glow'
                  : 'border-border hover:border-primary/30'
              }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tenMinMode ? 'gradient-primary' : 'bg-muted'}`}>
                  <Timer className={`w-5 h-5 ${tenMinMode ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-foreground">Quick tasks</div>
                  <div className="text-xs text-muted-foreground">
                    {tenMinMode ? 'Only showing tasks with a 15 min estimate or less.' : 'Toggle to filter shorter tasks.'}
                  </div>
                </div>
              </div>
              <div className={`w-12 h-7 rounded-full p-1 transition-colors ${tenMinMode ? 'bg-primary' : 'bg-muted'}`}>
                <motion.div animate={{ x: tenMinMode ? 20 : 0 }} className="w-5 h-5 rounded-full bg-primary-foreground shadow" />
              </div>
            </button>
          </motion.div>

          {/* Active task banner */}
          <AnimatePresence>
            {activeTask && activeTask.backendStatus === 'ASSIGNED' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6">
                <Card className="border-primary/30 bg-accent/50">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <Badge className="gradient-primary text-primary-foreground">In progress</Badge>
                      <span className="text-2xl font-mono font-bold text-primary">{formatTime(timer)}</span>
                    </div>
                    <h3 className="font-semibold text-foreground">{activeTask.title}</h3>
                    <p className="text-sm text-muted-foreground">{activeTask.description}</p>
                    {activeTask.requiresContact && activeTask.contactInfo?.trim() && (
                      <div className="rounded-lg border border-border bg-card/80 p-3 text-sm">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">Contact</p>
                        <p className="text-foreground whitespace-pre-wrap">{activeTask.contactInfo}</p>
                      </div>
                    )}
                    <div className="w-full bg-muted rounded-full h-2">
                      <motion.div className="h-full rounded-full gradient-primary"
                        initial={{ width: '0%' }}
                        animate={{ width: `${Math.max(5, ((activeTask.timeEstimate * 60 - timer) / (activeTask.timeEstimate * 60)) * 100)}%` }}
                        transition={{ duration: 0.5 }} />
                    </div>
                    <div className="space-y-2 pt-2 border-t border-border/60">
                      <p className="text-xs font-medium text-muted-foreground">Submit your work</p>
                      <Label className="text-xs">Description</Label>
                      <Input value={submitText} onChange={(e) => setSubmitText(e.target.value)} placeholder="What you did / deliverables" />
                      <Label className="text-xs">Link (optional)</Label>
                      <Input value={submitLink} onChange={(e) => setSubmitLink(e.target.value)} placeholder="https://…" type="url" />
                      <Label className="text-xs">File (optional)</Label>
                      <Input type="file" onChange={(e) => setSubmitFile(e.target.files?.[0] ?? null)} className="cursor-pointer text-sm" />
                    </div>
                    <Button
                      onClick={() => void submitWork({ text: submitText, link: submitLink, file: submitFile })}
                      disabled={submittingTask}
                      aria-busy={submittingTask}
                      className="w-full gradient-primary text-primary-foreground gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {submittingTask ? 'Submitting…' : 'Submit work'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

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

          {/* Tasks tab */}
          {tab === 'tasks' && (
            <div className="space-y-4">
              {availableTasks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {tasksLoading ? 'Loading available tasks...' : 'No tasks available right now'}
                </div>
              ) : (
                availableTasks.map((task, i) => (
                  <motion.div key={task.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card className="hover:shadow-md hover:border-primary/30 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm text-foreground">{task.title}</h3>
                            <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-3 flex-wrap">
                          <Badge variant="outline" className="text-xs gap-1"><Clock className="w-3 h-3" /> {task.timeEstimate} min</Badge>
                          <Badge variant="outline" className="text-xs gap-1"><DollarSign className="w-3 h-3" /> ${task.reward.toFixed(2)}</Badge>
                          <Badge className={`text-xs ${difficultyColor[task.difficulty]}`}>{task.difficulty}</Badge>
                          <span className="text-xs text-muted-foreground ml-auto">{task.createdAt}</span>
                        </div>
                        <Button onClick={() => acceptTask(task.id)} disabled={!!activeTask || acceptingTaskId === task.id} aria-busy={acceptingTaskId === task.id} size="sm"
                          className="w-full mt-3 gradient-primary text-primary-foreground gap-1">
                          {acceptingTaskId === task.id ? 'Accepting…' : 'Accept Task'} <ArrowRight className="w-3 h-3" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
              {tasksError && <p className="text-center text-sm text-destructive">{tasksError}</p>}
            </div>
          )}

          {/* Wallet tab */}
          {tab === 'wallet' && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
                  <motion.p key={balance} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className="text-4xl font-bold gradient-text">
                    ${balance.toFixed(2)}
                  </motion.p>
                  <div className="flex gap-3 mt-4 justify-center">
                    <Button className="gradient-primary text-primary-foreground">Withdraw</Button>
                    <Button variant="outline">Add Funds</Button>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg">Recent Transactions</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {transactions.slice(0, 5).map(tx => (
                    <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-foreground">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">{tx.date}</p>
                      </div>
                      <span className={`text-sm font-semibold ${tx.type === 'earned' ? 'text-success' : tx.type === 'withdrawn' ? 'text-destructive' : 'text-foreground'}`}>
                        {tx.type === 'earned' ? '+' : '-'}${tx.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* History tab */}
          {tab === 'history' && (
            <div className="space-y-3">
              {tasks
                .filter(
                  (t) =>
                    t.assignedTo &&
                    currentUser &&
                    t.assignedTo.toLowerCase() === currentUser.email.toLowerCase() &&
                    ['in-progress', 'submitted', 'rejected', 'completed'].includes(t.status),
                )
                .map((task) => (
                <Card key={task.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-foreground">{task.title}</h3>
                      <p className="text-xs text-muted-foreground">{task.category} • {task.timeEstimate} min</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={task.status === 'completed' ? 'default' : 'outline'} className={task.status === 'completed' ? 'bg-success text-success-foreground' : ''}>
                        {task.status}
                      </Badge>
                      <p className="text-sm font-semibold mt-1 text-foreground">
                        {task.status === 'completed' && task.userEarning != null
                          ? `+$${Number(task.userEarning).toFixed(2)}`
                          : `$${task.reward.toFixed(2)}`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {tasks.filter(
                (t) =>
                  t.assignedTo &&
                  currentUser &&
                  t.assignedTo.toLowerCase() === currentUser.email.toLowerCase() &&
                  ['in-progress', 'submitted', 'rejected', 'completed'].includes(t.status),
              ).length === 0 && (
                <div className="text-center py-12 text-muted-foreground">No task history yet</div>
              )}
            </div>
          )}

          {/* Notifications tab */}
          {tab === 'notifications' && (
            <div className="space-y-3">
              {notifications.map(n => (
                <motion.div key={n.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Card className={`cursor-pointer transition-colors ${!n.read ? 'border-primary/20 bg-accent/30' : ''}`}
                    onClick={() => markNotificationRead(n.id)}>
                    <CardContent className="p-4 flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        n.type === 'payment' ? 'bg-success/10' : n.type === 'task' ? 'bg-primary/10' : 'bg-muted'
                      }`}>
                        {n.type === 'payment' ? <DollarSign className="w-4 h-4 text-success" /> :
                         n.type === 'task' ? <Zap className="w-4 h-4 text-primary" /> :
                         <Bell className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{n.title}</p>
                        <p className="text-xs text-muted-foreground">{n.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
                      </div>
                      {!n.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* Profile tab */}
          {tab === 'profile' && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xl font-bold">
                    {currentUser?.avatar || '?'}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{currentUser?.name || 'User'}</h2>
                    <p className="text-sm text-muted-foreground">{currentUser?.email || '—'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-foreground">{currentUser?.tasksCompleted ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Tasks Done</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-foreground">{(currentUser?.rating ?? 0).toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Rating</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-foreground">${balance.toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">Earned</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-foreground">Skills</Label>
                  {currentUser?.skills?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {currentUser.skills.map((s) => (
                        <Badge key={s} variant="outline">{s}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No skills listed yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

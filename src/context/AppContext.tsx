import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Notification, Task, Transaction } from '@/data/mockData';
import { toast } from 'sonner';
import {
  apiPath,
  connectionErrorMessage,
  SESSION_USER_KEY,
  SESSION_TOKEN_KEY,
  getAuthHeaders,
  SOCKET_URL,
} from '@/lib/api';

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'seller' | 'admin';
  balance: number;
  tasksCompleted: number;
  rating: number;
  status: string;
  joinedAt: string;
  avatar: string;
  skills: string[];
};

interface AppState {
  role: 'user' | 'seller' | 'admin' | null;
  isLoggedIn: boolean;
  currentUser: SessionUser | null;
  tenMinMode: boolean;
  balance: number;
  tasks: Task[];
  activeTask: Task | null;
  taskTimer: number;
  transactions: Transaction[];
  notifications: Notification[];
  sellerTasks: Task[];
  tasksLoading: boolean;
  tasksError: string | null;
  acceptingTaskId: string | null;
  submittingTask: boolean;
  postingTask: boolean;
  payingTaskId: string | null;
}

interface AppContextType extends AppState {
  registerUser: (input: {
    email: string;
    name: string;
    password: string;
    role: 'user' | 'seller';
    skills?: string[];
  }) => Promise<SessionUser | null>;
  loginUser: (email: string, password: string) => Promise<SessionUser | null>;
  logout: () => void;
  toggleTenMinMode: () => void;
  acceptTask: (taskId: string) => Promise<void>;
  submitWork: (payload: { text: string; link: string; file?: File | null }) => Promise<void>;
  payListing: (taskId: string) => Promise<void>;
  approveSubmission: (taskId: string) => Promise<void>;
  rejectSubmission: (taskId: string) => Promise<void>;
  postTask: (task: Omit<Task, 'id' | 'status' | 'createdAt' | 'postedBy' | 'sellerId' | 'backendStatus'>) => Promise<Task | null>;
  markNotificationRead: (id: string) => void;
  showPaymentSuccess: boolean;
  setShowPaymentSuccess: (v: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

type ApiTask = {
  id: number;
  title: string;
  price: number;
  status: string;
  assignedTo: string | null;
  description?: string;
  timeEstimateMinutes?: number;
  difficulty?: string;
  category?: string;
  postedBy?: string;
  sellerId?: number | null;
  createdAt?: string;
  commissionRate?: number;
  commission?: number;
  userEarning?: number;
  adminRevenue?: number;
  contactInfo?: string;
  requiresContact?: boolean;
  submission?: { text?: string; link?: string; file?: string | null } | null;
};

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  error?: string;
};

const statusMap: Record<string, Task['status']> = {
  PENDING_PAYMENT: 'pending-payment',
  OPEN: 'available',
  ASSIGNED: 'in-progress',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PAID: 'completed',
  DONE: 'completed',
  pending: 'available',
  'in-progress': 'in-progress',
};

function parseDifficulty(v: string | undefined): Task['difficulty'] {
  if (v === 'Easy' || v === 'Medium' || v === 'Hard') return v;
  return 'Medium';
}

function mapApiTaskToTask(apiTask: ApiTask): Task {
  const minutes = Math.max(1, Number(apiTask.timeEstimateMinutes) || 60);
  const mapped = statusMap[apiTask.status] || 'available';
  return {
    id: String(apiTask.id),
    title: apiTask.title,
    description: (apiTask.description && apiTask.description.trim()) || 'Task details are managed by the task owner.',
    timeEstimate: minutes,
    reward: Number(apiTask.price) || 0,
    difficulty: parseDifficulty(apiTask.difficulty),
    category: apiTask.category || 'General',
    status: mapped,
    backendStatus: apiTask.status,
    postedBy: apiTask.postedBy || 'Marketplace',
    assignedTo: apiTask.assignedTo || undefined,
    createdAt: apiTask.createdAt || 'Just now',
    sellerId: apiTask.sellerId != null ? String(apiTask.sellerId) : undefined,
    commissionRate: apiTask.commissionRate,
    commission: apiTask.commission,
    userEarning: apiTask.userEarning,
    adminRevenue: apiTask.adminRevenue,
    contactInfo: apiTask.contactInfo,
    requiresContact: apiTask.requiresContact,
    submission: apiTask.submission ?? null,
  };
}

function sellerTasksForUser(tasks: Task[], user: SessionUser | null): Task[] {
  if (!user || user.role !== 'seller') return [];
  return tasks.filter((t) => t.sellerId === user.id);
}

function upsertTaskById(tasks: Task[], incoming: Task): Task[] {
  const index = tasks.findIndex((item) => item.id === incoming.id);
  if (index === -1) {
    return [incoming, ...tasks];
  }

  const next = [...tasks];
  next[index] = { ...next[index], ...incoming };
  return next;
}

function unwrapApiData<T>(payload: ApiEnvelope<T> | T): T {
  if (payload && typeof payload === 'object' && 'data' in (payload as ApiEnvelope<T>)) {
    return ((payload as ApiEnvelope<T>).data ?? payload) as T;
  }
  return payload as T;
}

function parseSessionUser(raw: unknown): SessionUser | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = o.id != null ? String(o.id) : '';
  if (
    id &&
    typeof o.email === 'string' &&
    typeof o.name === 'string' &&
    (o.role === 'user' || o.role === 'seller' || o.role === 'admin')
  ) {
    return {
      id,
      email: o.email,
      name: o.name,
      role: o.role,
      balance: Number(o.balance) || 0,
      tasksCompleted: Number(o.tasksCompleted) || 0,
      rating: Number(o.rating) || 0,
      status: typeof o.status === 'string' ? o.status : 'active',
      joinedAt: typeof o.joinedAt === 'string' ? o.joinedAt : '',
      avatar: typeof o.avatar === 'string' ? o.avatar : '?',
      skills: Array.isArray(o.skills) ? (o.skills as string[]) : [],
    };
  }
  return null;
}

function splitLoginPayload(raw: unknown): { user: SessionUser | null; token: string | null } {
  if (!raw || typeof raw !== 'object') return { user: null, token: null };
  const o = { ...(raw as Record<string, unknown>) };
  const token = typeof o.token === 'string' ? o.token : null;
  delete o.token;
  return { user: parseSessionUser(o), token };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    role: null,
    isLoggedIn: false,
    currentUser: null,
    tenMinMode: false,
    balance: 0,
    tasks: [],
    activeTask: null,
    taskTimer: 0,
    transactions: [],
    notifications: [],
    sellerTasks: [],
    tasksLoading: false,
    tasksError: null,
    acceptingTaskId: null,
    submittingTask: false,
    postingTask: false,
    payingTaskId: null,
  });
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  const fetchTasks = useCallback(async () => {
    setState((s) => ({ ...s, tasksLoading: true, tasksError: null }));
    try {
      const response = await fetch(apiPath('/api/tasks'), {
        headers: { ...getAuthHeaders() },
      });
      const raw = await response.json().catch(() => ([]));
      const data = unwrapApiData<ApiTask[]>(raw);

      if (!response.ok) {
        const errorMessage = (raw as ApiEnvelope<ApiTask[]>).error || 'Failed to load tasks.';
        setState((s) => ({ ...s, tasksLoading: false, tasksError: errorMessage }));
        return;
      }

      const normalizedTasks = (Array.isArray(data) ? data : []).map(mapApiTaskToTask);
      setState((s) => ({
        ...s,
        tasksLoading: false,
        tasks: normalizedTasks,
        sellerTasks: sellerTasksForUser(normalizedTasks, s.currentUser),
      }));
    } catch {
      setState((s) => ({ ...s, tasksLoading: false, tasksError: connectionErrorMessage() }));
    }
  }, []);

  const refreshCurrentUser = useCallback(async (userId: string) => {
    try {
      const response = await fetch(apiPath(`/api/users/${userId}`), {
        headers: { ...getAuthHeaders() },
      });
      const raw = await response.json().catch(() => ({}));
      const data = unwrapApiData<SessionUser>(raw);
      if (!response.ok || !data?.id) return;
      const u = parseSessionUser(data);
      if (!u) return;
      localStorage.setItem(SESSION_USER_KEY, JSON.stringify(u));
      setState((s) => ({
        ...s,
        currentUser: u,
        balance: u.balance,
        role: u.role,
      }));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_USER_KEY);
      const token = localStorage.getItem(SESSION_TOKEN_KEY);
      if (!raw || !token) {
        localStorage.removeItem(SESSION_USER_KEY);
        localStorage.removeItem(SESSION_TOKEN_KEY);
        return;
      }
      const u = parseSessionUser(JSON.parse(raw));
      if (!u) {
        localStorage.removeItem(SESSION_USER_KEY);
        localStorage.removeItem(SESSION_TOKEN_KEY);
        return;
      }
      setState((s) => ({
        ...s,
        currentUser: u,
        role: u.role,
        isLoggedIn: true,
        balance: u.balance,
      }));
    } catch {
      localStorage.removeItem(SESSION_USER_KEY);
      localStorage.removeItem(SESSION_TOKEN_KEY);
    }
  }, []);

  useEffect(() => {
    if (!state.isLoggedIn || state.role === null) return;
    if (state.role !== 'user' && state.role !== 'seller') return;
    void fetchTasks();
  }, [state.isLoggedIn, state.role, fetchTasks]);

  const registerUser = useCallback(
    async (input: {
      email: string;
      name: string;
      password: string;
      role: 'user' | 'seller';
      skills?: string[];
    }) => {
      try {
        const response = await fetch(apiPath('/api/register'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: input.email.trim(),
            name: input.name.trim(),
            password: input.password,
            role: input.role,
            skills: input.skills,
          }),
        });
        const raw = await response.json().catch(() => ({}));
        const data = unwrapApiData<Record<string, unknown>>(raw);
        if (!response.ok) {
          toast.error((raw as ApiEnvelope<unknown>).error || 'Registration failed.');
          return null;
        }
        const { user: u, token } = splitLoginPayload(data);
        if (!u || !token) {
          toast.error('Invalid response from server.');
          return null;
        }
        localStorage.setItem(SESSION_USER_KEY, JSON.stringify(u));
        localStorage.setItem(SESSION_TOKEN_KEY, token);
        setState((s) => ({
          ...s,
          currentUser: u,
          role: u.role,
          isLoggedIn: true,
          balance: u.balance,
        }));
        toast.success(`Welcome, ${u.name}`);
        await fetchTasks();
        return u;
      } catch {
        toast.error(connectionErrorMessage());
        return null;
      }
    },
    [fetchTasks],
  );

  const loginUser = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await fetch(apiPath('/api/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password }),
        });
        const raw = await response.json().catch(() => ({}));
        const data = unwrapApiData<Record<string, unknown>>(raw);
        if (!response.ok) {
          toast.error((raw as ApiEnvelope<unknown>).error || 'Login failed.');
          return null;
        }
        const { user: u, token } = splitLoginPayload(data);
        if (!u || !token) {
          toast.error('Invalid response from server.');
          return null;
        }
        localStorage.setItem(SESSION_USER_KEY, JSON.stringify(u));
        localStorage.setItem(SESSION_TOKEN_KEY, token);
        setState((s) => ({
          ...s,
          currentUser: u,
          role: u.role,
          isLoggedIn: true,
          balance: u.balance,
        }));
        toast.success(`Logged in as ${u.name}`);
        if (u.role === 'user' || u.role === 'seller') {
          await fetchTasks();
        }
        return u;
      } catch {
        toast.error(connectionErrorMessage());
        return null;
      }
    },
    [fetchTasks],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_USER_KEY);
    localStorage.removeItem(SESSION_TOKEN_KEY);
    setState((s) => ({
      ...s,
      role: null,
      isLoggedIn: false,
      currentUser: null,
      activeTask: null,
      tenMinMode: false,
      balance: 0,
      tasks: [],
      sellerTasks: [],
    }));
  }, []);

  const toggleTenMinMode = useCallback(() => {
    setState((s) => {
      const next = !s.tenMinMode;
      if (next) toast('Quick-task mode — showing tasks with shorter time estimates.');
      return { ...s, tenMinMode: next };
    });
  }, []);

  const acceptTask = useCallback(async (taskId: string) => {
    if (state.currentUser?.role !== 'user') {
      toast.error('Only earners can accept tasks from this dashboard.');
      return;
    }
    const email = state.currentUser?.email;
    if (!email) {
      toast.error('Log in to accept tasks.');
      return;
    }
    try {
      setState((s) => ({ ...s, acceptingTaskId: taskId, tasksError: null }));
      const response = await fetch(apiPath(`/api/tasks/${taskId}/accept`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ assignedTo: email }),
      });
      const raw = await response.json().catch(() => ({}));
      const data = unwrapApiData<ApiTask>(raw);

      if (!response.ok) {
        const errorMessage = (raw as ApiEnvelope<ApiTask>).error || 'Unable to accept task.';
        toast.error(errorMessage);
        setState((s) => ({ ...s, acceptingTaskId: null }));
        return;
      }

      const acceptedTask = mapApiTaskToTask(data);
      setState((s) => {
        const mergedTask = s.tasks.find((t) => t.id === acceptedTask.id)
          ? { ...s.tasks.find((t) => t.id === acceptedTask.id)!, ...acceptedTask }
          : acceptedTask;
        const nextTasks = upsertTaskById(s.tasks, mergedTask);
        return {
          ...s,
          activeTask: mergedTask,
          tasks: nextTasks,
          sellerTasks: sellerTasksForUser(nextTasks, s.currentUser),
          taskTimer: mergedTask.timeEstimate * 60,
          acceptingTaskId: null,
        };
      });

      toast.success(`Task accepted: ${acceptedTask.title}`);
    } catch {
      toast.error(connectionErrorMessage());
      setState((s) => ({ ...s, acceptingTaskId: null, tasksError: connectionErrorMessage() }));
    }
  }, [state.currentUser?.email, state.currentUser?.role]);

  const submitWork = useCallback(
    async (payload: { text: string; link: string; file?: File | null }) => {
      if (!state.activeTask) return;
      if (state.currentUser?.role !== 'user') {
        toast.error('Only the assigned earner can submit work.');
        return;
      }
      const t = payload.text.trim();
      const l = payload.link.trim();
      let fileBase64: string | undefined;
      let fileName: string | undefined;
      if (payload.file) {
        fileName = payload.file.name;
        fileBase64 = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => {
            const s = String(r.result || '');
            const b64 = s.includes(',') ? s.split(',')[1] : s;
            resolve(b64);
          };
          r.onerror = () => reject(new Error('read failed'));
          r.readAsDataURL(payload.file!);
        });
      }
      if (!t && !l && !fileBase64) {
        toast.error('Add a description, link, or file.');
        return;
      }
      try {
        setState((s) => ({ ...s, submittingTask: true, tasksError: null }));
        const response = await fetch(apiPath(`/api/tasks/${state.activeTask.id}/submit`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({
            text: t,
            link: l,
            fileName,
            fileBase64,
          }),
        });
        const raw = await response.json().catch(() => ({}));
        const data = unwrapApiData<ApiTask>(raw);
        if (!response.ok) {
          toast.error((raw as ApiEnvelope<ApiTask>).error || 'Unable to submit work.');
          setState((s) => ({ ...s, submittingTask: false }));
          return;
        }
        const updated = mapApiTaskToTask(data);
        setState((s) => {
          const nextTasks = upsertTaskById(s.tasks, updated);
          return {
            ...s,
            activeTask: null,
            taskTimer: 0,
            tasks: nextTasks,
            sellerTasks: sellerTasksForUser(nextTasks, s.currentUser),
            submittingTask: false,
            notifications: [
              {
                id: `n${Date.now()}`,
                type: 'task',
                title: 'Work submitted',
                message: `You submitted work for “${updated.title}”.`,
                time: 'Just now',
                read: false,
              },
              ...s.notifications,
            ],
          };
        });
        toast.success('Work submitted. The seller will review it.');
        if (state.currentUser?.id) void refreshCurrentUser(state.currentUser.id);
      } catch {
        toast.error(connectionErrorMessage());
        setState((s) => ({ ...s, submittingTask: false, tasksError: connectionErrorMessage() }));
      }
    },
    [state.activeTask, state.currentUser?.id, state.currentUser?.role, refreshCurrentUser],
  );

  const payListing = useCallback(async (taskId: string) => {
    if (state.currentUser?.role !== 'seller') {
      toast.error('Only sellers can pay listing fees.');
      return;
    }
    try {
      setState((s) => ({ ...s, payingTaskId: taskId, tasksError: null }));
      const response = await fetch(apiPath(`/api/tasks/${taskId}/pay`), {
        method: 'POST',
        headers: { ...getAuthHeaders() },
      });
      const raw = await response.json().catch(() => ({}));
      const data = unwrapApiData<ApiTask>(raw);
      if (!response.ok) {
        toast.error((raw as ApiEnvelope<ApiTask>).error || 'Payment failed.');
        setState((s) => ({ ...s, payingTaskId: null }));
        return;
      }
      const updated = mapApiTaskToTask(data);
      setState((s) => {
        const nextTasks = upsertTaskById(s.tasks, updated);
        return {
          ...s,
          tasks: nextTasks,
          sellerTasks: sellerTasksForUser(nextTasks, s.currentUser),
          payingTaskId: null,
        };
      });
      toast.success('Payment successful — task is live.');
    } catch {
      toast.error(connectionErrorMessage());
      setState((s) => ({ ...s, payingTaskId: null }));
    }
  }, [state.currentUser?.role]);

  const approveSubmission = useCallback(
    async (taskId: string) => {
      if (state.currentUser?.role !== 'seller') return;
      try {
        const response = await fetch(apiPath(`/api/tasks/${taskId}/approve`), {
          method: 'POST',
          headers: { ...getAuthHeaders() },
        });
        const raw = await response.json().catch(() => ({}));
        const data = unwrapApiData<ApiTask>(raw);
        if (!response.ok) {
          toast.error((raw as ApiEnvelope<ApiTask>).error || 'Unable to approve.');
          return;
        }
        const updated = mapApiTaskToTask(data);
        setState((s) => {
          const nextTasks = upsertTaskById(s.tasks, updated);
          return {
            ...s,
            tasks: nextTasks,
            sellerTasks: sellerTasksForUser(nextTasks, s.currentUser),
          };
        });
        toast.success('Submission approved — payout sent to the earner.');
      } catch {
        toast.error(connectionErrorMessage());
      }
    },
    [state.currentUser?.role],
  );

  const rejectSubmission = useCallback(
    async (taskId: string) => {
      if (state.currentUser?.role !== 'seller') return;
      try {
        const response = await fetch(apiPath(`/api/tasks/${taskId}/reject`), {
          method: 'POST',
          headers: { ...getAuthHeaders() },
        });
        const raw = await response.json().catch(() => ({}));
        const data = unwrapApiData<ApiTask>(raw);
        if (!response.ok) {
          toast.error((raw as ApiEnvelope<ApiTask>).error || 'Unable to reject.');
          return;
        }
        const updated = mapApiTaskToTask(data);
        setState((s) => {
          const nextTasks = upsertTaskById(s.tasks, updated);
          return {
            ...s,
            tasks: nextTasks,
            sellerTasks: sellerTasksForUser(nextTasks, s.currentUser),
          };
        });
        toast.success('Submission rejected.');
      } catch {
        toast.error(connectionErrorMessage());
      }
    },
    [state.currentUser?.role],
  );

  const postTask = useCallback(
    async (task: Omit<Task, 'id' | 'status' | 'createdAt' | 'postedBy' | 'sellerId' | 'backendStatus'>) => {
      const seller = state.currentUser;
      if (!seller || seller.role !== 'seller') {
        toast.error('Log in as a seller to post tasks.');
        return null;
      }
      try {
        setState((s) => ({ ...s, postingTask: true, tasksError: null }));
        const response = await fetch(apiPath('/api/tasks'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({
            title: task.title,
            price: task.reward,
            description: task.description,
            timeEstimateMinutes: task.timeEstimate,
            difficulty: task.difficulty,
            category: task.category,
            sellerId: Number(seller.id),
            postedBy: seller.name,
            contactInfo: task.contactInfo ?? '',
            requiresContact: Boolean(task.requiresContact),
            commissionRate: task.commissionRate,
          }),
        });
        const raw = await response.json().catch(() => ({}));
        const data = unwrapApiData<ApiTask>(raw);

        if (!response.ok) {
          const errorMessage = (raw as ApiEnvelope<ApiTask>).error || 'Unable to post task.';
          toast.error(errorMessage);
          setState((s) => ({ ...s, postingTask: false }));
          return null;
        }

        const createdTask = {
          ...mapApiTaskToTask(data),
          description: task.description,
          timeEstimate: task.timeEstimate,
          difficulty: task.difficulty,
          category: task.category,
          postedBy: seller.name,
          sellerId: seller.id,
        };

        setState((s) => {
          const nextTasks = upsertTaskById(s.tasks, createdTask);
          return {
            ...s,
            tasks: nextTasks,
            sellerTasks: sellerTasksForUser(nextTasks, s.currentUser),
            postingTask: false,
          };
        });
        toast.success('Task draft saved — complete payment to publish.');
        return createdTask;
      } catch {
        toast.error(connectionErrorMessage());
        setState((s) => ({ ...s, postingTask: false, tasksError: connectionErrorMessage() }));
        return null;
      }
    },
    [state.currentUser],
  );

  const markNotificationRead = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  }, []);

  useEffect(() => {
    const socket: Socket = SOCKET_URL
      ? io(SOCKET_URL, { transports: ['websocket', 'polling'] })
      : io({ transports: ['websocket', 'polling'] });

    socket.on('task:created', (rawTask: ApiTask) => {
      const mappedTask = mapApiTaskToTask(rawTask);
      setState((s) => {
        const nextTasks = upsertTaskById(s.tasks, mappedTask);
        return {
          ...s,
          tasks: nextTasks,
          sellerTasks: sellerTasksForUser(nextTasks, s.currentUser),
        };
      });
    });

    socket.on('task:accepted', (rawTask: ApiTask) => {
      const mappedTask = mapApiTaskToTask(rawTask);
      setState((s) => {
        const nextTasks = upsertTaskById(s.tasks, mappedTask);
        return {
          ...s,
          tasks: nextTasks,
          sellerTasks: sellerTasksForUser(nextTasks, s.currentUser),
          activeTask:
            s.activeTask?.id === mappedTask.id ? { ...s.activeTask, ...mappedTask } : s.activeTask,
          taskTimer:
            s.activeTask?.id === mappedTask.id
              ? mappedTask.timeEstimate * 60
              : s.taskTimer,
        };
      });
    });

    socket.on('task:published', (rawTask: ApiTask) => {
      const mappedTask = mapApiTaskToTask(rawTask);
      setState((s) => {
        const nextTasks = upsertTaskById(s.tasks, mappedTask);
        return {
          ...s,
          tasks: nextTasks,
          sellerTasks: sellerTasksForUser(nextTasks, s.currentUser),
        };
      });
    });

    socket.on('task:submitted', (rawTask: ApiTask) => {
      const mappedTask = mapApiTaskToTask(rawTask);
      setState((s) => {
        const nextTasks = upsertTaskById(s.tasks, mappedTask);
        return {
          ...s,
          tasks: nextTasks,
          sellerTasks: sellerTasksForUser(nextTasks, s.currentUser),
        };
      });
    });

    socket.on('task:approved', (rawTask: ApiTask) => {
      const mappedTask = mapApiTaskToTask(rawTask);
      setState((s) => {
        const nextTasks = upsertTaskById(s.tasks, mappedTask);
        const earner =
          s.currentUser?.email &&
          mappedTask.assignedTo?.toLowerCase() === s.currentUser.email.toLowerCase();
        const earned = Number(mappedTask.userEarning) || 0;
        const newTx: Transaction | null =
          earner && earned > 0
            ? {
                id: `t${Date.now()}`,
                type: 'earned',
                amount: earned,
                description: mappedTask.title,
                date: 'Just now',
                status: 'completed',
              }
            : null;
        return {
          ...s,
          tasks: nextTasks,
          sellerTasks: sellerTasksForUser(nextTasks, s.currentUser),
          activeTask: s.activeTask?.id === mappedTask.id ? null : s.activeTask,
          taskTimer: s.activeTask?.id === mappedTask.id ? 0 : s.taskTimer,
          balance: earner ? s.balance + earned : s.balance,
          transactions: newTx ? [newTx, ...s.transactions] : s.transactions,
          notifications:
            earner && earned > 0
              ? [
                  {
                    id: `n${Date.now()}`,
                    type: 'payment',
                    title: 'Payment received!',
                    message: `You earned $${earned.toFixed(2)} (after platform fee).`,
                    time: 'Just now',
                    read: false,
                  },
                  ...s.notifications,
                ]
              : s.notifications,
        };
      });
    });

    socket.on('task:rejected', (rawTask: ApiTask) => {
      const mappedTask = mapApiTaskToTask(rawTask);
      setState((s) => {
        const nextTasks = upsertTaskById(s.tasks, mappedTask);
        return {
          ...s,
          tasks: nextTasks,
          sellerTasks: sellerTasksForUser(nextTasks, s.currentUser),
        };
      });
    });

    socket.on('connect_error', () => {
      setState((s) => ({ ...s, tasksError: s.tasksError || 'Realtime connection unavailable.' }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <AppContext.Provider
      value={{
        ...state,
        registerUser,
        loginUser,
        logout,
        toggleTenMinMode,
        acceptTask,
        submitWork,
        payListing,
        approveSubmission,
        rejectSubmission,
        postTask,
        markNotificationRead,
        showPaymentSuccess,
        setShowPaymentSuccess,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

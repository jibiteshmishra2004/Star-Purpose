import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Notification, Task, Transaction, mockNotifications, mockTasks, mockTransactions } from '@/data/mockData';
import { toast } from 'sonner';

interface AppState {
  role: 'user' | 'seller' | 'admin' | null;
  isLoggedIn: boolean;
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
  completingTask: boolean;
  postingTask: boolean;
}

interface AppContextType extends AppState {
  setRole: (role: 'user' | 'seller' | 'admin') => void;
  login: (role: 'user' | 'seller' | 'admin') => void;
  logout: () => void;
  toggleTenMinMode: () => void;
  acceptTask: (taskId: string) => Promise<void>;
  completeTask: () => Promise<void>;
  postTask: (task: Omit<Task, 'id' | 'status' | 'createdAt' | 'postedBy'>) => Promise<void>;
  markNotificationRead: (id: string) => void;
  showPaymentSuccess: boolean;
  setShowPaymentSuccess: (v: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/** In Vite dev, use same-origin URLs so the dev-server proxy can reach the API without CORS issues. */
const API_BASE_URL = (() => {
  const fromEnv = import.meta.env.VITE_API_URL;
  if (fromEnv !== undefined && fromEnv !== '') {
    return String(fromEnv).replace(/\/$/, '');
  }
  if (import.meta.env.DEV) {
    return '';
  }
  return 'http://localhost:5000';
})();

function apiPath(path: string) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${p}` : p;
}

function connectionErrorMessage(): string {
  return API_BASE_URL
    ? `Cannot reach the API at ${API_BASE_URL}. Is the backend running?`
    : 'Cannot reach the API (proxied to port 5000). Run `npm run server` in another terminal, then refresh.';
}

type ApiTask = {
  id: number;
  title: string;
  price: number;
  status: string;
  assignedTo: string | null;
};

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  error?: string;
};

const statusMap: Record<string, Task['status']> = {
  OPEN: 'available',
  ASSIGNED: 'in-progress',
  DONE: 'completed',
  pending: 'available',
  'in-progress': 'in-progress',
};

function mapApiTaskToTask(apiTask: ApiTask): Task {
  return {
    id: String(apiTask.id),
    title: apiTask.title,
    description: 'Task details are managed by the task owner.',
    timeEstimate: 10,
    reward: Number(apiTask.price) || 0,
    difficulty: 'Medium',
    category: 'General',
    status: statusMap[apiTask.status] || 'available',
    postedBy: 'Marketplace',
    assignedTo: apiTask.assignedTo || undefined,
    createdAt: 'Just now',
  };
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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    role: null,
    isLoggedIn: false,
    tenMinMode: false,
    balance: 127.50,
    tasks: mockTasks,
    activeTask: null,
    taskTimer: 0,
    transactions: mockTransactions,
    notifications: mockNotifications,
    sellerTasks: mockTasks.slice(0, 3).map(t => ({ ...t, postedBy: 'You', status: 'in-progress' as const })),
    tasksLoading: false,
    tasksError: null,
    acceptingTaskId: null,
    completingTask: false,
    postingTask: false,
  });
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  const login = useCallback((role: 'user' | 'seller' | 'admin') => {
    setState(s => ({ ...s, role, isLoggedIn: true }));
    toast.success(`Logged in as ${role}`);
  }, []);

  const logout = useCallback(() => {
    setState(s => ({ ...s, role: null, isLoggedIn: false, activeTask: null, tenMinMode: false }));
  }, []);

  const setRole = useCallback((role: 'user' | 'seller' | 'admin') => {
    setState(s => ({ ...s, role }));
  }, []);

  const toggleTenMinMode = useCallback(() => {
    setState(s => {
      const next = !s.tenMinMode;
      if (next) toast('🔥 10-Minute Mode activated! Finding tasks for you...');
      return { ...s, tenMinMode: next };
    });
  }, []);

  const acceptTask = useCallback(async (taskId: string) => {
    try {
      setState(s => ({ ...s, acceptingTaskId: taskId, tasksError: null }));
      const response = await fetch(apiPath(`/api/tasks/${taskId}/accept`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const raw = await response.json().catch(() => ({}));
      const data = unwrapApiData<ApiTask>(raw);

      if (!response.ok) {
        const errorMessage = (raw as ApiEnvelope<ApiTask>).error || 'Unable to accept task.';
        toast.error(errorMessage);
        setState(s => ({ ...s, acceptingTaskId: null }));
        return;
      }

      const acceptedTask = mapApiTaskToTask(data);
      setState(s => {
        const mergedTask = s.tasks.find(t => t.id === acceptedTask.id)
          ? { ...s.tasks.find(t => t.id === acceptedTask.id)!, ...acceptedTask }
          : acceptedTask;
        return {
          ...s,
          activeTask: mergedTask,
          tasks: upsertTaskById(s.tasks, mergedTask),
          taskTimer: mergedTask.timeEstimate * 60,
          acceptingTaskId: null,
        };
      });

      toast.success(`Task accepted: ${acceptedTask.title}`);
    } catch (error) {
      toast.error(connectionErrorMessage());
      setState(s => ({ ...s, acceptingTaskId: null, tasksError: connectionErrorMessage() }));
    }
  }, []);

  const completeTask = useCallback(async () => {
    if (!state.activeTask) return;

    try {
      setState(s => ({ ...s, completingTask: true, tasksError: null }));
      const response = await fetch(apiPath(`/api/tasks/${state.activeTask.id}/complete`), {
        method: 'POST',
      });
      const raw = await response.json().catch(() => ({}));
      const data = unwrapApiData<ApiTask>(raw);

      if (!response.ok) {
        const errorMessage = (raw as ApiEnvelope<ApiTask>).error || 'Unable to complete task.';
        toast.error(errorMessage);
        setState(s => ({ ...s, completingTask: false }));
        return;
      }

      const completedTask = mapApiTaskToTask(data);

      setState(s => {
        const earned = s.activeTask?.reward ?? completedTask.reward;
        const newTx: Transaction = {
          id: `t${Date.now()}`,
          type: 'earned',
          amount: earned,
          description: completedTask.title,
          date: 'Just now',
          status: 'completed',
        };

        return {
          ...s,
          balance: s.balance + earned,
          activeTask: null,
          taskTimer: 0,
          tasks: upsertTaskById(s.tasks, { ...completedTask, reward: earned }),
          transactions: [newTx, ...s.transactions],
          notifications: [
            {
              id: `n${Date.now()}`,
              type: 'payment',
              title: 'Payment received!',
              message: `You earned $${earned.toFixed(2)}`,
              time: 'Just now',
              read: false,
            },
            ...s.notifications,
          ],
          completingTask: false,
        };
      });
      setShowPaymentSuccess(true);
    } catch (error) {
      toast.error(connectionErrorMessage());
      setState(s => ({ ...s, completingTask: false, tasksError: connectionErrorMessage() }));
    }
  }, [state.activeTask]);

  const postTask = useCallback(async (task: Omit<Task, 'id' | 'status' | 'createdAt' | 'postedBy'>) => {
    try {
      setState(s => ({ ...s, postingTask: true, tasksError: null }));
      const response = await fetch(apiPath('/api/tasks'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: task.title, price: task.reward }),
      });
      const raw = await response.json().catch(() => ({}));
      const data = unwrapApiData<ApiTask>(raw);

      if (!response.ok) {
        const errorMessage = (raw as ApiEnvelope<ApiTask>).error || 'Unable to post task.';
        toast.error(errorMessage);
        setState(s => ({ ...s, postingTask: false }));
        return;
      }

      const createdTask = {
        ...mapApiTaskToTask(data),
        description: task.description,
        timeEstimate: task.timeEstimate,
        difficulty: task.difficulty,
        category: task.category,
        postedBy: 'You',
      };

      setState(s => ({
        ...s,
        sellerTasks: upsertTaskById(s.sellerTasks, createdTask),
        tasks: upsertTaskById(s.tasks, createdTask),
        postingTask: false,
      }));
      toast.success('Task posted successfully!');
    } catch (error) {
      toast.error(connectionErrorMessage());
      setState(s => ({ ...s, postingTask: false, tasksError: connectionErrorMessage() }));
    }
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setState(s => ({
      ...s,
      notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n),
    }));
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      setState(s => ({ ...s, tasksLoading: true, tasksError: null }));
      try {
        const response = await fetch(apiPath('/api/tasks'));
        const raw = await response.json().catch(() => ([]));
        const data = unwrapApiData<ApiTask[]>(raw);

        if (!response.ok) {
          const errorMessage = (raw as ApiEnvelope<ApiTask[]>).error || 'Failed to load tasks.';
          setState(s => ({ ...s, tasksLoading: false, tasksError: errorMessage }));
          return;
        }

        const normalizedTasks = (Array.isArray(data) ? data : []).map(mapApiTaskToTask);
        setState(s => ({
          ...s,
          tasksLoading: false,
          tasks: normalizedTasks.length ? normalizedTasks : s.tasks,
          sellerTasks: s.sellerTasks,
        }));
      } catch (error) {
        setState(s => ({ ...s, tasksLoading: false, tasksError: connectionErrorMessage() }));
      }
    };

    fetchTasks();
  }, []);

  useEffect(() => {
    const socket: Socket = API_BASE_URL
      ? io(API_BASE_URL, { transports: ['websocket', 'polling'] })
      : io({ transports: ['websocket', 'polling'] });

    socket.on('task:created', (rawTask: ApiTask) => {
      const mappedTask = mapApiTaskToTask(rawTask);
      setState(s => ({ ...s, tasks: upsertTaskById(s.tasks, mappedTask) }));
    });

    socket.on('task:accepted', (rawTask: ApiTask) => {
      const mappedTask = mapApiTaskToTask(rawTask);
      setState(s => ({
        ...s,
        tasks: upsertTaskById(s.tasks, mappedTask),
        activeTask: s.activeTask?.id === mappedTask.id ? { ...s.activeTask, ...mappedTask } : s.activeTask,
      }));
    });

    socket.on('task:completed', (rawTask: ApiTask) => {
      const mappedTask = mapApiTaskToTask(rawTask);
      setState(s => ({
        ...s,
        tasks: upsertTaskById(s.tasks, mappedTask),
        activeTask: s.activeTask?.id === mappedTask.id ? null : s.activeTask,
        taskTimer: s.activeTask?.id === mappedTask.id ? 0 : s.taskTimer,
      }));
    });

    socket.on('connect_error', () => {
      setState(s => ({ ...s, tasksError: s.tasksError || 'Realtime connection unavailable.' }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <AppContext.Provider value={{
      ...state, login, logout, setRole, toggleTenMinMode,
      acceptTask, completeTask, postTask, markNotificationRead,
      showPaymentSuccess, setShowPaymentSuccess,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

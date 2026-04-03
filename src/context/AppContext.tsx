import React, { createContext, useContext, useState, useCallback } from 'react';
import { Task, Transaction, Notification, mockTasks, mockTransactions, mockNotifications } from '@/data/mockData';
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
}

interface AppContextType extends AppState {
  setRole: (role: 'user' | 'seller' | 'admin') => void;
  login: (role: 'user' | 'seller' | 'admin') => void;
  logout: () => void;
  toggleTenMinMode: () => void;
  acceptTask: (taskId: string) => void;
  completeTask: () => void;
  postTask: (task: Omit<Task, 'id' | 'status' | 'createdAt' | 'postedBy'>) => void;
  markNotificationRead: (id: string) => void;
  showPaymentSuccess: boolean;
  setShowPaymentSuccess: (v: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

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

  const acceptTask = useCallback((taskId: string) => {
    setState(s => {
      const task = s.tasks.find(t => t.id === taskId);
      if (!task) return s;
      toast.success(`Task accepted: ${task.title}`);
      return {
        ...s,
        activeTask: { ...task, status: 'in-progress' },
        tasks: s.tasks.map(t => t.id === taskId ? { ...t, status: 'in-progress' as const } : t),
        taskTimer: task.timeEstimate * 60,
      };
    });
  }, []);

  const completeTask = useCallback(() => {
    setState(s => {
      if (!s.activeTask) return s;
      const earned = s.activeTask.reward;
      const newTx: Transaction = {
        id: `t${Date.now()}`,
        type: 'earned',
        amount: earned,
        description: s.activeTask.title,
        date: 'Just now',
        status: 'completed',
      };
      setShowPaymentSuccess(true);
      return {
        ...s,
        balance: s.balance + earned,
        activeTask: null,
        taskTimer: 0,
        tasks: s.tasks.map(t => t.id === s.activeTask!.id ? { ...t, status: 'completed' as const } : t),
        transactions: [newTx, ...s.transactions],
        notifications: [
          { id: `n${Date.now()}`, type: 'payment', title: 'Payment received!', message: `You earned $${earned.toFixed(2)}`, time: 'Just now', read: false },
          ...s.notifications,
        ],
      };
    });
  }, []);

  const postTask = useCallback((task: Omit<Task, 'id' | 'status' | 'createdAt' | 'postedBy'>) => {
    const newTask: Task = {
      ...task,
      id: `t${Date.now()}`,
      status: 'available',
      postedBy: 'You',
      createdAt: 'Just now',
    };
    setState(s => ({
      ...s,
      sellerTasks: [newTask, ...s.sellerTasks],
      tasks: [newTask, ...s.tasks],
    }));
    toast.success('Task posted successfully!');
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setState(s => ({
      ...s,
      notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n),
    }));
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

export type TaskSubmission = {
  text?: string;
  link?: string;
  file?: string | null;
};

export interface Task {
  id: string;
  title: string;
  description: string;
  timeEstimate: number; // minutes
  reward: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  status:
    | 'available'
    | 'in-progress'
    | 'completed'
    | 'pending-review'
    | 'pending-payment'
    | 'submitted'
    | 'rejected'
    | 'approved';
  /** Raw API status for payment / pipeline logic */
  backendStatus?: string;
  postedBy: string;
  assignedTo?: string;
  createdAt: string;
  /** Set when task is created by a seller (matches API) */
  sellerId?: string;
  commissionRate?: number;
  commission?: number;
  userEarning?: number;
  adminRevenue?: number;
  contactInfo?: string;
  requiresContact?: boolean;
  submission?: TaskSubmission | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'user' | 'seller' | 'admin';
  balance: number;
  tasksCompleted: number;
  rating: number;
  joinedAt: string;
  skills: string[];
  status: 'active' | 'flagged' | 'suspended';
}

export interface Transaction {
  id: string;
  type: 'earned' | 'spent' | 'withdrawn' | 'deposited';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending';
}

export interface Notification {
  id: string;
  type: 'task' | 'payment' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export const mockTasks: Task[] = [
  { id: '1', title: 'Complete a short survey about food preferences', description: 'Answer 15 questions about your dining habits and food preferences.', timeEstimate: 5, reward: 2.50, difficulty: 'Easy', category: 'Survey', status: 'available', postedBy: 'FoodCo Research', createdAt: '2 min ago' },
  { id: '2', title: 'Transcribe a 3-minute audio clip', description: 'Listen to a short podcast clip and type out the transcript accurately.', timeEstimate: 10, reward: 5.00, difficulty: 'Medium', category: 'Transcription', status: 'available', postedBy: 'MediaHouse', createdAt: '5 min ago' },
  { id: '3', title: 'Review and tag 20 product images', description: 'Look at product photos and add relevant tags from a provided list.', timeEstimate: 8, reward: 3.75, difficulty: 'Easy', category: 'Data Labeling', status: 'available', postedBy: 'ShopEasy', createdAt: '8 min ago' },
  { id: '4', title: 'Test a mobile app login flow', description: 'Follow the steps to test the login, signup, and password reset flows.', timeEstimate: 12, reward: 6.00, difficulty: 'Medium', category: 'QA Testing', status: 'available', postedBy: 'AppDev Studio', createdAt: '12 min ago' },
  { id: '5', title: 'Write a 100-word product description', description: 'Write a compelling description for a new fitness tracker product.', timeEstimate: 10, reward: 4.50, difficulty: 'Medium', category: 'Writing', status: 'available', postedBy: 'FitGear Inc', createdAt: '15 min ago' },
  { id: '6', title: 'Verify 30 business email addresses', description: 'Check if the provided email addresses are valid and deliverable.', timeEstimate: 7, reward: 3.00, difficulty: 'Easy', category: 'Data Entry', status: 'available', postedBy: 'LeadGen Pro', createdAt: '20 min ago' },
  { id: '7', title: 'Moderate 15 user comments', description: 'Review user comments and flag any that violate community guidelines.', timeEstimate: 10, reward: 4.00, difficulty: 'Easy', category: 'Moderation', status: 'available', postedBy: 'SocialApp', createdAt: '25 min ago' },
  { id: '8', title: 'Create a simple logo concept sketch', description: 'Sketch 3 quick logo concepts for a pet grooming business.', timeEstimate: 15, reward: 8.00, difficulty: 'Hard', category: 'Design', status: 'available', postedBy: 'PawPerfect', createdAt: '30 min ago' },
];

export const mockUsers: User[] = [
  { id: 'u1', name: 'Alex Rivera', email: 'alex@example.com', avatar: 'AR', role: 'user', balance: 127.50, tasksCompleted: 48, rating: 4.8, joinedAt: 'Jan 2024', skills: ['Surveys', 'Data Entry', 'Writing'], status: 'active' },
  { id: 'u2', name: 'Sam Chen', email: 'sam@example.com', avatar: 'SC', role: 'user', balance: 89.25, tasksCompleted: 32, rating: 4.6, joinedAt: 'Feb 2024', skills: ['QA Testing', 'Transcription'], status: 'active' },
  { id: 'u3', name: 'Jordan Kim', email: 'jordan@example.com', avatar: 'JK', role: 'user', balance: 245.00, tasksCompleted: 95, rating: 4.9, joinedAt: 'Dec 2023', skills: ['Design', 'Writing', 'Data Labeling'], status: 'active' },
  { id: 'u4', name: 'Taylor Swift', email: 'taylor@example.com', avatar: 'TS', role: 'user', balance: 12.75, tasksCompleted: 5, rating: 3.8, joinedAt: 'Mar 2024', skills: ['Surveys'], status: 'flagged' },
];

export const mockSellers: User[] = [
  { id: 's1', name: 'FoodCo Research', email: 'info@foodco.com', avatar: 'FR', role: 'seller', balance: 1250.00, tasksCompleted: 120, rating: 4.7, joinedAt: 'Nov 2023', skills: [], status: 'active' },
  { id: 's2', name: 'MediaHouse', email: 'hello@mediahouse.com', avatar: 'MH', role: 'seller', balance: 890.00, tasksCompleted: 85, rating: 4.5, joinedAt: 'Jan 2024', skills: [], status: 'active' },
  { id: 's3', name: 'AppDev Studio', email: 'dev@appdev.com', avatar: 'AD', role: 'seller', balance: 2100.00, tasksCompleted: 200, rating: 4.9, joinedAt: 'Oct 2023', skills: [], status: 'active' },
];

export const mockTransactions: Transaction[] = [
  { id: 't1', type: 'earned', amount: 5.00, description: 'Transcribe audio clip', date: '2 hours ago', status: 'completed' },
  { id: 't2', type: 'earned', amount: 2.50, description: 'Food survey completed', date: '5 hours ago', status: 'completed' },
  { id: 't3', type: 'withdrawn', amount: 50.00, description: 'Withdrawal to PayPal', date: '1 day ago', status: 'completed' },
  { id: 't4', type: 'earned', amount: 4.50, description: 'Product description', date: '1 day ago', status: 'completed' },
  { id: 't5', type: 'earned', amount: 3.75, description: 'Image tagging', date: '2 days ago', status: 'completed' },
  { id: 't6', type: 'earned', amount: 6.00, description: 'App testing', date: '2 days ago', status: 'pending' },
];

export const mockNotifications: Notification[] = [
  { id: 'n1', type: 'task', title: 'New task available!', message: 'A new survey task matching your skills is available.', time: '1 min ago', read: false },
  { id: 'n2', type: 'payment', title: 'Payment received', message: 'You earned $5.00 for completing the transcription task.', time: '2 hours ago', read: false },
  { id: 'n3', type: 'system', title: 'Welcome bonus!', message: 'Complete 5 tasks this week and earn a $10 bonus.', time: '1 day ago', read: true },
  { id: 'n4', type: 'task', title: 'Task deadline approaching', message: 'Your accepted task expires in 30 minutes.', time: '1 day ago', read: true },
];

export const chartData = {
  weeklyTasks: [
    { day: 'Mon', tasks: 45 }, { day: 'Tue', tasks: 62 }, { day: 'Wed', tasks: 58 },
    { day: 'Thu', tasks: 71 }, { day: 'Fri', tasks: 89 }, { day: 'Sat', tasks: 34 }, { day: 'Sun', tasks: 28 },
  ],
  monthlyRevenue: [
    { month: 'Jan', revenue: 12400 }, { month: 'Feb', revenue: 15800 }, { month: 'Mar', revenue: 18200 },
    { month: 'Apr', revenue: 22100 }, { month: 'May', revenue: 28500 }, { month: 'Jun', revenue: 32000 },
  ],
  taskCategories: [
    { name: 'Surveys', value: 35 }, { name: 'Data Entry', value: 25 }, { name: 'Writing', value: 15 },
    { name: 'QA Testing', value: 12 }, { name: 'Design', value: 8 }, { name: 'Other', value: 5 },
  ],
};

export const testimonials = [
  { name: 'Maria G.', role: 'Student', text: 'I earn $50–$80 a week just doing tasks between classes. It\'s the perfect side hustle!', rating: 5 },
  { name: 'David L.', role: 'Freelancer', text: 'STAR PURPOSE fills my gaps between client projects. Quick tasks, instant pay — what\'s not to love?', rating: 5 },
  { name: 'Priya S.', role: 'Stay-at-home Mom', text: 'I love that I can pick tasks that fit my schedule. Even 10 free minutes can earn me something.', rating: 4 },
];

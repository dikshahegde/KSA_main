

export interface Note {
  _id: string;
  content: string;
  addedBy: User;
  addedAt: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalPages: number;
  currentPage: number;
  total: number;
}

export interface DashboardAnalytics {
  overview: {
    totalComplaints: number;
    openComplaints: number;
    inProgressComplaints: number;
    resolvedComplaints: number;
  };
  complaintsByCategory: Array<{ _id: string; count: number }>;
  complaintsByPriority: Array<{ _id: string; count: number }>;
  monthlyTrend: Array<{
    _id: { year: number; month: number };
    count: number;
  }>;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ComplaintFormData {
  title: string;
  description: string;
  category: string;
  priority: string;
}

export interface CreateUserFormData {
  name: string;
  email: string;
  password: string;
  role: 'technician' | 'admin';
}

export type User = {
  id: string;
  name: string;
  email?: string;
  role: 'customer' | 'admin';
};

export type Complaint = {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  remarks?: string;
  created_at: string;
  customer?: User;
};

export type Analytics = {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  urgent: number;
};

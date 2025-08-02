// Job Application Types
export interface JobApplication {
  id: number;
  user_id: string;
  job_title: string;
  company: string;
  location?: string;
  job_description?: string;
  requirements?: string;
  salary_range?: string;
  job_type?: string;
  application_date: string;
  status: 'applied' | 'interviewing' | 'offered' | 'rejected' | 'withdrawn';
  source?: string;
  contact_info?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface JobApplicationCreate {
  job_title: string;
  company: string;
  location?: string;
  job_description?: string;
  requirements?: string;
  salary_range?: string;
  job_type?: string;
  application_date: string;
  status: 'applied' | 'interviewing' | 'offered' | 'rejected' | 'withdrawn';
  source?: string;
  contact_info?: string;
  notes?: string;
}

// Task Types
export interface Task {
  id: number;
  user_id: string;
  title: string;
  description?: string;
  task_type: 'job_application' | 'interview_prep' | 'networking' | 'skill_building' | 'daily_goal' | 'custom';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string;
  due_time?: string;
  estimated_duration?: number;
  actual_duration?: number;
  target_count?: number;
  completed_count: number;
  job_application_id?: number;
  calendar_event_id?: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface TaskCreate {
  title: string;
  description?: string;
  task_type: 'job_application' | 'interview_prep' | 'networking' | 'skill_building' | 'daily_goal' | 'custom';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  due_time?: string;
  estimated_duration?: number;
  target_count?: number;
  job_application_id?: number;
}

// Calendar Event Types
export interface CalendarEvent {
  id: number;
  user_id: string;
  title: string;
  description?: string;
  event_type: 'interview' | 'networking' | 'deadline' | 'follow_up' | 'task' | 'custom';
  start_datetime: string;
  end_datetime: string;
  location?: string;
  is_all_day: boolean;
  reminder_minutes: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  job_application_id?: number;
  follow_up_id?: number;
  created_at: string;
  updated_at: string;
}

// Summary Types
export interface SummaryStats {
  total_applications: number;
  applications_this_week: number;
  applications_this_month: number;
  interviews_scheduled: number;
  pending_follow_ups: number;
  response_rate: number;
}

export interface TaskSummary {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  overdue_tasks: number;
  today_tasks: number;
  this_week_tasks: number;
}

// Navigation Types
export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  JobApplicationDetail: { id: number };
  AddJobApplication: undefined;
  EditJobApplication: { id: number };
  AddTask: undefined;
  EditTask: { id: number };
  AddEvent: undefined;
  EditEvent: { id: number };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Applications: undefined;
  Calendar: undefined;
  Tasks: undefined;
  Profile: undefined;
};

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Auth Types
export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
} 
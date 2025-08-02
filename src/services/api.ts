import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { JobApplication, JobApplicationCreate, Task, TaskCreate, CalendarEvent, SummaryStats, TaskSummary } from '../types';

// API Configuration
// Use your computer's network IP address so mobile devices can connect
const API_BASE_URL = 'http://192.168.1.76:8000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add Supabase JWT token
api.interceptors.request.use(
  async (config) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id && config.headers) {
        // Use the Supabase user ID as the Bearer token (matching web app)
        config.headers.Authorization = `Bearer ${session.user.id}`;
        console.log('🔑 API Request with user ID:', session.user.id.substring(0, 8) + '...');
      } else {
        console.log('❌ No Supabase session found for API request');
      }
    } catch (error) {
      console.error('Error getting Supabase session:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access - sign out user
      console.log('Unauthorized access, signing out...');
      await supabase.auth.signOut();
    }
    return Promise.reject(error);
  }
);

// Job Applications API
export const jobApplicationsApi = {
  getAll: async (): Promise<JobApplication[]> => {
    const response = await api.get('/job-applications/');
    return response.data;
  },

  getById: async (id: number): Promise<JobApplication> => {
    const response = await api.get(`/job-applications/${id}`);
    return response.data;
  },

  create: async (data: JobApplicationCreate): Promise<JobApplication> => {
    const response = await api.post('/job-applications/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<JobApplicationCreate>): Promise<JobApplication> => {
    const response = await api.put(`/job-applications/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/job-applications/${id}`);
  },

  getStats: async (): Promise<SummaryStats> => {
    const response = await api.get('/job-applications/stats');
    return response.data;
  },

  enhanceDescription: async (jobDescription: string): Promise<any> => {
    console.log('🔍 API: Making scraping request with URL:', jobDescription);
    console.log('🔍 API: Request payload:', { url: jobDescription });
    
    const response = await api.post('/job-applications/scrape-job', {
      url: jobDescription,
    }, {
      timeout: 30000, // Increase timeout to 30 seconds for scraping
    });
    
    console.log('🔍 API: Response received:', response.data);
    return response.data;
  },
};

// Tasks API
export const tasksApi = {
  getAll: async (): Promise<Task[]> => {
    const response = await api.get('/tasks/');
    return response.data;
  },

  getById: async (id: number): Promise<Task> => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  create: async (data: TaskCreate): Promise<Task> => {
    const response = await api.post('/tasks/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Task>): Promise<Task> => {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },

  getSummary: async (): Promise<TaskSummary> => {
    const response = await api.get('/tasks/summary/stats');
    return response.data;
  },
};

// Calendar Events API
export const calendarEventsApi = {
  getAll: async (): Promise<CalendarEvent[]> => {
    const response = await api.get('/calendar/events/');
    return response.data;
  },

  getById: async (id: number): Promise<CalendarEvent> => {
    const response = await api.get(`/calendar/events/${id}`);
    return response.data;
  },

  create: async (data: Partial<CalendarEvent>): Promise<CalendarEvent> => {
    const response = await api.post('/calendar/events/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CalendarEvent>): Promise<CalendarEvent> => {
    const response = await api.put(`/calendar/events/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/calendar/events/${id}`);
  },

  getDayView: async (date: string): Promise<any> => {
    const response = await api.get(`/calendar/view/day/${date}`);
    return response.data;
  },

  getMonthView: async (year: number, month: number): Promise<any> => {
    const response = await api.get(`/calendar/view/month/${year}/${month}`);
    return response.data;
  },
};

// Auth API - Now handled by Supabase
export const authApi = {
  // Authentication now handled by Supabase AuthContext
  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  signOut: async () => {
    await supabase.auth.signOut();
  },

  getSession: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },
};

export default api; 
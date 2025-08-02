import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const userId = await AsyncStorage.getItem('user_id');
      if (userId && config.headers) {
        config.headers.Authorization = `Bearer ${userId}`;
      }
    } catch (error) {
      console.error('Error getting user ID from storage:', error);
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
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      AsyncStorage.removeItem('user_id');
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
    const response = await api.post('/job-applications/enhance-job-description', {
      job_description: jobDescription,
    });
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

// Auth API
export const authApi = {
  setUserId: async (userId: string): Promise<void> => {
    await AsyncStorage.setItem('user_id', userId);
  },

  getUserId: async (): Promise<string | null> => {
    return await AsyncStorage.getItem('user_id');
  },

  clearAuth: async (): Promise<void> => {
    await AsyncStorage.removeItem('user_id');
  },
};

export default api; 
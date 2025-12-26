import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

interface User {
  _id: string;
  name: string;
  email: string;
  profile: {
    experience: string;
    currentRole?: string;
    yearsOfExperience: number;
  };
  preferences: {
    difficulty: string;
    topics: string[];
    dailyGoal: number;
  };
  stats: {
    totalInterviews: number;
    totalQuestions: number;
    averageScore: number;
    streakDays: number;
    lastPracticeDate?: string;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    name: string;
    email: string;
    password: string;
    experience?: string;
    currentRole?: string;
    yearsOfExperience?: number;
  }) => Promise<void>;
  logout: () => void;
  updateProfile: (profileData: Partial<User>) => Promise<void>;
  clearError: () => void;
  verifyToken: () => Promise<void>;
}

const API_BASE_URL = 'http://localhost:5000/api';

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;

const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post('/auth/login', { email, password });
          const { token, user } = response.data;
          
          // Set axios default authorization header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } catch (error: any) {
          console.error('Login error:', error);
          let errorMessage = 'Login failed';
          
          if (error.response?.data?.errors) {
            // Handle validation errors
            const validationErrors = error.response.data.errors;
            errorMessage = validationErrors.map((err: any) => err.msg).join(', ');
          } else if (error.response?.data?.error) {
            // Handle single error message
            errorMessage = error.response.data.error;
          } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          set({
            isLoading: false,
            error: errorMessage
          });
          throw error;
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post('/auth/register', userData);
          const { token, user } = response.data;
          
          // Set axios default authorization header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } catch (error: any) {
          console.error('Registration error:', error);
          let errorMessage = 'Registration failed';
          
          if (error.response?.data?.errors) {
            // Handle validation errors
            const validationErrors = error.response.data.errors;
            errorMessage = validationErrors.map((err: any) => err.msg).join(', ');
          } else if (error.response?.data?.error) {
            // Handle single error message
            errorMessage = error.response.data.error;
          } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          set({
            isLoading: false,
            error: errorMessage
          });
          throw error;
        }
      },

      logout: () => {
        // Remove axios default authorization header
        delete axios.defaults.headers.common['Authorization'];
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
      },

      updateProfile: async (profileData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.put('/auth/profile', profileData);
          const { user } = response.data;
          
          set({
            user,
            isLoading: false,
            error: null
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.error || 'Profile update failed'
          });
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      verifyToken: async () => {
        const { token } = get();
        if (!token) {
          set({ isAuthenticated: false });
          return;
        }

        try {
          // Set axios default authorization header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          const response = await axios.get('/auth/verify');
          const { user } = response.data;
          
          set({
            user,
            isAuthenticated: true,
            error: null
          });
        } catch (error: any) {
          // Token is invalid, logout user
          get().logout();
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

export default useAuthStore;

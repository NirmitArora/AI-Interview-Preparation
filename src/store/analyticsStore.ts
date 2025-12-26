import { create } from 'zustand';
import axios from 'axios';
import useAuthStore from './authStore';

// Ensure axios has the same base URL
axios.defaults.baseURL = 'http://localhost:5000/api';

// Helper function to ensure auth token is set (optional - backend may have bypass enabled)
const ensureAuthToken = () => {
  const { token } = useAuthStore.getState();
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

interface DashboardOverview {
  totalQuestions: number;
  totalInterviews: number;
  averageScore: number;
  streakDays: number;
  lastPracticeDate?: string;
}

interface RecentActivity {
  answers: number;
  interviews: number;
  averageScore: number;
}

interface TopicPerformance {
  _id: string;
  avgScore: number;
  count: number;
  totalTimeSpent: number;
}

interface DifficultyBreakdown {
  _id: string;
  avgScore: number;
  count: number;
}

interface SkillAssessment {
  avgTechnicalAccuracy: number;
  avgCommunication: number;
  avgProblemSolving: number;
  avgCodeQuality: number;
}

interface Trend {
  _id: string;
  avgScore: number;
  count: number;
}

interface Recommendation {
  type: string;
  title: string;
  description: string;
  priority: string;
  actionItems: string[];
}

interface DashboardData {
  overview: DashboardOverview;
  recentActivity: RecentActivity;
  topicPerformance: TopicPerformance[];
  difficultyBreakdown: DifficultyBreakdown[];
  trends: Trend[];
  skillAssessment: SkillAssessment;
  recommendations: Recommendation[];
}

interface DetailedAnalytics {
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
  statistics: {
    totalQuestions: number;
    totalInterviews: number;
    averageScore: number;
    totalTimeSpent: number;
    averageTimePerQuestion: number;
  };
  topicBreakdown: TopicPerformance[];
  timeTrends: Trend[];
  difficultyPerformance: DifficultyBreakdown[];
}

interface TopicAnalytics {
  topic: string;
  period: string;
  statistics: {
    totalQuestions: number;
    totalInterviews: number;
    averageScore: number;
    totalTimeSpent: number;
    averageTimePerQuestion: number;
  };
  categories: Array<{
    _id: string;
    avgScore: number;
    count: number;
    avgTimeSpent: number;
  }>;
  trends: Trend[];
}

interface ComparisonData {
  period1: {
    name: string;
    data: any;
  };
  period2: {
    name: string;
    data: any;
  };
  improvements: Record<string, {
    change: number;
    percentage: number;
    improved: boolean;
  }>;
}

interface AnalyticsState {
  dashboardData: DashboardData | null;
  detailedAnalytics: DetailedAnalytics | null;
  topicAnalytics: TopicAnalytics | null;
  comparisonData: ComparisonData | null;
  isLoading: boolean;
  error: string | null;
}

interface AnalyticsActions {
  getDashboardData: () => Promise<void>;
  getDetailedAnalytics: (params?: {
    period?: string;
    startDate?: string;
    endDate?: string;
  }) => Promise<void>;
  getTopicAnalytics: (topic: string, period?: string) => Promise<void>;
  getComparisonData: (period1: string, period2: string) => Promise<void>;
  getRecommendations: () => Promise<Recommendation[]>;
  clearError: () => void;
  resetAnalytics: () => void;
}

const useAnalyticsStore = create<AnalyticsState & AnalyticsActions>((set, get) => ({
  dashboardData: null,
  detailedAnalytics: null,
  topicAnalytics: null,
  comparisonData: null,
  isLoading: false,
  error: null,

  getDashboardData: async () => {
    ensureAuthToken();
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get('/analytics/dashboard');
      const data = response.data;
      
      set({
        dashboardData: data,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error || 'Failed to load dashboard data'
      });
      throw error;
    }
  },

  getDetailedAnalytics: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get('/analytics/detailed', { params });
      const data = response.data;
      
      set({
        detailedAnalytics: data,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error || 'Failed to load detailed analytics'
      });
      throw error;
    }
  },

  getTopicAnalytics: async (topic: string, period = 'all') => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`/analytics/topic/${topic}`, {
        params: { period }
      });
      const data = response.data;
      
      set({
        topicAnalytics: data,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error || 'Failed to load topic analytics'
      });
      throw error;
    }
  },

  getComparisonData: async (period1: string, period2: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get('/analytics/comparison', {
        params: { period1, period2 }
      });
      const data = response.data;
      
      set({
        comparisonData: data,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error || 'Failed to load comparison data'
      });
      throw error;
    }
  },

  getRecommendations: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get('/analytics/recommendations');
      const { recommendations } = response.data;
      
      set({ isLoading: false, error: null });
      return recommendations;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error || 'Failed to load recommendations'
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },

  resetAnalytics: () => {
    set({
      dashboardData: null,
      detailedAnalytics: null,
      topicAnalytics: null,
      comparisonData: null,
      error: null
    });
  }
}));

export default useAnalyticsStore;

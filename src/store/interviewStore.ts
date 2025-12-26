import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import axios from 'axios';
import useAuthStore from './authStore';

// Ensure axios has the same base URL as authStore
axios.defaults.baseURL = 'http://localhost:5000/api';

// Helper function to ensure auth token is set (optional - backend may have bypass enabled)
const ensureAuthToken = () => {
  const { token } = useAuthStore.getState();
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    // Don't delete - let backend handle bypass if enabled
    // delete axios.defaults.headers.common['Authorization'];
  }
};

interface Question {
  id: string;
  text: string;
  topic: string;
  difficulty: string;
  category: string;
  hints?: string[];
  timeEstimate?: number;
}

interface InterviewSession {
  id: string;
  topic: string;
  difficulty: string;
  status: string;
  startTime: string;
  totalQuestions: number;
  answeredQuestions: number;
  averageScore: number;
}

interface Answer {
  id: string;
  questionId: string;
  userResponse: string;
  timeSpent: number;
  aiFeedback: {
    score: number;
    strengths: string[];
    improvements: string[];
    detailedFeedback: string;
    suggestions: string[];
    evaluation: {
      technicalAccuracy: number;
      communication: number;
      problemSolving: number;
      codeQuality: number;
    };
    followUpQuestions: string[];
  };
  createdAt: string;
}

interface InterviewState {
  currentSession: InterviewSession | null;
  currentQuestion: Question | null;
  answers: Answer[];
  isLoading: boolean;
  error: string | null;
  timeElapsed: number;
  isTimerRunning: boolean;
}

interface InterviewActions {
  startInterview: (topic: string, difficulty: string) => Promise<void>;
  getNextQuestion: (difficulty?: string) => Promise<void>;
  submitAnswer: (questionId: string, answer: string, timeSpent: number) => Promise<Answer>;
  endInterview: () => Promise<void>;
  resetSession: () => void;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  clearError: () => void;
  getInterviewHistory: (params?: {
    page?: number;
    limit?: number;
    topic?: string;
    difficulty?: string;
    status?: string;
  }) => Promise<{
    interviews: InterviewSession[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>;
  getBookmarkedAnswers: (params?: {
    page?: number;
    limit?: number;
  }) => Promise<{
    answers: Answer[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>;
  toggleBookmark: (answerId: string) => Promise<void>;
}

const useInterviewStore = create<InterviewState & InterviewActions>()(
  subscribeWithSelector((set, get) => ({
  currentSession: null,
  currentQuestion: null,
  answers: [],
  isLoading: false,
  error: null,
  timeElapsed: 0,
  isTimerRunning: false,

  startInterview: async (topic: string, difficulty: string) => {
    ensureAuthToken(); // Ensure token is set before making request
    set({ isLoading: true, error: null, timeElapsed: 0, isTimerRunning: false });
    try {
      const response = await axios.post('/interviews/start', { topic, difficulty });
      const { interview } = response.data;
      
      console.log('✅ Interview session started:', interview);
      
      // Ensure interview has all required fields
      const session: InterviewSession = {
        id: interview.id || interview._id,
        topic: interview.topic,
        difficulty: interview.difficulty,
        status: interview.status || 'in-progress',
        startTime: interview.startTime,
        totalQuestions: interview.totalQuestions || 0,
        answeredQuestions: interview.answeredQuestions || 0,
        averageScore: interview.averageScore || 0
      };
      
      // Set session and start timer together
      set({
        currentSession: session,
        isLoading: false,
        error: null,
        timeElapsed: 0,
        isTimerRunning: true // This will trigger the timer subscription
      });
      
      console.log('✅ Session stored in store:', session);
    } catch (error: any) {
      console.error('❌ Failed to start interview:', error);
      set({
        isLoading: false,
        error: error.response?.data?.error || 'Failed to start interview'
      });
      throw error;
    }
  },

  getNextQuestion: async (difficulty?: string) => {
    ensureAuthToken(); // Ensure token is set before making request
    const { currentSession } = get();
    
    if (!currentSession) {
      console.error('❌ No active interview session when trying to get next question');
      throw new Error('No active interview session');
    }

    console.log('📝 Getting next question for session:', currentSession.id);
    set({ isLoading: true, error: null });
    try {
      const params = difficulty ? { difficulty } : {};
      const response = await axios.get(`/interviews/${currentSession.id}/question`, { params });
      const { question } = response.data;
      
      console.log('✅ Question received:', question);
      
      set({
        currentQuestion: question,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      console.error('❌ Failed to get question:', error);
      // Extract error message - check multiple possible locations
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to get question';
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'interviewStore.ts:195',message:'Error caught in getNextQuestion',data:{errorMessage,statusCode:error.response?.status,hasResponse:!!error.response,responseData:error.response?.data},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      
      set({
        isLoading: false,
        error: errorMessage
      });
      throw error;
    }
  },

  submitAnswer: async (questionId: string, answer: string, timeSpent: number) => {
    ensureAuthToken(); // Ensure token is set before making request
    const { currentSession } = get();
    
    if (!currentSession) {
      console.error('❌ No active interview session when trying to submit answer');
      throw new Error('No active interview session');
    }
    
    console.log('📤 Submitting answer for session:', currentSession.id);

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'interviewStore.ts:180',message:'Frontend submitting answer',data:{answerPreview:answer?.substring(0,100),answerLength:answer?.length,questionId,timeSpent},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D,E'})}).catch(()=>{});
    // #endregion

    set({ isLoading: true, error: null });
    try {
      // Ensure data types are correct for server validation
      const payload = {
        questionId: String(questionId), // Ensure it's a string
        answer: String(answer).trim(), // Ensure it's a string and trimmed
        timeSpent: Math.floor(Number(timeSpent)) // Ensure it's an integer
      };
      
      // Validate payload before sending
      if (!payload.questionId || payload.questionId.length === 0) {
        throw new Error('Question ID is required');
      }
      if (!payload.answer || payload.answer.length === 0) {
        throw new Error('Answer cannot be empty');
      }
      if (isNaN(payload.timeSpent) || payload.timeSpent < 0) {
        throw new Error('Time spent must be a valid positive number');
      }
      
      console.log('📤 Submitting answer with payload:', {
        questionId: payload.questionId,
        answerLength: payload.answer.length,
        timeSpent: payload.timeSpent,
        interviewId: currentSession.id
      });
      
      const response = await axios.post(`/interviews/${currentSession.id}/answer`, payload);
      
      const { feedback, answerId } = response.data;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'interviewStore.ts:195',message:'Frontend received response',data:{score:feedback?.score,strengths:feedback?.strengths,answerId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      
      console.log('✅ Answer submitted successfully:', { answerId, score: feedback?.score });
      
      const newAnswer: Answer = {
        id: answerId,
        questionId,
        userResponse: answer,
        timeSpent,
        aiFeedback: feedback,
        createdAt: new Date().toISOString()
      };

      set(state => ({
        answers: [...state.answers, newAnswer],
        isLoading: false,
        error: null
      }));

      return newAnswer;
    } catch (error: any) {
      console.error('❌ Failed to submit answer:', error);
      
      // Enhanced error logging
      if (error.response) {
        // Server responded with error
        console.error('Server status:', error.response.status);
        console.error('Server error data:', error.response.data);
        
        // Log validation errors if present
        if (error.response.data?.errors) {
          console.error('Validation errors:', error.response.data.errors);
        }
      } else if (error.request) {
        // Request was made but no response received
        console.error('No response received from server');
      } else {
        // Error in setting up the request
        console.error('Error setting up request:', error.message);
      }
      
      set({
        isLoading: false,
        error: error.response?.data?.error || error.response?.data?.errors?.[0]?.msg || error.message || 'Failed to submit answer'
      });
      throw error;
    }
  },

  endInterview: async () => {
    ensureAuthToken(); // Ensure token is set before making request
    const { currentSession } = get();
    if (!currentSession) {
      throw new Error('No active interview session');
    }

    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(`/interviews/${currentSession.id}/end`);
      const { interview } = response.data;
      
      set({
        currentSession: interview,
        isLoading: false,
        error: null,
        isTimerRunning: false
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error || 'Failed to end interview'
      });
      throw error;
    }
  },

  resetSession: () => {
    set({
      currentSession: null,
      currentQuestion: null,
      answers: [],
      error: null,
      timeElapsed: 0,
      isTimerRunning: false
    });
  },

  startTimer: () => {
    const state = get();
    if (!state.isTimerRunning) {
      set({ isTimerRunning: true });
    }
  },

  stopTimer: () => {
    set({ isTimerRunning: false });
  },

  resetTimer: () => {
    set({ timeElapsed: 0, isTimerRunning: false });
    // Restart timer after reset
    setTimeout(() => {
      get().startTimer();
    }, 100);
  },

  clearError: () => {
    set({ error: null });
  },

  getInterviewHistory: async (params = {}) => {
    ensureAuthToken(); // Ensure token is set before making request
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get('/interviews/history', { params });
      const { interviews, pagination } = response.data;
      
      set({ isLoading: false, error: null });
      return { interviews, pagination };
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error || 'Failed to get interview history'
      });
      throw error;
    }
  },

  getBookmarkedAnswers: async (params = {}) => {
    ensureAuthToken(); // Ensure token is set before making request
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get('/interviews/bookmarks', { params });
      const { answers, pagination } = response.data;
      
      set({ isLoading: false, error: null });
      return { answers, pagination };
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error || 'Failed to get bookmarked answers'
      });
      throw error;
    }
  },

  toggleBookmark: async (answerId: string) => {
    ensureAuthToken(); // Ensure token is set before making request
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(`/interviews/answer/${answerId}/bookmark`);
      const { isBookmarked } = response.data;
      
      // Update the answer in the store if it exists
      set(state => ({
        answers: state.answers.map(answer => 
          answer.id === answerId 
            ? { ...answer, isBookmarked } 
            : answer
        ),
        isLoading: false,
        error: null
      }));
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error || 'Failed to toggle bookmark'
      });
      throw error;
    }
  }
})));

// Timer effect
let timerInterval: NodeJS.Timeout | null = null;

useInterviewStore.subscribe(
  (state) => state.isTimerRunning,
  (isRunning) => {
    if (isRunning && !timerInterval) {
      timerInterval = setInterval(() => {
        useInterviewStore.setState(state => ({
          timeElapsed: state.timeElapsed + 1
        }));
      }, 1000);
    } else if (!isRunning && timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }
);

export default useInterviewStore;

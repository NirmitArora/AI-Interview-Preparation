import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import CategoriesPage from './components/CategoriesPage';
import InterviewPage from './components/InterviewPage';
import FeedbackPage from './components/FeedbackPage';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import useAuthStore from './store/authStore';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, verifyToken } = useAuthStore();
  // Auth enforced
  const BYPASS_AUTH = false;
  const allowBypass = typeof window !== 'undefined' && window.localStorage.getItem('bypassAuth') === '1';

  useEffect(() => {
    if (isAuthenticated) {
      verifyToken();
    }
  }, [isAuthenticated, verifyToken]);

  if (!isAuthenticated && !BYPASS_AUTH && !allowBypass) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  const { verifyToken } = useAuthStore();

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route 
            path="/categories" 
            element={
              <ProtectedRoute>
                <CategoriesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/interview/:category" 
            element={
              <ProtectedRoute>
                <InterviewPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/feedback" 
            element={
              <ProtectedRoute>
                <FeedbackPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/analytics" 
            element={
              <ProtectedRoute>
                <AnalyticsDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import CategoriesPage from './components/CategoriesPage';
import InterviewPage from './components/InterviewPage';
import FeedbackPage from './components/FeedbackPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/interview/:category" element={<InterviewPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
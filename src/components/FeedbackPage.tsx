import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Brain, ArrowLeft, CheckCircle, AlertCircle, TrendingUp, Clock, Target, BookOpen } from 'lucide-react';

const FeedbackPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get data from InterviewPage
  const { question, answer, timeElapsed, category } = location.state || {};

  const feedback = {
    score: 85,
    strengths: [
      'Clear explanation of core concepts',
      'Good use of examples',
      'Logical flow of ideas'
    ],
    improvements: [
      'Could mention more edge cases',
      'Consider discussing time complexity',
      'Add more practical applications'
    ],
    detailedFeedback: `Your answer demonstrates a solid understanding of the core concepts. You provided a clear explanation and used relevant examples, which shows good communication skills. 

However, there are opportunities for improvement. Consider discussing edge cases that might affect your solution, and always analyze the time and space complexity of your approach. This level of detail is highly valued in technical interviews.

Overall, this is a strong response that would likely impress interviewers at most companies.`,
    recommendations: [
      'Practice explaining complex concepts in simpler terms',
      'Work on analyzing algorithm complexity',
      'Study common edge cases for this topic'
    ]
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 90) return 'from-green-400 to-green-600';
    if (score >= 75) return 'from-blue-400 to-blue-600';
    if (score >= 60) return 'from-yellow-400 to-yellow-600';
    return 'from-red-400 to-red-600';
  };

  if (!question) {
    navigate('/categories');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => navigate('/categories')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Back to Categories</span>
            </button>
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-gray-900 bg-clip-text text-transparent">
                InterviewAI
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Interview Feedback
          </h1>
          <p className="text-gray-600">AI-powered analysis of your technical interview response</p>
        </div>

        {/* Score Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-center md:text-left mb-6 md:mb-0">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Overall Score</h2>
              <div className={`text-6xl font-bold ${getScoreColor(feedback.score)} mb-2`}>
                {feedback.score}
              </div>
              <div className="text-gray-600">out of 100</div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-2 mx-auto">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div className="font-semibold text-gray-900">{formatTime(timeElapsed)}</div>
                <div className="text-sm text-gray-600">Time Taken</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-2 mx-auto">
                </div>
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-2 mx-auto">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
                <div className="font-semibold text-gray-900">{question.difficulty}</div>
                <div className="text-sm text-gray-600">Difficulty</div>
              </div>
            </div>
          </div>
        </div>

        {/* Strengths & Improvements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Strengths */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <h3 className="text-xl font-bold text-gray-900">Strengths</h3>
            </div>
            <ul className="space-y-3">
              {feedback.strengths.map((strength, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700">{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Areas for Improvement */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">Areas to Improve</h3>
            </div>
            <ul className="space-y-3">
              {feedback.improvements.map((improvement, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700">{improvement}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Detailed Feedback */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <AlertCircle className="h-6 w-6 text-orange-600" />
            <h3 className="text-xl font-bold text-gray-900">Detailed Analysis</h3>
          </div>
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {feedback.detailedFeedback}
            </p>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-gradient-to-r from-green-50 to-gray-100 rounded-2xl shadow-lg border border-green-100 p-8 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-900">Next Steps</h3>
          </div>
          <ul className="space-y-3">
            {feedback.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-700">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate(`/interview/${category}`)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Practice More Questions
          </button>
          <button
            onClick={() => navigate('/categories')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Choose Different Topic
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
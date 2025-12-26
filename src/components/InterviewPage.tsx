import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Brain, ArrowLeft, Clock, Send, RefreshCw, LogOut } from 'lucide-react';
import useInterviewStore from '../store/interviewStore';
import useAuthStore from '../store/authStore';

interface Question {
  id: string;
  text: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
}

const InterviewPage: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const {
    currentSession,
    currentQuestion,
    isLoading,
    error,
    timeElapsed,
    startInterview,
    getNextQuestion,
    submitAnswer,
    startTimer,
    resetTimer,
    clearError
  } = useInterviewStore();
  
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fallbackQuestion, setFallbackQuestion] = useState<Question | null>(null);
  const [isDemoQuestion, setIsDemoQuestion] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  // Get difficulty from URL params
  const searchParams = new URLSearchParams(location.search);
  const difficulty = searchParams.get('difficulty') || 'Medium';

  // Function to load a demo question
  const loadDemoQuestion = () => {
    if (!category) return;
    
    const categoryQuestions = questions[category] || [];
    if (categoryQuestions.length === 0) {
      // Fallback to any available question if category not found
      const allQuestions = Object.values(questions).flat();
      if (allQuestions.length > 0) {
        const demoQ = allQuestions[0];
        setFallbackQuestion(demoQ);
        setIsDemoQuestion(true);
        clearError();
        startTimer();
        return;
      }
      return;
    }
    
    // Pick a random question from the category, or filter by difficulty if possible
    const filteredQuestions = categoryQuestions.filter(q => 
      q.difficulty === difficulty || !difficulty
    );
    const questionsToUse = filteredQuestions.length > 0 ? filteredQuestions : categoryQuestions;
    const randomIndex = Math.floor(Math.random() * questionsToUse.length);
    const demoQuestion = questionsToUse[randomIndex];
    
    setFallbackQuestion(demoQuestion);
    setIsDemoQuestion(true);
    clearError();
    startTimer();
  };

  // Sample questions database
  const questions: Record<string, Question[]> = {
    javascript: [
      {
        id: 'js1',
        text: 'Explain the difference between `var`, `let`, and `const` in JavaScript. Provide examples of when you would use each one.',
        difficulty: 'Medium',
        topic: 'Variables & Scope'
      },
      {
        id: 'js2',
        text: 'What is a closure in JavaScript? Can you provide a practical example of how closures are used?',
        difficulty: 'Medium',
        topic: 'Functions & Closures'
      }
    ],
    python: [
      {
        id: 'py1',
        text: 'Explain the difference between a list and a tuple in Python. When would you choose one over the other?',
        difficulty: 'Easy',
        topic: 'Data Types'
      }
    ],
    'data-structures': [
      {
        id: 'ds1',
        text: 'Implement a function to reverse a linked list. Explain the time and space complexity of your solution.',
        difficulty: 'Medium',
        topic: 'Linked Lists'
      }
    ],
    algorithms: [
      {
        id: 'alg1',
        text: 'Explain the merge sort algorithm and implement it in your preferred programming language. What is its time complexity?',
        difficulty: 'Medium',
        topic: 'Sorting Algorithms'
      }
    ],
    sql: [
      {
        id: 'sql1',
        text: 'Write a SQL query to find the second highest salary from an Employee table. Explain your approach.',
        difficulty: 'Medium',
        topic: 'SQL Queries'
      }
    ],
    java: [
      {
        id: 'java1',
        text: 'Explain the concept of inheritance in Java. How does it differ from composition? When would you use each approach?',
        difficulty: 'Medium',
        topic: 'Object-Oriented Programming'
      }
    ],
    'system-design': [
      {
        id: 'sd1',
        text: 'Design a URL shortening service like bit.ly. Discuss the high-level architecture, database design, and scaling considerations.',
        difficulty: 'Hard',
        topic: 'System Architecture'
      }
    ]
  };

  useEffect(() => {
    const initializeInterview = async () => {
      if (!category) return;
      
      // If session exists but no question, get one
      if (currentSession && !currentQuestion) {
        try {
          await getNextQuestion(difficulty);
          startTimer();
          // Clear fallback when we successfully get a real question
          setFallbackQuestion(null);
        } catch (error) {
          console.error('Failed to get question:', error);
          // Don't set fallback - let error state handle it
        }
        return;
      }
      
      // If no session, start a new interview
      if (!currentSession) {
        try {
          console.log(`Starting interview for ${category} with difficulty ${difficulty}`);
          await startInterview(category, difficulty);
          await getNextQuestion(difficulty);
          startTimer();
          // Clear any previous fallback question when successfully getting AI question
          setFallbackQuestion(null);
        } catch (error: any) {
          console.error('Failed to start interview:', error);
          // Don't use fallback - show error instead
          // The error will be displayed in the error state UI
          // Only set fallback if it's a network/auth issue and we want to show something
          // For now, let the error state handle it
        }
      }
    };

    initializeInterview();
  }, [category, difficulty, currentSession, currentQuestion, startInterview, getNextQuestion, startTimer]);

  useEffect(() => {
    // Don't auto-clear quota errors - they're persistent and user needs to see them
    const isQuotaError = error?.includes('quota') || error?.includes('429') || error?.includes('Gemini API quota');
    if (error && !isQuotaError) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Removed stray local timer (store already tracks timeElapsed)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Function to generate demo analysis
  const generateDemoAnalysis = () => {
    const questionToUse = currentQuestion || fallbackQuestion;
    if (!questionToUse || !answer.trim()) return;
    
    // Generate a demo analysis based on answer length and question
    const answerLength = answer.trim().length;
    const hasCode = answer.includes('function') || answer.includes('def') || answer.includes('class') || answer.includes('const') || answer.includes('let');
    const hasExplanation = answerLength > 100;
    
    // Calculate a score based on answer quality indicators
    let score = 60; // Base score
    if (hasCode) score += 15;
    if (hasExplanation) score += 15;
    if (answerLength > 200) score += 10;
    score = Math.min(95, score); // Cap at 95
    
    const demoFeedback = {
      score,
      strengths: [
        hasCode ? 'Provided code examples demonstrating practical understanding' : 'Clear explanation of concepts',
        hasExplanation ? 'Good use of examples and explanations' : 'Concise and to the point',
        answerLength > 150 ? 'Comprehensive answer covering multiple aspects' : 'Focused answer addressing the question'
      ],
      improvements: [
        answerLength < 100 ? 'Consider providing more detail and examples' : 'Could mention more edge cases',
        !hasCode && questionToUse?.text?.toLowerCase().includes('implement') ? 'Consider including code examples' : 'Consider discussing time complexity',
        'Add more practical applications or real-world use cases'
      ],
      detailedFeedback: `Your answer demonstrates a ${score >= 75 ? 'solid' : 'basic'} understanding of the core concepts. ${hasCode ? 'You provided code examples, which shows good practical knowledge.' : 'You provided a clear explanation.'} ${hasExplanation ? 'The use of examples helps illustrate your points effectively.' : 'Consider adding examples to strengthen your answer.'}

${score < 75 ? 'However, there are opportunities for improvement. ' : 'To further enhance your answer, '}Consider discussing edge cases that might affect your solution, and always analyze the time and space complexity of your approach when relevant. This level of detail is highly valued in technical interviews.

Overall, this is a ${score >= 75 ? 'strong' : 'decent'} response that ${score >= 75 ? 'would likely impress' : 'shows potential to improve and'} interviewers at most companies.`,
      suggestions: [
        'Practice explaining complex concepts in simpler terms',
        'Work on analyzing algorithm complexity when applicable',
        'Study common edge cases for this topic'
      ],
      evaluation: {
        technicalAccuracy: score,
        communication: Math.min(95, score + 5),
        problemSolving: score - 5,
        codeQuality: hasCode ? Math.min(95, score + 10) : score - 10
      },
      followUpQuestions: [
        `How would you optimize this solution for better performance?`,
        `What edge cases should be considered for this problem?`
      ]
    };
    
    // Navigate to feedback page with demo analysis
    navigate('/feedback', {
      state: {
        question: questionToUse,
        answer: {
          id: `demo-${Date.now()}`,
          questionId: questionToUse.id,
          userResponse: answer.trim(),
          timeSpent: Math.floor(timeElapsed || 0),
          aiFeedback: demoFeedback,
          createdAt: new Date().toISOString()
        },
        timeElapsed: Math.floor(timeElapsed || 0),
        category,
        isDemoQuestion: true,
        isDemoAnalysis: true
      }
    });
  };

  const handleSubmit = async () => {
    if (!answer.trim() || !displayQuestion) {
      console.warn('Cannot submit: missing answer or question');
      return;
    }
    
    // Validate question ID format (MongoDB ObjectId is 24 hex characters)
    const questionId = displayQuestion.id;
    
    // Check if it's a demo/fallback question (has non-MongoDB ID like 'js1', 'py1', etc.)
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(questionId);
    if (!questionId || typeof questionId !== 'string' || !isMongoId) {
      // For demo questions, skip API submission and go directly to demo analysis
      if (isDemoQuestion || (fallbackQuestion && displayQuestion.id === fallbackQuestion.id)) {
        console.log('Demo question detected - generating demo analysis directly');
        generateDemoAnalysis();
        return;
      }
      
      console.error('Invalid question ID (not a MongoDB ObjectId):', questionId);
      // Show a better error message and offer to retry
      const shouldRetry = window.confirm(
        'This appears to be a sample question. AI-generated questions are required to submit answers.\n\n' +
        'Would you like to retry getting an AI-generated question?'
      );
      if (shouldRetry && category) {
        try {
          clearError();
          setFallbackQuestion(null);
          setIsDemoQuestion(false);
          if (!currentSession) {
            await startInterview(category, difficulty);
          }
          await getNextQuestion(difficulty);
          startTimer();
        } catch (retryError) {
          console.error('Failed to get AI question:', retryError);
          alert('Failed to get AI question. Please check your connection and try again.');
        }
      }
      return;
    }
    
    // Validate timeElapsed is a number
    const timeSpent = Math.floor(timeElapsed || 0);
    if (isNaN(timeSpent) || timeSpent < 0) {
      console.error('Invalid time elapsed:', timeElapsed);
      alert('Invalid time data. Please refresh and try again.');
      return;
    }
    
    console.log('📝 Preparing to submit answer:', {
      questionId,
      answerLength: answer.length,
      timeSpent,
      hasSession: !!currentSession
    });
    
    setIsSubmitting(true);
    setAnalysisError(null); // Clear any previous analysis errors
    
    try {
      // Ensure session exists before submitting
      if (!currentSession && category) {
        console.log('Session missing, re-initializing...');
        await startInterview(category, difficulty);
      }
      
      const submittedAnswer = await submitAnswer(questionId, answer.trim(), timeSpent);
      
      navigate('/feedback', { 
        state: { 
          question: displayQuestion,
          answer: submittedAnswer,
          timeElapsed: timeSpent,
          category,
          isDemoQuestion
        } 
      });
    } catch (error: any) {
      console.error('Failed to submit answer:', error);
      
      // Check if it's an analysis error (quota or AI service unavailable)
      const errorMessage = error.response?.data?.error || error.message || '';
      const isAnalysisError = errorMessage.includes('quota') || 
                             errorMessage.includes('429') ||
                             errorMessage.includes('Gemini API') ||
                             errorMessage.includes('AI evaluation') ||
                             errorMessage.includes('503');
      
      if (isAnalysisError) {
        // Store the analysis error to show demo analysis option
        setAnalysisError(errorMessage);
        // Don't show alert - let user see the demo analysis button
      } else {
        // Enhanced error handling for other errors
        if (error.response?.data?.errors) {
          // Validation errors from server
          const validationErrors = error.response.data.errors;
          const errorMessage = validationErrors.map((err: any) => err.msg).join(', ');
          alert(`Validation error: ${errorMessage}`);
        } else if (error.response?.data?.error) {
          // Server error message
          alert(`Error: ${error.response.data.error}`);
        } else if (error.message) {
          // Client-side error
          alert(`Error: ${error.message}`);
        }
      }
      
      // If error is about missing session, try to recover
      if (error.message?.includes('No active interview session') && category) {
        try {
          await startInterview(category, difficulty);
          // Retry submission
          const submittedAnswer = await submitAnswer(questionId, answer.trim(), timeSpent);
          navigate('/feedback', { 
            state: { 
              question: displayQuestion,
              answer: submittedAnswer,
              timeElapsed: timeSpent,
              category,
              isDemoQuestion
            } 
          });
          return;
        } catch (retryError) {
          console.error('Retry failed:', retryError);
        }
      }
      setIsSubmitting(false);
    }
  };

  const generateNewQuestion = async () => {
    try {
      // Clear demo flags and errors when getting a new question
      setIsDemoQuestion(false);
      setAnalysisError(null);
      setFallbackQuestion(null);
      
      // Ensure session exists before getting next question
      if (!currentSession && category) {
        console.log('Session missing, re-initializing...');
        await startInterview(category, difficulty);
      }
      
      await getNextQuestion(difficulty);
      setAnswer('');
      resetTimer();
      startTimer();
    } catch (error: any) {
      console.error('Failed to get new question:', error);
      // If error is about missing session, try to recover
      if (error.message?.includes('No active interview session') && category) {
        try {
          await startInterview(category, difficulty);
          await getNextQuestion(difficulty);
          setAnswer('');
          resetTimer();
          startTimer();
        } catch (retryError) {
          console.error('Retry failed:', retryError);
        }
      }
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryName = (cat: string) => {
    const names: Record<string, string> = {
      'javascript': 'JavaScript',
      'python': 'Python',
      'data-structures': 'Data Structures',
      'algorithms': 'Algorithms',
      'sql': 'SQL & Databases',
      'java': 'Java',
      'system-design': 'System Design'
    };
    return names[cat] || cat;
  };

  // Only use fallback if we have no real question AND we're not loading
  // Prefer real AI-generated questions over fallback
  const displayQuestion = currentQuestion || (fallbackQuestion && !isLoading ? fallbackQuestion : null);

  if (isLoading && !displayQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading question...</p>
        </div>
      </div>
    );
  }

  // Show error state if no question is available
  if (!displayQuestion && !isLoading) {
    const errorMessage = error || 'Failed to fetch AI-generated question. Please check your connection and try again.';
    // Check for AI service errors including quota errors (429), API key errors, and service unavailable (503)
    const isAIServiceError = error?.includes('AI service') || 
                              error?.includes('GEMINI_API_KEY') || 
                              error?.includes('quota') || 
                              error?.includes('429') ||
                              error?.includes('Gemini API') ||
                              error?.includes('503');
    
    // #region agent log
    if (error) {
      fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InterviewPage.tsx:372',message:'Displaying error state',data:{errorMessage,isAIServiceError,hasQuota:error.includes('quota')},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
    }
    // #endregion
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="text-red-600 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {isAIServiceError ? 'AI Service Unavailable' : 'Unable to Load Question'}
          </h2>
          <p className="text-gray-600 mb-2">{errorMessage}</p>
          {isAIServiceError && !error?.includes('quota') && (
            <p className="text-sm text-gray-500 mb-4">
              Please check your GEMINI_API_KEY in the .env file and ensure the AI service is properly configured.
            </p>
          )}
          {error?.includes('quota') && (
            <p className="text-sm text-gray-500 mb-4">
              The free tier has a limit of 20 requests per day. The quota resets every 24 hours. Consider upgrading your plan for unlimited requests.
            </p>
          )}
          <div className="flex gap-3 justify-center flex-wrap">
            {isAIServiceError && (
              <button
                onClick={loadDemoQuestion}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors duration-200"
              >
                Demo Question
              </button>
            )}
            {!error?.includes('quota') && (
              <button
                onClick={async () => {
                  if (category) {
                    try {
                      clearError();
                      await startInterview(category, difficulty);
                      await getNextQuestion(difficulty);
                      startTimer();
                    } catch (retryError) {
                      console.error('Retry failed:', retryError);
                    }
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors duration-200"
              >
                Retry
              </button>
            )}
            <button
              onClick={() => navigate('/categories')}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-semibold transition-colors duration-200"
            >
              Back to Categories
            </button>
          </div>
        </div>
      </div>
    );
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
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-lg">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-blue-600 font-mono">{formatTime(timeElapsed)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Brain className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-gray-900 bg-clip-text text-transparent">
                  InterviewAI
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors duration-200"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Question Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {getCategoryName(category || '')} Interview
              </h1>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getDifficultyColor((displayQuestion?.difficulty as string) || 'Medium')}`}>
                  {displayQuestion?.difficulty || difficulty}
                </span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-600">{displayQuestion?.topic || displayQuestion?.category || getCategoryName(category || '')}</span>
              </div>
            </div>
            <button
              onClick={generateNewQuestion}
              className="mt-4 sm:mt-0 flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
            >
              <RefreshCw className="h-4 w-4" />
              <span>New Question</span>
            </button>
          </div>

          {/* Question */}
          <div className="bg-gray-50 rounded-lg p-6">
            <p className="text-lg leading-relaxed text-gray-900">
              {displayQuestion?.text || 'No question available'}
            </p>
          </div>
        </div>

        {/* Answer Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Answer</h2>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Start typing your answer here... Be detailed and explain your thought process."
            className="w-full h-64 p-4 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 leading-relaxed"
          />
          
          <div className="flex flex-col gap-3 mt-6">
            {analysisError && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm mb-3">
                  AI analysis is currently unavailable. You can view a demo analysis instead.
                </p>
                <button
                  onClick={generateDemoAnalysis}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors duration-200 w-full sm:w-auto"
                >
                  Demo Analysis
                </button>
              </div>
            )}
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {answer.length} characters
              </div>
              <button
                onClick={handleSubmit}
                disabled={!answer.trim() || isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 flex items-center space-x-2 shadow-lg hover:shadow-xl"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Submit Answer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-6 bg-gradient-to-r from-green-50 to-gray-100 rounded-2xl p-6 border border-green-100">
          <h3 className="font-semibold text-gray-900 mb-2">💡 Interview Tips</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Think out loud and explain your reasoning</li>
            <li>• Consider edge cases and potential optimizations</li>
            <li>• Don't hesitate to ask clarifying questions</li>
            <li>• Walk through examples if helpful</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default InterviewPage;
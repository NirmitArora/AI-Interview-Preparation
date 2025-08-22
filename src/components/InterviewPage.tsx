import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Brain, ArrowLeft, Clock, Send, RefreshCw } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
}

const InterviewPage: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const [answer, setAnswer] = useState('');
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);

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
    if (category && questions[category]) {
      const randomQuestion = questions[category][Math.floor(Math.random() * questions[category].length)];
      setCurrentQuestion(randomQuestion);
    }
  }, [category]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    navigate('/feedback', { 
      state: { 
        question: currentQuestion,
        answer,
        timeElapsed,
        category 
      } 
    });
  };

  const generateNewQuestion = () => {
    if (category && questions[category]) {
      const randomQuestion = questions[category][Math.floor(Math.random() * questions[category].length)];
      setCurrentQuestion(randomQuestion);
      setAnswer('');
      setTimeElapsed(0);
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

  if (!currentQuestion) {
    return <div>Loading...</div>;
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
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getDifficultyColor(currentQuestion.difficulty)}`}>
                  {currentQuestion.difficulty}
                </span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-600">{currentQuestion.topic}</span>
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
              {currentQuestion.text}
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
          
          <div className="flex justify-between items-center mt-6">
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
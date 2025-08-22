import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, ArrowLeft, Code, Database, Cpu, Coffee, Settings, Globe } from 'lucide-react';

const CategoriesPage: React.FC = () => {
  const navigate = useNavigate();

  const categories = [
    {
      id: 'javascript',
      title: 'JavaScript',
      description: 'Modern JS, ES6+, async/await, closures, and more',
      icon: <Code className="h-8 w-8" />,
      color: 'from-yellow-400 to-orange-500',
      questions: '500+ questions'
    },
    {
      id: 'python',
      title: 'Python',
      description: 'Object-oriented programming, data structures, algorithms',
      icon: <Coffee className="h-8 w-8" />,
      color: 'from-green-400 to-blue-500',
      questions: '450+ questions'
    },
    {
      id: 'data-structures',
      title: 'Data Structures',
      description: 'Arrays, linked lists, trees, graphs, hash tables',
      icon: <Cpu className="h-8 w-8" />,
      color: 'from-purple-400 to-pink-500',
      questions: '300+ questions'
    },
    {
      id: 'algorithms',
      title: 'Algorithms',
      description: 'Sorting, searching, dynamic programming, recursion',
      icon: <Settings className="h-8 w-8" />,
      color: 'from-blue-400 to-indigo-500',
      questions: '400+ questions'
    },
    {
      id: 'sql',
      title: 'SQL & Databases',
      description: 'Queries, joins, indexing, database design',
      icon: <Database className="h-8 w-8" />,
      color: 'from-red-400 to-pink-500',
      questions: '250+ questions'
    },
    {
      id: 'java',
      title: 'Java',
      description: 'OOP concepts, collections, multithreading, Spring',
      icon: <Coffee className="h-8 w-8" />,
      color: 'from-orange-400 to-red-500',
      questions: '350+ questions'
    },
    {
      id: 'system-design',
      title: 'System Design',
      description: 'Scalability, microservices, load balancing',
      icon: <Globe className="h-8 w-8" />,
      color: 'from-teal-400 to-cyan-500',
      questions: '200+ questions'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Back to Home</span>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Choose Your
            <span className="block bg-gradient-to-r from-green-600 to-gray-900 bg-clip-text text-transparent">
              Interview Topic
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Select a technical category to start practicing. Each topic includes real interview questions 
            from top tech companies with AI-powered feedback.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              onClick={() => navigate(`/interview/${category.id}`)}
              className="group cursor-pointer bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 relative overflow-hidden"
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              
              {/* Icon */}
              <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${category.color} text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                {category.icon}
              </div>

              {/* Content */}
              <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-gray-700 transition-colors duration-200">
                {category.title}
              </h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                {category.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-blue-600">
                  {category.questions}
                </span>
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-200">
                  <ArrowLeft className="h-4 w-4 text-blue-600 group-hover:text-white rotate-180 transition-colors duration-200" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Not sure where to start?
            </h3>
            <p className="text-gray-600 mb-6">
              Take our quick assessment to get personalized recommendations based on your experience level.
            </p>
            <button className="bg-gradient-to-r from-green-600 to-gray-900 hover:from-green-700 hover:to-black text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl">
              Take Assessment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;
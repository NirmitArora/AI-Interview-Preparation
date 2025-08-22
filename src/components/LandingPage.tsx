import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Brain, Target, TrendingUp, Users } from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Brain className="h-8 w-8 text-blue-600" />,
      title: "AI-Powered Questions",
      description: "Get personalized interview questions tailored to your skill level"
    },
    {
      icon: <Target className="h-8 w-8 text-orange-600" />,
      title: "Targeted Practice",
      description: "Focus on specific technologies and programming concepts"
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-green-600" />,
      title: "Track Progress",
      description: "Monitor your improvement with detailed feedback and scoring"
    },
    {
      icon: <Users className="h-8 w-8 text-gray-800" />,
      title: "Industry Standards",
      description: "Practice with questions from top tech companies"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-gray-900 bg-clip-text text-transparent">
                InterviewAI
              </span>
            </div>
            <button
              onClick={() => navigate('/categories')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Ace Your Next
            <span className="block bg-gradient-to-r from-green-600 to-gray-900 bg-clip-text text-transparent">
              Technical Interview
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Practice with AI-generated interview questions across multiple programming languages and computer science topics. 
            Get instant feedback and improve your technical communication skills.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => navigate('/categories')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-105 flex items-center space-x-2 shadow-lg hover:shadow-xl"
            >
              <span>Start Practicing</span>
              <ArrowRight className="h-5 w-5" />
            </button>
            <button className="text-gray-600 hover:text-gray-800 px-8 py-4 rounded-lg font-semibold text-lg transition-colors duration-200">
              Learn More
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-24 bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">10,000+</div>
              <div className="text-gray-600">Practice Questions</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-800 mb-2">50,000+</div>
              <div className="text-gray-600">Students Prepared</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">95%</div>
              <div className="text-gray-600">Success Rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
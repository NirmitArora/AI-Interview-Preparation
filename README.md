# InterviewAI Prep - AI-Powered Technical Interview Practice Platform

A comprehensive web application that helps users practice technical interviews using AI-generated questions and personalized feedback. Built with React, Node.js, MongoDB, and integrated with Google's Gemini AI.

## 🚀 Features

### Core Features
- **AI-Powered Question Generation**: Dynamic interview questions using Google's Gemini AI
- **Personalized Feedback**: Detailed analysis of answers with strengths and improvements
- **Multiple Topics**: JavaScript, Python, Data Structures, Algorithms, SQL, Java, System Design
- **Difficulty Levels**: Easy, Medium, and Hard questions
- **Real-time Analytics**: Comprehensive dashboard with performance metrics
- **Progress Tracking**: Monitor improvement over time with detailed statistics

### Technical Features
- **Authentication**: JWT-based user authentication with Passport.js
- **Database**: MongoDB with Mongoose ODM
- **State Management**: Zustand for client-side state management
- **Charts & Analytics**: Recharts for data visualization
- **Responsive Design**: Modern UI with Tailwind CSS
- **Real-time Timer**: Track time spent on questions
- **Bookmarking**: Save important questions and answers for later review

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **React Router** for navigation
- **Zustand** for state management
- **Axios** for API communication
- **Recharts** for data visualization
- **Tailwind CSS** for styling
- **Lucide React** for icons

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose
- **Passport.js** for authentication
- **JWT** for token management
- **Google Gemini AI** for question generation and evaluation
- **Express Validator** for input validation
- **Helmet** for security headers

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (v16 or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- **Google Gemini API Key** (for AI features)

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd interview-ai-prep
```

### 2. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 3. Environment Configuration

Create a `.env` file in the root directory:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/interview-ai-prep

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# AI Configuration
GEMINI_API_KEY=your-gemini-api-key-here

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
HELMET_ENABLED=true
CORS_ENABLED=true
```

### 4. Get Google Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add the API key to your `.env` file

### 5. Start the Application

#### Development Mode (Both Frontend and Backend)
```bash
npm run dev:full
```

#### Start Backend Only
```bash
npm run server
```

#### Start Frontend Only
```bash
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

## 📊 Database Schema

### Collections

#### Users
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  preferences: {
    difficulty: String,
    topics: [String],
    dailyGoal: Number
  },
  profile: {
    experience: String,
    currentRole: String,
    yearsOfExperience: Number
  },
  stats: {
    totalInterviews: Number,
    totalQuestions: Number,
    averageScore: Number,
    streakDays: Number,
    lastPracticeDate: Date
  }
}
```

#### Interviews
```javascript
{
  userId: ObjectId,
  topic: String,
  difficulty: String,
  status: String,
  startTime: Date,
  endTime: Date,
  duration: Number,
  totalQuestions: Number,
  answeredQuestions: Number,
  averageScore: Number,
  sessionData: {
    currentQuestionIndex: Number,
    questions: [{
      questionId: ObjectId,
      order: Number,
      timeSpent: Number,
      score: Number
    }]
  }
}
```

#### Questions
```javascript
{
  text: String,
  topic: String,
  difficulty: String,
  category: String,
  generatedBy: String,
  aiPrompt: String,
  expectedAnswer: String,
  keyPoints: [String],
  hints: [String],
  metadata: {
    timeEstimate: Number,
    complexity: String,
    concepts: [String]
  },
  stats: {
    timesAsked: Number,
    averageScore: Number,
    averageTimeSpent: Number,
    successRate: Number
  }
}
```

#### Answers
```javascript
{
  userId: ObjectId,
  questionId: ObjectId,
  interviewId: ObjectId,
  userResponse: String,
  timeSpent: Number,
  aiFeedback: {
    score: Number,
    strengths: [String],
    improvements: [String],
    detailedFeedback: String,
    suggestions: [String],
    evaluation: {
      technicalAccuracy: Number,
      communication: Number,
      problemSolving: Number,
      codeQuality: Number
    }
  },
  isBookmarked: Boolean
}
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `GET /api/auth/verify` - Verify JWT token

### Interviews
- `POST /api/interviews/start` - Start new interview session
- `GET /api/interviews/:id/question` - Get next question
- `POST /api/interviews/:id/answer` - Submit answer
- `PUT /api/interviews/:id/end` - End interview session
- `GET /api/interviews/history` - Get interview history
- `GET /api/interviews/bookmarks` - Get bookmarked answers

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard data
- `GET /api/analytics/detailed` - Get detailed analytics
- `GET /api/analytics/topic/:topic` - Get topic-specific analytics
- `GET /api/analytics/comparison` - Get performance comparison
- `GET /api/analytics/recommendations` - Get personalized recommendations

### AI Services
- `POST /api/ai/generate-question` - Generate new question
- `POST /api/ai/evaluate-answer` - Evaluate answer
- `POST /api/ai/follow-up-questions` - Generate follow-up questions
- `GET /api/ai/question/:id/hints` - Get question hints

## 🎯 Usage

### 1. Registration/Login
- Create an account or log in with existing credentials
- Complete your profile with experience level and preferences

### 2. Select Topic and Difficulty
- Choose from 7 technical topics
- Select difficulty level (Easy, Medium, Hard)

### 3. Practice Interviews
- Answer AI-generated questions
- Receive detailed feedback and scoring
- Track your time and performance

### 4. Review Analytics
- View comprehensive performance metrics
- Analyze strengths and weaknesses
- Get personalized recommendations

### 5. Track Progress
- Monitor improvement over time
- Review bookmarked questions
- Compare performance across periods

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **Input Validation**: Comprehensive validation using express-validator
- **Rate Limiting**: Protection against abuse
- **CORS Configuration**: Secure cross-origin requests
- **Helmet**: Security headers protection

## 📈 Analytics Features

### Dashboard Metrics
- Total questions answered
- Average score
- Streak days
- Topic performance breakdown
- Difficulty level analysis
- Skills assessment
- Progress trends
- Personalized recommendations

### Charts and Visualizations
- Bar charts for topic performance
- Pie charts for question distribution
- Area charts for progress trends
- Progress bars for skills assessment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed description
3. Contact the development team

## 🔮 Future Enhancements

- **Video Interviews**: Record and analyze video responses
- **Peer Review**: Allow users to review each other's answers
- **Company-Specific Questions**: Questions tailored to specific companies
- **Mobile App**: Native mobile application
- **Advanced Analytics**: Machine learning insights
- **Collaborative Features**: Study groups and competitions
- **Integration**: Connect with job boards and career platforms

---

**Note**: This application is designed specifically for technical interview practice. The AI is configured to only generate and evaluate questions related to programming, computer science, and technical concepts. It will not respond to non-technical queries.

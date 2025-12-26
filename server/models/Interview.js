import mongoose from 'mongoose';

const interviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  topic: {
    type: String,
    required: true,
    enum: ['javascript', 'python', 'data-structures', 'algorithms', 'sql', 'java', 'system-design']
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Easy', 'Medium', 'Hard']
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'abandoned'],
    default: 'in-progress'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: Date,
  duration: Number, // in seconds
  totalQuestions: {
    type: Number,
    default: 0
  },
  answeredQuestions: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  sessionData: {
    currentQuestionIndex: {
      type: Number,
      default: 0
    },
    questions: [{
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
      },
      order: Number,
      timeSpent: Number,
      score: Number
    }]
  },
  notes: String,
  tags: [String]
}, {
  timestamps: true
});

// Calculate duration when interview ends
interviewSchema.methods.endInterview = function() {
  this.endTime = new Date();
  this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  this.status = 'completed';
  return this.save();
};

// Add question to session
interviewSchema.methods.addQuestion = function(questionId, order) {
  this.sessionData.questions.push({
    questionId,
    order,
    timeSpent: 0,
    score: 0
  });
  this.totalQuestions += 1;
  return this.save();
};

// Update question score
interviewSchema.methods.updateQuestionScore = function(questionId, score, timeSpent) {
  const question = this.sessionData.questions.find(q => q.questionId.toString() === questionId.toString());
  if (question) {
    question.score = score;
    question.timeSpent = timeSpent;
    this.answeredQuestions += 1;
    
    // Recalculate average score
    const totalScore = this.sessionData.questions.reduce((sum, q) => sum + q.score, 0);
    this.averageScore = totalScore / this.answeredQuestions;
  }
  return this.save();
};

// Indexes for efficient queries
interviewSchema.index({ userId: 1, createdAt: -1 });
interviewSchema.index({ topic: 1, difficulty: 1 });
interviewSchema.index({ status: 1 });

const Interview = mongoose.model('Interview', interviewSchema);

export default Interview;

import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview'
  },
  userResponse: {
    type: String,
    required: true,
    trim: true
  },
  timeSpent: {
    type: Number,
    required: true,
    min: 0
  },
  aiFeedback: {
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    strengths: [{
      type: String,
      trim: true
    }],
    improvements: [{
      type: String,
      trim: true
    }],
    detailedFeedback: {
      type: String,
      trim: true
    },
    suggestions: [{
      type: String,
      trim: true
    }],
    followUpQuestions: [{
      type: String,
      trim: true
    }]
  },
  evaluation: {
    technicalAccuracy: {
      type: Number,
      min: 0,
      max: 100
    },
    communication: {
      type: Number,
      min: 0,
      max: 100
    },
    problemSolving: {
      type: Number,
      min: 0,
      max: 100
    },
    codeQuality: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  isBookmarked: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    trim: true
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Calculate overall score from evaluation
answerSchema.methods.calculateOverallScore = function() {
  const { technicalAccuracy, communication, problemSolving, codeQuality } = this.evaluation;
  const weights = {
    technicalAccuracy: 0.4,
    communication: 0.25,
    problemSolving: 0.25,
    codeQuality: 0.1
  };
  
  return Math.round(
    (technicalAccuracy * weights.technicalAccuracy) +
    (communication * weights.communication) +
    (problemSolving * weights.problemSolving) +
    (codeQuality * weights.codeQuality)
  );
};

// Method to get answer summary
answerSchema.methods.getSummary = function() {
  return {
    id: this._id,
    questionId: this.questionId,
    score: this.aiFeedback.score,
    timeSpent: this.timeSpent,
    strengths: this.aiFeedback.strengths,
    improvements: this.aiFeedback.improvements,
    isBookmarked: this.isBookmarked,
    createdAt: this.createdAt
  };
};

// Indexes for efficient queries
answerSchema.index({ userId: 1, createdAt: -1 });
answerSchema.index({ questionId: 1 });
answerSchema.index({ interviewId: 1 });
answerSchema.index({ 'aiFeedback.score': -1 });
answerSchema.index({ isBookmarked: 1 });

const Answer = mongoose.model('Answer', answerSchema);

export default Answer;

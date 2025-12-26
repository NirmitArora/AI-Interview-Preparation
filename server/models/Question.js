import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
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
  category: {
    type: String,
    required: true,
    trim: true
  },
  generatedBy: {
    type: String,
    enum: ['AI', 'Human', 'Hybrid'],
    default: 'AI'
  },
  aiPrompt: {
    type: String,
    trim: true
  },
  expectedAnswer: {
    type: String,
    trim: true
  },
  keyPoints: [{
    type: String,
    trim: true
  }],
  hints: [{
    type: String,
    trim: true
  }],
  followUpQuestions: [{
    type: String,
    trim: true
  }],
  tags: [{
    type: String,
    trim: true
  }],
  metadata: {
    timeEstimate: Number, // in minutes
    complexity: {
      type: String,
      enum: ['Low', 'Medium', 'High']
    },
    concepts: [String],
    frameworks: [String],
    languages: [String]
  },
  stats: {
    timesAsked: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    averageTimeSpent: {
      type: Number,
      default: 0
    },
    successRate: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Update stats when question is answered
questionSchema.methods.updateStats = function(score, timeSpent) {
  this.stats.timesAsked += 1;
  
  // Update average score
  const totalScore = this.stats.averageScore * (this.stats.timesAsked - 1) + score;
  this.stats.averageScore = totalScore / this.stats.timesAsked;
  
  // Update average time spent
  const totalTime = this.stats.averageTimeSpent * (this.stats.timesAsked - 1) + timeSpent;
  this.stats.averageTimeSpent = totalTime / this.stats.timesAsked;
  
  // Update success rate (score >= 70 considered success)
  const successfulAttempts = this.stats.successRate * (this.stats.timesAsked - 1) / 100;
  const newSuccessRate = score >= 70 ? successfulAttempts + 1 : successfulAttempts;
  this.stats.successRate = (newSuccessRate / this.stats.timesAsked) * 100;
  
  return this.save();
};

// Method to get question with hints
questionSchema.methods.getWithHints = function() {
  const questionObj = this.toObject();
  return {
    id: questionObj._id,
    text: questionObj.text,
    topic: questionObj.topic,
    difficulty: questionObj.difficulty,
    category: questionObj.category,
    hints: questionObj.hints,
    timeEstimate: questionObj.metadata.timeEstimate
  };
};

// Indexes for efficient queries
questionSchema.index({ topic: 1, difficulty: 1 });
questionSchema.index({ isActive: 1 });
questionSchema.index({ 'stats.timesAsked': -1 });
questionSchema.index({ 'stats.averageScore': -1 });

const Question = mongoose.model('Question', questionSchema);

export default Question;

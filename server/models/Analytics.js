import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  overview: {
    totalQuestions: {
      type: Number,
      default: 0
    },
    totalInterviews: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    totalTimeSpent: {
      type: Number,
      default: 0 // in minutes
    },
    streakDays: {
      type: Number,
      default: 0
    }
  },
  topicPerformance: [{
    topic: {
      type: String,
      enum: ['javascript', 'python', 'data-structures', 'algorithms', 'sql', 'java', 'system-design']
    },
    questionsAnswered: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    timeSpent: {
      type: Number,
      default: 0
    },
    improvement: {
      type: Number,
      default: 0 // percentage improvement from previous period
    }
  }],
  difficultyBreakdown: {
    easy: {
      questions: {
        type: Number,
        default: 0
      },
      averageScore: {
        type: Number,
        default: 0
      }
    },
    medium: {
      questions: {
        type: Number,
        default: 0
      },
      averageScore: {
        type: Number,
        default: 0
      }
    },
    hard: {
      questions: {
        type: Number,
        default: 0
      },
      averageScore: {
        type: Number,
        default: 0
      }
    }
  },
  skillAssessment: {
    technicalAccuracy: {
      type: Number,
      default: 0
    },
    communication: {
      type: Number,
      default: 0
    },
    problemSolving: {
      type: Number,
      default: 0
    },
    codeQuality: {
      type: Number,
      default: 0
    }
  },
  trends: {
    scoreTrend: [{
      date: Date,
      score: Number
    }],
    timeTrend: [{
      date: Date,
      timeSpent: Number
    }],
    topicTrend: [{
      date: Date,
      topic: String,
      score: Number
    }]
  },
  recommendations: [{
    type: {
      type: String,
      enum: ['topic', 'difficulty', 'skill', 'practice']
    },
    title: String,
    description: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    actionItems: [String]
  }],
  goals: {
    dailyTarget: {
      type: Number,
      default: 5
    },
    weeklyTarget: {
      type: Number,
      default: 25
    },
    targetScore: {
      type: Number,
      default: 80
    },
    progress: {
      daily: {
        type: Number,
        default: 0
      },
      weekly: {
        type: Number,
        default: 0
      },
      score: {
        type: Number,
        default: 0
      }
    }
  }
}, {
  timestamps: true
});

// Method to update analytics from new answer
analyticsSchema.methods.updateFromAnswer = function(answer, question) {
  // Update overview
  this.overview.totalQuestions += 1;
  this.overview.totalTimeSpent += answer.timeSpent;
  
  // Update average score
  const totalScore = this.overview.averageScore * (this.overview.totalQuestions - 1) + answer.aiFeedback.score;
  this.overview.averageScore = totalScore / this.overview.totalQuestions;
  
  // Update topic performance
  let topicPerf = this.topicPerformance.find(tp => tp.topic === question.topic);
  if (!topicPerf) {
    topicPerf = {
      topic: question.topic,
      questionsAnswered: 0,
      averageScore: 0,
      timeSpent: 0,
      improvement: 0
    };
    this.topicPerformance.push(topicPerf);
  }
  
  topicPerf.questionsAnswered += 1;
  topicPerf.timeSpent += answer.timeSpent;
  const topicTotalScore = topicPerf.averageScore * (topicPerf.questionsAnswered - 1) + answer.aiFeedback.score;
  topicPerf.averageScore = topicTotalScore / topicPerf.questionsAnswered;
  
  // Update difficulty breakdown
  const difficulty = question.difficulty.toLowerCase();
  this.difficultyBreakdown[difficulty].questions += 1;
  const diffTotalScore = this.difficultyBreakdown[difficulty].averageScore * (this.difficultyBreakdown[difficulty].questions - 1) + answer.aiFeedback.score;
  this.difficultyBreakdown[difficulty].averageScore = diffTotalScore / this.difficultyBreakdown[difficulty].questions;
  
  // Update skill assessment
  if (answer.evaluation) {
    const { technicalAccuracy, communication, problemSolving, codeQuality } = answer.evaluation;
    this.skillAssessment.technicalAccuracy = (this.skillAssessment.technicalAccuracy + technicalAccuracy) / 2;
    this.skillAssessment.communication = (this.skillAssessment.communication + communication) / 2;
    this.skillAssessment.problemSolving = (this.skillAssessment.problemSolving + problemSolving) / 2;
    this.skillAssessment.codeQuality = (this.skillAssessment.codeQuality + codeQuality) / 2;
  }
  
  return this.save();
};

// Method to generate recommendations
analyticsSchema.methods.generateRecommendations = function() {
  const recommendations = [];
  
  // Topic-based recommendations
  this.topicPerformance.forEach(topic => {
    if (topic.averageScore < 70) {
      recommendations.push({
        type: 'topic',
        title: `Improve ${topic.topic} skills`,
        description: `Your average score in ${topic.topic} is ${topic.averageScore.toFixed(1)}%. Focus on this area to improve your overall performance.`,
        priority: topic.averageScore < 50 ? 'high' : 'medium',
        actionItems: [
          `Practice more ${topic.topic} questions`,
          'Review fundamental concepts',
          'Study common patterns and solutions'
        ]
      });
    }
  });
  
  // Difficulty-based recommendations
  if (this.difficultyBreakdown.hard.averageScore < 60) {
    recommendations.push({
      type: 'difficulty',
      title: 'Build confidence with hard questions',
      description: 'You\'re struggling with hard questions. Consider practicing more medium-level questions first.',
      priority: 'medium',
      actionItems: [
        'Focus on medium difficulty questions',
        'Review advanced concepts',
        'Practice time management'
      ]
    });
  }
  
  // Skill-based recommendations
  Object.entries(this.skillAssessment).forEach(([skill, score]) => {
    if (score < 70) {
      recommendations.push({
        type: 'skill',
        title: `Improve ${skill.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
        description: `Your ${skill.replace(/([A-Z])/g, ' $1').toLowerCase()} score is ${score.toFixed(1)}%.`,
        priority: score < 50 ? 'high' : 'medium',
        actionItems: [
          'Practice explaining solutions clearly',
          'Focus on code quality and best practices',
          'Work on systematic problem-solving approaches'
        ]
      });
    }
  });
  
  this.recommendations = recommendations;
  return this.save();
};

// Indexes for efficient queries
analyticsSchema.index({ userId: 1, period: 1, date: 1 });
analyticsSchema.index({ userId: 1, date: -1 });

const Analytics = mongoose.model('Analytics', analyticsSchema);

export default Analytics;

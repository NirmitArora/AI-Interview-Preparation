import express from 'express';
import Answer from '../models/Answer.js';
import Interview from '../models/Interview.js';
import User from '../models/User.js';
import Analytics from '../models/Analytics.js';
import aiService from '../services/aiService.js';
import authenticateToken from '../middleware/authBypass.js';

const router = express.Router();

// Get user dashboard overview
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user stats
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentAnswers = await Answer.find({
      userId,
      createdAt: { $gte: sevenDaysAgo }
    }).populate('questionId');

    const recentInterviews = await Interview.find({
      userId,
      createdAt: { $gte: sevenDaysAgo }
    });

    // Calculate streak
    const streak = await calculateStreak(userId);

    // Get topic performance
    const topicPerformance = await getTopicPerformance(userId);

    // Get difficulty breakdown
    const difficultyBreakdown = await getDifficultyBreakdown(userId);

    // Get recent trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTrends = await Answer.aggregate([
      { $match: { userId, createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          avgScore: { $avg: "$aiFeedback.score" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get skill assessment
    const skillAssessment = await getSkillAssessment(userId);

    // Generate recommendations
    const recommendations = await generateRecommendations(userId);

    res.json({
      overview: {
        totalQuestions: user.stats.totalQuestions,
        totalInterviews: user.stats.totalInterviews,
        averageScore: user.stats.averageScore,
        streakDays: streak,
        lastPracticeDate: user.stats.lastPracticeDate
      },
      recentActivity: {
        answers: recentAnswers.length,
        interviews: recentInterviews.length,
        averageScore: recentAnswers.length > 0 
          ? recentAnswers.reduce((sum, answer) => sum + answer.aiFeedback.score, 0) / recentAnswers.length 
          : 0
      },
      topicPerformance,
      difficultyBreakdown,
      trends: recentTrends,
      skillAssessment,
      recommendations
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// Get detailed analytics for a specific period
router.get('/detailed', authenticateToken, async (req, res) => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;
    const userId = req.user._id;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    } else {
      // Default to last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter = { createdAt: { $gte: thirtyDaysAgo } };
    }

    // Get answers for the period
    const answers = await Answer.find({ userId, ...dateFilter })
      .populate('questionId')
      .populate('interviewId');

    // Get interviews for the period
    const interviews = await Interview.find({ userId, ...dateFilter });

    // Calculate detailed statistics
    const stats = calculateDetailedStats(answers, interviews);

    // Get topic-wise breakdown
    const topicBreakdown = await getDetailedTopicBreakdown(userId, dateFilter);

    // Get time-based trends
    const timeTrends = await getTimeTrends(userId, dateFilter);

    // Get performance by difficulty
    const difficultyPerformance = await getDifficultyPerformance(userId, dateFilter);

    res.json({
      period,
      dateRange: {
        start: dateFilter.createdAt?.$gte || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: dateFilter.createdAt?.$lte || new Date()
      },
      statistics: stats,
      topicBreakdown,
      timeTrends,
      difficultyPerformance
    });
  } catch (error) {
    console.error('Get detailed analytics error:', error);
    res.status(500).json({ error: 'Failed to get detailed analytics' });
  }
});

// Get topic-specific analytics
router.get('/topic/:topic', authenticateToken, async (req, res) => {
  try {
    const { topic } = req.params;
    const { period = 'all' } = req.query;
    const userId = req.user._id;

    let dateFilter = {};
    if (period !== 'all') {
      const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      dateFilter = { createdAt: { $gte: startDate } };
    }

    // Get answers for the specific topic
    const answers = await Answer.find({
      userId,
      ...dateFilter
    }).populate({
      path: 'questionId',
      match: { topic }
    }).then(answers => answers.filter(answer => answer.questionId));

    // Get interviews for the topic
    const interviews = await Interview.find({
      userId,
      topic,
      ...dateFilter
    });

    // Calculate topic-specific statistics
    const stats = calculateTopicStats(answers, interviews);

    // Get question categories within the topic
    const categories = await Answer.aggregate([
      { $match: { userId, ...dateFilter } },
      { $lookup: { from: 'questions', localField: 'questionId', foreignField: '_id', as: 'question' } },
      { $unwind: '$question' },
      { $match: { 'question.topic': topic } },
      {
        $group: {
          _id: '$question.category',
          avgScore: { $avg: '$aiFeedback.score' },
          count: { $sum: 1 },
          avgTimeSpent: { $avg: '$timeSpent' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get performance trends over time
    const trends = await Answer.aggregate([
      { $match: { userId, ...dateFilter } },
      { $lookup: { from: 'questions', localField: 'questionId', foreignField: '_id', as: 'question' } },
      { $unwind: '$question' },
      { $match: { 'question.topic': topic } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          avgScore: { $avg: '$aiFeedback.score' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      topic,
      period,
      statistics: stats,
      categories,
      trends
    });
  } catch (error) {
    console.error('Get topic analytics error:', error);
    res.status(500).json({ error: 'Failed to get topic analytics' });
  }
});

// Get performance comparison
router.get('/comparison', authenticateToken, async (req, res) => {
  try {
    const { period1, period2 } = req.query;
    const userId = req.user._id;

    // Get data for both periods
    const period1Data = await getPeriodData(userId, period1);
    const period2Data = await getPeriodData(userId, period2);

    // Calculate improvements
    const improvements = calculateImprovements(period1Data, period2Data);

    res.json({
      period1: { name: period1, data: period1Data },
      period2: { name: period2, data: period2Data },
      improvements
    });
  } catch (error) {
    console.error('Get comparison error:', error);
    res.status(500).json({ error: 'Failed to get comparison data' });
  }
});

// Get personalized recommendations
router.get('/recommendations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const recommendations = await generateRecommendations(userId);
    
    res.json({ recommendations });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// Helper functions

async function calculateStreak(userId) {
  const answers = await Answer.find({ userId })
    .sort({ createdAt: -1 })
    .limit(100);

  if (answers.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const dayStart = new Date(currentDate);
    dayStart.setDate(dayStart.getDate() - i);
    
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const hasAnswer = answers.some(answer => 
      answer.createdAt >= dayStart && answer.createdAt < dayEnd
    );

    if (hasAnswer) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

async function getTopicPerformance(userId) {
  const topicStats = await Answer.aggregate([
    { $match: { userId } },
    { $lookup: { from: 'questions', localField: 'questionId', foreignField: '_id', as: 'question' } },
    { $unwind: '$question' },
    {
      $group: {
        _id: '$question.topic',
        avgScore: { $avg: '$aiFeedback.score' },
        count: { $sum: 1 },
        totalTimeSpent: { $sum: '$timeSpent' }
      }
    },
    { $sort: { count: -1 } }
  ]);

  return topicStats;
}

async function getDifficultyBreakdown(userId) {
  const difficultyStats = await Answer.aggregate([
    { $match: { userId } },
    { $lookup: { from: 'questions', localField: 'questionId', foreignField: '_id', as: 'question' } },
    { $unwind: '$question' },
    {
      $group: {
        _id: '$question.difficulty',
        avgScore: { $avg: '$aiFeedback.score' },
        count: { $sum: 1 }
      }
    }
  ]);

  return difficultyStats;
}

async function getSkillAssessment(userId) {
  const skills = await Answer.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: null,
        avgTechnicalAccuracy: { $avg: '$evaluation.technicalAccuracy' },
        avgCommunication: { $avg: '$evaluation.communication' },
        avgProblemSolving: { $avg: '$evaluation.problemSolving' },
        avgCodeQuality: { $avg: '$evaluation.codeQuality' }
      }
    }
  ]);

  return skills[0] || {
    avgTechnicalAccuracy: 0,
    avgCommunication: 0,
    avgProblemSolving: 0,
    avgCodeQuality: 0
  };
}

async function generateRecommendations(userId) {
  try {
    // Get user analytics data
    const user = await User.findById(userId);
    const topicPerformance = await getTopicPerformance(userId);
    const skillAssessment = await getSkillAssessment(userId);

    const analyticsData = {
      user: user.toPublicJSON(),
      topicPerformance,
      skillAssessment
    };

    // Generate AI recommendations
    const aiRecommendations = await aiService.generateRecommendations(analyticsData);

    // Parse and structure recommendations
    const recommendations = parseRecommendations(aiRecommendations);

    return recommendations;
  } catch (error) {
    console.error('Error generating recommendations:', error);
    // Return default recommendations
    return [
      {
        type: 'practice',
        title: 'Practice Regularly',
        description: 'Consistent practice is key to improving your interview skills.',
        priority: 'high',
        actionItems: ['Set daily practice goals', 'Review previous answers', 'Focus on weak areas']
      }
    ];
  }
}

function parseRecommendations(aiText) {
  // Simple parsing of AI recommendations
  const recommendations = [];
  const lines = aiText.split('\n');
  
  let currentRec = null;
  
  for (const line of lines) {
    if (line.includes('Recommendation') || line.includes('Suggestion')) {
      if (currentRec) recommendations.push(currentRec);
      currentRec = {
        type: 'practice',
        title: line.replace(/^\d+\.\s*/, '').trim(),
        description: '',
        priority: 'medium',
        actionItems: []
      };
    } else if (currentRec && line.trim()) {
      if (!currentRec.description) {
        currentRec.description = line.trim();
      } else {
        currentRec.actionItems.push(line.replace(/^[-•]\s*/, '').trim());
      }
    }
  }
  
  if (currentRec) recommendations.push(currentRec);
  
  return recommendations.length > 0 ? recommendations : [
    {
      type: 'practice',
      title: 'Continue Practicing',
      description: 'Keep up the good work and maintain consistent practice.',
      priority: 'medium',
      actionItems: ['Practice daily', 'Review feedback', 'Track progress']
    }
  ];
}

function calculateDetailedStats(answers, interviews) {
  const totalQuestions = answers.length;
  const totalInterviews = interviews.length;
  const averageScore = totalQuestions > 0 
    ? answers.reduce((sum, answer) => sum + answer.aiFeedback.score, 0) / totalQuestions 
    : 0;
  const totalTimeSpent = answers.reduce((sum, answer) => sum + answer.timeSpent, 0);
  const averageTimePerQuestion = totalQuestions > 0 ? totalTimeSpent / totalQuestions : 0;

  return {
    totalQuestions,
    totalInterviews,
    averageScore: Math.round(averageScore * 100) / 100,
    totalTimeSpent,
    averageTimePerQuestion: Math.round(averageTimePerQuestion)
  };
}

async function getDetailedTopicBreakdown(userId, dateFilter) {
  return await Answer.aggregate([
    { $match: { userId, ...dateFilter } },
    { $lookup: { from: 'questions', localField: 'questionId', foreignField: '_id', as: 'question' } },
    { $unwind: '$question' },
    {
      $group: {
        _id: '$question.topic',
        avgScore: { $avg: '$aiFeedback.score' },
        count: { $sum: 1 },
        totalTimeSpent: { $sum: '$timeSpent' },
        categories: { $addToSet: '$question.category' }
      }
    },
    { $sort: { count: -1 } }
  ]);
}

async function getTimeTrends(userId, dateFilter) {
  return await Answer.aggregate([
    { $match: { userId, ...dateFilter } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        avgScore: { $avg: '$aiFeedback.score' },
        count: { $sum: 1 },
        totalTimeSpent: { $sum: '$timeSpent' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
}

async function getDifficultyPerformance(userId, dateFilter) {
  return await Answer.aggregate([
    { $match: { userId, ...dateFilter } },
    { $lookup: { from: 'questions', localField: 'questionId', foreignField: '_id', as: 'question' } },
    { $unwind: '$question' },
    {
      $group: {
        _id: '$question.difficulty',
        avgScore: { $avg: '$aiFeedback.score' },
        count: { $sum: 1 },
        avgTimeSpent: { $avg: '$timeSpent' }
      }
    }
  ]);
}

function calculateTopicStats(answers, interviews) {
  const totalQuestions = answers.length;
  const totalInterviews = interviews.length;
  const averageScore = totalQuestions > 0 
    ? answers.reduce((sum, answer) => sum + answer.aiFeedback.score, 0) / totalQuestions 
    : 0;
  const totalTimeSpent = answers.reduce((sum, answer) => sum + answer.timeSpent, 0);

  return {
    totalQuestions,
    totalInterviews,
    averageScore: Math.round(averageScore * 100) / 100,
    totalTimeSpent,
    averageTimePerQuestion: totalQuestions > 0 ? Math.round(totalTimeSpent / totalQuestions) : 0
  };
}

async function getPeriodData(userId, period) {
  const startDate = new Date();
  const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
  startDate.setDate(startDate.getDate() - days);

  const answers = await Answer.find({
    userId,
    createdAt: { $gte: startDate }
  }).populate('questionId');

  return calculateDetailedStats(answers, []);
}

function calculateImprovements(period1Data, period2Data) {
  const improvements = {};
  
  for (const key in period1Data) {
    if (typeof period1Data[key] === 'number' && period2Data[key] !== undefined) {
      const change = period2Data[key] - period1Data[key];
      const percentage = period1Data[key] > 0 ? (change / period1Data[key]) * 100 : 0;
      
      improvements[key] = {
        change,
        percentage: Math.round(percentage * 100) / 100,
        improved: change > 0
      };
    }
  }
  
  return improvements;
}

export default router;

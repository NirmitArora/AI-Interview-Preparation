import express from 'express';
import { body, validationResult } from 'express-validator';
import Interview from '../models/Interview.js';
import Question from '../models/Question.js';
import Answer from '../models/Answer.js';
import User from '../models/User.js';
import aiService from '../services/aiService.js';
import authenticateToken from '../middleware/authBypass.js';

const router = express.Router();

// Start a new interview session
router.post('/start', authenticateToken, [
  body('topic').isIn(['javascript', 'python', 'data-structures', 'algorithms', 'sql', 'java', 'system-design']).withMessage('Invalid topic'),
  body('difficulty').isIn(['Easy', 'Medium', 'Hard']).withMessage('Invalid difficulty level')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { topic, difficulty } = req.body;

    // Create new interview session
    const interview = new Interview({
      userId: req.user._id,
      topic,
      difficulty,
      status: 'in-progress'
    });

    await interview.save();

    // Update user stats (if user exists in database)
    try {
      const user = await User.findById(req.user._id);
      if (user) {
        if (!user.stats) {
          user.stats = {
            totalInterviews: 0,
            totalQuestions: 0,
            averageScore: 0,
            streakDays: 0
          };
        }
        user.stats.totalInterviews += 1;
        user.stats.lastPracticeDate = new Date();
        await user.save();
      }
    } catch (userError) {
      console.error('Error updating user stats:', userError);
      // Continue even if user update fails
    }

    res.status(201).json({
      message: 'Interview session started',
      interview: {
        id: interview._id.toString(),
        topic: interview.topic,
        difficulty: interview.difficulty,
        startTime: interview.startTime,
        status: interview.status,
        totalQuestions: interview.totalQuestions || 0,
        answeredQuestions: interview.answeredQuestions || 0,
        averageScore: interview.averageScore || 0
      }
    });
  } catch (error) {
    console.error('Start interview error:', error);
    res.status(500).json({ error: 'Failed to start interview session' });
  }
});

// Get next question for interview session
router.get('/:interviewId/question', authenticateToken, async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { difficulty } = req.query;

    // Find interview session
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ error: 'Interview session not found' });
    }

    // Check if user owns this interview (skip in bypass mode for development)
    const userIdMatches = interview.userId.toString() === req.user._id.toString();
    if (!userIdMatches) {
      console.log('⚠️ User ID mismatch - Interview owner:', interview.userId.toString(), 'Request user:', req.user._id.toString());
      // In development with bypass, update the interview's userId to match current user
      interview.userId = req.user._id;
      await interview.save();
      console.log('✅ Updated interview ownership for bypass mode');
    }

    // Generate question - try AI first, then fallback to samples
    let question;
    const questionDifficulty = difficulty || interview.difficulty;
    
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'interviews.js:102',message:'Before generateQuestion call',data:{topic:interview.topic,difficulty:questionDifficulty,interviewId:interview._id.toString()},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B,C,D'})}).catch(()=>{});
      // #endregion
      
      console.log(`🤖 Generating new ${questionDifficulty} question for ${interview.topic}...`);
      const aiQuestion = await aiService.generateQuestion(
        interview.topic,
        questionDifficulty
      );
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'interviews.js:107',message:'generateQuestion succeeded',data:{questionTextLength:aiQuestion.text?.length||0,hasTopic:!!aiQuestion.topic},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B,C,D'})}).catch(()=>{});
      // #endregion

      // Save AI-generated question to database
      question = new Question({
        text: aiQuestion.text,
        topic: aiQuestion.topic || interview.topic,
        difficulty: aiQuestion.difficulty || questionDifficulty,
        category: aiQuestion.category || interview.topic,
        keyPoints: aiQuestion.keyConcepts || [],
        expectedAnswer: aiQuestion.expectedApproach || '',
        metadata: {
          timeEstimate: aiQuestion.timeEstimate || 10,
          complexity: questionDifficulty === 'Easy' ? 'Low' : questionDifficulty === 'Medium' ? 'Medium' : 'High'
        }
      });

      await question.save();
      console.log('✅ AI question generated and saved successfully');
    } catch (aiError) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'interviews.js:125',message:'generateQuestion failed in route handler',data:{errorMessage:aiError.message,errorName:aiError.name,errorCode:aiError.code||aiError.status},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,B,C,D'})}).catch(()=>{});
      // #endregion
      
      console.error('❌ AI question generation failed:', aiError.message);
      
      // Use the specific error message from AI service (which now distinguishes quota, API key, etc.)
      const errorMessage = aiError.message || 'AI service unavailable';
      const isQuotaError = errorMessage.includes('quota') || errorMessage.includes('429');
      const statusCode = isQuotaError ? 429 : 503;
      
      return res.status(statusCode).json({ 
        error: errorMessage,
        details: aiError.message
      });
    }

    // Add question to interview session
    await interview.addQuestion(question._id, interview.sessionData.questions.length);

    res.json({
      question: {
        id: question._id.toString(),
        text: question.text,
        topic: question.topic || question.category || interview.topic,
        difficulty: question.difficulty,
        category: question.category || question.topic || interview.topic,
        hints: question.hints || [],
        timeEstimate: question.metadata?.timeEstimate || 10
      },
      interviewId: interview._id,
      questionIndex: interview.sessionData.questions.length - 1
    });
  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({ error: 'Failed to get question' });
  }
});

// Submit answer for a question
router.post('/:interviewId/answer', authenticateToken, [
  body('questionId').isMongoId().withMessage('Invalid question ID'),
  body('answer').notEmpty().withMessage('Answer is required'),
  body('timeSpent').isInt({ min: 0 }).withMessage('Time spent must be a positive number')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('❌ Validation errors:', errors.array());
      console.error('Request body:', req.body);
      return res.status(400).json({ 
        error: 'Validation failed',
        errors: errors.array(),
        received: {
          questionId: req.body.questionId,
          answerLength: req.body.answer?.length,
          timeSpent: req.body.timeSpent,
          timeSpentType: typeof req.body.timeSpent
        }
      });
    }

    const { interviewId } = req.params;
    const { questionId, answer, timeSpent } = req.body;
    
    console.log('📥 Received answer submission:', {
      interviewId,
      questionId,
      answerLength: answer?.length,
      timeSpent,
      timeSpentType: typeof timeSpent
    });

    // Find interview session
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ error: 'Interview session not found' });
    }

    // Check if user owns this interview
    if (interview.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Find question
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Generate AI feedback
    let aiFeedback;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'interviews.js:284',message:'Starting AI evaluation',data:{userAnswer:answer,answerLength:answer?.length,questionText:question?.text?.substring(0,50)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,D'})}).catch(()=>{});
    // #endregion
    try {
      aiFeedback = await aiService.evaluateAnswer(question, answer, timeSpent);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'interviews.js:290',message:'AI evaluation SUCCESS',data:{score:aiFeedback?.score,strengths:aiFeedback?.strengths,source:'gemini-ai'},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
    } catch (aiError) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'interviews.js:277',message:'AI evaluation FAILED',data:{error:aiError?.message,errorName:aiError?.name},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      console.error('❌ AI evaluation failed:', aiError);
      
      // Use the specific error message from AI service (which now distinguishes quota, API key, etc.)
      const errorMessage = aiError.message || 'AI evaluation unavailable';
      const isQuotaError = errorMessage.includes('quota') || errorMessage.includes('429');
      const statusCode = isQuotaError ? 429 : 503;
      
      return res.status(statusCode).json({ 
        error: errorMessage,
        details: aiError.message
      });
    }

    // Create answer record
    const answerRecord = new Answer({
      userId: req.user._id,
      questionId,
      interviewId,
      userResponse: answer,
      timeSpent,
      aiFeedback,
      evaluation: aiFeedback.evaluation
    });

    await answerRecord.save();

    // Update question stats
    await question.updateStats(aiFeedback.score, timeSpent);

    // Update interview session
    await interview.updateQuestionScore(questionId, aiFeedback.score, timeSpent);

    // Update user stats
    const user = await User.findById(req.user._id);
    user.stats.totalQuestions += 1;
    
    // Update average score
    const totalScore = user.stats.averageScore * (user.stats.totalQuestions - 1) + aiFeedback.score;
    user.stats.averageScore = totalScore / user.stats.totalQuestions;
    
    await user.save();

    res.json({
      message: 'Answer submitted successfully',
      feedback: {
        score: aiFeedback.score,
        strengths: aiFeedback.strengths,
        improvements: aiFeedback.improvements,
        detailedFeedback: aiFeedback.detailedFeedback,
        suggestions: aiFeedback.suggestions,
        evaluation: aiFeedback.evaluation,
        followUpQuestions: aiFeedback.followUpQuestions
      },
      answerId: answerRecord._id
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
});

// End interview session
router.put('/:interviewId/end', authenticateToken, async (req, res) => {
  try {
    const { interviewId } = req.params;

    // Find interview session
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ error: 'Interview session not found' });
    }

    // Check if user owns this interview
    if (interview.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // End interview
    await interview.endInterview();

    res.json({
      message: 'Interview session ended',
      interview: {
        id: interview._id,
        topic: interview.topic,
        difficulty: interview.difficulty,
        duration: interview.duration,
        totalQuestions: interview.totalQuestions,
        answeredQuestions: interview.answeredQuestions,
        averageScore: interview.averageScore,
        status: interview.status
      }
    });
  } catch (error) {
    console.error('End interview error:', error);
    res.status(500).json({ error: 'Failed to end interview session' });
  }
});

// Get interview session details
router.get('/:interviewId', authenticateToken, async (req, res) => {
  try {
    const { interviewId } = req.params;

    // Find interview session with populated questions
    const interview = await Interview.findById(interviewId)
      .populate('sessionData.questions.questionId');

    if (!interview) {
      return res.status(404).json({ error: 'Interview session not found' });
    }

    // Check if user owns this interview
    if (interview.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ interview });
  } catch (error) {
    console.error('Get interview error:', error);
    res.status(500).json({ error: 'Failed to get interview session' });
  }
});

// Get user's interview history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, topic, difficulty, status } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = { userId: req.user._id };
    if (topic) query.topic = topic;
    if (difficulty) query.difficulty = difficulty;
    if (status) query.status = status;

    // Get interviews with pagination
    const interviews = await Interview.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-sessionData');

    // Get total count
    const total = await Interview.countDocuments(query);

    res.json({
      interviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get interview history error:', error);
    res.status(500).json({ error: 'Failed to get interview history' });
  }
});

// Get answer details
router.get('/answer/:answerId', authenticateToken, async (req, res) => {
  try {
    const { answerId } = req.params;

    const answer = await Answer.findById(answerId)
      .populate('questionId')
      .populate('interviewId');

    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    // Check if user owns this answer
    if (answer.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ answer });
  } catch (error) {
    console.error('Get answer error:', error);
    res.status(500).json({ error: 'Failed to get answer' });
  }
});

// Bookmark/unbookmark an answer
router.put('/answer/:answerId/bookmark', authenticateToken, async (req, res) => {
  try {
    const { answerId } = req.params;

    const answer = await Answer.findById(answerId);
    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    // Check if user owns this answer
    if (answer.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Toggle bookmark status
    answer.isBookmarked = !answer.isBookmarked;
    await answer.save();

    res.json({
      message: answer.isBookmarked ? 'Answer bookmarked' : 'Answer unbookmarked',
      isBookmarked: answer.isBookmarked
    });
  } catch (error) {
    console.error('Bookmark answer error:', error);
    res.status(500).json({ error: 'Failed to update bookmark status' });
  }
});

// Get bookmarked answers
router.get('/bookmarks', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const answers = await Answer.find({ 
      userId: req.user._id, 
      isBookmarked: true 
    })
      .populate('questionId')
      .populate('interviewId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Answer.countDocuments({ 
      userId: req.user._id, 
      isBookmarked: true 
    });

    res.json({
      answers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({ error: 'Failed to get bookmarked answers' });
  }
});

export default router;

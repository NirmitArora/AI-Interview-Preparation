import express from 'express';
import { body, validationResult } from 'express-validator';
import aiService from '../services/aiService.js';
import Question from '../models/Question.js';
import authenticateToken from '../middleware/authBypass.js';

const router = express.Router();

// Generate a new question
router.post('/generate-question', authenticateToken, [
  body('topic').isIn(['javascript', 'python', 'data-structures', 'algorithms', 'sql', 'java', 'system-design']).withMessage('Invalid topic'),
  body('difficulty').isIn(['Easy', 'Medium', 'Hard']).withMessage('Invalid difficulty level'),
  body('context').optional().isString().withMessage('Context must be a string')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { topic, difficulty, context } = req.body;

    // Generate question using AI
    const aiQuestion = await aiService.generateQuestion(topic, difficulty, context);

    // Save question to database
    const question = new Question({
      text: aiQuestion.text,
      topic: aiQuestion.topic,
      difficulty: aiQuestion.difficulty,
      category: aiQuestion.category,
      keyPoints: aiQuestion.keyConcepts,
      expectedAnswer: aiQuestion.expectedApproach,
      aiPrompt: `Generate ${difficulty} level question for ${topic}${context ? ` with context: ${context}` : ''}`,
      metadata: {
        timeEstimate: aiQuestion.timeEstimate,
        complexity: aiQuestion.difficulty === 'Easy' ? 'Low' : aiQuestion.difficulty === 'Medium' ? 'Medium' : 'High'
      }
    });

    await question.save();

    res.json({
      message: 'Question generated successfully',
      question: {
        id: question._id,
        text: question.text,
        topic: question.topic,
        difficulty: question.difficulty,
        category: question.category,
        keyPoints: question.keyPoints,
        timeEstimate: question.metadata.timeEstimate
      }
    });
  } catch (error) {
    console.error('Generate question error:', error);
    res.status(500).json({ error: 'Failed to generate question' });
  }
});

// Evaluate an answer without saving to database
router.post('/evaluate-answer', authenticateToken, [
  body('question').isObject().withMessage('Question object is required'),
  body('answer').notEmpty().withMessage('Answer is required'),
  body('timeSpent').isInt({ min: 0 }).withMessage('Time spent must be a positive number')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { question, answer, timeSpent } = req.body;

    // Evaluate answer using AI
    const feedback = await aiService.evaluateAnswer(question, answer, timeSpent);

    res.json({
      message: 'Answer evaluated successfully',
      feedback
    });
  } catch (error) {
    console.error('Evaluate answer error:', error);
    res.status(500).json({ error: 'Failed to evaluate answer' });
  }
});

// Generate follow-up questions
router.post('/follow-up-questions', authenticateToken, [
  body('originalQuestion').isObject().withMessage('Original question object is required'),
  body('userAnswer').notEmpty().withMessage('User answer is required'),
  body('topic').isIn(['javascript', 'python', 'data-structures', 'algorithms', 'sql', 'java', 'system-design']).withMessage('Invalid topic')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { originalQuestion, userAnswer, topic } = req.body;

    // Generate follow-up questions using AI
    const followUpQuestions = await aiService.generateFollowUpQuestions(originalQuestion, userAnswer, topic);

    res.json({
      message: 'Follow-up questions generated successfully',
      followUpQuestions
    });
  } catch (error) {
    console.error('Generate follow-up questions error:', error);
    res.status(500).json({ error: 'Failed to generate follow-up questions' });
  }
});

// Get AI-generated study recommendations
router.post('/study-recommendations', authenticateToken, [
  body('userData').isObject().withMessage('User data object is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userData } = req.body;

    // Generate personalized recommendations using AI
    const recommendations = await aiService.generateRecommendations(userData);

    res.json({
      message: 'Recommendations generated successfully',
      recommendations
    });
  } catch (error) {
    console.error('Generate recommendations error:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// Get question hints
router.get('/question/:questionId/hints', authenticateToken, async (req, res) => {
  try {
    const { questionId } = req.params;

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // If question has hints, return them
    if (question.hints && question.hints.length > 0) {
      return res.json({
        hints: question.hints
      });
    }

    // Generate hints using AI if none exist
    try {
      const aiHints = await generateHintsForQuestion(question);
      
      // Save hints to question
      question.hints = aiHints;
      await question.save();

      res.json({
        hints: aiHints
      });
    } catch (aiError) {
      console.error('AI hint generation failed:', aiError);
      res.json({
        hints: ['Think about the core concepts involved', 'Consider different approaches to solve this']
      });
    }
  } catch (error) {
    console.error('Get hints error:', error);
    res.status(500).json({ error: 'Failed to get hints' });
  }
});

// Generate practice questions for a specific concept
router.post('/practice-questions', authenticateToken, [
  body('concept').notEmpty().withMessage('Concept is required'),
  body('topic').isIn(['javascript', 'python', 'data-structures', 'algorithms', 'sql', 'java', 'system-design']).withMessage('Invalid topic'),
  body('difficulty').isIn(['Easy', 'Medium', 'Hard']).withMessage('Invalid difficulty level'),
  body('count').optional().isInt({ min: 1, max: 10 }).withMessage('Count must be between 1 and 10')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { concept, topic, difficulty, count = 3 } = req.body;

    const questions = [];
    
    // Generate multiple questions
    for (let i = 0; i < count; i++) {
      try {
        const context = `Focus specifically on the concept of: ${concept}`;
        const aiQuestion = await aiService.generateQuestion(topic, difficulty, context);
        
        // Save question to database
        const question = new Question({
          text: aiQuestion.text,
          topic: aiQuestion.topic,
          difficulty: aiQuestion.difficulty,
          category: aiQuestion.category,
          keyPoints: aiQuestion.keyConcepts,
          expectedAnswer: aiQuestion.expectedApproach,
          aiPrompt: `Generate ${difficulty} level question for ${topic} focusing on ${concept}`,
          metadata: {
            timeEstimate: aiQuestion.timeEstimate,
            complexity: aiQuestion.difficulty === 'Easy' ? 'Low' : aiQuestion.difficulty === 'Medium' ? 'Medium' : 'High'
          }
        });

        await question.save();
        
        questions.push({
          id: question._id,
          text: question.text,
          topic: question.topic,
          difficulty: question.difficulty,
          category: question.category,
          timeEstimate: question.metadata.timeEstimate
        });
      } catch (error) {
        console.error(`Failed to generate question ${i + 1}:`, error);
      }
    }

    res.json({
      message: `${questions.length} practice questions generated successfully`,
      questions
    });
  } catch (error) {
    console.error('Generate practice questions error:', error);
    res.status(500).json({ error: 'Failed to generate practice questions' });
  }
});

// Get AI explanation for a concept
router.post('/explain-concept', authenticateToken, [
  body('concept').notEmpty().withMessage('Concept is required'),
  body('topic').isIn(['javascript', 'python', 'data-structures', 'algorithms', 'sql', 'java', 'system-design']).withMessage('Invalid topic'),
  body('level').optional().isIn(['Beginner', 'Intermediate', 'Advanced']).withMessage('Invalid level')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { concept, topic, level = 'Intermediate' } = req.body;

    // Generate explanation using AI
    const explanation = await generateConceptExplanation(concept, topic, level);

    res.json({
      message: 'Explanation generated successfully',
      explanation
    });
  } catch (error) {
    console.error('Generate explanation error:', error);
    res.status(500).json({ error: 'Failed to generate explanation' });
  }
});

// Helper functions

async function generateHintsForQuestion(question) {
  const prompt = `Generate 2-3 helpful hints for the following interview question. The hints should guide the candidate without giving away the complete answer.

Question: ${question.text}
Topic: ${question.topic}
Difficulty: ${question.difficulty}

Provide hints that:
1. Point to relevant concepts or approaches
2. Suggest a direction to think about the problem
3. Mention important considerations

Format as a simple list.`;

  try {
    const result = await aiService.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse hints from response
    const hints = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && (line.startsWith('-') || line.startsWith('•') || line.match(/^\d+\./)))
      .map(line => line.replace(/^[-•\d\.]\s*/, ''))
      .filter(line => line.length > 10);

    return hints.slice(0, 3);
  } catch (error) {
    console.error('Error generating hints:', error);
    return [
      'Think about the core concepts involved',
      'Consider different approaches to solve this',
      'Break down the problem into smaller parts'
    ];
  }
}

async function generateConceptExplanation(concept, topic, level) {
  const prompt = `Provide a comprehensive explanation of the concept "${concept}" in the context of ${topic} programming, suitable for a ${level.toLowerCase()} level developer.

Include:
1. Definition and core principles
2. Practical examples
3. Common use cases
4. Best practices
5. Potential pitfalls to avoid

Make the explanation clear, practical, and interview-ready.`;

  try {
    const result = await aiService.model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating explanation:', error);
    throw new Error('Failed to generate explanation');
  }
}

export default router;

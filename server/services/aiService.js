import { GoogleGenerativeAI } from '@google/generative-ai';

// Lazy initialization - will be set when first API call is made
let genAI = null;
let model = null;

// Initialize AI service lazily (after dotenv has loaded)
const initializeAI = () => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:8',message:'initializeAI called',data:{modelAlreadyInitialized:!!model},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,E'})}).catch(()=>{});
  // #endregion
  
  if (model) return model; // Already initialized
  
  const apiKey = process.env.GEMINI_API_KEY;
  // Use gemini-2.0-flash as default (recommended for Dec 2025, fastest/cheapest)
  // User can override with GEMINI_MODEL env var
  const userModel = process.env.GEMINI_MODEL;
  const modelName = userModel || 'gemini-2.0-flash';
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:11',message:'Before API key check',data:{apiKeyPresent:!!apiKey,apiKeyLength:apiKey?.length||0,apiKeyPrefix:apiKey?.substring(0,10)||'N/A',apiKeySuffix:apiKey?.substring(apiKey?.length-4)||'N/A',modelName,allEnvKeys:Object.keys(process.env).filter(k=>k.includes('GEMINI')).join(',')},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,B,E'})}).catch(()=>{});
  // #endregion
  
  console.log(`🤖 AI Service initializing with model: ${modelName}`);
  console.log(`🔑 API Key status: ${apiKey ? `Found (${apiKey.length} chars, starts with ${apiKey.substring(0, 8)}...)` : '❌ NOT FOUND'}`);
  
  if (!apiKey) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:18',message:'API key missing error',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    throw new Error('GEMINI_API_KEY not found in environment variables. Please check your .env file.');
  }
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:22',message:'Creating GoogleGenerativeAI instance',data:{apiKeyLength:apiKey.length,modelName},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B,C'})}).catch(()=>{});
  // #endregion
  
  genAI = new GoogleGenerativeAI(apiKey);
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:23',message:'Getting generative model',data:{modelName},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  
  model = genAI.getGenerativeModel({ 
    model: modelName,
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 2048,
    }
  });
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:33',message:'Model initialized successfully',data:{modelName},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  
  console.log(`✅ AI Service ready!`);
  return model;
};

class AIService {
  constructor() {
    const userModel = process.env.GEMINI_MODEL;
    // Use gemini-2.5-flash as default - it has the highest free tier quota (20 requests/day)
    // Other models show "limit: 0" on free tier, so we only use this one
    this.modelName = userModel || 'gemini-2.5-flash';
    // Minimal fallback list - only models that might work on free tier
    // Most models have 0 quota on free tier, so we keep this minimal
    this.fallbackModels = [
      'gemini-2.5-flash', // Primary - has 20 requests/day on free tier
      // Only add other models if they're explicitly set in env
      ...(userModel && userModel !== 'gemini-2.5-flash' ? [userModel] : [])
    ];
  }
  
  // Get model (lazy init)
  getModel() {
    return initializeAI();
  }

  // Generate interview question based on topic and difficulty
  async generateQuestion(topic, difficulty, context = '') {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:83',message:'generateQuestion called',data:{topic,difficulty,hasContext:!!context},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B,C,D'})}).catch(()=>{});
    // #endregion
    
    const prompt = this.buildQuestionPrompt(topic, difficulty, context);
    const modelsToTry = [this.modelName, ...this.fallbackModels.filter(m => m !== this.modelName)];
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:87',message:'Trying models',data:{modelsToTry,primaryModel:this.modelName,modelCount:modelsToTry.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    console.log(`📋 Using ${modelsToTry.length} model(s): ${modelsToTry.join(', ')}`);
    
    let lastError = null;
    let quotaError = null; // Track quota errors separately
    
    for (const modelName of modelsToTry) {
      try {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:92',message:'Trying model',data:{modelName,apiKeyPresent:!!process.env.GEMINI_API_KEY},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        
        const apiKey = process.env.GEMINI_API_KEY;
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 2048,
          }
        });
        
        console.log(`📤 Trying model ${modelName} for ${topic} (${difficulty})...`);
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:106',message:'Before generateContent call',data:{promptLength:prompt.length,modelName},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B,C,D'})}).catch(()=>{});
        // #endregion
        
        const result = await model.generateContent(prompt);
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:110',message:'generateContent succeeded',data:{modelName,hasResponse:!!result.response},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B,C,D'})}).catch(()=>{});
        // #endregion
        
        const response = await result.response;
        const text = response.text();
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:115',message:'Response text extracted',data:{modelName,textLength:text.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B,C,D'})}).catch(()=>{});
        // #endregion
        
        console.log(`✅ Success with model ${modelName}! Received response (${text.length} chars)`);
        // Update the working model for future use
        this.modelName = modelName;
        return this.parseQuestionResponse(text, topic, difficulty);
      } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:123',message:'Model failed, trying next',data:{modelName,errorMessage:error.message,errorCode:error.code||error.status},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        
        const errorMessage = error.message || '';
        const errorCode = error.code || error.status;
        
        // Check if this is a quota error - if so, save it and throw immediately
        if (errorCode === 429 || errorCode === 503 || 
            errorMessage.includes('429') || errorMessage.includes('Too Many Requests') ||
            errorMessage.includes('quota') || errorMessage.includes('rate limit') || 
            errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('Quota exceeded')) {
          quotaError = error;
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:164',message:'Quota error detected, will throw after all models tried',data:{modelName,errorMessage:errorMessage.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
        }
        
        lastError = error;
        console.log(`❌ Model ${modelName} failed: ${error.message}`);
        // Continue to next model
        continue;
      }
    }
    
    // All models failed - prioritize quota errors
    const error = quotaError || lastError || new Error('All models failed');
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:150',message:'All models failed',data:{errorMessage:error.message,errorName:error.name,errorCode:error.code||error.status,modelsTried:modelsToTry},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,B,C,D'})}).catch(()=>{});
    // #endregion
    
    console.error('❌ All models failed. Last error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      status: error.status,
      statusText: error.statusText,
      response: error.response?.data || error.response,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    });
      
      // Check for specific Gemini API error codes
      const errorMessage = error.message || '';
      const errorCode = error.code || error.status;
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:190',message:'Checking error type for generateQuestion',data:{errorMessage:errorMessage.substring(0,200),errorCode,has429:errorMessage.includes('429'),hasQuota:errorMessage.includes('quota')},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      // Quota/Rate limit errors - check FIRST since this is most common
      if (errorCode === 429 || errorCode === 503 || 
          errorMessage.includes('429') || errorMessage.includes('Too Many Requests') ||
          errorMessage.includes('quota') || errorMessage.includes('rate limit') || 
          errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('Quota exceeded')) {
        throw new Error('Gemini API quota exceeded. You have reached your daily request limit on the free tier (20 requests/day for gemini-2.5-flash). The quota resets in 24 hours. To continue using the service, please upgrade your API plan at https://ai.google.dev/pricing or wait for the quota to reset.');
      }
      
      // API Key errors
      if (errorCode === 400 && (errorMessage.includes('API_KEY') || errorMessage.includes('API key') || errorMessage.includes('invalid'))) {
        throw new Error('Invalid GEMINI_API_KEY. The API key may be incorrect, expired, or revoked. Please check your API key in the .env file and get a new one from https://makersuite.google.com/app/apikey');
      }
      
      // Permission errors
      if (errorCode === 403 || errorMessage.includes('permission') || errorMessage.includes('PERMISSION_DENIED')) {
        throw new Error('Gemini API permission denied. Please check your API key permissions and ensure it has access to the Generative AI API.');
      }
      
      // Model not found errors
      if (errorCode === 404 || errorMessage.includes('MODEL_NOT_FOUND') || (errorMessage.includes('model') && errorMessage.includes('not found'))) {
        const currentModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
        throw new Error(`Model "${currentModel}" not found. Please check GEMINI_MODEL in .env file. Try using "gemini-1.5-flash" or "gemini-1.5-pro".`);
      }
      
      // Network errors
      if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND') || errorMessage.includes('network')) {
        throw new Error('Network error connecting to Gemini API. Please check your internet connection.');
      }
      
      // Generic error with full message
      throw new Error(`Failed to generate question: ${errorMessage || 'Unknown error'}. Error code: ${errorCode || 'N/A'}`);
  }

  // Evaluate user's answer and provide feedback
  async evaluateAnswer(question, userAnswer, timeSpent) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:224',message:'evaluateAnswer called',data:{questionText:question?.text?.substring(0,50),userAnswerPreview:userAnswer?.substring(0,100),timeSpent,currentModel:this.modelName},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B,C'})}).catch(()=>{});
    // #endregion
    
    const prompt = this.buildEvaluationPrompt(question, userAnswer, timeSpent);
    // Use the working model from generateQuestion, or try fallbacks
    const modelsToTry = [this.modelName, ...this.fallbackModels.filter(m => m !== this.modelName)];
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:230',message:'evaluateAnswer trying models',data:{modelsToTry,primaryModel:this.modelName},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    let lastError = null;
    let quotaError = null; // Track quota errors separately
    
    for (const modelName of modelsToTry) {
      try {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:236',message:'evaluateAnswer trying model',data:{modelName},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        
        const apiKey = process.env.GEMINI_API_KEY;
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 2048,
          }
        });
        
        console.log(`📤 Evaluating answer with model ${modelName}...`);
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:252',message:'evaluateAnswer before generateContent',data:{modelName,promptLength:prompt.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B,C,D'})}).catch(()=>{});
        // #endregion
        
        const result = await model.generateContent(prompt);
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:256',message:'evaluateAnswer generateContent succeeded',data:{modelName,hasResponse:!!result.response},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B,C,D'})}).catch(()=>{});
        // #endregion
        
        const response = await result.response;
        const text = response.text();
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:261',message:'evaluateAnswer response extracted',data:{modelName,textLength:text.length,fullText:text},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B,C,D'})}).catch(()=>{});
        // #endregion
        
        console.log(`✅ Evaluation successful with model ${modelName}!`);
        // Update the working model for future use
        this.modelName = modelName;
        
        try {
          const parsed = this.parseEvaluationResponse(text);
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:280',message:'evaluateAnswer parsed successfully',data:{modelName,score:parsed?.score,hasStrengths:!!parsed?.strengths},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
          
          return parsed;
        } catch (parseError) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:288',message:'Parsing failed but got response, using fallback',data:{modelName,parseError:parseError.message,textLength:text.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
          
          // If we got a response but parsing failed, provide a fallback evaluation
          // This is better than trying another model (which might have quota issues)
          console.warn('⚠️ Failed to parse evaluation response, using fallback evaluation');
          return {
            score: 50, // Default score
            strengths: ['Answer was submitted successfully'],
            improvements: ['Could not parse detailed feedback from AI'],
            detailedFeedback: text.substring(0, 500) || 'AI evaluation completed but response format was unexpected.',
            suggestions: ['Review the answer for completeness', 'Consider providing more detail'],
            evaluation: {
              technicalAccuracy: 50,
              communication: 50,
              problemSolving: 50,
              codeQuality: 50
            },
            followUpQuestions: []
          };
        }
      } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:275',message:'evaluateAnswer model failed, trying next',data:{modelName,errorMessage:error.message,errorCode:error.code||error.status},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        
        const errorMessage = error.message || '';
        const errorCode = error.code || error.status;
        
        // Check if this is a quota error - if so, save it and prioritize it
        if (errorCode === 429 || errorCode === 503 || 
            errorMessage.includes('429') || errorMessage.includes('Too Many Requests') ||
            errorMessage.includes('quota') || errorMessage.includes('rate limit') || 
            errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('Quota exceeded')) {
          quotaError = error;
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:348',message:'Quota error detected in evaluateAnswer, will throw after all models tried',data:{modelName,errorMessage:errorMessage.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
        }
        
        lastError = error;
        console.log(`❌ Model ${modelName} failed for evaluation: ${error.message}`);
        // Continue to next model
        continue;
      }
    }
    
    // All models failed - prioritize quota errors
    const error = quotaError || lastError || new Error('All models failed for evaluation');
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:299',message:'evaluateAnswer all models failed',data:{errorMessage:error.message,errorName:error.name,errorCode:error.code||error.status,modelsTried:modelsToTry},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,B,C,D'})}).catch(()=>{});
    // #endregion
    
    console.error('❌ All models failed for evaluation. Last error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      status: error.status,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    });
    
    // Check for specific Gemini API error codes
    const errorMessage = error.message || '';
    const errorCode = error.code || error.status;
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:340',message:'Checking error type',data:{errorMessage:errorMessage.substring(0,200),errorCode,has429:errorMessage.includes('429'),hasQuota:errorMessage.includes('quota')},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Quota/Rate limit errors - check FIRST since this is most common
    if (errorCode === 429 || errorCode === 503 || 
        errorMessage.includes('429') || errorMessage.includes('Too Many Requests') ||
        errorMessage.includes('quota') || errorMessage.includes('rate limit') || 
        errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('Quota exceeded')) {
      throw new Error('Gemini API quota exceeded. You have reached your daily request limit on the free tier (20 requests/day for gemini-2.5-flash). The quota resets in 24 hours. To continue using the service, please upgrade your API plan at https://ai.google.dev/pricing or wait for the quota to reset.');
    }
    
    // API Key errors
    if (errorCode === 400 && (errorMessage.includes('API_KEY') || errorMessage.includes('API key') || errorMessage.includes('invalid'))) {
      throw new Error('Invalid GEMINI_API_KEY. The API key may be incorrect, expired, or revoked. Please check your API key in the .env file and get a new one from https://makersuite.google.com/app/apikey');
    }
    
    // Permission errors
    if (errorCode === 403 || errorMessage.includes('permission') || errorMessage.includes('PERMISSION_DENIED')) {
      throw new Error('Gemini API permission denied. Please check your API key permissions and ensure it has access to the Generative AI API.');
    }
    
    // Model not found errors
    if (errorCode === 404 || errorMessage.includes('MODEL_NOT_FOUND') || (errorMessage.includes('model') && errorMessage.includes('not found'))) {
      throw new Error(`Model not found. All available models were tried. Please check your API key has access to Gemini models.`);
    }
    
    // Network errors
    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND') || errorMessage.includes('network')) {
      throw new Error('Network error connecting to Gemini API. Please check your internet connection.');
    }
    
    // Generic error with full message
    throw new Error(`Failed to evaluate answer: ${errorMessage || 'Unknown error'}. Error code: ${errorCode || 'N/A'}`);
  }

  // Generate follow-up questions based on user's answer
  async generateFollowUpQuestions(originalQuestion, userAnswer, topic) {
    try {
      const aiModel = this.getModel();
      const prompt = this.buildFollowUpPrompt(originalQuestion, userAnswer, topic);
      const result = await aiModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseFollowUpResponse(text);
    } catch (error) {
      console.error('❌ Error generating follow-up questions:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name
      });
      
      if (error.message?.includes('API_KEY') || error.message?.includes('API key')) {
        throw new Error('Invalid GEMINI_API_KEY. Please check your API key in the .env file.');
      } else if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
        throw new Error('Gemini API quota exceeded or rate limited. Please try again later.');
      }
      
      throw new Error(`Failed to generate follow-up questions: ${error.message}`);
    }
  }

  // Build prompt for question generation
  buildQuestionPrompt(topic, difficulty, context) {
    const topicContexts = {
      'javascript': 'JavaScript programming language, ES6+, modern web development, DOM manipulation, async programming, closures, prototypes, and related concepts.',
      'python': 'Python programming language, object-oriented programming, data structures, algorithms, web frameworks, and Python-specific features.',
      'data-structures': 'Arrays, linked lists, stacks, queues, trees, graphs, hash tables, heaps, and their implementations and use cases.',
      'algorithms': 'Sorting algorithms, searching algorithms, dynamic programming, recursion, greedy algorithms, and algorithm complexity analysis.',
      'sql': 'SQL queries, database design, joins, indexing, normalization, transactions, and database management systems.',
      'java': 'Java programming language, object-oriented programming, collections framework, multithreading, Spring framework, and Java ecosystem.',
      'system-design': 'Scalable system architecture, microservices, load balancing, caching, database design, and distributed systems.'
    };

    const difficultyContexts = {
      'Easy': 'Basic concepts, fundamental understanding, simple implementations',
      'Medium': 'Intermediate concepts, practical applications, optimization considerations',
      'Hard': 'Advanced concepts, complex scenarios, performance optimization, edge cases'
    };

    return `You are an expert technical interviewer. Generate a ${difficulty.toLowerCase()} level interview question for ${topic}.

Context: ${topicContexts[topic]}
Difficulty Level: ${difficultyContexts[difficulty]}
${context ? `Additional Context: ${context}` : ''}

Requirements:
1. The question should be realistic and similar to what would be asked in actual technical interviews
2. Focus on practical problem-solving and real-world scenarios
3. Include specific technical details relevant to ${topic}
4. Make it challenging but appropriate for ${difficulty} level
5. The question should encourage detailed explanations and code examples

Please provide the question in the following format:
QUESTION: [The actual question text]
CATEGORY: [Specific subcategory within ${topic}]
KEY_CONCEPTS: [List of key concepts the question tests]
EXPECTED_APPROACH: [Brief description of expected solution approach]
TIME_ESTIMATE: [Estimated time in minutes]`;
  }

  // Build prompt for answer evaluation
  buildEvaluationPrompt(question, userAnswer, timeSpent) {
    return `You are an expert technical interviewer evaluating a candidate's response.

Question: ${question.text}
Topic: ${question.topic}
Difficulty: ${question.difficulty}
Category: ${question.category}

Candidate's Answer: ${userAnswer}
Time Spent: ${timeSpent} seconds

Please evaluate this answer comprehensively and provide detailed feedback in the following JSON format:

{
  "score": [0-100],
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["improvement1", "improvement2", "improvement3"],
  "detailedFeedback": "Comprehensive feedback paragraph",
  "suggestions": ["suggestion1", "suggestion2"],
  "evaluation": {
    "technicalAccuracy": [0-100],
    "communication": [0-100],
    "problemSolving": [0-100],
    "codeQuality": [0-100]
  },
  "followUpQuestions": ["follow-up question 1", "follow-up question 2"]
}

Evaluation criteria:
- Technical Accuracy: Correctness of technical concepts and implementation
- Communication: Clarity of explanation and ability to articulate thoughts
- Problem Solving: Logical approach and problem-solving methodology
- Code Quality: Code structure, readability, and best practices

Be constructive and provide actionable feedback.`;
  }

  // Build prompt for follow-up questions
  buildFollowUpPrompt(originalQuestion, userAnswer, topic) {
    return `Based on the candidate's answer to the following question, generate 2-3 relevant follow-up questions that would help assess their depth of knowledge.

Original Question: ${originalQuestion.text}
Topic: ${topic}
Candidate's Answer: ${userAnswer}

Generate follow-up questions that:
1. Build upon the candidate's response
2. Test deeper understanding of the topic
3. Explore edge cases or advanced concepts
4. Are appropriate for technical interviews

Please provide the questions in a simple list format.`;
  }

  // Parse question generation response
  parseQuestionResponse(text, topic, difficulty) {
    try {
      const lines = text.split('\n');
      const question = {
        text: '',
        category: topic,
        keyConcepts: [],
        expectedApproach: '',
        timeEstimate: 10,
        topic,
        difficulty,
        generatedBy: 'AI'
      };

      let currentSection = '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        
        if (trimmedLine.toUpperCase().startsWith('QUESTION:')) {
          currentSection = 'question';
          question.text = trimmedLine.replace(/^QUESTION:\s*/i, '').trim();
        } else if (trimmedLine.toUpperCase().startsWith('CATEGORY:')) {
          currentSection = 'category';
          question.category = trimmedLine.replace(/^CATEGORY:\s*/i, '').trim() || topic;
        } else if (trimmedLine.toUpperCase().startsWith('KEY_CONCEPTS:')) {
          currentSection = 'keyConcepts';
          const concepts = trimmedLine.replace(/^KEY_CONCEPTS:\s*/i, '').trim();
          question.keyConcepts = concepts ? concepts.split(',').map(c => c.trim()).filter(c => c) : [];
        } else if (trimmedLine.toUpperCase().startsWith('EXPECTED_APPROACH:')) {
          currentSection = 'expectedApproach';
          question.expectedApproach = trimmedLine.replace(/^EXPECTED_APPROACH:\s*/i, '').trim();
        } else if (trimmedLine.toUpperCase().startsWith('TIME_ESTIMATE:')) {
          currentSection = 'timeEstimate';
          const timeStr = trimmedLine.replace(/^TIME_ESTIMATE:\s*/i, '').trim();
          question.timeEstimate = parseInt(timeStr) || 10;
        } else if (currentSection === 'question' && trimmedLine) {
          question.text += (question.text ? ' ' : '') + trimmedLine;
        }
      }

      // If no question text was found, use the entire response as the question
      if (!question.text || question.text.trim().length === 0) {
        // Try to extract the first meaningful paragraph
        const paragraphs = text.split('\n\n').filter(p => p.trim().length > 20);
        question.text = paragraphs[0] || text.substring(0, 500) || `Please explain ${topic} concepts related to ${difficulty} level problems.`;
      }

      // Ensure we have at least a basic category
      if (!question.category) {
        question.category = topic;
      }

      return question;
    } catch (error) {
      console.error('Error parsing question response:', error);
      // Return a fallback question if parsing fails
      return {
        text: `Explain key concepts and best practices for ${topic} at ${difficulty} level. Provide examples and discuss implementation details.`,
        category: topic,
        keyConcepts: [topic, difficulty],
        expectedApproach: 'Provide a clear explanation with examples',
        timeEstimate: 10,
        topic,
        difficulty,
        generatedBy: 'AI'
      };
    }
  }

  // Parse evaluation response
  parseEvaluationResponse(text) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:541',message:'parseEvaluationResponse called',data:{textLength:text.length,textPreview:text.substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    try {
      // Try to extract JSON from the response (might be wrapped in markdown code blocks)
      let jsonText = text;
      
      // Remove markdown code blocks if present
      jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Extract JSON object (greedy match for nested objects)
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:550',message:'No JSON found in response',data:{textPreview:text.substring(0,1000)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        throw new Error('No JSON found in response');
      }

      const jsonString = jsonMatch[0];
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:556',message:'Attempting JSON parse',data:{jsonLength:jsonString.length,jsonPreview:jsonString.substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      const evaluation = JSON.parse(jsonString);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:560',message:'JSON parsed successfully',data:{hasScore:!!evaluation.score,hasStrengths:!!evaluation.strengths,hasImprovements:!!evaluation.improvements,score:evaluation.score},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      // Validate required fields
      if (!evaluation.score && evaluation.score !== 0) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:565',message:'Missing score field',data:{evaluationKeys:Object.keys(evaluation)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        throw new Error('Invalid evaluation format: missing score');
      }
      
      if (!evaluation.strengths || !Array.isArray(evaluation.strengths)) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:571',message:'Missing or invalid strengths field',data:{strengths:evaluation.strengths},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        // Provide defaults if missing
        evaluation.strengths = evaluation.strengths || [];
      }
      
      if (!evaluation.improvements || !Array.isArray(evaluation.improvements)) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:577',message:'Missing or invalid improvements field',data:{improvements:evaluation.improvements},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        // Provide defaults if missing
        evaluation.improvements = evaluation.improvements || [];
      }

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:583',message:'parseEvaluationResponse success',data:{score:evaluation.score,strengthsCount:evaluation.strengths?.length,improvementsCount:evaluation.improvements?.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      return evaluation;
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:587',message:'parseEvaluationResponse ERROR',data:{errorMessage:error.message,errorName:error.name,fullText:text,textLength:text.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      console.error('Error parsing evaluation response:', error);
      console.error('Response text preview:', text.substring(0, 500));
      console.error('Full response text:', text);
      throw new Error(`Failed to parse evaluation response: ${error.message}`);
    }
  }

  // Parse follow-up questions response
  parseFollowUpResponse(text) {
    try {
      const lines = text.split('\n');
      const questions = lines
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('-') && !line.match(/^\d+\./))
        .filter(line => line.length > 10);

      return questions.slice(0, 3); // Return max 3 questions
    } catch (error) {
      console.error('Error parsing follow-up response:', error);
      throw new Error('Failed to parse follow-up questions');
    }
  }

  // Generate personalized study recommendations
  async generateRecommendations(userAnalytics) {
    try {
      const prompt = `Based on the following user analytics, generate personalized study recommendations:

${JSON.stringify(userAnalytics, null, 2)}

Generate 3-5 specific, actionable recommendations for improvement. Focus on:
1. Weak areas that need attention
2. Specific topics to practice
3. Study strategies
4. Time management tips

Provide recommendations in a clear, actionable format.`;

      const aiModel = this.getModel();
      const result = await aiModel.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('❌ Error generating recommendations:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name
      });
      
      if (error.message?.includes('API_KEY') || error.message?.includes('API key')) {
        throw new Error('Invalid GEMINI_API_KEY. Please check your API key in the .env file.');
      } else if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
        throw new Error('Gemini API quota exceeded or rate limited. Please try again later.');
      }
      
      throw new Error(`Failed to generate recommendations: ${error.message}`);
    }
  }
}

export default new AIService();

import passport from 'passport';
import mongoose from 'mongoose';
import User from '../models/User.js';

// FORCE BYPASS MODE FOR DEVELOPMENT - Set to true to bypass all authentication
const FORCE_BYPASS = true; // <-- Set this to false when you want real auth

// Fixed ObjectId for bypass user - ensures consistency across requests
const BYPASS_USER_ID = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');

// Cache the bypass user to avoid repeated DB calls
let cachedBypassUser = null;

// Function to check if auth bypass is enabled
const isBypassEnabled = () => {
  if (FORCE_BYPASS) return true;
  
  const bypassValue = (process.env.BYPASS_AUTH || '').toString().trim().toLowerCase();
  return bypassValue === 'true' || bypassValue === '1' || bypassValue === 'yes';
};

// Log bypass status
console.log('🔍 Auth Bypass Status:', {
  FORCE_BYPASS,
  BYPASS_AUTH_env: process.env.BYPASS_AUTH,
  isBypassEnabled: isBypassEnabled()
});

if (isBypassEnabled()) {
  console.log('🔓 Authentication BYPASS is ENABLED - No JWT tokens required');
} else {
  console.log('🔒 Authentication is REQUIRED - JWT tokens needed');
}

// Create or get a default user for bypass mode
const getOrCreateBypassUser = async () => {
  // Return cached user if available
  if (cachedBypassUser) {
    return cachedBypassUser;
  }

  try {
    // Try to find an existing bypass user by ID first (most reliable)
    let user = await User.findById(BYPASS_USER_ID);
    
    if (!user) {
      // Try by email
      user = await User.findOne({ email: 'bypass@interviewai.com' });
    }
    
    if (!user) {
      // Create a default bypass user with fixed ID
      user = new User({
        _id: BYPASS_USER_ID,
        name: 'Demo User',
        email: 'bypass@interviewai.com',
        password: 'bypass123', // Will be hashed by pre-save hook
        profile: {
          experience: 'Intermediate',
          yearsOfExperience: 2
        },
        preferences: {
          difficulty: 'Medium',
          topics: ['javascript', 'python', 'data-structures', 'algorithms', 'sql', 'java', 'system-design'],
          dailyGoal: 5
        },
        stats: {
          totalInterviews: 0,
          totalQuestions: 0,
          averageScore: 0,
          streakDays: 0
        }
      });
      await user.save();
      console.log('✅ Created bypass user for development');
    }
    
    // Ensure user has all required fields
    if (!user.stats) {
      user.stats = {
        totalInterviews: 0,
        totalQuestions: 0,
        averageScore: 0,
        streakDays: 0
      };
      await user.save();
    }
    
    // Cache the user
    cachedBypassUser = user;
    return user;
  } catch (error) {
    console.error('Error with bypass user:', error.message);
    // Return a minimal user object with FIXED ID if database fails
    const mockUser = {
      _id: BYPASS_USER_ID,
      name: 'Demo User',
      email: 'bypass@interviewai.com',
      stats: {
        totalInterviews: 0,
        totalQuestions: 0,
        averageScore: 0,
        streakDays: 0
      }
    };
    cachedBypassUser = mockUser;
    return mockUser;
  }
};

// Bypass authentication middleware
export const optionalAuth = async (req, res, next) => {
  if (isBypassEnabled()) {
    // In bypass mode, create/fetch a default user
    const user = await getOrCreateBypassUser();
    req.user = user;
    return next();
  }
  
  // Normal authentication flow
  return passport.authenticate('jwt', { session: false })(req, res, next);
};

// Main authentication middleware with bypass support
export const authenticateToken = async (req, res, next) => {
  // Always check bypass first
  if (FORCE_BYPASS || isBypassEnabled()) {
    console.log('✅ Bypass mode active for:', req.method, req.path);
    try {
      // In bypass mode, create/fetch a default user
      const user = await getOrCreateBypassUser();
      req.user = user;
      return next();
    } catch (error) {
      console.error('❌ Bypass auth error:', error);
      // Fallback to minimal user
      req.user = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Demo User',
        email: 'bypass@interviewai.com',
        stats: {
          totalInterviews: 0,
          totalQuestions: 0,
          averageScore: 0,
          streakDays: 0
        }
      };
      return next();
    }
  }
  
  console.log('🔒 Using normal JWT authentication for:', req.method, req.path);
  // Normal authentication - use passport
  return passport.authenticate('jwt', { session: false })(req, res, next);
};

export default authenticateToken;


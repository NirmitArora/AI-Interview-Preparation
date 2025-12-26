// Quick test script to verify Gemini API key
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('🔍 Testing Gemini API Configuration...\n');

const apiKey = process.env.GEMINI_API_KEY;
const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

console.log('📋 Configuration:');
console.log(`  API Key present: ${apiKey ? '✅ YES' : '❌ NO'}`);
if (apiKey) {
  console.log(`  API Key length: ${apiKey.length} characters`);
  console.log(`  API Key prefix: ${apiKey.substring(0, 10)}...`);
} else {
  console.log('  ⚠️  GEMINI_API_KEY not found in .env file');
  console.log('  💡 Make sure your .env file contains: GEMINI_API_KEY=your-key-here');
  process.exit(1);
}

console.log(`  Model name: ${modelName}\n`);

// Test the API
console.log('🧪 Testing API connection...');
try {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });
  
  const testPrompt = 'Say "Hello" in one word.';
  console.log(`  Sending test prompt: "${testPrompt}"`);
  
  const result = await model.generateContent(testPrompt);
  const response = await result.response;
  const text = response.text();
  
  console.log(`  ✅ SUCCESS! Response: "${text.trim()}"`);
  console.log('\n🎉 Your Gemini API key is working correctly!');
  process.exit(0);
} catch (error) {
  console.error('\n❌ ERROR:', error.message);
  console.error('\n📝 Error Details:');
  console.error('  Error name:', error.name);
  console.error('  Error code:', error.code || error.status);
  
  if (error.message?.includes('API_KEY') || error.message?.includes('API key')) {
    console.error('\n💡 Solution:');
    console.error('  - Your API key may be invalid or expired');
    console.error('  - Get a new API key from: https://makersuite.google.com/app/apikey');
    console.error('  - Make sure there are no extra spaces in your .env file');
  } else if (error.message?.includes('quota') || error.message?.includes('429')) {
    console.error('\n💡 Solution:');
    console.error('  - Your API quota has been exceeded');
    console.error('  - Check your quota in Google Cloud Console');
    console.error('  - Wait a bit and try again later');
  } else if (error.message?.includes('permission') || error.message?.includes('403')) {
    console.error('\n💡 Solution:');
    console.error('  - Your API key may not have the right permissions');
    console.error('  - Make sure the Generative AI API is enabled in your Google Cloud project');
  } else if (error.message?.includes('model') || error.message?.includes('not found')) {
    console.error('\n💡 Solution:');
    console.error(`  - The model "${modelName}" may not be available`);
    console.error('  - Try setting GEMINI_MODEL=gemini-1.5-flash in your .env file');
  }
  
  process.exit(1);
}



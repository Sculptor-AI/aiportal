// Simple test to verify SculptorAI system prompt is loaded correctly
import { SCULPTOR_AI_SYSTEM_PROMPT } from './sculptorAI-system-prompt.js';

export const testSystemPrompt = () => {
  console.log('=== SculptorAI System Prompt Test ===');
  console.log('System prompt loaded:', !!SCULPTOR_AI_SYSTEM_PROMPT);
  console.log('System prompt length:', SCULPTOR_AI_SYSTEM_PROMPT.length);
  console.log('System prompt preview (first 100 chars):', SCULPTOR_AI_SYSTEM_PROMPT.substring(0, 100));
  console.log('Contains "SculptorAI":', SCULPTOR_AI_SYSTEM_PROMPT.includes('SculptorAI'));
  console.log('Contains "Core Capabilities":', SCULPTOR_AI_SYSTEM_PROMPT.includes('Core Capabilities'));
  console.log('Contains "Thinking Process":', SCULPTOR_AI_SYSTEM_PROMPT.includes('Thinking Process'));
  console.log('========================================');
  
  return {
    loaded: !!SCULPTOR_AI_SYSTEM_PROMPT,
    length: SCULPTOR_AI_SYSTEM_PROMPT.length,
    valid: SCULPTOR_AI_SYSTEM_PROMPT.includes('SculptorAI') && SCULPTOR_AI_SYSTEM_PROMPT.length > 100
  };
};

// Run test if this file is imported
if (typeof window !== 'undefined') {
  window.testSculptorAI = testSystemPrompt;
} 
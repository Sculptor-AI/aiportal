// Test script to verify headline extraction

// Mock the extractHeadlineFromContent function
function extractHeadlineFromContent(content) {
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.startsWith('# ')) {
      const headline = line.substring(2).trim();
      if (headline.length > 0) {
        return headline;
      }
    }
  }
  return null;
}

// Test cases
const testCases = [
  {
    name: "Valid headline",
    content: `# Breaking: Major Discovery in Space
    
    Scientists announced today...`,
    expected: "Breaking: Major Discovery in Space"
  },
  {
    name: "No headline marker",
    content: `Breaking: Major Discovery in Space
    
    Scientists announced today...`,
    expected: null
  },
  {
    name: "Empty headline",
    content: `# 
    
    Scientists announced today...`,
    expected: null
  },
  {
    name: "Feature article with headline",
    content: `# Webb Telescope Reveals Universe's Largest Map Yet
    
    **GREENBELT, Md.** – The James Webb Space Telescope...`,
    expected: "Webb Telescope Reveals Universe's Largest Map Yet"
  }
];

console.log('🧪 Testing headline extraction...\n');

testCases.forEach(test => {
  const result = extractHeadlineFromContent(test.content);
  const passed = result === test.expected;
  
  console.log(`${passed ? '✅' : '❌'} ${test.name}`);
  console.log(`   Expected: ${test.expected}`);
  console.log(`   Got: ${result}`);
  console.log('');
});

// Example of proper fallback
console.log('📋 Testing fallback behavior:\n');

const noHeadlineContent = "Some content without a headline";
const suggestedHeadline = "AI Powers New Era of Scientific Discovery";

const extracted = extractHeadlineFromContent(noHeadlineContent);
const finalHeadline = extracted || suggestedHeadline;

console.log(`Extracted: ${extracted}`);
console.log(`Suggested: ${suggestedHeadline}`);
console.log(`Final: ${finalHeadline}`);
console.log(`✅ Fallback working: ${finalHeadline === suggestedHeadline}`); 
/**
 * Test file for code block streaming functionality
 * Run this to verify the fixes work correctly
 */

import { processCodeBlocks, hasIncompleteCodeBlock, validateCodeBlockSyntax, extractCodeBlocks } from './src/utils/codeBlockProcessor.js';

// Test cases for code block processing
const testCases = [
  {
    name: 'Complete Code Block',
    content: 'Here is some text\n\n```javascript\nconsole.log("Hello");\n```\n\nMore text',
    expected: {
      hasIncomplete: false,
      validationIssues: [],
      blockCount: 1
    }
  },
  {
    name: 'Incomplete Code Block (Streaming)',
    content: 'Here is some text\n\n```javascript\nconsole.log("Hello");\n',
    expected: {
      hasIncomplete: true,
      validationIssues: [{ type: 'unclosed_code_block' }],
      blockCount: 1
    }
  },
  {
    name: 'Multiple Code Blocks',
    content: '```python\ndef hello():\n    print("Hello")\n```\n\n```javascript\nfunction hello() {\n    console.log("Hello");\n}\n```',
    expected: {
      hasIncomplete: false,
      validationIssues: [],
      blockCount: 2
    }
  },
  {
    name: 'Code Block with Language',
    content: '```typescript\ninterface User {\n    name: string;\n    age: number;\n}\n```',
    expected: {
      hasIncomplete: false,
      validationIssues: [],
      blockCount: 1
    }
  },
  {
    name: 'Empty Code Block',
    content: '```\n```',
    expected: {
      hasIncomplete: false,
      validationIssues: [],
      blockCount: 1
    }
  },
  {
    name: 'Streaming Edge Case',
    content: '```javascript\nfunction test() {\n    console.log("Testing");\n    // This is incomplete',
    expected: {
      hasIncomplete: true,
      validationIssues: [{ type: 'unclosed_code_block' }],
      blockCount: 1
    }
  }
];

// Run tests
function runTests() {
  console.log('🧪 Running Code Block Streaming Tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: ${testCase.name}`);
    
    try {
      // Test hasIncompleteCodeBlock
      const hasIncomplete = hasIncompleteCodeBlock(testCase.content);
      if (hasIncomplete !== testCase.expected.hasIncomplete) {
        throw new Error(`hasIncompleteCodeBlock failed: expected ${testCase.expected.hasIncomplete}, got ${hasIncomplete}`);
      }
      
      // Test validateCodeBlockSyntax
      const validationIssues = validateCodeBlockSyntax(testCase.content);
      if (validationIssues.length !== testCase.expected.validationIssues.length) {
        throw new Error(`validateCodeBlockSyntax failed: expected ${testCase.expected.validationIssues.length} issues, got ${validationIssues.length}`);
      }
      
      // Test extractCodeBlocks
      const extractedBlocks = extractCodeBlocks(testCase.content);
      if (extractedBlocks.length !== testCase.expected.blockCount) {
        throw new Error(`extractCodeBlocks failed: expected ${testCase.expected.blockCount} blocks, got ${extractedBlocks.length}`);
      }
      
      // Test processCodeBlocks (basic functionality)
      const segments = processCodeBlocks(testCase.content, {
        onCodeBlock: ({ language, content, isComplete }) => ({ type: 'code', language, content, isComplete }),
        onTextSegment: (text) => ({ type: 'text', content: text })
      });
      
      if (!Array.isArray(segments)) {
        throw new Error('processCodeBlocks failed: expected array of segments');
      }
      
      console.log('✅ PASSED');
      passed++;
      
    } catch (error) {
      console.log(`❌ FAILED: ${error.message}`);
      failed++;
    }
    
    console.log('');
  });
  
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! Code block streaming fixes are working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please review the code block processing logic.');
  }
}

// Run the tests if this file is executed directly
if (typeof window === 'undefined') {
  // Node.js environment
  runTests();
} else {
  // Browser environment
  window.runCodeBlockTests = runTests;
  console.log('Code block tests loaded. Run window.runCodeBlockTests() to execute tests.');
}

export { runTests }; 
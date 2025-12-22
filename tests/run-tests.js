import { runTests as runCodeBlockTests } from './test-code-block-streaming.js';
import { testMarkdownRendering } from './test-markdown-formatting.js';

const runSuite = () => {
  console.log('🧪 Running AI Portal test suite...\n');

  try {
    runCodeBlockTests();
    console.log('\n');
    testMarkdownRendering();
    console.log('\n✅ All tests completed.');
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exitCode = 1;
  }
};

runSuite();

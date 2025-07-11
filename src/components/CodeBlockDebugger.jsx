import React, { useState } from 'react';
import { processCodeBlocks, hasIncompleteCodeBlock, validateCodeBlockSyntax, extractCodeBlocks } from '../utils/codeBlockProcessor';
import StreamingMarkdownRenderer from './StreamingMarkdownRenderer';

const CodeBlockDebugger = () => {
  const [testContent, setTestContent] = useState('');
  const [debugInfo, setDebugInfo] = useState({});

  const analyzeContent = (content) => {
    const info = {
      hasCodeBlocks: content.includes('```'),
      hasIncomplete: hasIncompleteCodeBlock(content),
      validationIssues: validateCodeBlockSyntax(content),
      extractedBlocks: extractCodeBlocks(content),
      lineCount: content.split('\n').length,
      charCount: content.length
    };
    setDebugInfo(info);
  };

  const testCases = [
    {
      name: 'Complete Code Block',
      content: 'Here is some text\n\n```javascript\nconsole.log("Hello");\n```\n\nMore text'
    },
    {
      name: 'Incomplete Code Block',
      content: 'Here is some text\n\n```javascript\nconsole.log("Hello");\n'
    },
    {
      name: 'Multiple Code Blocks',
      content: '```python\ndef hello():\n    print("Hello")\n```\n\n```javascript\nfunction hello() {\n    console.log("Hello");\n}\n```'
    },
    {
      name: 'Nested Code Blocks (Invalid)',
      content: '```javascript\n```python\nprint("Hello")\n```\n```'
    },
    {
      name: 'Streaming Simulation',
      content: '```javascript\nfunction test() {\n    console.log("Testing");\n    // This is incomplete'
    }
  ];

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Code Block Debugger</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Test Cases</h3>
        {testCases.map((testCase, index) => (
          <button
            key={index}
            onClick={() => {
              setTestContent(testCase.content);
              analyzeContent(testCase.content);
            }}
            style={{ margin: '5px', padding: '10px' }}
          >
            {testCase.name}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Custom Content</h3>
        <textarea
          value={testContent}
          onChange={(e) => {
            setTestContent(e.target.value);
            analyzeContent(e.target.value);
          }}
          style={{ width: '100%', height: '200px', fontFamily: 'monospace' }}
          placeholder="Enter content to test..."
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Debug Information</h3>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Rendered Output</h3>
        <div style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
          <StreamingMarkdownRenderer 
            text={testContent}
            isStreaming={false}
            theme={{ name: 'light', text: '#000', border: '#ccc' }}
          />
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Streaming Simulation</h3>
        <div style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
          <StreamingMarkdownRenderer 
            text={testContent}
            isStreaming={true}
            theme={{ name: 'light', text: '#000', border: '#ccc' }}
          />
        </div>
      </div>
    </div>
  );
};

export default CodeBlockDebugger; 
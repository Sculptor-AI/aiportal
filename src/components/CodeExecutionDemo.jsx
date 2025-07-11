import React, { useState } from 'react';
import styled from 'styled-components';
import CodeBlockWithExecution from './CodeBlockWithExecution';
import useSupportedLanguages from '../hooks/useSupportedLanguages';

const DemoContainer = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const DemoSection = styled.div`
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  background: #fff;
`;

const DemoTitle = styled.h2`
  margin: 0 0 20px 0;
  color: #333;
  font-size: 1.5em;
`;

const DemoDescription = styled.p`
  margin: 0 0 20px 0;
  color: #666;
  line-height: 1.6;
`;

const LanguageSelector = styled.select`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 15px;
  font-size: 14px;
`;

const CodeInput = styled.textarea`
  width: 100%;
  height: 200px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: 14px;
  line-height: 1.4;
  resize: vertical;
  margin-bottom: 15px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
`;

const Button = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: #007bff;
  color: white;
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    background: #0056b3;
  }
  
  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }
`;

const CodeExecutionDemo = () => {
  const { supportedLanguages, isLoading, error } = useSupportedLanguages();
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [customCode, setCustomCode] = useState('');
  const [showCustomDemo, setShowCustomDemo] = useState(false);

  const executableLanguages = supportedLanguages.filter(lang => lang.executable);

  const sampleCode = {
    javascript: `// JavaScript Example
console.log("Hello, World!");

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log("Fibonacci of 10:", fibonacci(10));

// Array operations
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(x => x * 2);
console.log("Doubled numbers:", doubled);`,

    python: `# Python Example
print("Hello, World!")

def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print(f"Fibonacci of 10: {fibonacci(10)}")

# List comprehension
numbers = [1, 2, 3, 4, 5]
doubled = [x * 2 for x in numbers]
print(f"Doubled numbers: {doubled}")

# Dictionary operations
person = {"name": "John", "age": 30, "city": "New York"}
print(f"Person: {person}")`,

    python_streaming: `# Python Streaming Example
import time

print("Starting streaming demo...")
time.sleep(0.5)

for i in range(5):
    print(f"Processing step {i + 1}/5...")
    time.sleep(0.3)

print("Streaming demo completed!")
print("This demonstrates real-time output during execution.")`,

    bash: `#!/bin/bash
# Bash Example
echo "Hello, World!"

# System information
echo "Current user: $(whoami)"
echo "Current directory: $(pwd)"
echo "System: $(uname -s)"

# Simple calculation
result=$((5 + 3))
echo "5 + 3 = $result"

# List files
echo "Files in current directory:"
ls -la | head -5`,

    sql: `-- SQL Example
-- Create a simple table
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    age INTEGER
);

-- Insert some data
INSERT INTO users (id, name, email, age) VALUES 
(1, 'John Doe', 'john@example.com', 30),
(2, 'Jane Smith', 'jane@example.com', 25),
(3, 'Bob Johnson', 'bob@example.com', 35);

-- Query the data
SELECT * FROM users WHERE age > 25;

-- Count users
SELECT COUNT(*) as total_users FROM users;`,

    java: `// Java Example
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        
        // Calculate factorial
        int n = 5;
        long factorial = 1;
        for (int i = 1; i <= n; i++) {
            factorial *= i;
        }
        System.out.println("Factorial of " + n + " is: " + factorial);
        
        // Array operations
        int[] numbers = {1, 2, 3, 4, 5};
        int sum = 0;
        for (int num : numbers) {
            sum += num;
        }
        System.out.println("Sum of numbers: " + sum);
    }
}`
  };

  const handleExecutionComplete = (result, error, executionTime) => {
    console.log('Code execution completed:', { result, error, executionTime });
  };

  if (isLoading) {
    return (
      <DemoContainer>
        <DemoSection>
          <DemoTitle>Code Execution Demo</DemoTitle>
          <DemoDescription>Loading supported languages...</DemoDescription>
        </DemoSection>
      </DemoContainer>
    );
  }

  if (error) {
    return (
      <DemoContainer>
        <DemoSection>
          <DemoTitle>Code Execution Demo</DemoTitle>
          <DemoDescription>Error loading supported languages: {error}</DemoDescription>
        </DemoSection>
      </DemoContainer>
    );
  }

  return (
    <DemoContainer>
      <DemoSection>
        <DemoTitle>Code Execution Demo</DemoTitle>
        <DemoDescription>
          This demo showcases the code execution functionality integrated into code blocks. 
          You can run code directly from the chat interface and see the results in real-time.
        </DemoDescription>

        <ButtonGroup>
          <Button onClick={() => setShowCustomDemo(!showCustomDemo)}>
            {showCustomDemo ? 'Hide' : 'Show'} Custom Code Demo
          </Button>
        </ButtonGroup>

        {showCustomDemo && (
          <DemoSection>
            <DemoTitle>Custom Code Execution</DemoTitle>
            <DemoDescription>
              Write your own code and test it with the execution feature.
            </DemoDescription>
            
            <LanguageSelector 
              value={selectedLanguage} 
              onChange={(e) => setSelectedLanguage(e.target.value)}
            >
              {executableLanguages.map(lang => (
                <option key={lang.id} value={lang.id}>
                  {lang.name}
                </option>
              ))}
            </LanguageSelector>
            
            <CodeInput
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              placeholder={`Enter your ${selectedLanguage} code here...`}
            />
            
            {customCode && (
              <CodeBlockWithExecution
                language={selectedLanguage}
                content={customCode}
                theme={{ name: 'light', text: '#000', border: '#ddd' }}
                supportedLanguages={supportedLanguages}
                onExecutionComplete={handleExecutionComplete}
              />
            )}
          </DemoSection>
        )}
      </DemoSection>

      <DemoSection>
        <DemoTitle>JavaScript Examples</DemoTitle>
        <DemoDescription>
          Click the "Run" button to execute JavaScript code and see the results.
        </DemoDescription>
        
        <CodeBlockWithExecution
          language="javascript"
          content={sampleCode.javascript}
          theme={{ name: 'light', text: '#000', border: '#ddd' }}
          supportedLanguages={supportedLanguages}
          onExecutionComplete={handleExecutionComplete}
        />
      </DemoSection>

      <DemoSection>
        <DemoTitle>Python Examples</DemoTitle>
        <DemoDescription>
          Execute Python code and see the output. Try the streaming version for real-time output.
        </DemoDescription>
        
        <CodeBlockWithExecution
          language="python"
          content={sampleCode.python}
          theme={{ name: 'light', text: '#000', border: '#ddd' }}
          supportedLanguages={supportedLanguages}
          onExecutionComplete={handleExecutionComplete}
        />
        
        <CodeBlockWithExecution
          language="python"
          content={sampleCode.python_streaming}
          theme={{ name: 'light', text: '#000', border: '#ddd' }}
          supportedLanguages={supportedLanguages}
          onExecutionComplete={handleExecutionComplete}
        />
      </DemoSection>

      <DemoSection>
        <DemoTitle>Bash Examples</DemoTitle>
        <DemoDescription>
          Run shell commands and see system information.
        </DemoDescription>
        
        <CodeBlockWithExecution
          language="bash"
          content={sampleCode.bash}
          theme={{ name: 'light', text: '#000', border: '#ddd' }}
          supportedLanguages={supportedLanguages}
          onExecutionComplete={handleExecutionComplete}
        />
      </DemoSection>

      <DemoSection>
        <DemoTitle>SQL Examples</DemoTitle>
        <DemoDescription>
          Execute SQL queries and see the results.
        </DemoDescription>
        
        <CodeBlockWithExecution
          language="sql"
          content={sampleCode.sql}
          theme={{ name: 'light', text: '#000', border: '#ddd' }}
          supportedLanguages={supportedLanguages}
          onExecutionComplete={handleExecutionComplete}
        />
      </DemoSection>

      <DemoSection>
        <DemoTitle>Java Examples</DemoTitle>
        <DemoDescription>
          Run Java code and see the compiled output.
        </DemoDescription>
        
        <CodeBlockWithExecution
          language="java"
          content={sampleCode.java}
          theme={{ name: 'light', text: '#000', border: '#ddd' }}
          supportedLanguages={supportedLanguages}
          onExecutionComplete={handleExecutionComplete}
        />
      </DemoSection>

      <DemoSection>
        <DemoTitle>Supported Languages</DemoTitle>
        <DemoDescription>
          The following languages are supported for code execution:
        </DemoDescription>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
          {executableLanguages.map(lang => (
            <div key={lang.id} style={{ 
              padding: '8px', 
              border: '1px solid #ddd', 
              borderRadius: '4px',
              backgroundColor: '#f8f9fa'
            }}>
              <strong>{lang.name}</strong>
              <br />
              <small>ID: {lang.id}</small>
            </div>
          ))}
        </div>
      </DemoSection>
    </DemoContainer>
  );
};

export default CodeExecutionDemo; 
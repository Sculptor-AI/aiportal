# Code Execution Integration

## Overview

This feature integrates code execution capabilities directly into code blocks within the chat interface. Users can now run code snippets and see the results in real-time, making the chat experience more interactive and educational.

## Features

### 1. Inline Code Execution
- **Run Button**: Each executable code block has a "Run" button
- **Stream Button**: Execute code with real-time streaming output
- **Stop Button**: Stop execution if it's taking too long
- **Copy Button**: Copy code to clipboard
- **Clear Button**: Clear execution results

### 2. Supported Languages
The system supports a wide range of programming languages:

**Executable Languages:**
- JavaScript, Python, Java, C++, C#, PHP, Ruby, Go, Rust
- Swift, Kotlin, TypeScript, SQL, Bash, PowerShell
- R, MATLAB, Scala, Perl, Lua, Dart, Elixir, Clojure
- Haskell, OCaml, F#, COBOL, Fortran, Pascal, Ada
- Lisp, Prolog, Erlang, Groovy, Julia, Nim, Crystal
- Zig, V, Odin, Carbon, Mojo

**Non-Executable Languages:**
- HTML, CSS, JSON, XML, YAML, TOML, INI, Markdown, Plain Text

### 3. Execution Modes
- **Synchronous**: Execute code and wait for complete result
- **Streaming**: Execute code with real-time output streaming
- **Error Handling**: Proper error display and handling
- **Execution Time**: Track and display execution time

## Components

### 1. CodeBlockWithExecution
The main component that replaces regular code blocks for executable languages.

**Props:**
```javascript
{
  language: 'javascript',           // Programming language
  content: 'console.log("Hello")', // Code content
  theme: {},                       // Theme object
  supportedLanguages: [],          // Array of supported languages
  onExecutionComplete: (result, error, executionTime) => {} // Callback
}
```

**Features:**
- Automatic language detection
- Execution state management
- Real-time output streaming
- Error handling and display
- Copy functionality
- Results clearing

### 2. useSupportedLanguages Hook
Manages the list of supported programming languages.

**Returns:**
```javascript
{
  supportedLanguages: [],           // Array of language objects
  isLoading: boolean,               // Loading state
  error: string | null,             // Error message
  isLanguageExecutable: (id) => boolean,  // Check if language is executable
  getLanguageDisplayName: (id) => string, // Get display name
  getExecutableLanguages: () => [],       // Get executable languages
  getNonExecutableLanguages: () => [],    // Get non-executable languages
  refetch: () => void                     // Refetch languages
}
```

### 3. Integration with Existing Components
- **StreamingMarkdownRenderer**: Automatically uses CodeBlockWithExecution for executable languages
- **ChatMessage**: Supports code execution in completed messages
- **MobileChatMessage**: Mobile-optimized version

## API Endpoints

### 1. Get Supported Languages
```
GET /api/tools/languages
```

**Response:**
```json
{
  "success": true,
  "languages": [
    {
      "id": "javascript",
      "name": "JavaScript",
      "executable": true
    }
  ]
}
```

### 2. Execute Code (Synchronous)
```
POST /api/tools/execute-code
```

**Request:**
```json
{
  "code": "console.log('Hello, World!')",
  "language": "javascript",
  "execution_id": "exec_1234567890_abc123"
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "success": true,
    "output": "Hello, World!\n",
    "result": null,
    "execution_time": 45
  }
}
```

### 3. Execute Code (Streaming)
```
POST /api/tools/execute-code/stream
```

**Request:** Same as synchronous endpoint

**Response:** Server-Sent Events (SSE) stream with events:
- `connected`: Connection established
- `execution_started`: Execution began
- `output`: Real-time output
- `execution_completed`: Execution finished
- `execution_failed`: Execution failed
- `ping`: Keep-alive

## Usage Examples

### 1. Basic Integration
```javascript
import CodeBlockWithExecution from './components/CodeBlockWithExecution';
import useSupportedLanguages from './hooks/useSupportedLanguages';

const MyComponent = () => {
  const { supportedLanguages } = useSupportedLanguages();
  
  return (
    <CodeBlockWithExecution
      language="python"
      content="print('Hello, World!')"
      supportedLanguages={supportedLanguages}
      onExecutionComplete={(result, error, time) => {
        console.log('Execution completed:', { result, error, time });
      }}
    />
  );
};
```

### 2. Custom Code Input
```javascript
const [code, setCode] = useState('');
const [language, setLanguage] = useState('javascript');

return (
  <div>
    <textarea
      value={code}
      onChange={(e) => setCode(e.target.value)}
      placeholder="Enter your code..."
    />
    {code && (
      <CodeBlockWithExecution
        language={language}
        content={code}
        supportedLanguages={supportedLanguages}
      />
    )}
  </div>
);
```

### 3. Demo Component
```javascript
import CodeExecutionDemo from './components/CodeExecutionDemo';

// Use the demo component to showcase functionality
<CodeExecutionDemo />
```

## Configuration

### 1. Enable/Disable Code Execution
```javascript
// In StreamingMarkdownRenderer
<StreamingMarkdownRenderer
  text={content}
  enableCodeExecution={true} // or false to disable
  theme={theme}
/>
```

### 2. Custom Theme
```javascript
const theme = {
  name: 'light', // or 'dark'
  text: '#000000',
  border: '#dddddd',
  // ... other theme properties
};
```

### 3. Language Detection
The system automatically detects if a language is executable based on the `supportedLanguages` array. Languages with `executable: true` will show run buttons.

## Error Handling

### 1. Network Errors
- Automatic fallback to common languages if API fails
- Graceful degradation to regular code blocks
- User-friendly error messages

### 2. Execution Errors
- Syntax errors displayed in error output
- Runtime errors shown with stack traces
- Timeout handling for long-running code

### 3. Streaming Errors
- Connection failure handling
- Automatic reconnection attempts
- Fallback to synchronous execution

## Security Considerations

### 1. Code Execution Safety
- Sandboxed execution environment
- Resource limits (CPU, memory, time)
- Network access restrictions
- File system access limitations

### 2. Input Validation
- Code length limits
- Language validation
- Malicious code detection
- Rate limiting

### 3. User Permissions
- Execution permission checks
- User quota management
- Admin controls

## Performance Optimizations

### 1. Lazy Loading
- Language support loaded on demand
- Component lazy loading
- Code execution queuing

### 2. Caching
- Language list caching
- Execution result caching
- Theme caching

### 3. Resource Management
- Automatic cleanup of event sources
- Memory leak prevention
- Connection pooling

## Testing

### 1. Unit Tests
```javascript
// Test code execution functionality
import { render, fireEvent, waitFor } from '@testing-library/react';
import CodeBlockWithExecution from './CodeBlockWithExecution';

test('executes code and shows results', async () => {
  const { getByText, getByRole } = render(
    <CodeBlockWithExecution
      language="javascript"
      content="console.log('test')"
      supportedLanguages={[{ id: 'javascript', name: 'JavaScript', executable: true }]}
    />
  );
  
  fireEvent.click(getByText('▶️ Run'));
  
  await waitFor(() => {
    expect(getByText('✅ Success')).toBeInTheDocument();
  });
});
```

### 2. Integration Tests
- Test with real API endpoints
- Test streaming functionality
- Test error scenarios
- Test mobile responsiveness

### 3. Demo Testing
Use the `CodeExecutionDemo` component to manually test:
- Different languages
- Various code examples
- Error conditions
- Streaming functionality

## Future Enhancements

### 1. Advanced Features
- **Syntax Highlighting**: Integrate with Prism.js or highlight.js
- **Code Formatting**: Auto-format code before execution
- **Dependencies**: Support for package management
- **File Upload**: Execute code with file inputs
- **Collaboration**: Real-time collaborative code editing

### 2. Language Support
- **WebAssembly**: Execute WASM modules
- **Docker**: Containerized execution environments
- **GPU Computing**: CUDA, OpenCL support
- **Database**: Direct database connections

### 3. User Experience
- **Code Templates**: Pre-built code examples
- **Execution History**: Save and replay executions
- **Export Results**: Download execution results
- **Share Code**: Share executable code snippets

## Troubleshooting

### Common Issues

1. **Code not executing**
   - Check if language is supported
   - Verify API endpoints are accessible
   - Check browser console for errors

2. **Streaming not working**
   - Verify EventSource support
   - Check network connectivity
   - Ensure proper CORS configuration

3. **Performance issues**
   - Monitor execution time limits
   - Check resource usage
   - Implement proper cleanup

### Debug Tools

1. **CodeBlockDebugger**: Interactive debugging component
2. **Console Logging**: Detailed execution logs
3. **Network Tab**: Monitor API requests
4. **Performance Profiling**: Track execution performance

## Conclusion

The code execution integration provides a powerful and user-friendly way to run code directly within the chat interface. It supports a wide range of programming languages, offers both synchronous and streaming execution modes, and includes comprehensive error handling and security measures.

The modular design makes it easy to extend and customize, while the comprehensive testing and documentation ensure reliable operation across different environments and use cases. 
/**
 * Utility for processing code blocks in streaming content
 * Handles incomplete code blocks during streaming and ensures consistent formatting
 */

export const processCodeBlocks = (content, options = {}) => {
  const {
    onCodeBlock = null,
    onTextSegment = null,
    isStreaming = false,
    theme = {}
  } = options;

  if (!content || !content.includes('```')) {
    return onTextSegment ? onTextSegment(content) : content;
  }

  const segments = [];
  const lines = content.split('\n');
  let lastIndex = 0;
  let inCodeBlock = false;
  let currentLang = "";
  let codeBlockCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Start of code block
    if (line.startsWith('```') && !inCodeBlock) {
      // Process any text before this code block
      const textBeforeCode = lines.slice(lastIndex, i).join('\n');
      if (textBeforeCode.trim()) {
        const textSegment = onTextSegment ? onTextSegment(textBeforeCode) : textBeforeCode;
        segments.push(textSegment);
      }
      
      inCodeBlock = true;
      currentLang = line.substring(3).trim() || 'code';
      lastIndex = i + 1; // Start collecting code from next line
      continue;
    }
    
    // End of code block
    if (line.startsWith('```') && inCodeBlock) {
      const codeContent = lines.slice(lastIndex, i).join('\n');
      
      if (onCodeBlock) {
        const codeBlock = onCodeBlock({
          language: currentLang,
          content: codeContent,
          isComplete: true,
          key: `code-${codeBlockCount++}`,
          theme
        });
        segments.push(codeBlock);
      }
      
      inCodeBlock = false;
      lastIndex = i + 1; // Start collecting text from next line
      continue;
    }
  }
  
  // Add any remaining text after the last code block (only if not in a code block)
  if (lastIndex < lines.length && !inCodeBlock) {
    const textAfterCode = lines.slice(lastIndex).join('\n');
    if (textAfterCode.trim()) {
      const textSegment = onTextSegment ? onTextSegment(textAfterCode) : textAfterCode;
      segments.push(textSegment);
    }
  }
  
  // If we're in the middle of a code block (streaming), show it as a partial code block
  if (inCodeBlock && lastIndex <= lines.length) {
    const partialCode = lines.slice(lastIndex).join('\n');
    
    if (onCodeBlock) {
      const codeBlock = onCodeBlock({
        language: currentLang,
        content: partialCode,
        isComplete: false,
        key: `partial-code-${codeBlockCount}`,
        theme
      });
      segments.push(codeBlock);
    }
  }
  
  return segments;
};

/**
 * Check if content contains incomplete code blocks
 */
export const hasIncompleteCodeBlock = (content) => {
  if (!content || !content.includes('```')) {
    return false;
  }

  const lines = content.split('\n');
  let inCodeBlock = false;
  let codeBlockCount = 0;

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        // Starting a code block
        inCodeBlock = true;
        codeBlockCount++;
      } else {
        // Ending a code block
        inCodeBlock = false;
      }
    }
  }

  // If we're still in a code block at the end, it's incomplete
  return inCodeBlock;
};

/**
 * Extract code blocks from content
 */
export const extractCodeBlocks = (content) => {
  const codeBlocks = [];
  
  if (!content || !content.includes('```')) {
    return codeBlocks;
  }

  const lines = content.split('\n');
  let inCodeBlock = false;
  let currentLang = "";
  let currentCode = [];
  let startIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.startsWith('```') && !inCodeBlock) {
      // Start of code block
      inCodeBlock = true;
      currentLang = line.substring(3).trim() || 'code';
      currentCode = [];
      startIndex = i;
    } else if (line.startsWith('```') && inCodeBlock) {
      // End of code block
      inCodeBlock = false;
      codeBlocks.push({
        language: currentLang,
        content: currentCode.join('\n'),
        startIndex,
        endIndex: i,
        isComplete: true
      });
    } else if (inCodeBlock) {
      // Inside code block
      currentCode.push(line);
    }
  }

  // Handle incomplete code block at the end
  if (inCodeBlock) {
    codeBlocks.push({
      language: currentLang,
      content: currentCode.join('\n'),
      startIndex,
      endIndex: lines.length - 1,
      isComplete: false
    });
  }

  return codeBlocks;
};

/**
 * Validate code block syntax
 */
export const validateCodeBlockSyntax = (content) => {
  const issues = [];
  
  if (!content) return issues;

  const lines = content.split('\n');
  let inCodeBlock = false;
  let codeBlockCount = 0;
  let lineNumber = 0;

  for (const line of lines) {
    lineNumber++;
    
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        // Starting a code block
        inCodeBlock = true;
        codeBlockCount++;
      } else {
        // Ending a code block
        inCodeBlock = false;
      }
    }
  }

  // Check for unclosed code blocks
  if (inCodeBlock) {
    issues.push({
      type: 'unclosed_code_block',
      message: 'Code block is not properly closed',
      lineNumber: lineNumber
    });
  }

  return issues;
}; 
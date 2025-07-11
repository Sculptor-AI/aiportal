// Test file to verify markdown formatting consistency
// This file can be run in the browser console to test markdown rendering

const testMarkdownContent = `
# Heading 1
## Heading 2
### Heading 3

This is a **bold** and *italic* text with a [link](https://example.com).

- Bullet point 1
- Bullet point 2
  - Nested bullet
- Bullet point 3

1. Numbered item 1
2. Numbered item 2
3. Numbered item 3

> This is a blockquote with some important information.

---

\`\`\`javascript
// Code block with syntax highlighting
function hello() {
  console.log("Hello, World!");
  return "Hello";
}
\`\`\`

\`\`\`python
# Python code block
def greet(name):
    print(f"Hello, {name}!")
    return f"Hello, {name}"
\`\`\`

Inline \`code\` example.

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
| Data 4   | Data 5   | Data 6   |

**Bold text** and *italic text* and ***bold italic text***.

Here's some math: $E = mc^2$ and display math:

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$
`;

// Test themes
const testThemes = {
  light: {
    name: 'light',
    text: '#000000',
    background: '#ffffff',
    primary: '#007AFF',
    border: 'rgba(0,0,0,0.1)',
    cardBackground: 'rgba(255,255,255,0.8)'
  },
  dark: {
    name: 'dark',
    text: '#ffffff',
    background: '#1c1c1e',
    primary: '#0A84FF',
    border: 'rgba(255,255,255,0.1)',
    cardBackground: 'rgba(30,30,30,0.8)'
  },
  oled: {
    name: 'oled',
    text: '#ffffff',
    background: '#000000',
    primary: '#0A84FF',
    border: 'rgba(255,255,255,0.1)',
    cardBackground: 'rgba(0,0,0,0.8)'
  }
};

// Test function to verify markdown rendering
function testMarkdownRendering() {
  console.log('Testing markdown rendering...');
  
  // Test each theme
  Object.entries(testThemes).forEach(([themeName, theme]) => {
    console.log(`\n--- Testing ${themeName} theme ---`);
    
    // Test code block processing
    const codeBlocks = testMarkdownContent.match(/```[\s\S]*?```/g);
    if (codeBlocks) {
      console.log(`Found ${codeBlocks.length} code blocks`);
      codeBlocks.forEach((block, index) => {
        console.log(`Code block ${index + 1}:`, block.substring(0, 50) + '...');
      });
    }
    
    // Test heading detection
    const headings = testMarkdownContent.match(/^#{1,6}\s.*$/gm);
    if (headings) {
      console.log(`Found ${headings.length} headings`);
      headings.forEach((heading, index) => {
        console.log(`Heading ${index + 1}:`, heading);
      });
    }
    
    // Test list detection
    const lists = testMarkdownContent.match(/^[\s]*[-*+]\s.*$/gm);
    if (lists) {
      console.log(`Found ${lists.length} list items`);
    }
    
    // Test link detection
    const links = testMarkdownContent.match(/\[([^\]]+)\]\(([^)]+)\)/g);
    if (links) {
      console.log(`Found ${links.length} links`);
      links.forEach((link, index) => {
        console.log(`Link ${index + 1}:`, link);
      });
    }
    
    // Test bold/italic detection
    const boldMatches = testMarkdownContent.match(/\*\*(.*?)\*\*/g);
    const italicMatches = testMarkdownContent.match(/\*(.*?)\*/g);
    console.log(`Found ${boldMatches ? boldMatches.length : 0} bold matches`);
    console.log(`Found ${italicMatches ? italicMatches.length : 0} italic matches`);
  });
  
  console.log('\n--- Markdown rendering test complete ---');
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testMarkdownRendering = testMarkdownRendering;
  window.testMarkdownContent = testMarkdownContent;
  window.testThemes = testThemes;
  
  console.log('Markdown test utilities loaded. Run testMarkdownRendering() to test.');
}

// Node.js export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testMarkdownRendering,
    testMarkdownContent,
    testThemes
  };
} 
import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import ReactKatex from '@pkasila/react-katex';
import 'katex/dist/katex.min.css'; // Required for KaTeX styling

// Import a LaTeX rendering library, now using @pkasila/react-katex
// We'll assume KaTeX is installed or @pkasila/react-katex handles it.
// import ReactKatex from '@pkasila/react-katex';
// import 'katex/dist/katex.min.css'; // Required for KaTeX

const EquationContainer = styled.div`
  position: fixed;
  top: 0;
  right: ${props => props.$otherPanelsOpen * 450}px; /* Shift right based on other panels */
  width: 450px; /* Same width as whiteboard */
  height: 100vh;
  background: ${props => props.theme.background};
  z-index: 1001; /* Slightly higher than whiteboard (1000) */
  display: flex;
  flex-direction: column;
  box-shadow: -3px 0 10px rgba(0, 0, 0, 0.15);
  border-left: 1px solid ${props => props.theme.border};
  transform: ${props => props.$isOpen ? 'translateX(0%)' : 'translateX(100%)'};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transition: transform 0.3s ease-in-out, visibility 0.3s ease-in-out;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.name === 'retro' ? props.theme.buttonFace : 'transparent'};
`;

const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  color: ${props => props.theme.text};
  font-family: ${props => props.theme.name === 'retro' ? 'MS Sans Serif, sans-serif' : 'inherit'};
`;

const CloseButton = styled.button`
  background: ${props => props.theme.name === 'retro' ? props.theme.buttonFace : 'transparent'};
  border: ${props => props.theme.name === 'retro' ? 
    `1px solid ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight}` : 
    'none'};
  color: ${props => props.theme.text};
  padding: ${props => props.theme.name === 'retro' ? '4px 12px' : '8px'};
  cursor: pointer;
  font-size: ${props => props.theme.name === 'retro' ? '12px' : '24px'};
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '4px'};
  
  &:hover {
    background: ${props => props.theme.name === 'retro' ? props.theme.buttonFace : 'rgba(0, 0, 0, 0.1)'};
  }
  
  &:active {
    ${props => props.theme.name === 'retro' && `
      border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
      padding: 5px 11px 3px 13px;
    `}
  }
`;

const ContentArea = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid ${props => props.theme.border};
  background-color: ${props => props.theme.chat};
  color: ${props => props.theme.text};
  font-family: monospace; // Good for LaTeX
  resize: vertical;
`;

const PreviewArea = styled.div`
  width: 100%;
  min-height: 50px;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid ${props => props.theme.border};
  background-color: ${props => props.theme.chat};
  color: ${props => props.theme.text};
  overflow-y: auto; // Add scroll for long equations
  // KaTeX specific styling might be needed here if default is not sufficient
  .katex-display {
    margin: 0; // Override default KaTeX display margins if any
    overflow-x: auto; // Allow horizontal scroll for very wide equations
    padding-bottom: 5px; // Space for scrollbar if it appears
  }
  .katex {
    font-size: 1em; // Adjust KaTeX font size to match surrounding text if needed
    color: ${props => props.theme.text}; // Ensure KaTeX text color matches theme
  }
  // Handle potential errors from KaTeX
  .katex-error {
    color: red; // Style KaTeX errors
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid ${props => props.theme.border};
`;

const Button = styled.button`
  padding: 8px 20px;
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '6px'};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => props.theme.name === 'retro' ? `
    background: ${props.theme.buttonFace};
    border: 1px solid ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight};
    color: ${props.theme.buttonText};
    box-shadow: 1px 1px 0 0 ${props.theme.buttonHighlightSoft} inset, -1px -1px 0 0 ${props.theme.buttonShadowSoft} inset;
    
    &:active {
      border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
      box-shadow: -1px -1px 0 0 ${props.theme.buttonHighlightSoft} inset, 1px 1px 0 0 ${props.theme.buttonShadowSoft} inset;
      padding: 9px 19px 7px 21px;
    }
  ` : `
    background: ${props.$primary ? props.theme.primary : 'transparent'};
    color: ${props.$primary ? 'white' : props.theme.text};
    border: 1px solid ${props.$primary ? props.theme.primary : props.theme.border};
    
    &:hover {
      background: ${props.$primary ? props.theme.primaryDark : props.theme.border};
      ${!props.$primary && `color: ${props.theme.text};`}
    }
  `}
`;

const SymbolPanel = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
  gap: 8px;
  padding: 10px;
  background-color: ${props => props.theme.chat || '#f0f0f0'}; // A slightly different background
  border-radius: 4px;
  border: 1px solid ${props => props.theme.border};
`;

const SymbolButton = styled.button`
  padding: 10px 5px;
  font-size: 1rem; // Increased font size for symbols
  background-color: ${props => props.theme.inputBackground || '#fff'};
  border: 1px solid ${props => props.theme.border};
  border-radius: 4px;
  cursor: pointer;
  color: ${props => props.theme.text};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.border || '#e0e0e0'};
  }

  // For KaTeX rendered labels if we use them later
  .katex {
    font-size: 1.1em !important; // Ensure KaTeX in button is legible
  }
`;

const EquationEditorModal = ({ isOpen, onClose, onSubmit, theme, otherPanelsOpen = 0 }) => {
  const [userInput, setUserInput] = useState('');
  const [latexOutput, setLatexOutput] = useState('');
  const textAreaRef = useRef(null);

  // Automatically focus the textarea when the modal opens
  useEffect(() => {
    if (isOpen && textAreaRef.current) {
      // Delay focus slightly to ensure the modal is fully rendered and transitions (if any) are complete
      const timer = setTimeout(() => {
        textAreaRef.current.focus();
      }, 100); // Small delay, adjust if needed
      return () => clearTimeout(timer);
    }
  }, [isOpen]); // Re-run when isOpen changes

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (isOpen && e.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const convertToLatex = useCallback((input) => {
    if (!input.trim()) return '';
    let latex = input;

    // Fractions: number/number or variable/variable etc.
    latex = latex.replace(/([a-zA-Z0-9]+(?:\.[0-9]+)?)\s*\/\s*([a-zA-Z0-9]+(?:\.[0-9]+)?)/g, '\\frac{$1}{$2}');

    // Exponents: x^2, x^{something}, x^2^2 -> x^{2^{2}}
    latex = latex.replace(/([a-zA-Z0-9]+(?:\([^)]*\))?|\([^)]+\))\^([a-zA-Z0-9]+(?:\{[^}]*\})?|\([^)]+\)|[^{}()\s]+)\^([a-zA-Z0-9]+(?:\{[^}]*\})?|\([^)]+\)|[^{}()\s]+)/g, '$1^{$2^{$3}}');
    latex = latex.replace(/([a-zA-Z0-9_]+(?:\([^)]*\))?|\([^)]+\))\^([a-zA-Z0-9_]+(?:\{[^}]*\})?|\([^)]+\)|[^{}()\s]+)/g, '$1^{$2}');

    // Subscripts: x_1, x_{ab}
    latex = latex.replace(/([a-zA-Z0-9]+)_([a-zA-Z0-9]+|\{[^}]*\})/g, '$1_{$2}');

    // Common functions (sin, cos, sqrt, abs, etc.)
    const functions = ['sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'abs'];
    functions.forEach(func => {
      // Handles func(expression) -> \func{expression}
      const funcRegex = new RegExp(`\\b${func}\\s*\\(([^)]*)\\)`, 'g');
      latex = latex.replace(funcRegex, `\\${func}{$1}`);
      // Handles \funcName (already LaTeX) - keep it as is but ensure it displays
      const alreadyLatexFuncRegex = new RegExp(`\\\\${func}`, 'g');
      if (!alreadyLatexFuncRegex.test(latex)){
         // Handles func without parens if it's a known keyword like pi, not for sqrt/abs that need args
         if (func !== 'sqrt' && func !== 'abs') {
            const keywordRegex = new RegExp(`(?<!\\\\)${func}(?!\\w)`, 'g');
            latex = latex.replace(keywordRegex, `\\${func}`);
         }
      }
    });
    
    // Pi
    latex = latex.replace(/(?<!\\\\)\bpi\b/g, '\\pi');

    // Common greek letters
    const greekMap = {
      alpha: '\\alpha',
      beta: '\\beta',
      gamma: '\\gamma',
      delta: '\\delta',
      theta: '\\theta',
      lambda: '\\lambda',
      mu: '\\mu',
      sigma: '\\sigma',
      omega: '\\omega'
    };
    Object.entries(greekMap).forEach(([word, cmd]) => {
      const regex = new RegExp(`(?<!\\\\)\\b${word}\\b`, 'gi');
      latex = latex.replace(regex, cmd);
    });

    // Comparisons
    latex = latex.replace(/\s*(>=|=>)\s*/g, ' \\geq ');
    latex = latex.replace(/\s*(<=|=<)\s*/g, ' \\leq ');
    // Ensure simple > and < are spaced, but don't convert to \gt or \lt unless necessary for complex HTML/XML contexts
    latex = latex.replace(/\s*<\s*/g, ' < ');
    latex = latex.replace(/\s*>\s*/g, ' > ');

    // Multiplication
    latex = latex.replace(/\s*\*\s*/g, ' \\cdot ');

    return latex.trim();
  }, []);

  useEffect(() => {
    const converted = convertToLatex(userInput);
    setLatexOutput(converted);
  }, [userInput, convertToLatex]);

  const insertText = (textToInsert, moveCursor = 0) => {
    if (textAreaRef.current) {
      textAreaRef.current.focus(); // Ensure focus before reading selection properties
      
      const start = textAreaRef.current.selectionStart;
      const end = textAreaRef.current.selectionEnd;
      const currentText = textAreaRef.current.value; // Use current value from textarea
      
      const before = currentText.substring(0, start);
      const after = currentText.substring(end, currentText.length);
      
      const newText = before + textToInsert + after;
      setUserInput(newText);

      const newCursorPos = start + textToInsert.length + moveCursor;
      
      setTimeout(() => {
        if (textAreaRef.current) { // Re-check ref in case component unmounted quickly
          textAreaRef.current.focus();
          textAreaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
  };

  // Button configurations
  const symbolButtons = [
    { label: 'x', insert: 'x' }, { label: 'y', insert: 'y' }, 
    { label: 'a²', insert: 'a^2', isLatexLabel: true }, { label: 'aᵇ', insert: 'a^b', isLatexLabel: true },
    { label: '(', insert: '(' }, { label: ')', insert: ')' },
    { label: '<', insert: ' < ' }, { label: '>', insert: ' > ' },
    { label: '|a|', insert: 'abs()', moveCursor: -1 }, { label: ',', insert: ', ' }, // move cursor inside abs()
    { label: '≤', insert: ' <= ' }, { label: '≥', insert: ' >= ' },
    { label: '√', insert: 'sqrt()', moveCursor: -1 }, { label: 'π', insert: 'pi' }, // move cursor inside sqrt()
    // Add more buttons as needed, for example:
    // { label: '/', insert: '/' }, { label: '+', insert: '+' }, { label: '-', insert: '-' }, { label: '', insert: ''}
  ];

  const handleSubmit = () => {
    onSubmit(latexOutput);
    setUserInput(''); // Clear input for next use
    setLatexOutput('');
    onClose();
  };

  const handleCancel = () => {
    setUserInput(''); // Clear input on cancel
    setLatexOutput('');
    onClose();
  };

  return (
    <EquationContainer $isOpen={isOpen} $otherPanelsOpen={otherPanelsOpen}>
      <Header>
        <Title>Equation Editor</Title>
        <CloseButton onClick={onClose}>
          {theme?.name === 'retro' ? '✕' : '×'}
        </CloseButton>
      </Header>
      
      <ContentArea>
        <SymbolPanel theme={theme}>
          {symbolButtons.map((btn, index) => (
            <SymbolButton 
              theme={theme} 
              key={index} 
              onClick={() => insertText(btn.insert, btn.moveCursor)}
              type="button" // Prevent form submission
            >
              {/* If we want to render LaTeX on buttons eventually: */}
              {/* btn.isLatexLabel ? <Latex>{`$${btn.label}$`}</Latex> : btn.label */}
              {btn.label} 
            </SymbolButton>
          ))}
        </SymbolPanel>
        <TextArea
          ref={textAreaRef}
          theme={theme}
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type math or use buttons: 1/2 + x^2, sqrt(pi)"
        />
        <PreviewArea theme={theme}>
          {latexOutput.trim() ? (
            <ReactKatex displayMode={true}>{`$$${latexOutput}$$`}</ReactKatex>
          ) : (
            <p style={{ opacity: 0.6 }}>Preview will appear here...</p>
          )}
        </PreviewArea>
      </ContentArea>
      
      <ButtonContainer>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button $primary onClick={handleSubmit} disabled={!latexOutput.trim()}>Done</Button>
      </ButtonContainer>
    </EquationContainer>
  );
};

export default EquationEditorModal; 
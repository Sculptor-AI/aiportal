import React, { useState, useRef, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import ReactKatex from '@pkasila/react-katex';
import 'katex/dist/katex.min.css';
import { useTranslation } from '../contexts/TranslationContext';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
`;

// Styled Components (mimicking SettingsModal for consistency)
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  animation: ${fadeIn} 0.25s ease-out;
`;

const ModalContent = styled.div`
  background-color: ${props => props.theme.sidebar || '#1e1e1e'};
  color: ${props => props.theme.text || '#fff'};
  border-radius: 16px;
  width: 900px;
  max-width: 95vw;
  height: 85vh;
  max-height: 800px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
  border: 1px solid ${props => props.theme.border || 'rgba(255,255,255,0.1)'};
  overflow: hidden;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background-color: ${props => props.theme.header || 'rgba(0,0,0,0.2)'};
  border-bottom: 1px solid ${props => props.theme.border || 'rgba(255,255,255,0.1)'};
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  
  svg {
    opacity: 0.8;
  }
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.theme.text};
  opacity: 0.6;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    opacity: 1;
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const MainLayout = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Sidebar = styled.div`
  width: 260px;
  background-color: ${props => props.theme.cardBackground || 'rgba(0,0,0,0.05)'};
  border-right: 1px solid ${props => props.theme.border || 'rgba(255,255,255,0.1)'};
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  
  @media (max-width: 768px) {
    width: 100%;
    height: 150px;
    border-right: none;
    border-bottom: 1px solid ${props => props.theme.border};
  }
`;

const EditorArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
`;

const PreviewSection = styled.div`
  flex: 1;
  padding: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.theme.background || '#121212'};
  overflow-y: auto;
  min-height: 150px;
  position: relative;
  
  /* Grid pattern background */
  background-image: radial-gradient(${props => props.theme.border || '#333'} 1px, transparent 1px);
  background-size: 20px 20px;
`;

const PreviewContainer = styled.div`
  font-size: 2rem;
  color: ${props => props.theme.text};
  text-align: center;
  max-width: 100%;
  overflow-x: auto;
  padding: 20px;
  
  .katex-display {
    margin: 0;
  }
  
  .katex-error {
    color: #ff6b6b;
    font-size: 1rem;
    font-family: monospace;
    background: rgba(255, 0, 0, 0.1);
    padding: 10px;
    border-radius: 8px;
  }
`;

const InputSection = styled.div`
  height: 200px;
  padding: 20px;
  background-color: ${props => props.theme.sidebar || '#1e1e1e'};
  border-top: 1px solid ${props => props.theme.border || 'rgba(255,255,255,0.1)'};
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const TextArea = styled.textarea`
  flex: 1;
  background-color: ${props => props.theme.inputBackground || 'rgba(0,0,0,0.2)'};
  border: 1px solid ${props => props.theme.border || 'rgba(255,255,255,0.1)'};
  color: ${props => props.theme.text};
  border-radius: 8px;
  padding: 15px;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 1rem;
  resize: none;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: ${props => props.theme.primary || '#0078d7'};
  }
  
  &::placeholder {
    opacity: 0.4;
  }
`;

const CategoryTabs = styled.div`
  display: flex;
  gap: 5px;
  padding: 10px;
  overflow-x: auto;
  border-bottom: 1px solid ${props => props.theme.border};
  
  &::-webkit-scrollbar {
    height: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.border};
    border-radius: 2px;
  }
`;

const CategoryTab = styled.button`
  background: ${props => props.$active ? props.theme.primary + '20' : 'transparent'};
  border: 1px solid ${props => props.$active ? props.theme.primary : 'transparent'};
  color: ${props => props.$active ? props.theme.primary : props.theme.text};
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.theme.primary + '10'};
  }
`;

const SymbolGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(45px, 1fr));
  gap: 8px;
  padding: 15px;
`;

const SymbolBtn = styled.button`
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.theme.buttonFace || 'rgba(255,255,255,0.05)'};
  border: 1px solid ${props => props.theme.border || 'transparent'};
  border-radius: 8px;
  color: ${props => props.theme.text};
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  &:hover {
    background: ${props => props.theme.primary + '20'};
    border-color: ${props => props.theme.primary};
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }

  &:active {
    transform: translateY(0);
  }
  
  /* Tooltip logic could go here */
`;

const Footer = styled.div`
  padding: 16px 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid ${props => props.theme.border || 'rgba(255,255,255,0.1)'};
  background-color: ${props => props.theme.header};
`;

const ActionButton = styled.button`
  padding: 10px 24px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.95rem;
  
  ${props => props.$primary ? css`
    background-color: ${props.theme.primary || '#0078d7'};
    color: white;
    border: none;
    
    &:hover {
      filter: brightness(1.1);
      box-shadow: 0 4px 12px ${props.theme.primary}40;
    }
  ` : css`
    background-color: transparent;
    color: ${props.theme.text};
    border: 1px solid ${props.theme.border};
    
    &:hover {
      background-color: rgba(255,255,255,0.05);
    }
  `}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    filter: none;
  }
`;

// Categories and Symbols Configuration
const SYMBOL_CATEGORIES = {
  basic: {
    label: "Basic",
    symbols: [
      { label: "+", insert: "+" },
      { label: "-", insert: "-" },
      { label: "×", insert: "\\times" },
      { label: "÷", insert: "\\div" },
      { label: "=", insert: "=" },
      { label: "≠", insert: "\\neq" },
      { label: "±", insert: "\\pm" },
      { label: "( )", insert: "($0)" },
      { label: "[ ]", insert: "[$0]" },
      { label: "{ }", insert: "\\{$0\\}" },
      { label: "x/y", insert: "\\frac{$0}{}" },
      { label: "x²", insert: "^{2}" },
      { label: "√", insert: "\\sqrt{$0}" },
      { label: "∞", insert: "\\infty" },
    ]
  },
  greek: {
    label: "Greek",
    symbols: [
      { label: "α", insert: "\\alpha" },
      { label: "β", insert: "\\beta" },
      { label: "γ", insert: "\\gamma" },
      { label: "δ", insert: "\\delta" },
      { label: "Δ", insert: "\\Delta" },
      { label: "θ", insert: "\\theta" },
      { label: "λ", insert: "\\lambda" },
      { label: "μ", insert: "\\mu" },
      { label: "π", insert: "\\pi" },
      { label: "σ", insert: "\\sigma" },
      { label: "Σ", insert: "\\Sigma" },
      { label: "φ", insert: "\\phi" },
      { label: "ω", insert: "\\omega" },
      { label: "Ω", insert: "\\Omega" },
    ]
  },
  relations: {
    label: "Relations",
    symbols: [
      { label: "<", insert: "<" },
      { label: ">", insert: ">" },
      { label: "≤", insert: "\\leq" },
      { label: "≥", insert: "\\geq" },
      { label: "∈", insert: "\\in" },
      { label: "∉", insert: "\\notin" },
      { label: "⊂", insert: "\\subset" },
      { label: "⊃", insert: "\\supset" },
      { label: "≈", insert: "\\approx" },
      { label: "≡", insert: "\\equiv" },
      { label: "∀", insert: "\\forall" },
      { label: "∃", insert: "\\exists" },
    ]
  },
  calculus: {
    label: "Calculus",
    symbols: [
      { label: "∫", insert: "\\int" },
      { label: "∫ab", insert: "\\int_{a}^{b}" },
      { label: "∑", insert: "\\sum" },
      { label: "∂", insert: "\\partial" },
      { label: "lim", insert: "\\lim_{x \\to 0}" },
      { label: "dy/dx", insert: "\\frac{dy}{dx}" },
      { label: "∇", insert: "\\nabla" },
      { label: "→", insert: "\\to" },
      { label: "sin", insert: "\\sin" },
      { label: "cos", insert: "\\cos" },
      { label: "tan", insert: "\\tan" },
      { label: "log", insert: "\\log" },
      { label: "ln", insert: "\\ln" },
    ]
  },
  arrows: {
    label: "Arrows",
    symbols: [
      { label: "←", insert: "\\leftarrow" },
      { label: "→", insert: "\\rightarrow" },
      { label: "↔", insert: "\\leftrightarrow" },
      { label: "⇐", insert: "\\Leftarrow" },
      { label: "⇒", insert: "\\Rightarrow" },
      { label: "⇔", insert: "\\Leftrightarrow" },
      { label: "↑", insert: "\\uparrow" },
      { label: "↓", insert: "\\downarrow" },
    ]
  }
};

const EquationEditorModal = ({ isOpen, onClose, onSubmit, theme }) => {
  const { t } = useTranslation();
  const [userInput, setUserInput] = useState('');
  const [latexOutput, setLatexOutput] = useState('');
  const [activeCategory, setActiveCategory] = useState('basic');
  const textAreaRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        textAreaRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isOpen && e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Smart conversion logic (Natural Text -> LaTeX)
  const convertToLatex = (input) => {
    if (!input) return '';
    let latex = input;

    // 1. Fractions: (expr)/(expr) or val/val, handling optional spaces
    // We handle parentheses groups first to allow (a+b)/(c+d)
    latex = latex.replace(/(\([^)]+\))\s*\/\s*(\([^)]+\))/g, '\\frac{$1}{$2}'); // (a) / (b)
    latex = latex.replace(/(\([^)]+\))\s*\/\s*([a-zA-Z0-9\.]+)/g, '\\frac{$1}{$2}'); // (a) / b
    latex = latex.replace(/([a-zA-Z0-9\.]+)\s*\/\s*(\([^)]+\))/g, '\\frac{$1}{$2}'); // a / (b)
    latex = latex.replace(/([a-zA-Z0-9\.]+)\s*\/\s*([a-zA-Z0-9\.]+)/g, '\\frac{$1}{$2}'); // a / b

    // Cleanup parens inside fractions if they were just wrappers for the division
    // e.g. \frac{(a+b)}{(c)} -> \frac{a+b}{c} (optional, strictly speaking { (a) } is valid latex)

    // 2. Exponents: val^val
    latex = latex.replace(/([a-zA-Z0-9]+)\s*\^\s*([a-zA-Z0-9]+)/g, '$1^{$2}');

    // 3. Greek Letters & Constants
    const map = {
      'alpha': '\\alpha', 'beta': '\\beta', 'gamma': '\\gamma', 'delta': '\\delta',
      'theta': '\\theta', 'pi': '\\pi', 'sigma': '\\sigma', 'omega': '\\omega',
      'lambda': '\\lambda', 'mu': '\\mu', 'phi': '\\phi', 'infinity': '\\infty', 'inf': '\\infty'
    };

    // Replace whole words only
    Object.keys(map).forEach(key => {
      const regex = new RegExp(`(?<!\\\\)\\b${key}\\b`, 'g'); // negative lookbehind to avoid replacing already latex'd cmds
      latex = latex.replace(regex, map[key]);
    });

    // 4. Functions
    // sqrt(x) -> \sqrt{x}, allowing space like sqrt (x)
    latex = latex.replace(/sqrt\s*\(([^)]+)\)/g, '\\sqrt{$1}');
    // sin(x) -> \sin(x), etc.
    const funcs = ['sin', 'cos', 'tan', 'log', 'ln', 'lim'];
    funcs.forEach(fn => {
      // Look for function name followed by optional space and optional paren
      // matching "sin " or "sin(" but not "sink"
      const regex = new RegExp(`\\b${fn}(?![a-zA-Z])`, 'g');
      latex = latex.replace(regex, `\\${fn}`);
    });

    // 5. Operators
    latex = latex.replace(/<=\s*/g, '\\leq ');
    latex = latex.replace(/>=\s*/g, '\\geq ');
    latex = latex.replace(/!=\s*/g, '\\neq ');
    // latex = latex.replace(/\*/g, '\\cdot'); // Optional: * to dot, might be annoying if user wants *

    return latex;
  };

  useEffect(() => {
    setLatexOutput(convertToLatex(userInput));
  }, [userInput]);

  const insertText = (text, cursorOffset = 0) => {
    if (!textAreaRef.current) return;

    const input = textAreaRef.current;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const currentVal = input.value;

    // Handle $0 placeholder
    const hasPlaceholder = text.includes('$0');
    const actualText = hasPlaceholder ? text.replace('$0', '') : text;

    const newVal = currentVal.substring(0, start) + actualText + currentVal.substring(end);
    setUserInput(newVal);

    // Calculate cursor position
    const newPos = hasPlaceholder
      ? start + text.indexOf('$0')
      : start + actualText.length + cursorOffset;

    setTimeout(() => {
      input.focus();
      input.setSelectionRange(newPos, newPos);
    }, 0);
  };

  // Modified symbol maps for "Natural" typing
  const insertMap = {
    // Basic
    '+': '+', '-': '-', '×': '*', '÷': '/', '=': '=', '≠': '!=', '±': '\\pm',
    '( )': '($0)', '[ ]': '[$0]', '{ }': '{$0}',
    'x/y': '($0)/()', // Encourages fraction format
    'x²': '^2', '√': 'sqrt($0)', '∞': 'infinity',
    // Greek
    'α': 'alpha', 'β': 'beta', 'γ': 'gamma', 'δ': 'delta', 'Δ': '\\Delta',
    'θ': 'theta', 'λ': 'lambda', 'μ': 'mu', 'π': 'pi', 'σ': 'sigma',
    'Σ': '\\Sigma', 'φ': 'phi', 'ω': 'omega', 'Ω': '\\Omega',
    // Relations
    '<': '<', '>': '>', '≤': '<=', '≥': '>=', '∈': '\\in', '∉': '\\notin',
    '⊂': '\\subset', '⊃': '\\supset', '≈': '\\approx', '≡': '\\equiv',
    '∀': '\\forall', '∃': '\\exists',
    // Calculus
    '∫': '\\int', '∫ab': '\\int_{a}^{b}', '∑': '\\sum', '∂': '\\partial',
    'lim': 'lim', 'dy/dx': '\\frac{dy}{dx}', '∇': '\\nabla', '→': '\\to',
    'sin': 'sin($0)', 'cos': 'cos($0)', 'tan': 'tan($0)',
    'log': 'log($0)', 'ln': 'ln($0)',
    // Arrows
    '←': '\\leftarrow', '↔': '\\leftrightarrow',
    '⇐': '\\Leftarrow', '⇒': '\\Rightarrow', '⇔': '\\Leftrightarrow',
    '↑': '\\uparrow', '↓': '\\downarrow'
  };

  const getInsertValue = (symbolObj) => {
    // Use the mapping if available, otherwise fallback to the label or existing insert
    if (insertMap[symbolObj.label]) return insertMap[symbolObj.label];
    // Some complex symbols might still need direct latex if natural parsing is too hard
    return symbolObj.insert;
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={(e) => e.target === e.currentTarget && onClose()}>
      <ModalContent theme={theme}>
        <ModalHeader theme={theme}>
          <ModalTitle>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 18h16M4 6h16M9 12h6" />
            </svg>
            {t('equation.title', 'Equation Editor')}
          </ModalTitle>
          <CloseButton onClick={onClose} theme={theme}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </CloseButton>
        </ModalHeader>

        <MainLayout>
          <Sidebar theme={theme}>
            <CategoryTabs theme={theme}>
              {Object.entries(SYMBOL_CATEGORIES).map(([key, category]) => (
                <CategoryTab
                  key={key}
                  theme={theme}
                  $active={activeCategory === key}
                  onClick={() => setActiveCategory(key)}
                >
                  {category.label}
                </CategoryTab>
              ))}
            </CategoryTabs>
            <SymbolGrid>
              {SYMBOL_CATEGORIES[activeCategory].symbols.map((symbol, idx) => (
                <SymbolBtn
                  key={idx}
                  theme={theme}
                  onClick={() => insertText(getInsertValue(symbol))}
                  title={symbol.label}
                >
                  {symbol.label}
                </SymbolBtn>
              ))}
            </SymbolGrid>
          </Sidebar>

          <EditorArea>
            <PreviewSection theme={theme}>
              <PreviewContainer theme={theme}>
                {latexOutput ? (
                  <ReactKatex key={latexOutput} displayMode={true} errorColor={'#cc0000'}>{latexOutput}</ReactKatex>
                ) : (
                  <div style={{ opacity: 0.3, fontSize: '1rem', fontStyle: 'italic' }}>
                    {t('equation.preview.hint')}
                  </div>
                )}
              </PreviewContainer>
            </PreviewSection>

            <InputSection theme={theme}>
                <TextArea
                  ref={textAreaRef}
                  theme={theme}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={t('equation.input.placeholder')}
                  spellCheck={false}
                />
              <div style={{ fontSize: '0.8rem', opacity: 0.6, textAlign: 'right', marginTop: '5px' }}>
                {t('equation.preview.typing', 'Typing: "{{input}}" → Renders as LaTeX', { input: userInput })}
              </div>
            </InputSection>
          </EditorArea>
        </MainLayout>

        <Footer theme={theme}>
          <ActionButton theme={theme} onClick={onClose}>
            {t('equation.button.cancel')}
          </ActionButton>
          <ActionButton
            theme={theme}
            $primary
            onClick={() => onSubmit(latexOutput)}
            disabled={!latexOutput.trim()}
          >
            {t('equation.button.insert')}
          </ActionButton>
        </Footer>
      </ModalContent>
    </ModalOverlay>
  );
};

export default EquationEditorModal;

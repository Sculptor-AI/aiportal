import React, { useEffect, useRef, useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import ReactKatex from '@pkasila/react-katex';
import 'katex/dist/katex.min.css';
import 'mathlive';
import { useTranslation } from '../contexts/TranslationContext';

const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
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
  width: 980px;
  max-width: 96vw;
  height: 86vh;
  max-height: 860px;
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
  width: 290px;
  background-color: ${props => props.theme.cardBackground || 'rgba(0,0,0,0.05)'};
  border-right: 1px solid ${props => props.theme.border || 'rgba(255,255,255,0.1)'};
  display: flex;
  flex-direction: column;
  overflow-y: auto;

  @media (max-width: 768px) {
    width: 100%;
    min-height: 240px;
    border-right: none;
    border-bottom: 1px solid ${props => props.theme.border || 'rgba(255,255,255,0.1)'};
  }
`;

const EditorArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const PreviewSection = styled.div`
  flex: 1;
  padding: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at top left, rgba(255,255,255,0.05), transparent 40%),
    ${props => props.theme.background || '#121212'};
  overflow-y: auto;
  min-height: 170px;
  position: relative;
`;

const PreviewContainer = styled.div`
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  padding: 24px;
  border-radius: 18px;
  background: rgba(0, 0, 0, 0.18);
  border: 1px solid ${props => props.theme.border || 'rgba(255,255,255,0.1)'};
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  text-align: center;
  font-size: 2rem;

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

const EditorSection = styled.div`
  padding: 20px;
  background-color: ${props => props.theme.sidebar || '#1e1e1e'};
  border-top: 1px solid ${props => props.theme.border || 'rgba(255,255,255,0.1)'};
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const HelperText = styled.div`
  font-size: 0.9rem;
  line-height: 1.45;
  color: ${props => props.theme.text || '#fff'};
  opacity: 0.72;
`;

const ToolbarRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const UtilityButton = styled.button`
  border: 1px solid ${props => props.theme.border || 'rgba(255,255,255,0.14)'};
  background: rgba(255, 255, 255, 0.04);
  color: ${props => props.theme.text || '#fff'};
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => props.theme.primary || '#0078d7'};
    background: ${props => `${props.theme.primary || '#0078d7'}18`};
  }
`;

const MathFieldShell = styled.div`
  border: 1px solid ${props => props.theme.border || 'rgba(255,255,255,0.1)'};
  border-radius: 16px;
  padding: 16px 18px;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01)),
    ${props => props.theme.inputBackground || 'rgba(0,0,0,0.2)'};
  min-height: 136px;

  math-field {
    width: 100%;
    min-height: 96px;
    background: transparent;
    border: none;
    color: ${props => props.theme.text || '#fff'};
    font-size: 1.6rem;
    line-height: 1.45;
    --hue: 210;
    --placeholder-color: ${props => props.theme.text || '#fff'};
    --selection-background-color: ${props => `${props.theme.primary || '#0078d7'}33`};
    --caret-color: ${props => props.theme.primary || '#0078d7'};
  }

  math-field:focus {
    outline: none;
  }
`;

const StatusRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  font-size: 0.82rem;
`;

const StatusText = styled.div`
  color: ${props => props.$warning ? '#ffb86b' : props.theme.text || '#fff'};
  opacity: ${props => props.$warning ? 1 : 0.7};
`;

const LatexOutput = styled.pre`
  margin: 0;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid ${props => props.theme.border || 'rgba(255,255,255,0.08)'};
  color: ${props => props.theme.text || '#fff'};
  font-size: 0.88rem;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: 'Fira Code', 'Consolas', monospace;
  min-height: 56px;
`;

const CategoryTabs = styled.div`
  display: flex;
  gap: 5px;
  padding: 10px;
  overflow-x: auto;
  border-bottom: 1px solid ${props => props.theme.border || 'rgba(255,255,255,0.1)'};

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.border || 'rgba(255,255,255,0.1)'};
    border-radius: 2px;
  }
`;

const CategoryTab = styled.button`
  background: ${props => props.$active ? `${props.theme.primary || '#0078d7'}20` : 'transparent'};
  border: 1px solid ${props => props.$active ? props.theme.primary || '#0078d7' : 'transparent'};
  color: ${props => props.$active ? props.theme.primary || '#0078d7' : props.theme.text || '#fff'};
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => `${props.theme.primary || '#0078d7'}12`};
  }
`;

const SymbolGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  padding: 14px;
`;

const SymbolBtn = styled.button`
  min-height: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: ${props => props.theme.buttonFace || 'rgba(255,255,255,0.05)'};
  border: 1px solid ${props => props.theme.border || 'transparent'};
  border-radius: 12px;
  color: ${props => props.theme.text || '#fff'};
  font-size: 0.98rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  padding: 8px;

  &:hover {
    background: ${props => `${props.theme.primary || '#0078d7'}18`};
    border-color: ${props => props.theme.primary || '#0078d7'};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const Footer = styled.div`
  padding: 16px 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid ${props => props.theme.border || 'rgba(255,255,255,0.1)'};
  background-color: ${props => props.theme.header || 'rgba(0,0,0,0.2)'};
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
      box-shadow: 0 4px 12px ${props.theme.primary || '#0078d7'}40;
    }
  ` : css`
    background-color: transparent;
    color: ${props.theme.text || '#fff'};
    border: 1px solid ${props.theme.border || 'rgba(255,255,255,0.1)'};

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

const INLINE_SHORTCUTS = {
  alpha: '\\alpha',
  beta: '\\beta',
  gamma: '\\gamma',
  delta: '\\delta',
  theta: '\\theta',
  lambda: '\\lambda',
  mu: '\\mu',
  pi: '\\pi',
  sigma: '\\sigma',
  phi: '\\phi',
  omega: '\\omega',
  oo: '\\infty',
  inf: '\\infty',
  infty: '\\infty',
  infinity: '\\infty',
  '!=': '\\neq',
  '<=': '\\leq',
  '>=': '\\geq',
  '->': '\\to'
};

const SYMBOL_CATEGORIES = {
  basic: {
    label: 'Basic',
    symbols: [
      { label: '+', insert: '+' },
      { label: '-', insert: '-' },
      { label: '=', insert: '=' },
      { label: 'x/y', insert: '\\frac{\\placeholder{}}{\\placeholder{}}' },
      { label: 'x^2', action: 'square' },
      { label: 'x^n', action: 'superscript' },
      { label: 'x_n', action: 'subscript' },
      { label: 'sqrt', insert: '\\sqrt{\\placeholder{}}' },
      { label: 'nth', insert: '\\sqrt[\\placeholder{}]{\\placeholder{}}' },
      { label: '( )', insert: '\\left(\\placeholder{}\\right)' },
      { label: '[ ]', insert: '\\left[\\placeholder{}\\right]' },
      { label: '|x|', insert: '\\left|\\placeholder{}\\right|' }
    ]
  },
  greek: {
    label: 'Greek',
    symbols: [
      { label: 'alpha', insert: '\\alpha' },
      { label: 'beta', insert: '\\beta' },
      { label: 'gamma', insert: '\\gamma' },
      { label: 'delta', insert: '\\delta' },
      { label: 'theta', insert: '\\theta' },
      { label: 'lambda', insert: '\\lambda' },
      { label: 'mu', insert: '\\mu' },
      { label: 'pi', insert: '\\pi' },
      { label: 'sigma', insert: '\\sigma' },
      { label: 'phi', insert: '\\phi' },
      { label: 'omega', insert: '\\omega' },
      { label: 'infty', insert: '\\infty' }
    ]
  },
  functions: {
    label: 'Functions',
    symbols: [
      { label: 'sin', insert: '\\sin\\left(\\placeholder{}\\right)' },
      { label: 'cos', insert: '\\cos\\left(\\placeholder{}\\right)' },
      { label: 'tan', insert: '\\tan\\left(\\placeholder{}\\right)' },
      { label: 'log', insert: '\\log\\left(\\placeholder{}\\right)' },
      { label: 'ln', insert: '\\ln\\left(\\placeholder{}\\right)' },
      { label: 'lim', insert: '\\lim_{\\placeholder{} \\to \\placeholder{}}' },
      { label: 'sum', insert: '\\sum_{\\placeholder{}=\\placeholder{}}^{\\placeholder{}}' },
      { label: 'prod', insert: '\\prod_{\\placeholder{}=\\placeholder{}}^{\\placeholder{}}' },
      { label: 'int', insert: '\\int \\placeholder{}\\,d\\placeholder{}' }
    ]
  },
  relations: {
    label: 'Relations',
    symbols: [
      { label: '<', insert: '<' },
      { label: '>', insert: '>' },
      { label: '<=', insert: '\\leq' },
      { label: '>=', insert: '\\geq' },
      { label: '!=', insert: '\\neq' },
      { label: 'approx', insert: '\\approx' },
      { label: 'in', insert: '\\in' },
      { label: 'subset', insert: '\\subset' },
      { label: 'to', insert: '\\to' }
    ]
  }
};

const EquationEditorModal = ({ isOpen, onClose, onSubmit, theme }) => {
  const { t } = useTranslation();
  const mathFieldRef = useRef(null);
  const [activeCategory, setActiveCategory] = useState('basic');
  const [rawLatexOutput, setRawLatexOutput] = useState('');
  const [latexOutput, setLatexOutput] = useState('');
  const [hasPlaceholders, setHasPlaceholders] = useState(false);

  const syncOutputs = () => {
    const mathField = mathFieldRef.current;
    if (!mathField) return;

    const rawLatex = mathField.getValue().trim();
    const sanitizedLatex = mathField.getValue('latex-without-placeholders').trim();

    setRawLatexOutput(rawLatex);
    setLatexOutput(sanitizedLatex);
    setHasPlaceholders(rawLatex.includes('\\placeholder'));
  };

  const handleSubmit = () => {
    if (!latexOutput.trim() || hasPlaceholders) return;

    onSubmit(latexOutput.trim());

    if (mathFieldRef.current) {
      mathFieldRef.current.setValue('');
    }

    setRawLatexOutput('');
    setLatexOutput('');
    setHasPlaceholders(false);
  };

  useEffect(() => {
    if (!isOpen) return undefined;

    const mathField = mathFieldRef.current;
    if (!mathField) return undefined;

    mathField.smartFence = true;
    mathField.smartMode = true;
    mathField.smartSuperscript = true;
    mathField.inlineShortcutTimeout = 750;
    mathField.mathVirtualKeyboardPolicy = window.matchMedia('(max-width: 768px)').matches ? 'auto' : 'manual';
    mathField.inlineShortcuts = {
      ...mathField.inlineShortcuts,
      ...INLINE_SHORTCUTS
    };

    const handleInput = () => syncOutputs();
    mathField.addEventListener('input', handleInput);
    mathField.addEventListener('change', handleInput);

    syncOutputs();

    const focusTimer = window.setTimeout(() => {
      mathField.focus();
    }, 80);

    return () => {
      window.clearTimeout(focusTimer);
      mathField.removeEventListener('input', handleInput);
      mathField.removeEventListener('change', handleInput);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, latexOutput, hasPlaceholders, onClose]);

  const applySymbol = (symbol) => {
    const mathField = mathFieldRef.current;
    if (!mathField) return;

    mathField.focus();

    if (symbol.action === 'square') {
      mathField.executeCommand('moveToSuperscript');
      mathField.insert('2', { selectionMode: 'after', focus: true });
      syncOutputs();
      return;
    }

    if (symbol.action === 'superscript') {
      mathField.executeCommand('moveToSuperscript');
      syncOutputs();
      return;
    }

    if (symbol.action === 'subscript') {
      mathField.executeCommand('moveToSubscript');
      syncOutputs();
      return;
    }

    mathField.insert(symbol.insert, {
      selectionMode: symbol.insert.includes('\\placeholder') ? 'placeholder' : 'after',
      focus: true,
      scrollIntoView: true
    });

    syncOutputs();
  };

  const clearField = () => {
    const mathField = mathFieldRef.current;
    if (!mathField) return;

    mathField.setValue('');
    mathField.focus();
    syncOutputs();
  };

  const toggleVirtualKeyboard = () => {
    const mathField = mathFieldRef.current;
    if (!mathField) return;

    mathField.executeCommand('toggleVirtualKeyboard');
    mathField.focus();
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={(event) => event.target === event.currentTarget && onClose()}>
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
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
              {SYMBOL_CATEGORIES[activeCategory].symbols.map((symbol) => (
                <SymbolBtn
                  key={`${activeCategory}-${symbol.label}`}
                  theme={theme}
                  onClick={() => applySymbol(symbol)}
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
                  <ReactKatex
                    key={latexOutput}
                    displayMode={true}
                    throwOnError={false}
                    strict={false}
                    errorColor="#cc0000"
                  >
                    {latexOutput}
                  </ReactKatex>
                ) : (
                  <div style={{ opacity: 0.35, fontSize: '1rem', fontStyle: 'italic' }}>
                    {t('equation.preview.hint', 'Type math naturally: x^2, (a+b)/c, sqrt(x), alpha, sin(x)')}
                  </div>
                )}
              </PreviewContainer>
            </PreviewSection>

            <EditorSection theme={theme}>
              <HelperText theme={theme}>
                {t(
                  'equation.editor.help',
                  'Type naturally like Desmos: x^2, (a+b)/c, sqrt(x), alpha, <=, >=, or use the palette.'
                )}
              </HelperText>

              <ToolbarRow>
                <UtilityButton type="button" theme={theme} onClick={toggleVirtualKeyboard}>
                  {t('equation.button.keyboard', 'Keyboard')}
                </UtilityButton>
                <UtilityButton type="button" theme={theme} onClick={clearField}>
                  {t('equation.button.clear', 'Clear')}
                </UtilityButton>
              </ToolbarRow>

              <MathFieldShell theme={theme}>
                <math-field ref={mathFieldRef} />
              </MathFieldShell>

              <StatusRow>
                <StatusText theme={theme}>
                  {t('equation.output.label', 'Generated LaTeX')}
                </StatusText>
                <StatusText theme={theme} $warning={hasPlaceholders}>
                  {hasPlaceholders
                    ? t('equation.output.fillBlanks', 'Fill the highlighted blanks before inserting.')
                    : t('equation.output.ready', 'Ready to insert')}
                </StatusText>
              </StatusRow>

              <LatexOutput theme={theme}>
                {rawLatexOutput || t('equation.input.placeholder', 'Type math here...')}
              </LatexOutput>
            </EditorSection>
          </EditorArea>
        </MainLayout>

        <Footer theme={theme}>
          <ActionButton theme={theme} onClick={onClose}>
            {t('equation.button.cancel', 'Cancel')}
          </ActionButton>
          <ActionButton
            theme={theme}
            $primary
            onClick={handleSubmit}
            disabled={!latexOutput.trim() || hasPlaceholders}
          >
            {t('equation.button.insert', 'Insert Equation')}
          </ActionButton>
        </Footer>
      </ModalContent>
    </ModalOverlay>
  );
};

export default EquationEditorModal;

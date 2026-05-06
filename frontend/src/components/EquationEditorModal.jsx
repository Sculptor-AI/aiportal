import React, { useEffect, useRef, useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import 'mathlive';
import { useTranslation } from '../contexts/TranslationContext';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(6px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  animation: ${fadeIn} 0.18s ease-out;
  padding: 24px;
`;

const ModalContent = styled.div`
  background-color: ${props => props.theme.sidebar || '#1e1e1e'};
  color: ${props => props.theme.text || '#fff'};
  border-radius: 18px;
  width: 640px;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
  border: 1px solid ${props => props.theme.border || 'rgba(255,255,255,0.1)'};
  overflow: hidden;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  opacity: 0.7;
  text-transform: uppercase;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.theme.text};
  opacity: 0.55;
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;

  &:hover {
    opacity: 1;
    background-color: rgba(255, 255, 255, 0.08);
  }
`;

const Body = styled.div`
  padding: 4px 22px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const MathFieldShell = styled.div`
  border: 1px solid ${props => props.$focused
    ? (props.theme.primary || '#0078d7')
    : (props.theme.border || 'rgba(255,255,255,0.12)')};
  border-radius: 14px;
  padding: 18px 20px;
  background: ${props => props.theme.inputBackground || 'rgba(0,0,0,0.22)'};
  transition: border-color 0.15s, box-shadow 0.15s;
  box-shadow: ${props => props.$focused
    ? `0 0 0 3px ${props.theme.primary || '#0078d7'}22`
    : 'none'};

  math-field {
    width: 100%;
    min-height: 56px;
    background: transparent;
    border: none;
    color: ${props => props.theme.text || '#fff'};
    font-size: 1.6rem;
    line-height: 1.4;
    --hue: 210;
    --placeholder-color: ${props => props.theme.text || '#fff'}66;
    --selection-background-color: ${props => `${props.theme.primary || '#0078d7'}33`};
    --caret-color: ${props => props.theme.primary || '#0078d7'};
    --smart-fence-color: ${props => props.theme.text || '#fff'};
  }

  math-field:focus,
  math-field:focus-visible {
    outline: none;
  }

  math-field::part(virtual-keyboard-toggle),
  math-field::part(menu-toggle) {
    display: none;
  }
`;

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const Chip = styled.button`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid ${props => props.theme.border || 'rgba(255,255,255,0.1)'};
  color: ${props => props.theme.text || '#fff'};
  border-radius: 8px;
  padding: 6px 11px;
  font-size: 0.92rem;
  cursor: pointer;
  transition: all 0.15s;
  min-width: 36px;
  font-family: 'KaTeX_Main', 'Times New Roman', serif;

  &:hover {
    border-color: ${props => props.theme.primary || '#0078d7'};
    background: ${props => `${props.theme.primary || '#0078d7'}18`};
  }
`;

const Hint = styled.div`
  font-size: 0.78rem;
  line-height: 1.45;
  color: ${props => props.theme.text || '#fff'};
  opacity: 0.5;

  kbd {
    font-family: 'Fira Code', 'Consolas', monospace;
    font-size: 0.78rem;
    padding: 1px 5px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
`;

const Footer = styled.div`
  padding: 12px 18px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid ${props => props.theme.border || 'rgba(255,255,255,0.08)'};
  background-color: rgba(0, 0, 0, 0.15);
`;

const ActionButton = styled.button`
  padding: 8px 18px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  font-size: 0.9rem;

  ${props => props.$primary ? css`
    background-color: ${props.theme.primary || '#0078d7'};
    color: white;
    border: none;

    &:hover:not(:disabled) {
      filter: brightness(1.1);
    }
  ` : css`
    background-color: transparent;
    color: ${props.theme.text || '#fff'};
    border: 1px solid ${props.theme.border || 'rgba(255,255,255,0.12)'};

    &:hover {
      background-color: rgba(255, 255, 255, 0.05);
    }
  `}

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    filter: none;
  }
`;

// Desmos-style natural typing: short aliases auto-expand to LaTeX
const INLINE_SHORTCUTS = {
  alpha: '\\alpha',
  beta: '\\beta',
  gamma: '\\gamma',
  delta: '\\delta',
  epsilon: '\\epsilon',
  zeta: '\\zeta',
  eta: '\\eta',
  theta: '\\theta',
  iota: '\\iota',
  kappa: '\\kappa',
  lambda: '\\lambda',
  mu: '\\mu',
  nu: '\\nu',
  xi: '\\xi',
  pi: '\\pi',
  rho: '\\rho',
  sigma: '\\sigma',
  tau: '\\tau',
  upsilon: '\\upsilon',
  phi: '\\phi',
  chi: '\\chi',
  psi: '\\psi',
  omega: '\\omega',
  oo: '\\infty',
  inf: '\\infty',
  infty: '\\infty',
  infinity: '\\infty',
  '!=': '\\neq',
  '<=': '\\leq',
  '>=': '\\geq',
  '->': '\\to',
  '=>': '\\Rightarrow',
  '+-': '\\pm',
  '-+': '\\mp'
};

// MathLive emits compact LaTeX like `\frac12` for `1/2` — readable to KaTeX
// but ugly as raw text. Expand the common compact forms so the chat input
// shows `\frac{1}{2}` etc.
const normalizeLatex = (input) => {
  if (!input) return '';
  let out = input.trim();
  // \frac<a><b> → \frac{a}{b} where a,b are single non-special chars
  out = out.replace(/\\frac([0-9A-Za-z])([0-9A-Za-z])/g, '\\frac{$1}{$2}');
  // \sqrt<a> → \sqrt{a}
  out = out.replace(/\\sqrt([0-9A-Za-z])(?![A-Za-z])/g, '\\sqrt{$1}');
  return out;
};

// Tiny set of common shortcuts. Anything else, the user types.
const QUICK_INSERTS = [
  { label: '·⁄·', insert: '\\frac{#0}{#?}', title: 'Fraction (or just type "/")' },
  { label: '√', insert: '\\sqrt{#0}', title: 'Square root (or type "sqrt")' },
  { label: 'xⁿ', action: 'superscript', title: 'Exponent (or type "^")' },
  { label: 'xₙ', action: 'subscript', title: 'Subscript (or type "_")' },
  { label: 'π', insert: '\\pi', title: 'Pi (or type "pi")' },
  { label: '∞', insert: '\\infty', title: 'Infinity (or type "oo")' },
  { label: '∑', insert: '\\sum_{#?}^{#?}', title: 'Sum' },
  { label: '∫', insert: '\\int_{#?}^{#?}', title: 'Integral' },
  { label: '≤', insert: '\\leq', title: 'Less or equal (or type "<=")' },
  { label: '≥', insert: '\\geq', title: 'Greater or equal (or type ">=")' }
];

const EquationEditorModal = ({ isOpen, onClose, onSubmit, theme }) => {
  const { t } = useTranslation();
  const mathFieldRef = useRef(null);
  const [latex, setLatex] = useState('');
  const [hasPlaceholders, setHasPlaceholders] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const syncFromField = () => {
    const mf = mathFieldRef.current;
    if (!mf) return;
    const raw = mf.getValue().trim();
    const clean = mf.getValue('latex-without-placeholders').trim();
    setLatex(clean);
    setHasPlaceholders(raw.includes('\\placeholder'));
  };

  const handleSubmit = () => {
    const value = normalizeLatex(latex);
    if (!value || hasPlaceholders) return;

    onSubmit(value);

    if (mathFieldRef.current) {
      mathFieldRef.current.setValue('');
    }
    setLatex('');
    setHasPlaceholders(false);
  };

  useEffect(() => {
    if (!isOpen) return undefined;

    const mf = mathFieldRef.current;
    if (!mf) return undefined;

    mf.smartFence = true;
    mf.smartMode = true;
    mf.smartSuperscript = true;
    mf.removeExtraneousParentheses = true;
    mf.inlineShortcutTimeout = 750;
    mf.mathVirtualKeyboardPolicy = window.matchMedia('(max-width: 768px)').matches ? 'auto' : 'manual';
    mf.inlineShortcuts = {
      ...mf.inlineShortcuts,
      ...INLINE_SHORTCUTS
    };

    const handleInput = () => syncFromField();
    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    mf.addEventListener('input', handleInput);
    mf.addEventListener('change', handleInput);
    mf.addEventListener('focus', handleFocus);
    mf.addEventListener('blur', handleBlur);

    syncFromField();

    const focusTimer = window.setTimeout(() => mf.focus(), 60);

    return () => {
      window.clearTimeout(focusTimer);
      mf.removeEventListener('input', handleInput);
      mf.removeEventListener('change', handleInput);
      mf.removeEventListener('focus', handleFocus);
      mf.removeEventListener('blur', handleBlur);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key === 'Enter' && !event.shiftKey) {
        const value = latex.trim();
        if (value && !hasPlaceholders) {
          event.preventDefault();
          handleSubmit();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, latex, hasPlaceholders, onClose]);

  const applyQuick = (item) => {
    const mf = mathFieldRef.current;
    if (!mf) return;
    mf.focus();

    if (item.action === 'superscript') {
      mf.executeCommand('moveToSuperscript');
    } else if (item.action === 'subscript') {
      mf.executeCommand('moveToSubscript');
    } else {
      mf.insert(item.insert, {
        selectionMode: item.insert.includes('#?') || item.insert.includes('#0') ? 'placeholder' : 'after',
        focus: true,
        scrollIntoView: true
      });
    }
    syncFromField();
  };

  if (!isOpen) return null;

  const canSubmit = Boolean(latex.trim()) && !hasPlaceholders;

  return (
    <ModalOverlay onClick={(event) => event.target === event.currentTarget && onClose()}>
      <ModalContent theme={theme}>
        <ModalHeader theme={theme}>
          <ModalTitle>{t('equation.title', 'Equation')}</ModalTitle>
          <CloseButton onClick={onClose} theme={theme} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </CloseButton>
        </ModalHeader>

        <Body>
          <MathFieldShell theme={theme} $focused={isFocused}>
            <math-field ref={mathFieldRef} placeholder="x^2 + y^2 = r^2" />
          </MathFieldShell>

          <ChipRow>
            {QUICK_INSERTS.map((item) => (
              <Chip
                key={item.label}
                theme={theme}
                onClick={() => applyQuick(item)}
                title={item.title}
                type="button"
              >
                {item.label}
              </Chip>
            ))}
          </ChipRow>

          <Hint theme={theme}>
            {t(
              'equation.editor.help',
              'Type naturally — / for fractions, ^ for powers, sqrt, pi, alpha. Press '
            )}
            <kbd>Enter</kbd>
            {t('equation.editor.helpInsert', ' to insert.')}
          </Hint>
        </Body>

        <Footer theme={theme}>
          <ActionButton theme={theme} onClick={onClose} type="button">
            {t('equation.button.cancel', 'Cancel')}
          </ActionButton>
          <ActionButton
            theme={theme}
            $primary
            onClick={handleSubmit}
            disabled={!canSubmit}
            type="button"
          >
            {t('equation.button.insert', 'Insert')}
          </ActionButton>
        </Footer>
      </ModalContent>
    </ModalOverlay>
  );
};

export default EquationEditorModal;

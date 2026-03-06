import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import 'mathlive';
import { useTranslation } from '../contexts/TranslationContext';

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  opacity: ${props => props.$isOpen ? 1 : 0};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out;
`;

const GraphingContainer = styled.div`
  background: ${props => props.theme.background};
  border-radius: 20px;
  width: 95vw;
  height: 90vh;
  max-width: 1600px;
  max-height: 1000px;
  display: flex;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
  border: 1px solid ${props => props.theme.border};
  overflow: hidden;
  position: relative;
  transform: ${props => props.$isOpen ? 'scale(1)' : 'scale(0.95)'};
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
`;

const Sidebar = styled.div`
  width: 390px;
  background: ${props => props.theme.sidebar};
  border-right: 1px solid ${props => props.theme.border};
  display: flex;
  flex-direction: column;
  z-index: 10;
  backdrop-filter: blur(20px);
  min-width: 320px;
`;

const SidebarHeader = styled.div`
  padding: 20px 24px 16px;
  border-bottom: 1px solid ${props => props.theme.border};
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  background: linear-gradient(135deg, ${props => props.theme.primary}, ${props => props.theme.secondary});
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 2px 10px rgba(0,0,0,0.1);
`;

const TitleText = styled.span`
  color: ${props => props.theme.text};
`;

const HeaderHint = styled.div`
  font-size: 0.88rem;
  line-height: 1.45;
  color: ${props => props.theme.text};
  opacity: 0.7;
`;

const EquationList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const EquationItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: ${props => props.theme.inputBackground};
  border: 1px solid ${props => {
    if (props.$invalid) return '#ff8c82';
    if (props.$active) return props.theme.border;
    return 'transparent';
  }};
  border-radius: 14px;
  transition: all 0.2s ease;
  box-shadow: ${props => props.$active ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'};

  &:focus-within {
    border-color: ${props => props.$invalid ? '#ff8c82' : props.theme.primary};
    box-shadow: 0 0 0 2px ${props => props.$invalid ? 'rgba(255,140,130,0.18)' : `${props.theme.primary}20`};
  }
`;

const ColorIndicator = styled.button`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${props => props.$visible ? props.$color : 'transparent'};
  border: 2px solid ${props => props.$color};
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;
  position: relative;
  margin-top: 10px;

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 60%;
    height: 60%;
    background: ${props => props.$visible ? 'white' : props.$color};
    border-radius: 50%;
    opacity: ${props => props.$visible ? 0.3 : 0};
    transition: opacity 0.2s;
  }

  &:hover {
    transform: scale(1.1);
  }
`;

const InputWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
`;

const MathFieldShell = styled.div`
  border-radius: 10px;
  border: 1px solid transparent;
  background: rgba(255,255,255,0.03);
  padding: 10px 12px;

  math-field {
    width: 100%;
    min-height: 28px;
    background: transparent;
    border: none;
    color: ${props => props.theme.text};
    font-size: 1.05rem;
    line-height: 1.35;
    --caret-color: ${props => props.theme.primary};
    --selection-background-color: ${props => `${props.theme.primary}22`};
    --placeholder-color: ${props => props.theme.text};
  }

  math-field::part(menu-toggle) {
    display: none;
  }
`;

const ExpressionMeta = styled.div`
  min-height: 1.1rem;
  font-size: 0.76rem;
  color: ${props => props.$invalid ? '#ff8c82' : props.theme.text};
  opacity: ${props => props.$invalid ? 1 : 0.65};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const DeleteButton = styled.button`
  background: transparent;
  border: none;
  color: ${props => `${props.theme.text}60`};
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s;
  margin-top: 8px;

  ${EquationItem}:hover & {
    opacity: 1;
  }

  &:hover {
    background: rgba(255, 59, 48, 0.1);
    color: #ff3b30;
  }
`;

const SidebarFooter = styled.div`
  padding: 16px;
  border-top: 1px solid ${props => props.theme.border};
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const AddButton = styled.button`
  padding: 12px;
  background: transparent;
  border: 1px dashed ${props => props.theme.border};
  border-radius: 12px;
  color: ${props => `${props.theme.text}cc`};
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    border-color: ${props => props.theme.primary};
    color: ${props => props.theme.primary};
    background: ${props => `${props.theme.primary}10`};
  }
`;

const SendButton = styled.button`
  padding: 12px 14px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, ${props => props.theme.primary}, ${props => props.theme.secondary});
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;

  &:hover {
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    transform: none;
  }
`;

const CanvasArea = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
  background: white;
  cursor: crosshair;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.theme.inputBackground};
  border: 1px solid ${props => props.theme.border};
  color: ${props => props.theme.text};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 20;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);

  &:hover {
    background: ${props => props.theme.border};
    transform: scale(1.05);
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="6" y1="6" x2="18" y2="18" />
    <line x1="18" y1="6" x2="6" y2="18" />
  </svg>
);

const ControlsOverlay = styled.div`
  position: absolute;
  bottom: 24px;
  right: 24px;
  display: flex;
  gap: 12px;
  z-index: 10;
`;

const ControlButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: white;
  border: 1px solid #e0e0e0;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.15);
  }
`;

const FUNCTION_IDENTIFIERS = new Set([
  'sin', 'cos', 'tan',
  'asin', 'acos', 'atan',
  'sqrt', 'log', 'ln', 'abs', 'exp'
]);

const GRAPH_INLINE_SHORTCUTS = {
  alpha: '\\alpha',
  beta: '\\beta',
  theta: '\\theta',
  pi: '\\pi',
  oo: '\\infty',
  inf: '\\infty',
  '<=': '\\leq',
  '>=': '\\geq',
  '!=': '\\neq',
  '->': '\\to'
};

const GRAPH_COLORS = ['#c74440', '#2d70b3', '#388c46', '#e68d39', '#9147b1', '#47a5a5'];

const createGraphItem = (id, latex, expression, color) => ({
  id,
  latex,
  expression,
  displayExpression: expression,
  color,
  visible: true
});

const DEFAULT_ITEMS = [
  createGraphItem(1, 'y=\\sin(x)', 'y = sin(x)', GRAPH_COLORS[0]),
  createGraphItem(2, 'y=\\frac{x^2}{10}', 'y = x^2 / 10', GRAPH_COLORS[1])
];

const getGraphExpressionFromField = (mathField) => {
  if (!mathField) {
    return { latex: '', expression: '', displayExpression: '' };
  }

  const latex = mathField.getValue('latex-without-placeholders').trim();
  const ascii = mathField.getValue('ascii-math').trim();
  const plainText = mathField.getValue('plain-text').trim();

  return {
    latex,
    expression: ascii || plainText || latex,
    displayExpression: plainText || ascii || latex
  };
};

const normalizeExpression = (expression) => {
  if (!expression || typeof expression !== 'string') return null;

  let normalized = expression
    .toLowerCase()
    .trim()
    .replace(/[−–]/g, '-')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/π/g, 'pi');

  normalized = normalized.replace(/^y\s*=\s*/, '');
  normalized = normalized.replace(/^f\s*\(\s*x\s*\)\s*=\s*/, '');
  normalized = normalized.replace(/^g\s*\(\s*x\s*\)\s*=\s*/, '');

  // Convert MathLive's root(n)(x) ASCII output into a graph-friendly power form.
  let previous = '';
  while (previous !== normalized) {
    previous = normalized;
    normalized = normalized.replace(/root\s*\(([^()]+)\)\s*\(([^()]+)\)/g, '(($2)^(1/($1)))');
  }

  if (normalized.includes('=')) {
    return null;
  }

  if (/[^0-9a-z+\-*/^().,\s]/.test(normalized)) {
    return null;
  }

  const identifiers = normalized.match(/[a-z]+/g) || [];
  const allowedIdentifiers = new Set([
    'x', 'pi', 'e',
    'sin', 'cos', 'tan',
    'asin', 'acos', 'atan',
    'sqrt', 'log', 'ln', 'abs', 'exp'
  ]);

  if (identifiers.some((identifier) => !allowedIdentifiers.has(identifier))) {
    return null;
  }

  return normalized;
};

const tokenizeExpression = (expression) => {
  const tokens = [];
  let index = 0;

  while (index < expression.length) {
    const char = expression[index];

    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    if (/[0-9.]/.test(char)) {
      let numberLiteral = char;
      index += 1;
      while (index < expression.length && /[0-9.]/.test(expression[index])) {
        numberLiteral += expression[index];
        index += 1;
      }

      const value = Number(numberLiteral);
      if (!Number.isFinite(value)) return null;
      tokens.push({ type: 'number', value });
      continue;
    }

    if (/[a-z]/.test(char)) {
      let identifier = char;
      index += 1;
      while (index < expression.length && /[a-z]/.test(expression[index])) {
        identifier += expression[index];
        index += 1;
      }
      tokens.push({ type: 'identifier', value: identifier });
      continue;
    }

    if ('+-*/^(),'.includes(char)) {
      tokens.push({ type: 'operator', value: char });
      index += 1;
      continue;
    }

    return null;
  }

  return tokens;
};

const addImplicitMultiplication = (tokens) => {
  if (!tokens) return null;

  const result = [];

  const isValueToken = (token) => {
    if (!token) return false;
    if (token.type === 'number') return true;
    if (token.type === 'identifier') return true;
    return token.type === 'operator' && token.value === ')';
  };

  const startsValue = (token) => {
    if (!token) return false;
    if (token.type === 'number' || token.type === 'identifier') return true;
    return token.type === 'operator' && token.value === '(';
  };

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    const next = tokens[index + 1];
    result.push(token);

    if (!next) continue;

    const currentIsFunction = token.type === 'identifier' && FUNCTION_IDENTIFIERS.has(token.value);
    const nextStartsValue = startsValue(next);
    const currentEndsValue = isValueToken(token);

    if (!currentEndsValue || !nextStartsValue) continue;
    if (currentIsFunction) continue;

    result.push({ type: 'operator', value: '*' });
  }

  return result;
};

const evaluateTokens = (tokens, x) => {
  let position = 0;

  const functionMap = {
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    asin: Math.asin,
    acos: Math.acos,
    atan: Math.atan,
    sqrt: Math.sqrt,
    log: Math.log10,
    ln: Math.log,
    abs: Math.abs,
    exp: Math.exp
  };

  const peek = () => tokens[position];
  const consume = () => tokens[position++];
  const matchOperator = (operator) => peek()?.type === 'operator' && peek()?.value === operator;

  const parseExpressionNode = () => {
    let value = parseTerm();
    while (matchOperator('+') || matchOperator('-')) {
      const operator = consume().value;
      const right = parseTerm();
      value = operator === '+' ? value + right : value - right;
    }
    return value;
  };

  const parsePrimary = () => {
    const token = consume();
    if (!token) return NaN;

    if (token.type === 'number') {
      return token.value;
    }

    if (token.type === 'identifier') {
      if (token.value === 'x') return x;
      if (token.value === 'pi') return Math.PI;
      if (token.value === 'e') return Math.E;
      return NaN;
    }

    if (token.type === 'operator' && token.value === '(') {
      const value = parseExpressionNode();
      if (!matchOperator(')')) return NaN;
      consume();
      return value;
    }

    return NaN;
  };

  const parseFunctionArgument = () => {
    if (matchOperator('(')) {
      consume();
      const argument = parseExpressionNode();
      if (!matchOperator(')')) return NaN;
      consume();
      return argument;
    }

    return parsePower();
  };

  const parseUnary = () => {
    if (matchOperator('+')) {
      consume();
      return parseUnary();
    }

    if (matchOperator('-')) {
      consume();
      return -parseUnary();
    }

    if (peek()?.type === 'identifier' && FUNCTION_IDENTIFIERS.has(peek().value)) {
      const fn = consume().value;
      const argument = parseFunctionArgument();
      return functionMap[fn](argument);
    }

    return parsePrimary();
  };

  const parsePower = () => {
    const left = parseUnary();
    if (matchOperator('^')) {
      consume();
      const right = parsePower();
      return Math.pow(left, right);
    }
    return left;
  };

  const parseTerm = () => {
    let value = parsePower();
    while (matchOperator('*') || matchOperator('/')) {
      const operator = consume().value;
      const right = parsePower();
      value = operator === '*' ? value * right : value / right;
    }
    return value;
  };

  const result = parseExpressionNode();
  if (position !== tokens.length) return NaN;
  return Number.isFinite(result) ? result : NaN;
};

const evaluateExpression = (expression, x, compiledExpressionsRef) => {
  try {
    const normalized = normalizeExpression(expression);
    if (!normalized) return NaN;

    if (!compiledExpressionsRef.current.has(normalized)) {
      const tokenized = tokenizeExpression(normalized);
      const compiled = addImplicitMultiplication(tokenized);
      if (!compiled) return NaN;

      compiledExpressionsRef.current.set(normalized, compiled);
      if (compiledExpressionsRef.current.size > 200) {
        compiledExpressionsRef.current.clear();
        compiledExpressionsRef.current.set(normalized, compiled);
      }
    }

    const compiled = compiledExpressionsRef.current.get(normalized);
    return evaluateTokens(compiled, x);
  } catch (error) {
    return NaN;
  }
};

const GraphExpressionField = ({ item, theme, placeholder, onChange }) => {
  const mathFieldRef = useRef(null);

  useEffect(() => {
    const mathField = mathFieldRef.current;
    if (!mathField) return undefined;

    mathField.smartFence = true;
    mathField.smartMode = true;
    mathField.smartSuperscript = true;
    mathField.inlineShortcutTimeout = 700;
    mathField.mathVirtualKeyboardPolicy = window.matchMedia('(max-width: 768px)').matches ? 'auto' : 'manual';
    mathField.inlineShortcuts = {
      ...mathField.inlineShortcuts,
      ...GRAPH_INLINE_SHORTCUTS
    };

    if (mathField.getValue('latex-without-placeholders') !== (item.latex || '')) {
      mathField.setValue(item.latex || '');
    }

    const syncValue = () => onChange(item.id, getGraphExpressionFromField(mathField));
    mathField.addEventListener('input', syncValue);
    mathField.addEventListener('change', syncValue);

    return () => {
      mathField.removeEventListener('input', syncValue);
      mathField.removeEventListener('change', syncValue);
    };
  }, [item.id, item.latex, onChange]);

  return (
    <MathFieldShell theme={theme}>
      <math-field ref={mathFieldRef} placeholder={placeholder} />
    </MathFieldShell>
  );
};

const GraphingModal = ({ isOpen, onClose, onSubmit, theme }) => {
  const { t } = useTranslation();
  const canvasRef = useRef(null);
  const [items, setItems] = useState(DEFAULT_ITEMS);
  const [scale, setScale] = useState(40);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialOffset, setInitialOffset] = useState({ x: 0, y: 0 });
  const compiledExpressionsRef = useRef(new Map());

  const hasVisibleGraph = useMemo(
    () => items.some((item) => item.visible && normalizeExpression(item.expression)),
    [items]
  );

  const drawGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = parseFloat(canvas.style.width);
    const height = parseFloat(canvas.style.height);

    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2 + offset.x;
    const centerY = height / 2 + offset.y;

    ctx.lineWidth = 0.5;
    ctx.strokeStyle = '#e0e0e0';
    ctx.beginPath();

    const minGridX = Math.floor(-centerX / scale) - 1;
    const maxGridX = Math.ceil((width - centerX) / scale) + 1;
    for (let index = minGridX; index <= maxGridX; index += 1) {
      const x = centerX + index * scale;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }

    const minGridY = Math.floor(-centerY / scale) - 1;
    const maxGridY = Math.ceil((height - centerY) / scale) + 1;
    for (let index = minGridY; index <= maxGridY; index += 1) {
      const y = centerY - index * scale;
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#333';
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();

    items.forEach((item) => {
      if (!item.visible || !item.expression) return;

      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = item.color;

      let first = true;
      for (let px = 0; px < width; px += 1) {
        const mathX = (px - centerX) / scale;
        const mathY = evaluateExpression(item.expression, mathX, compiledExpressionsRef);

        if (Number.isNaN(mathY) || !Number.isFinite(mathY)) {
          first = true;
          continue;
        }

        const py = centerY - mathY * scale;
        if (py < -height || py > height * 2) {
          first = true;
          continue;
        }

        if (first) {
          ctx.moveTo(px, py);
          first = false;
        } else {
          ctx.lineTo(px, py);
        }
      }

      ctx.stroke();
    });
  };

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return undefined;

    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const ctx = canvas.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      requestAnimationFrame(drawGraph);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [isOpen, scale, offset, items]);

  useEffect(() => {
    if (!isOpen) return;
    requestAnimationFrame(drawGraph);
  }, [items, scale, offset, isOpen]);

  const handleMouseDown = (event) => {
    setIsDragging(true);
    setDragStart({ x: event.clientX, y: event.clientY });
    setInitialOffset({ ...offset });
  };

  const handleMouseMove = (event) => {
    if (!isDragging) return;
    const dx = event.clientX - dragStart.x;
    const dy = event.clientY - dragStart.y;
    setOffset({
      x: initialOffset.x + dx,
      y: initialOffset.y + dy
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (event) => {
    const zoomSensitivity = 0.001;
    const newScale = Math.max(10, Math.min(1000, scale * (1 - event.deltaY * zoomSensitivity)));
    setScale(newScale);
  };

  const addItem = () => {
    const nextIndex = items.length % GRAPH_COLORS.length;
    setItems([
      ...items,
      createGraphItem(Date.now(), '', '', GRAPH_COLORS[nextIndex])
    ]);
  };

  const updateItem = (id, updates) => {
    setItems((currentItems) => currentItems.map((item) => (
      item.id === id ? { ...item, ...updates } : item
    )));
  };

  const removeItem = (id) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
  };

  const centerGraph = () => {
    setOffset({ x: 0, y: 0 });
    setScale(40);
  };

  const buildExportCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;

    const ctx = exportCanvas.getContext('2d');
    ctx.drawImage(canvas, 0, 0);

    const visibleItems = items
      .filter((item) => item.visible && normalizeExpression(item.expression))
      .slice(0, 8);

    if (visibleItems.length > 0) {
      const dpr = window.devicePixelRatio || 1;
      const padding = 18 * dpr;
      const lineHeight = 22 * dpr;
      const swatchSize = 12 * dpr;
      const titleHeight = 24 * dpr;
      const legendWidth = Math.min(exportCanvas.width * 0.42, 420 * dpr);
      const legendHeight = padding * 2 + titleHeight + visibleItems.length * lineHeight;

      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.strokeStyle = 'rgba(0,0,0,0.08)';
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      ctx.roundRect(20 * dpr, 20 * dpr, legendWidth, legendHeight, 16 * dpr);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#1f1f1f';
      ctx.font = `${16 * dpr}px sans-serif`;
      ctx.fillText('Graph Expressions', 20 * dpr + padding, 20 * dpr + padding + titleHeight / 1.3);

      ctx.font = `${13 * dpr}px monospace`;
      visibleItems.forEach((item, index) => {
        const y = 20 * dpr + padding + titleHeight + index * lineHeight;
        ctx.fillStyle = item.color;
        ctx.fillRect(20 * dpr + padding, y - swatchSize + 3 * dpr, swatchSize, swatchSize);
        ctx.fillStyle = '#1f1f1f';
        const label = (item.displayExpression || item.expression || '').replace(/\s+/g, ' ').trim();
        ctx.fillText(label, 20 * dpr + padding + swatchSize + 10 * dpr, y + 2 * dpr);
      });
      ctx.restore();
    }

    return exportCanvas;
  };

  const handleSendGraph = async () => {
    if (!onSubmit) return;

    const exportCanvas = buildExportCanvas();
    if (!exportCanvas) return;

    const blob = await new Promise((resolve) => {
      exportCanvas.toBlob(resolve, 'image/png');
    });

    if (!blob) return;

    const file = new File([blob], `graph-${Date.now()}.png`, { type: 'image/png' });
    onSubmit(file);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <ModalOverlay $isOpen={isOpen} onClick={onClose}>
      <GraphingContainer $isOpen={isOpen} onClick={(event) => event.stopPropagation()}>
        <Sidebar theme={theme}>
          <SidebarHeader theme={theme}>
            <Title theme={theme}>
              SCULPTOR <TitleText theme={theme}>{t('graph.titleSuffix', 'Graph')}</TitleText>
            </Title>
            <HeaderHint theme={theme}>
              {t(
                'graph.hint',
                'Type naturally like Desmos: y=x^2, y=sin(x), y=(x^2+1)/4, y=sqrt(x).'
              )}
            </HeaderHint>
          </SidebarHeader>

          <EquationList>
            {items.map((item) => {
              const isInvalid = item.expression.trim().length > 0 && !normalizeExpression(item.expression);

              return (
                <EquationItem key={item.id} theme={theme} $active={item.visible} $invalid={isInvalid}>
                  <ColorIndicator
                    $color={item.color}
                    $visible={item.visible}
                    onClick={() => updateItem(item.id, { visible: !item.visible })}
                  />

                  <InputWrapper>
                    <GraphExpressionField
                      item={item}
                      theme={theme}
                      placeholder={t('graph.placeholder', 'Enter expression...')}
                      onChange={(id, value) => updateItem(id, value)}
                    />
                    <ExpressionMeta theme={theme} $invalid={isInvalid}>
                      {isInvalid
                        ? t('graph.status.invalid', 'Expression not supported yet. Use forms like y=f(x).')
                        : item.displayExpression || t('graph.status.ready', 'Ready to graph')}
                    </ExpressionMeta>
                  </InputWrapper>

                  <DeleteButton theme={theme} onClick={() => removeItem(item.id)}>
                    ×
                  </DeleteButton>
                </EquationItem>
              );
            })}
          </EquationList>

          <SidebarFooter theme={theme}>
            <AddButton theme={theme} onClick={addItem}>
              {t('graph.button.addExpression', '+ Add Expression')}
            </AddButton>
            <SendButton theme={theme} onClick={handleSendGraph} disabled={!hasVisibleGraph}>
              {t('graph.button.sendToModel', 'Send Graph to Model')}
            </SendButton>
          </SidebarFooter>
        </Sidebar>

        <CanvasArea
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

          <CloseButton theme={theme} onClick={onClose} aria-label="Close graphing calculator">
            <CloseIcon />
          </CloseButton>

          <ControlsOverlay>
            <ControlButton onClick={centerGraph} title={t('graph.controls.reset', 'Reset View')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M12 3v18M19 12a7 7 0 0 1-7 7 7 7 0 0 1 0-14 7 7 0 0 1 7 7z" />
              </svg>
            </ControlButton>
            <ControlButton onClick={() => setScale((current) => current * 1.2)} title={t('graph.controls.zoomIn', 'Zoom In')}>
              +
            </ControlButton>
            <ControlButton onClick={() => setScale((current) => current / 1.2)} title={t('graph.controls.zoomOut', 'Zoom Out')}>
              -
            </ControlButton>
          </ControlsOverlay>
        </CanvasArea>
      </GraphingContainer>
    </ModalOverlay>
  );
};

export default GraphingModal;

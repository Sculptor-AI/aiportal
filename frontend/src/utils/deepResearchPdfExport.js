/**
 * Deep Research PDF Export
 *
 * Native jsPDF renderer for Sculptor AI deep research reports. No HTML->canvas
 * rasterization (avoids the "pages of white" failure mode). Produces a branded,
 * typographic PDF with cover, markdown-rendered body, and sources section.
 */

import { jsPDF } from 'jspdf';

// Layout constants (mm on A4)
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN_X = 18;
const MARGIN_TOP = 26;
const MARGIN_BOTTOM = 22;
const CONTENT_W = PAGE_W - MARGIN_X * 2;

// Color palette (slate + Sculptor blue)
const C = {
  text: [15, 23, 42],
  textSecondary: [51, 65, 85],
  textMuted: [100, 116, 139],
  textFaint: [148, 163, 184],
  accent: [29, 78, 216],
  accentMid: [37, 99, 235],
  accentLight: [96, 165, 250],
  accentFaint: [219, 234, 254],
  coverA: [15, 23, 42],
  coverB: [29, 78, 216],
  coverC: [96, 165, 250],
  divider: [226, 232, 240],
  surfaceSoft: [248, 250, 252],
  surfaceSofter: [241, 245, 249],
  code: [30, 41, 59],
  codeBg: [241, 245, 249],
  quoteBorder: [147, 197, 253],
  success: [22, 163, 74],
  warn: [234, 88, 12]
};

const setFill = (doc, rgb) => doc.setFillColor(rgb[0], rgb[1], rgb[2]);
const setStroke = (doc, rgb) => doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
const setText = (doc, rgb) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);

const loadImageAsDataUrl = async (src) => {
  try {
    const response = await fetch(src, { cache: 'force-cache' });
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

const truncate = (text, max) => {
  const clean = String(text || '').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
};

const formatHumanDate = (value) => {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return new Date().toLocaleString();
  return d.toLocaleString([], {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
};

const sanitizeFileName = (input) => {
  const clean = String(input || '')
    .trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return clean.slice(0, 70) || 'deep-research-report';
};

/* ---------------- markdown ---------------- */

// Block-level parse: headings, paragraphs, bullet/numbered lists, quotes, code fences, hr
const parseBlocks = (markdown) => {
  const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let para = [];
  let list = null;
  let code = null;

  const flushPara = () => {
    if (para.length > 0) {
      blocks.push({ type: 'p', text: para.join(' ') });
      para = [];
    }
  };
  const flushList = () => {
    if (list) { blocks.push(list); list = null; }
  };

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (code) {
      if (trimmed.startsWith('```')) {
        blocks.push(code);
        code = null;
      } else {
        code.lines.push(raw);
      }
      continue;
    }
    if (trimmed.startsWith('```')) {
      flushPara(); flushList();
      code = { type: 'code', lines: [] };
      continue;
    }

    // Hide explicit "Sources:" header from body — the sources section handles it
    if (/^\*?\*?sources:?\*?\*?\s*$/i.test(trimmed)) {
      flushPara(); flushList();
      // Skip subsequent source list lines (S1 ... URL) here — they’ll be rendered from sources array
      while (i + 1 < lines.length) {
        const next = lines[i + 1].trim();
        if (!next) { i += 1; continue; }
        if (/^\s*(?:[-*]\s*)?S\d+\b/i.test(next)) { i += 1; continue; }
        break;
      }
      continue;
    }

    if (trimmed === '---' || trimmed === '***') {
      flushPara(); flushList();
      blocks.push({ type: 'hr' });
      continue;
    }

    const h3 = trimmed.match(/^###\s+(.+)$/);
    const h2 = trimmed.match(/^##\s+(.+)$/);
    const h1 = trimmed.match(/^#\s+(.+)$/);
    if (h3) { flushPara(); flushList(); blocks.push({ type: 'h3', text: h3[1] }); continue; }
    if (h2) { flushPara(); flushList(); blocks.push({ type: 'h2', text: h2[1] }); continue; }
    if (h1) { flushPara(); flushList(); blocks.push({ type: 'h1', text: h1[1] }); continue; }

    const bullet = trimmed.match(/^[-*+]\s+(.+)$/);
    const numbered = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (bullet) {
      flushPara();
      if (!list || list.variant !== 'ul') { flushList(); list = { type: 'list', variant: 'ul', items: [] }; }
      list.items.push(bullet[1]);
      continue;
    }
    if (numbered) {
      flushPara();
      if (!list || list.variant !== 'ol') { flushList(); list = { type: 'list', variant: 'ol', items: [] }; }
      list.items.push(numbered[2]);
      continue;
    }

    const quote = trimmed.match(/^>\s*(.*)$/);
    if (quote) {
      flushPara(); flushList();
      blocks.push({ type: 'quote', text: quote[1] });
      continue;
    }

    if (trimmed === '') { flushPara(); flushList(); continue; }

    flushList();
    para.push(trimmed);
  }
  flushPara(); flushList();
  if (code) blocks.push(code);
  return blocks;
};

// Inline tokenize: **bold**, *italic*, `code`, [label](url), [S1], plain
const tokenizeInline = (text) => {
  const out = [];
  const raw = String(text || '');
  let i = 0;
  let buf = '';
  const push = (type, content, extra = {}) => {
    if (buf) { out.push({ type: 'text', content: buf }); buf = ''; }
    out.push({ type, content, ...extra });
  };

  while (i < raw.length) {
    // [S1], [S12], etc.
    const srcMatch = raw.slice(i).match(/^\[(S\d+)\]/);
    if (srcMatch) { push('source', srcMatch[1]); i += srcMatch[0].length; continue; }

    // [label](url)
    const linkMatch = raw.slice(i).match(/^\[([^\]]+)\]\(([^)\s]+)\)/);
    if (linkMatch) { push('link', linkMatch[1], { url: linkMatch[2] }); i += linkMatch[0].length; continue; }

    // **bold**
    if (raw.startsWith('**', i)) {
      const end = raw.indexOf('**', i + 2);
      if (end > i + 2) { push('bold', raw.slice(i + 2, end)); i = end + 2; continue; }
    }
    // *italic* (not part of **)
    if (raw[i] === '*' && raw[i + 1] !== '*') {
      const end = raw.indexOf('*', i + 1);
      if (end > i + 1 && raw[end + 1] !== '*') { push('italic', raw.slice(i + 1, end)); i = end + 1; continue; }
    }
    // `code`
    if (raw[i] === '`') {
      const end = raw.indexOf('`', i + 1);
      if (end > i + 1) { push('code', raw.slice(i + 1, end)); i = end + 1; continue; }
    }
    buf += raw[i];
    i += 1;
  }
  if (buf) out.push({ type: 'text', content: buf });
  return out;
};

/* ---------------- rendering engine ---------------- */

const createEngine = (doc, opts) => {
  const state = {
    page: 1,
    y: MARGIN_TOP,
    totalPages: 1
  };

  const newPage = () => {
    doc.addPage();
    state.page += 1;
    state.totalPages = Math.max(state.totalPages, state.page);
    state.y = MARGIN_TOP;
    drawRunningHeader();
  };

  const ensureSpace = (needed) => {
    if (state.y + needed > PAGE_H - MARGIN_BOTTOM) newPage();
  };

  const drawRunningHeader = () => {
    // Only on body pages (page > 1 i.e. after cover)
    if (state.page === 1) return;
    setText(doc, C.textMuted);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const left = `Sculptor AI · Deep Research`;
    doc.text(left, MARGIN_X, 14);
    const right = truncate(opts.query || 'Report', 60);
    doc.text(right, PAGE_W - MARGIN_X, 14, { align: 'right' });
    setStroke(doc, C.divider);
    doc.setLineWidth(0.2);
    doc.line(MARGIN_X, 17, PAGE_W - MARGIN_X, 17);
  };

  const drawFooter = (pageIndex, totalPages) => {
    const y = PAGE_H - 10;
    setStroke(doc, C.divider);
    doc.setLineWidth(0.2);
    doc.line(MARGIN_X, y - 4, PAGE_W - MARGIN_X, y - 4);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    setText(doc, C.accent);
    doc.text('Sculptor AI', MARGIN_X, y);
    doc.setFont('helvetica', 'normal');
    setText(doc, C.textMuted);
    doc.text(opts.generatedAt, PAGE_W / 2, y, { align: 'center' });
    doc.text(`Page ${pageIndex} of ${totalPages}`, PAGE_W - MARGIN_X, y, { align: 'right' });
  };

  /* ---- text writers ---- */

  const writeInlineLine = (segments, { x, y, maxWidth, fontSize, bold = false, italic = false, color = C.text }) => {
    // Greedily wrap inline segments into lines, rendering each line.
    doc.setFontSize(fontSize);
    const spaceWidth = () => {
      doc.setFont('helvetica', bold ? (italic ? 'bolditalic' : 'bold') : (italic ? 'italic' : 'normal'));
      return doc.getTextWidth(' ');
    };

    const measureSegment = (seg) => {
      if (seg.type === 'code') {
        doc.setFont('courier', 'normal');
        return doc.getTextWidth(seg.content);
      }
      if (seg.type === 'bold') {
        doc.setFont('helvetica', italic ? 'bolditalic' : 'bold');
        return doc.getTextWidth(seg.content);
      }
      if (seg.type === 'italic') {
        doc.setFont('helvetica', bold ? 'bolditalic' : 'italic');
        return doc.getTextWidth(seg.content);
      }
      if (seg.type === 'link') {
        doc.setFont('helvetica', 'normal');
        return doc.getTextWidth(seg.content);
      }
      if (seg.type === 'source') {
        doc.setFontSize(fontSize - 1);
        doc.setFont('helvetica', 'bold');
        const w = doc.getTextWidth(seg.content) + 3;
        doc.setFontSize(fontSize);
        return w;
      }
      doc.setFont('helvetica', bold ? (italic ? 'bolditalic' : 'bold') : (italic ? 'italic' : 'normal'));
      return doc.getTextWidth(seg.content);
    };

    // Expand each plain-text segment into whitespace-tokenized words
    const tokens = [];
    for (const seg of segments) {
      if (seg.type === 'text') {
        const parts = seg.content.split(/(\s+)/);
        for (const part of parts) {
          if (!part) continue;
          if (/^\s+$/.test(part)) tokens.push({ type: 'space' });
          else tokens.push({ type: 'text', content: part });
        }
      } else {
        tokens.push(seg);
      }
    }

    let lineTokens = [];
    let lineWidth = 0;
    const flushLine = (isLast) => {
      let cursorX = x;
      for (const tok of lineTokens) {
        if (tok.type === 'space') { cursorX += spaceWidth(); continue; }
        if (tok.type === 'source') {
          // Small rounded pill
          doc.setFontSize(fontSize - 1);
          doc.setFont('helvetica', 'bold');
          const w = doc.getTextWidth(tok.content) + 3;
          const h = fontSize * 0.4;
          setFill(doc, C.accentFaint);
          doc.roundedRect(cursorX, y - h, w, h + 1.1, 1, 1, 'F');
          setText(doc, C.accent);
          doc.text(tok.content, cursorX + 1.5, y - 0.5);
          setText(doc, color);
          doc.setFontSize(fontSize);
          cursorX += w + 1;
          continue;
        }
        if (tok.type === 'code') {
          doc.setFont('courier', 'normal');
          const w = doc.getTextWidth(tok.content);
          const h = fontSize * 0.48;
          setFill(doc, C.codeBg);
          doc.roundedRect(cursorX - 0.8, y - h, w + 1.6, h + 1.2, 0.8, 0.8, 'F');
          setText(doc, C.code);
          doc.text(tok.content, cursorX, y);
          setText(doc, color);
          cursorX += w + 1;
          continue;
        }
        if (tok.type === 'bold') {
          doc.setFont('helvetica', italic ? 'bolditalic' : 'bold');
          doc.text(tok.content, cursorX, y);
          cursorX += doc.getTextWidth(tok.content);
          continue;
        }
        if (tok.type === 'italic') {
          doc.setFont('helvetica', bold ? 'bolditalic' : 'italic');
          doc.text(tok.content, cursorX, y);
          cursorX += doc.getTextWidth(tok.content);
          continue;
        }
        if (tok.type === 'link') {
          doc.setFont('helvetica', 'normal');
          setText(doc, C.accent);
          const w = doc.getTextWidth(tok.content);
          doc.text(tok.content, cursorX, y);
          setStroke(doc, C.accent);
          doc.setLineWidth(0.2);
          doc.line(cursorX, y + 0.6, cursorX + w, y + 0.6);
          setText(doc, color);
          cursorX += w;
          continue;
        }
        // plain text
        doc.setFont('helvetica', bold ? (italic ? 'bolditalic' : 'bold') : (italic ? 'italic' : 'normal'));
        setText(doc, color);
        doc.text(tok.content, cursorX, y);
        cursorX += doc.getTextWidth(tok.content);
      }
    };

    for (const tok of tokens) {
      const w = tok.type === 'space' ? spaceWidth() : measureSegment(tok);
      if (tok.type !== 'space' && lineWidth + w > maxWidth && lineTokens.length > 0) {
        flushLine(false);
        // move to next line
        y += fontSize * 0.55;
        // page break
        if (y > PAGE_H - MARGIN_BOTTOM) {
          state.y = y;
          newPage();
          y = state.y;
        }
        // trim leading space
        lineTokens = [];
        lineWidth = 0;
        if (tok.type === 'space') continue;
      }
      lineTokens.push(tok);
      lineWidth += w;
    }
    if (lineTokens.length > 0) flushLine(true);
    return y;
  };

  const writeHeading = (level, text) => {
    const styles = {
      1: { size: 17, gapBefore: 8, gapAfter: 4, color: C.text, weight: 'bold', rule: true },
      2: { size: 13, gapBefore: 6, gapAfter: 3, color: C.text, weight: 'bold', rule: false },
      3: { size: 11, gapBefore: 5, gapAfter: 2, color: C.accent, weight: 'bold', rule: false }
    };
    const s = styles[level] || styles[2];
    ensureSpace(s.size * 0.7 + s.gapBefore + s.gapAfter + 4);
    state.y += s.gapBefore;
    doc.setFont('helvetica', s.weight);
    doc.setFontSize(s.size);
    setText(doc, s.color);
    // Word-wrap for long headings
    const lines = doc.splitTextToSize(text, CONTENT_W);
    for (const line of lines) {
      ensureSpace(s.size * 0.6);
      doc.text(line, MARGIN_X, state.y + s.size * 0.4);
      state.y += s.size * 0.55;
    }
    if (s.rule) {
      setStroke(doc, C.divider);
      doc.setLineWidth(0.3);
      doc.line(MARGIN_X, state.y + 1, MARGIN_X + 28, state.y + 1);
    }
    state.y += s.gapAfter;
  };

  const writeParagraph = (text) => {
    const segments = tokenizeInline(text);
    const size = 10;
    const lineHeight = size * 0.55;
    ensureSpace(lineHeight + 1);
    state.y += size * 0.4;
    state.y = writeInlineLine(segments, {
      x: MARGIN_X, y: state.y, maxWidth: CONTENT_W, fontSize: size
    });
    state.y += lineHeight * 0.9;
  };

  const writeList = (list) => {
    const size = 10;
    const lineHeight = size * 0.55;
    for (let i = 0; i < list.items.length; i += 1) {
      const item = list.items[i];
      const bullet = list.variant === 'ol' ? `${i + 1}.` : '•';
      ensureSpace(lineHeight + 1);
      state.y += size * 0.4;
      setText(doc, C.accent);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(size);
      doc.text(bullet, MARGIN_X + 2, state.y);
      const bulletWidth = list.variant === 'ol' ? 7 : 5;
      setText(doc, C.text);
      state.y = writeInlineLine(tokenizeInline(item), {
        x: MARGIN_X + 2 + bulletWidth,
        y: state.y,
        maxWidth: CONTENT_W - 2 - bulletWidth,
        fontSize: size
      });
      state.y += lineHeight * 0.55;
    }
  };

  const writeQuote = (text) => {
    const size = 10;
    const lineHeight = size * 0.55;
    const startY = state.y + 2;
    ensureSpace(lineHeight + 4);
    state.y += size * 0.4;
    const innerX = MARGIN_X + 4;
    state.y = writeInlineLine(tokenizeInline(text), {
      x: innerX, y: state.y, maxWidth: CONTENT_W - 4, fontSize: size, italic: true, color: C.textSecondary
    });
    const endY = state.y + 2;
    setFill(doc, C.accentFaint);
    doc.rect(MARGIN_X, startY - size * 0.55, 1.4, endY - startY + size * 0.55, 'F');
    state.y += lineHeight * 0.9;
  };

  const writeCode = (code) => {
    const size = 9;
    const lineHeight = size * 0.55;
    const lines = code.lines;
    doc.setFont('courier', 'normal');
    doc.setFontSize(size);
    const padding = 2;
    const blockHeight = lines.length * lineHeight + padding * 2;
    ensureSpace(blockHeight + 2);
    setFill(doc, C.codeBg);
    doc.roundedRect(MARGIN_X, state.y, CONTENT_W, blockHeight, 1.5, 1.5, 'F');
    setText(doc, C.code);
    let lineY = state.y + padding + lineHeight - 1;
    for (const line of lines) {
      const wrapped = doc.splitTextToSize(line, CONTENT_W - padding * 2);
      for (const l of wrapped) {
        doc.text(l, MARGIN_X + padding, lineY);
        lineY += lineHeight;
      }
    }
    state.y += blockHeight + 2;
  };

  const writeRule = () => {
    ensureSpace(4);
    state.y += 2;
    setStroke(doc, C.divider);
    doc.setLineWidth(0.3);
    doc.line(MARGIN_X + 16, state.y, PAGE_W - MARGIN_X - 16, state.y);
    state.y += 3;
  };

  return {
    state,
    newPage,
    ensureSpace,
    drawRunningHeader,
    drawFooter,
    writeHeading,
    writeParagraph,
    writeList,
    writeQuote,
    writeCode,
    writeRule
  };
};

/* ---------------- cover page ---------------- */

const drawCover = (doc, opts, logoDataUrl) => {
  // Hero band: gradient strip across top
  const bandHeight = 72;
  const steps = 48;
  for (let i = 0; i < steps; i += 1) {
    const t = i / (steps - 1);
    const r = Math.round(C.coverA[0] + (C.coverB[0] - C.coverA[0]) * t);
    const g = Math.round(C.coverA[1] + (C.coverB[1] - C.coverA[1]) * t);
    const b = Math.round(C.coverA[2] + (C.coverB[2] - C.coverA[2]) * t);
    doc.setFillColor(r, g, b);
    const y = (bandHeight * i) / steps;
    doc.rect(0, y, PAGE_W, bandHeight / steps + 0.6, 'F');
  }

  // Accent glow (top-right)
  doc.setFillColor(C.coverC[0], C.coverC[1], C.coverC[2]);
  for (let i = 0; i < 8; i += 1) {
    doc.setGState(new doc.GState({ opacity: 0.06 - i * 0.007 }));
    doc.circle(PAGE_W - 10, 4, 30 + i * 4, 'F');
  }
  doc.setGState(new doc.GState({ opacity: 1 }));

  // Logo
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', MARGIN_X, 14, 14, 14, undefined, 'FAST');
    } catch {
      // ignore
    }
  }

  // Brand lockup
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('Sculptor AI', MARGIN_X + 18, 21);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(180, 200, 230);
  doc.text('DEEP RESEARCH REPORT', MARGIN_X + 18, 25.5);

  // Date on top-right
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(200, 215, 240);
  doc.text(opts.generatedAt, PAGE_W - MARGIN_X, 21, { align: 'right' });

  // Title area starts around y=92
  let y = 92;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  setText(doc, C.accent);
  doc.text('RESEARCH QUERY', MARGIN_X, y);
  y += 9;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  setText(doc, C.text);
  const titleLines = doc.splitTextToSize(truncate(opts.query, 260), CONTENT_W);
  for (const line of titleLines.slice(0, 5)) {
    doc.text(line, MARGIN_X, y);
    y += 10;
  }
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  setText(doc, C.textSecondary);
  const sub = opts.subtitle || 'A multi-agent investigation synthesized with verified citations.';
  const subLines = doc.splitTextToSize(sub, CONTENT_W);
  for (const line of subLines) {
    doc.text(line, MARGIN_X, y);
    y += 6;
  }

  // Metadata card (rounded, gently shadowed)
  const cardY = y + 10;
  const cardH = 58;
  setFill(doc, [255, 255, 255]);
  setStroke(doc, C.divider);
  doc.setLineWidth(0.4);
  doc.roundedRect(MARGIN_X, cardY, CONTENT_W, cardH, 3, 3, 'FD');

  // Inner accent strip (top of card)
  setFill(doc, C.accentFaint);
  doc.rect(MARGIN_X, cardY, CONTENT_W, 5, 'F');

  const meta = opts.metadata || [];
  const columns = 3;
  const rows = Math.ceil(meta.length / columns);
  const cellW = CONTENT_W / columns;
  const cellH = (cardH - 10) / Math.max(rows, 1);
  for (let i = 0; i < meta.length; i += 1) {
    const col = i % columns;
    const row = Math.floor(i / columns);
    const cx = MARGIN_X + col * cellW + 6;
    const cy = cardY + 12 + row * cellH;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    setText(doc, C.textMuted);
    doc.text(String(meta[i].label || '').toUpperCase(), cx, cy);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    setText(doc, C.text);
    const value = truncate(String(meta[i].value ?? '—'), 28);
    doc.text(value, cx, cy + 5.5);
  }

  // Bottom accent bar
  const bottomY = PAGE_H - 32;
  setFill(doc, C.accent);
  doc.rect(MARGIN_X, bottomY, 40, 2, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  setText(doc, C.textMuted);
  doc.text('Generated by Sculptor AI Deep Research · ai.sculptorai.org', MARGIN_X, bottomY + 8);
};

/* ---------------- sources ---------------- */

const drawSources = (engine, doc, sources) => {
  if (!Array.isArray(sources) || sources.length === 0) return;
  engine.newPage();
  engine.writeHeading(1, `Sources (${sources.length})`);

  const size = 10;
  const lineH = size * 0.52;
  for (let i = 0; i < sources.length; i += 1) {
    const src = sources[i];
    const tag = `S${i + 1}`;
    const title = String(src.title || src.domain || 'Untitled source').slice(0, 200);
    const url = String(src.url || '').slice(0, 300);
    const domain = (() => {
      try { return new URL(url).hostname.replace(/^www\./, ''); }
      catch { return ''; }
    })();

    engine.ensureSpace(18);
    const startY = engine.state.y + 4;

    // Index pill
    setFill(doc, C.accent);
    doc.roundedRect(MARGIN_X, startY - 3.5, 10, 5.2, 1.2, 1.2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(tag, MARGIN_X + 5, startY, { align: 'center' });

    // Title (bold)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    setText(doc, C.text);
    const titleLines = doc.splitTextToSize(title, CONTENT_W - 14);
    let ty = startY;
    for (const line of titleLines.slice(0, 2)) {
      doc.text(line, MARGIN_X + 14, ty);
      ty += 5.2;
    }

    // URL
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    setText(doc, C.accent);
    const urlLines = doc.splitTextToSize(url, CONTENT_W - 14);
    doc.text(urlLines[0], MARGIN_X + 14, ty);

    // Domain / muted label
    if (domain) {
      doc.setFontSize(7.5);
      setText(doc, C.textMuted);
      const domainX = Math.min(PAGE_W - MARGIN_X, MARGIN_X + 14 + doc.getTextWidth(urlLines[0]) + 6);
      doc.text(`· ${domain}`, domainX, ty);
    }
    ty += 4;

    // Subtle underline hairline
    setStroke(doc, C.surfaceSofter);
    doc.setLineWidth(0.2);
    doc.line(MARGIN_X, ty + 1, PAGE_W - MARGIN_X, ty + 1);

    engine.state.y = ty + 4;
  }
};

/* ---------------- main entry ---------------- */

export const exportDeepResearchPdf = async ({
  query,
  content,
  metadata = {},
  sources = [],
  subQuestions = [],
  timestamp
}) => {
  const generatedAt = formatHumanDate(timestamp);
  const cleanQuery = String(query || '').trim() || 'Deep Research Report';

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  try {
    doc.setProperties({
      title: `Sculptor AI Deep Research — ${truncate(cleanQuery, 90)}`,
      subject: cleanQuery,
      author: 'Sculptor AI',
      creator: 'Sculptor AI Deep Research',
      keywords: [
        'sculptor',
        'deep research',
        metadata.reportLength || 'standard',
        metadata.reportDepth || 'standard'
      ].join(', ')
    });
  } catch {
    // ignore
  }

  // Load logo (prefer PNG icon for reliability)
  const logoDataUrl = await loadImageAsDataUrl('/images/sculptor-apple-icon.png');

  // Build metadata pairs for cover
  const metaPairs = [
    { label: 'Generated', value: generatedAt },
    { label: 'Length', value: (metadata.reportLength || 'standard') },
    { label: 'Depth', value: (metadata.reportDepth || 'standard') },
    { label: 'Planner', value: metadata.models?.planner || 'Auto' },
    { label: 'Researcher', value: metadata.models?.researcher || 'Auto' },
    { label: 'Writer', value: metadata.models?.writer || 'Auto' },
    { label: 'Agents', value: String(metadata.agentCount ?? (subQuestions?.length || '—')) },
    { label: 'Sources', value: String((sources || []).length || '—') }
  ];

  drawCover(doc, {
    query: cleanQuery,
    subtitle: 'A multi-agent investigation synthesized with verified citations.',
    generatedAt,
    metadata: metaPairs
  }, logoDataUrl);

  // Body
  const engine = createEngine(doc, {
    query: cleanQuery,
    generatedAt
  });
  engine.newPage();

  // Intro: "Report" eyebrow + a Plan section if we have sub-questions
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  setText(doc, C.accent);
  doc.text('REPORT', MARGIN_X, engine.state.y);
  engine.state.y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  setText(doc, C.text);
  const headlineLines = doc.splitTextToSize(truncate(cleanQuery, 160), CONTENT_W);
  for (const line of headlineLines) {
    doc.text(line, MARGIN_X, engine.state.y + 6);
    engine.state.y += 7;
  }
  engine.state.y += 4;

  if (Array.isArray(subQuestions) && subQuestions.length > 0) {
    engine.writeHeading(3, 'Research plan');
    engine.writeList({ type: 'list', variant: 'ol', items: subQuestions.slice(0, 12) });
    engine.state.y += 2;
  }

  // Markdown body
  const blocks = parseBlocks(content || '');
  for (const block of blocks) {
    if (block.type === 'h1') engine.writeHeading(1, block.text);
    else if (block.type === 'h2') engine.writeHeading(2, block.text);
    else if (block.type === 'h3') engine.writeHeading(3, block.text);
    else if (block.type === 'p') engine.writeParagraph(block.text);
    else if (block.type === 'list') engine.writeList(block);
    else if (block.type === 'quote') engine.writeQuote(block.text);
    else if (block.type === 'code') engine.writeCode(block);
    else if (block.type === 'hr') engine.writeRule();
  }

  // Sources section on its own page
  drawSources(engine, doc, sources);

  // Footers on body + sources pages only (skip cover)
  const totalPages = doc.getNumberOfPages();
  for (let p = 2; p <= totalPages; p += 1) {
    doc.setPage(p);
    engine.drawFooter(p - 1, totalPages - 1);
  }

  const fileBase = sanitizeFileName(cleanQuery);
  const fileTime = (timestamp ? new Date(timestamp) : new Date())
    .toISOString().replace(/[:.]/g, '-').slice(0, 19);
  doc.save(`${fileBase}-${fileTime}.pdf`);
};

export default exportDeepResearchPdf;

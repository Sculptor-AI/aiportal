import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import ReactKatex from '@pkasila/react-katex';
import 'katex/dist/katex.min.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import CodeBlockWithExecution from './CodeBlockWithExecution';
import useSupportedLanguages from '../hooks/useSupportedLanguages';
import mermaid from 'mermaid';
import { InlineHtmlArtifact, SideArtifactChip } from './ArtifactRenderer';
import {
  createArtifact,
  extractArtifactSegments,
  isInlineArtifactLanguage,
  isSideArtifactLanguage
} from '../utils/artifactParser';

// Helper for generating IDs from header text
const slugify = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Styled components for markdown formatting aligned with design language
const Bold = styled.span`
  font-weight: 700;
  color: ${props => props.theme.text};
`;

const Italic = styled.span`
  font-style: italic;
  color: ${props => props.theme.text};
`;

const Heading1 = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0.8em 0 0.3em 0;
  color: ${props => props.theme.text};
  border-bottom: 1px solid ${props => props.theme.border};
  padding-bottom: 0.25rem;
  line-height: 1.3;
  letter-spacing: -0.02em;
  scroll-margin-top: 100px;
  
  &:first-child {
    margin-top: 0;
  }
`;

const Heading2 = styled.h2`
  font-size: 1.25rem;
  font-weight: 650;
  margin: 0.7em 0 0.25em 0;
  color: ${props => props.theme.text};
  line-height: 1.3;
  letter-spacing: -0.015em;
  scroll-margin-top: 100px;
  
  &:first-child {
    margin-top: 0;
  }
`;

const Heading3 = styled.h3`
  font-size: 1.08rem;
  font-weight: 600;
  margin: 0.6em 0 0.2em 0;
  color: ${props => props.theme.text};
  line-height: 1.3;
  letter-spacing: -0.01em;
  scroll-margin-top: 100px;
  
  &:first-child {
    margin-top: 0;
  }
`;

const Heading4 = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  margin: 0.5em 0 0.2em 0;
  color: ${props => props.theme.text};
  line-height: 1.3;
  
  &:first-child {
    margin-top: 0;
  }
`;

const Heading5 = styled.h5`
  font-size: 0.92rem;
  font-weight: 600;
  margin: 0.4em 0 0.15em 0;
  color: ${props => props.theme.text};
  line-height: 1.3;
  
  &:first-child {
    margin-top: 0;
  }
`;

const Heading6 = styled.h6`
  font-size: 0.85rem;
  font-weight: 600;
  margin: 0.35em 0 0.1em 0;
  color: ${props => props.theme.text};
  line-height: 1.3;
  
  &:first-child {
    margin-top: 0;
  }
`;

const Paragraph = styled.p`
  margin: 0.4em 0;
  line-height: 1.6;
  color: ${props => props.theme.text};
  
  &:first-child {
    margin-top: 0;
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const BulletList = styled.ul`
  list-style-type: none;
  padding-left: 1em;
  margin: 0.35em 0;
  
  li {
    position: relative;
    padding-left: 1.3em;
    margin: 0.2em 0;
    line-height: 1.6;
    color: ${props => props.theme.text};
    
    &:before {
      content: "•";
      position: absolute;
      left: 0.15em;
      color: ${props => props.theme.accentColor || props.theme.text};
      font-weight: bold;
      font-size: 1em;
      opacity: 0.55;
    }
  }
`;

const NumberedList = styled.ol`
  padding-left: 1.4em;
  margin: 0.35em 0;
  
  li {
    margin: 0.2em 0;
    line-height: 1.6;
    color: ${props => props.theme.text};
    padding-left: 0.2em;
    
    &::marker {
      color: ${props => props.theme.accentColor || props.theme.text};
      opacity: 0.55;
      font-weight: 600;
      font-size: 0.9em;
    }
  }
`;

const Blockquote = styled.blockquote`
  border-left: 3px solid ${props => props.theme.accentColor || props.theme.text}44;
  margin: 0.4em 0;
  padding: 0.3rem 0 0.3rem 0.9rem;
  background: transparent;
  border-radius: 0;
  font-style: italic;
  color: ${props => `${props.theme.text}cc`};
  
  p {
    margin: 0;
    line-height: 1.6;
  }
`;

const Link = styled.a`
  color: ${props => props.theme.primary};
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-bottom-color 0.2s ease;
  
  &:hover {
    border-bottom-color: ${props => props.theme.primary};
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 0.5rem 0;
  border: 1px solid ${props => props.theme.border};
  border-radius: 8px;
  overflow: hidden;
  background: ${props => props.theme.cardBackground || (props.theme.isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)')};
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
`;

const TableHeader = styled.th`
  background: ${props => props.theme.codeBlockHeaderBg || (props.theme.isDark ? 'rgba(45, 45, 45, 0.8)' : 'rgba(240, 240, 240, 0.8)')};
  padding: 8px 10px;
  text-align: left;
  font-weight: 600;
  color: ${props => props.theme.text};
  border-bottom: 1px solid ${props => props.theme.border};
`;

const TableCell = styled.td`
  padding: 8px 10px;
  border-bottom: 1px solid ${props => props.theme.border};
  color: ${props => props.theme.text};
  
  &:last-child {
    border-bottom: none;
  }
`;

const TableRow = styled.tr`
  &:last-child td {
    border-bottom: none;
  }
  
  &:hover {
    background: ${props => props.theme.accentSurface || (props.theme.isDark ? 'rgba(10, 132, 255, 0.1)' : 'rgba(0, 122, 255, 0.05)')};
  }
`;

const CodeBlock = styled.div`
  background: ${props => props.theme.codeBlockBg || (props.theme.isDark ? 'rgba(30, 30, 30, 0.9)' : 'rgba(246, 248, 250, 0.9)')};
  border: 1px solid ${props => props.theme.codeBlockBorder || props.theme.border};
  border-radius: 12px;
  overflow: hidden;
  margin: 0.5rem 0;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace;
  font-size: 0.9em;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
`;

const CodeHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: ${props => props.theme.codeBlockHeaderBg || (props.theme.isDark ? 'rgba(45, 45, 45, 0.8)' : 'rgba(240, 240, 240, 0.8)')};
  border-bottom: 1px solid ${props => props.theme.codeBlockBorder || props.theme.border};
  font-size: 0.8em;
`;

const CodeLanguage = styled.span`
  color: ${props => props.theme.text};
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75em;
  letter-spacing: 0.5px;
`;

const CopyButton = styled.button`
  background: none;
  border: 1px solid ${props => props.theme.border};
  color: ${props => props.theme.primary};
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.7em;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  
  &:hover {
    background: ${props => props.theme.primary}10;
    border-color: ${props => props.theme.primary};
  }
`;

const Pre = styled.pre`
  margin: 0;
  padding: 10px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  background: none;
  color: ${props => props.theme.text};
  line-height: 1.4;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    height: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0,0,0,0.1);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.border};
    border-radius: 4px;
  }
`;

const InlineCode = styled.code`
  background: ${props => props.theme.inlineCodeBg || (props.theme.isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(246, 248, 250, 0.8)')};
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace;
  font-size: 0.9em;
  border: 1px solid ${props => props.theme.border};
  color: ${props => props.theme.text};
`;

const HorizontalRule = styled.hr`
  border: none;
  height: 1px;
  background: ${props => props.theme.border};
  margin: 1rem 0;
  border-radius: 1px;
`;

const InlineArtifact = styled.div`
  margin: 1rem 0 1.1rem;
  width: 100%;
  max-width: 100%;
  padding: 0;
  overflow-x: auto;
  overflow-y: hidden;
  color: ${props => props.theme.text};
  background: transparent;
  border: 0;
  border-radius: 0;

  svg {
    display: block;
    width: 100% !important;
    min-width: 640px;
    max-width: none !important;
    height: auto !important;
    margin: 0;
  }

  .nodeLabel,
  .edgeLabel,
  .actor,
  .messageText,
  .label {
    font-size: 16px !important;
  }

  @media (max-width: 640px) {
    svg {
      min-width: 520px;
    }
  }
`;

const MermaidError = styled.div`
  margin: 0.75rem 0;
  color: ${props => props.theme.text};
  font-size: 0.92rem;
  line-height: 1.5;
`;

const MermaidErrorSummary = styled.div`
  color: ${props => props.theme.error || '#b42318'};
  margin-bottom: 0.35rem;
`;

const MermaidSource = styled.pre`
  margin: 0.45rem 0 0;
  padding: 0;
  overflow-x: auto;
  white-space: pre;
  color: ${props => `${props.theme.text || '#111827'}cc`};
  background: transparent;
  border: 0;
  font-size: 0.82rem;
  line-height: 1.45;
`;


const ArtifactPreviewShell = styled.div`
  margin: 0.85rem 0 1rem;
  border: 1px solid ${props => props.theme.border || (props.theme.isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.12)')};
  border-radius: 16px;
  background: ${props => props.theme.codeBlockBg || (props.theme.isDark ? 'rgba(30, 30, 30, 0.82)' : 'rgba(246, 248, 250, 0.92)')};
  overflow: hidden;
  box-shadow: ${props => props.theme.isDark ? 'none' : '0 8px 24px rgba(15, 23, 42, 0.06)'};
`;

const ArtifactPreviewHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  color: ${props => props.theme.text || '#111'};
  border-bottom: 1px solid ${props => props.theme.border || 'rgba(0,0,0,0.12)'};
  background: ${props => props.theme.codeBlockHeaderBg || (props.theme.isDark ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.025)')};
`;

const ArtifactPreviewIcon = styled.span`
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${props => props.theme.border || 'rgba(0,0,0,0.12)'};
  border-radius: 9px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  opacity: 0.78;
  flex-shrink: 0;
`;

const ArtifactPreviewTitleGroup = styled.div`
  min-width: 0;
  flex: 1;
`;

const ArtifactPreviewTitle = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.92rem;
  font-weight: 560;
`;

const ArtifactPreviewSubtitle = styled.div`
  margin-top: 1px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.76rem;
  opacity: 0.58;
`;

const ArtifactPreviewStatus = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: ${props => props.theme.accentColor || props.theme.primary || '#3b82f6'};
  box-shadow: 0 0 0 4px ${props => `${props.theme.accentColor || props.theme.primary || '#3b82f6'}18`};
  flex-shrink: 0;
`;

const ArtifactPreviewCode = styled.pre`
  margin: 0;
  min-height: 120px;
  max-height: 240px;
  padding: 14px 16px;
  overflow: auto;
  white-space: pre;
  color: ${props => props.theme.text || '#111'};
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
  font-size: 0.82rem;
  line-height: 1.55;
  background: transparent;

  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.border || 'rgba(0,0,0,0.2)'};
    border-radius: 999px;
  }
`;

const Cursor = styled.span`
  opacity: ${props => props.$show ? 1 : 0};
  transition: opacity 0.1s ease-in-out;
  color: ${props => props.theme.text};
  animation: blink 1s infinite;

  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }
`;

const Strikethrough = styled.del`
  text-decoration: line-through;
  color: ${props => props.theme.text};
`;

const isMermaidLanguage = (language) => (
  ['mermaid', 'mmd'].includes(String(language || '').toLowerCase())
);

const normalizeMermaidSource = (chart) => String(chart || '')
  .replace(/\r\n/g, '\n')
  .replace(/^\s*```(?:mermaid|mmd)?\s*/i, '')
  .replace(/\s*```\s*$/i, '')
  .trim();

const prepareMermaidSvg = (renderedSvg) => String(renderedSvg || '').replace(/<svg\b([^>]*)>/i, (match, attrs) => {
  let nextAttrs = attrs
    .replace(/\swidth="[^"]*"/i, '')
    .replace(/\sheight="[^"]*"/i, '')
    .replace(/\sstyle="([^"]*)"/i, (_, styleValue) => {
      const cleanedStyle = styleValue
        .split(';')
        .map(part => part.trim())
        .filter(Boolean)
        .filter(part => !/^(max-width|width|height)\s*:/i.test(part))
        .join('; ');

      return cleanedStyle ? ` style="${cleanedStyle}"` : '';
    });

  if (!/\srole=/i.test(nextAttrs)) {
    nextAttrs += ' role="img"';
  }

  if (!/\saria-label=/i.test(nextAttrs)) {
    nextAttrs += ' aria-label="Generated diagram"';
  }

  if (!/\spreserveAspectRatio=/i.test(nextAttrs)) {
    nextAttrs += ' preserveAspectRatio="xMidYMid meet"';
  }

  return `<svg${nextAttrs} width="100%">`;
});

const getMermaidThemeVariables = (theme = {}) => {
  const isDark = Boolean(theme.isDark);
  const text = theme.text || (isDark ? '#f3f4f6' : '#111827');
  const border = theme.border || (isDark ? '#4b5563' : '#d1d5db');
  const surface = isDark ? '#1f2937' : '#f8fafc';
  const mutedSurface = isDark ? '#111827' : '#ffffff';

  return {
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: '16px',
    primaryColor: surface,
    primaryTextColor: text,
    primaryBorderColor: border,
    lineColor: border,
    secondaryColor: mutedSurface,
    tertiaryColor: surface,
    background: 'transparent',
    mainBkg: surface,
    secondBkg: mutedSurface,
    clusterBkg: 'transparent',
    clusterBorder: border,
    edgeLabelBackground: mutedSurface,
    actorBkg: surface,
    actorBorder: border,
    actorTextColor: text,
    noteBkgColor: mutedSurface,
    noteTextColor: text,
    noteBorderColor: border
  };
};

const getMermaidErrorLabel = (error) => {
  const firstLine = String(error || 'Unable to render diagram')
    .split('\n')
    .map(line => line.trim())
    .find(Boolean);

  return firstLine && !/^syntax error in text$/i.test(firstLine)
    ? firstLine
    : 'Diagram syntax issue';
};

const MermaidArtifact = ({ chart, theme = {}, isStreaming = false }) => {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');
  const id = useMemo(() => `mermaid-${Math.random().toString(36).slice(2)}`, [chart]);
  const mermaidThemeVariables = useMemo(
    () => getMermaidThemeVariables(theme),
    [theme?.isDark, theme?.text, theme?.border]
  );

  useEffect(() => {
    let cancelled = false;
    const source = normalizeMermaidSource(chart);

    if (!source) {
      setSvg('');
      setError('');
      return;
    }

    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: 'base',
      flowchart: {
        useMaxWidth: false,
        htmlLabels: false,
        padding: 18
      },
      sequence: {
        useMaxWidth: false,
        mirrorActors: false
      },
      gantt: {
        useMaxWidth: false
      },
      themeVariables: mermaidThemeVariables
    });

    mermaid.render(id, source)
      .then(({ svg: renderedSvg }) => {
        if (!cancelled) {
          setSvg(prepareMermaidSvg(renderedSvg));
          setError('');
        }
      })
      .catch((renderError) => {
        if (!cancelled) {
          setSvg('');
          setError(isStreaming ? '' : (renderError?.message || 'Unable to render diagram'));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [chart, id, isStreaming, mermaidThemeVariables]);

  if (error) {
    return (
      <MermaidError theme={theme}>
        <MermaidErrorSummary theme={theme}>{getMermaidErrorLabel(error)}</MermaidErrorSummary>
        <details>
          <summary>Show Mermaid source</summary>
          <MermaidSource theme={theme}>{normalizeMermaidSource(chart)}</MermaidSource>
        </details>
      </MermaidError>
    );
  }

  if (!svg) {
    return <InlineArtifact theme={theme} aria-label="Rendering diagram" />;
  }

  return (
    <InlineArtifact
      theme={theme}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};


const ARTIFACT_OPEN_TAG_REGEX = /<sculptor[-_]artifact\b([^>]*)>/gi;
const ARTIFACT_CLOSE_TAG_REGEX = /<\/sculptor[-_]artifact\s*>/i;
const FENCE_LINE_REGEX = /^```([^\n`]*)\n?/gm;

const getArtifactLanguageSetMatch = (language) => (
  isInlineArtifactLanguage(language) || isSideArtifactLanguage(language)
);

const findIncompleteTaggedArtifact = (source) => {
  let match;
  ARTIFACT_OPEN_TAG_REGEX.lastIndex = 0;

  while ((match = ARTIFACT_OPEN_TAG_REGEX.exec(source)) !== null) {
    const codeStart = ARTIFACT_OPEN_TAG_REGEX.lastIndex;
    const remainder = source.slice(codeStart);
    const closeMatch = remainder.match(ARTIFACT_CLOSE_TAG_REGEX);

    if (!closeMatch) {
      const artifact = createArtifact({
        rawContent: remainder,
        attributes: parseArtifactAttributesForPreview(match[1] || ''),
        fallbackPlacement: 'side',
        fallbackTitle: 'Artifact'
      });

      return {
        type: 'artifact-preview',
        start: match.index,
        code: remainder.replace(/^\n/, ''),
        title: artifact.title,
        placement: artifact.placement,
        language: artifact.language
      };
    }

    ARTIFACT_OPEN_TAG_REGEX.lastIndex = codeStart + closeMatch.index + closeMatch[0].length;
  }

  return null;
};

const parseArtifactAttributesForPreview = (rawAttributes = '') => {
  const attributes = {};
  const attributeRegex = /([a-zA-Z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
  let match;

  while ((match = attributeRegex.exec(rawAttributes)) !== null) {
    const key = match[1]?.toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? '';
    if (key) attributes[key] = value.trim();
  }

  return attributes;
};

const findIncompleteFencedArtifact = (source) => {
  let activeFence = null;
  let match;
  FENCE_LINE_REGEX.lastIndex = 0;

  while ((match = FENCE_LINE_REGEX.exec(source)) !== null) {
    if (activeFence) {
      activeFence = null;
      continue;
    }

    const language = String(match[1] || '').trim().split(/\s+/)[0];
    activeFence = {
      start: match.index,
      codeStart: FENCE_LINE_REGEX.lastIndex,
      language
    };
  }

  if (!activeFence || !getArtifactLanguageSetMatch(activeFence.language)) {
    return null;
  }

  const placement = isInlineArtifactLanguage(activeFence.language) ? 'inline' : 'side';
  const code = source.slice(activeFence.codeStart).replace(/^\n/, '');
  const artifact = createArtifactFromCodeBlock(activeFence.language, code, placement);

  return {
    type: 'artifact-preview',
    start: activeFence.start,
    code,
    title: artifact.title,
    placement,
    language: activeFence.language || artifact.language
  };
};

const getStreamingArtifactSegments = (source, isStreaming) => {
  if (!isStreaming) {
    return extractArtifactSegments(source);
  }

  const candidates = [
    findIncompleteTaggedArtifact(source),
    findIncompleteFencedArtifact(source)
  ].filter(Boolean);

  if (candidates.length === 0) {
    return extractArtifactSegments(source);
  }

  const activeArtifact = candidates.reduce((latest, candidate) => (
    !latest || candidate.start > latest.start ? candidate : latest
  ), null);
  const before = source.slice(0, activeArtifact.start);

  return [
    ...extractArtifactSegments(before).filter(segment => segment.type !== 'text' || String(segment.content || '').trim()),
    {
      ...activeArtifact,
      key: `artifact-preview-${activeArtifact.start}`
    }
  ];
};

const ArtifactStreamingPreview = ({ code = '', title = 'Artifact', placement = 'side', language = 'html', theme = {} }) => {
  const codeRef = useRef(null);

  useEffect(() => {
    if (codeRef.current) {
      codeRef.current.scrollTop = codeRef.current.scrollHeight;
    }
  }, [code]);

  const normalizedLanguage = String(language || 'html').toUpperCase();
  const placementLabel = placement === 'inline' ? 'inline preview' : 'sidebar preview';

  return (
    <ArtifactPreviewShell theme={theme} aria-label={`Generating ${title}`}>
      <ArtifactPreviewHeader theme={theme}>
        <ArtifactPreviewIcon theme={theme}>HTML</ArtifactPreviewIcon>
        <ArtifactPreviewTitleGroup>
          <ArtifactPreviewTitle>{title}</ArtifactPreviewTitle>
          <ArtifactPreviewSubtitle>{`Creating ${placementLabel} · ${normalizedLanguage} streaming`}</ArtifactPreviewSubtitle>
        </ArtifactPreviewTitleGroup>
        <ArtifactPreviewStatus theme={theme} aria-hidden="true" />
      </ArtifactPreviewHeader>
      <ArtifactPreviewCode ref={codeRef} theme={theme}>{code || 'Waiting for artifact code…'}</ArtifactPreviewCode>
    </ArtifactPreviewShell>
  );
};

const createArtifactFromCodeBlock = (language, codeContent, placement) => createArtifact({
  rawContent: codeContent,
  attributes: {
    language: 'html'
  },
  fallbackPlacement: placement,
  fallbackTitle: placement === 'inline' ? 'Inline artifact' : 'Artifact'
});


const normalizeLatexDelimiters = (source = '') => {
  const text = String(source || '');
  if (!text.includes('\\(') && !text.includes('\\[')) {
    return text;
  }

  const segments = text.split(/(```[\s\S]*?```|`[^`\n]*`)/g);
  return segments.map((segment) => {
    if (!segment || segment.startsWith('```') || segment.startsWith('`')) {
      return segment;
    }

    return segment
      .replace(/\\\[([\s\S]*?)\\\]/g, (_match, math) => `$$${math}$$`)
      .replace(/\\\(([\s\S]*?)\\\)/g, (_match, math) => `$${math}$`);
  }).join('');
};

const StreamingMarkdownRenderer = ({ 
  text = '', 
  isStreaming = false,
  showCursor = true,
  theme = {},
  enableCodeExecution = true
}) => {
  const { supportedLanguages, isLanguageExecutable } = useSupportedLanguages();
  const normalizedText = useMemo(() => normalizeLatexDelimiters(text), [text]);
  const artifactSegments = useMemo(() => getStreamingArtifactSegments(normalizedText, isStreaming), [normalizedText, isStreaming]);

  if (!normalizedText) {
    return isStreaming && showCursor ? <Cursor $show={true} theme={theme}>|</Cursor> : null;
  }

  // Custom renderers for markdown elements
  const components = {
    h1: ({node, children, ...props}) => {
      const id = slugify(children?.[0]?.toString());
      return <Heading1 id={id} {...props} theme={theme}>{children}</Heading1>;
    },
    h2: ({node, children, ...props}) => {
      const id = slugify(children?.[0]?.toString());
      return <Heading2 id={id} {...props} theme={theme}>{children}</Heading2>;
    },
    h3: ({node, children, ...props}) => {
      const id = slugify(children?.[0]?.toString());
      return <Heading3 id={id} {...props} theme={theme}>{children}</Heading3>;
    },
    h4: props => <Heading4 {...props} theme={theme} />,
    h5: props => <Heading5 {...props} theme={theme} />,
    h6: props => <Heading6 {...props} theme={theme} />,
    p: props => <Paragraph {...props} theme={theme} />,
    ul: props => <BulletList {...props} theme={theme} />,
    ol: props => <NumberedList {...props} theme={theme} />,
    li: props => <li {...props} style={{ color: theme.text }} />,
    blockquote: props => <Blockquote {...props} theme={theme} />,
    a: props => <Link {...props} theme={theme} />,
    table: props => <Table {...props} theme={theme} />,
    th: props => <TableHeader {...props} theme={theme} />,
    td: props => <TableCell {...props} theme={theme} />,
    del: props => <Strikethrough {...props} theme={theme} />,
    code({node, inline, className, children, ...props}) {
      const match = /language-([^\s]+)/.exec(className || '');
      const language = match ? match[1] : '';
      const position = node?.position;
      const spansMultipleLines = Boolean(position && position.start?.line !== position.end?.line);
      const isBlockCode = inline === false || Boolean(className) || spansMultipleLines;
      if (isBlockCode) {
        if (isMermaidLanguage(language)) {
          return <MermaidArtifact chart={children} theme={theme} isStreaming={isStreaming} />;
        }

        const codeContent = String(children).replace(/\n$/, '');
        if (isInlineArtifactLanguage(language)) {
          const artifact = createArtifactFromCodeBlock(language, codeContent, 'inline');
          return <InlineHtmlArtifact code={artifact.code} title={artifact.title} theme={theme} />;
        }

        if (isSideArtifactLanguage(language)) {
          const artifact = createArtifactFromCodeBlock(language, codeContent, 'side');
          return <SideArtifactChip code={artifact.code} title={artifact.title} theme={theme} />;
        }

        if (enableCodeExecution && isLanguageExecutable && isLanguageExecutable(language)) {
          return (
            <CodeBlockWithExecution
              language={language}
              content={codeContent}
              theme={theme}
              supportedLanguages={supportedLanguages}
            />
          );
        }
        return (
          <CodeBlock key={`code-block-${Math.random()}`} theme={theme}>
            <CodeHeader theme={theme}>
              <CodeLanguage theme={theme}>{language}</CodeLanguage>
              <CopyButton theme={theme} onClick={() => navigator.clipboard.writeText(codeContent)}>
                Copy
              </CopyButton>
            </CodeHeader>
            <Pre theme={theme}>
              <code className={className} style={{ color: theme.text }}>{children}</code>
            </Pre>
          </CodeBlock>
        );
      }
      return <InlineCode theme={theme}>{children}</InlineCode>;
    },
  };

  return (
    <div style={{ 
      fontFamily: 'inherit', 
      lineHeight: 1.6, 
      wordWrap: 'break-word', 
      whiteSpace: 'normal',
      color: theme.text || '#000'
    }}>
      {artifactSegments.map((segment, index) => {
        if (segment.type === 'artifact-preview') {
          return (
            <ArtifactStreamingPreview
              key={segment.key || `artifact-preview-${index}`}
              code={segment.code}
              title={segment.title}
              placement={segment.placement}
              language={segment.language}
              theme={theme}
            />
          );
        }

        if (segment.type === 'artifact') {
          if (segment.placement === 'inline') {
            return (
              <InlineHtmlArtifact
                key={segment.key || `inline-artifact-${index}`}
                code={segment.code}
                title={segment.title}
                theme={theme}
              />
            );
          }

          return (
            <SideArtifactChip
              key={segment.key || `side-artifact-${index}`}
              code={segment.code}
              title={segment.title}
              theme={theme}
            />
          );
        }

        if (!String(segment.content || '').trim()) {
          return null;
        }

        return (
          <ReactMarkdown
            key={`markdown-${index}`}
            children={segment.content}
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={components}
          />
        );
      })}
      {isStreaming && showCursor && (
        <Cursor $show={true} theme={theme}>|</Cursor>
      )}
    </div>
  );
};

export default StreamingMarkdownRenderer;

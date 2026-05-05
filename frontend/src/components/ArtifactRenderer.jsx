import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { Code2, Copy, Download, Eye, FileCode2, PanelRightOpen, X } from 'lucide-react';
import { buildArtifactDocument, postArtifactChatResult } from '../utils/artifactBridge';
import { sendArtifactChat } from '../services/shareService';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const slugifyFilename = (value = 'artifact') => {
  const slug = String(value || 'artifact')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);

  return `${slug || 'artifact'}.html`;
};

const copyText = async (text) => {
  await navigator.clipboard.writeText(text);
};

const downloadText = (text, filename) => {
  const blob = new Blob([text], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const InlineArtifactWrap = styled.div`
  width: 100%;
  margin: 14px 0 16px;
  background: transparent;
  border: 0;
  overflow: hidden;
`;

const ArtifactIframe = styled.iframe`
  display: block;
  width: 100%;
  height: ${props => props.$height || '100%'};
  min-height: ${props => props.$variant === 'inline' ? '220px' : '100%'};
  border: 0;
  background: transparent;
`;

const ChipButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 9px;
  max-width: 100%;
  min-height: 34px;
  margin: 8px 0;
  padding: 6px 10px;
  border: 1px solid ${props => props.theme.border || 'rgba(0,0,0,0.12)'};
  border-radius: 999px;
  background: ${props => props.theme.inputBackground || (props.theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)')};
  color: ${props => props.theme.text || '#111'};
  font: inherit;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;

  &:hover {
    background: ${props => props.theme.isDark ? 'rgba(255,255,255,0.075)' : 'rgba(0,0,0,0.045)'};
    border-color: ${props => props.theme.text || 'rgba(0,0,0,0.35)'};
  }

  &:active {
    transform: translateY(1px);
  }

  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    opacity: 0.72;
  }
`;

const ChipText = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ChipMeta = styled.span`
  color: ${props => props.theme.text || '#111'};
  opacity: 0.56;
  font-size: 0.78rem;
  white-space: nowrap;
`;

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: rgba(0, 0, 0, ${props => props.$open ? '0.18' : '0'});
  pointer-events: ${props => props.$open ? 'auto' : 'none'};
  transition: background 0.2s ease;
`;

const Panel = styled.aside`
  position: fixed;
  top: 0;
  right: 0;
  z-index: 1101;
  width: min(760px, calc(100vw - 32px));
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: ${props => props.theme.background || '#fff'};
  color: ${props => props.theme.text || '#111'};
  border-left: 1px solid ${props => props.theme.border || 'rgba(0,0,0,0.12)'};
  box-shadow: -18px 0 42px rgba(0, 0, 0, 0.16);
  transform: translateX(${props => props.$open ? '0' : '100%'});
  transition: transform 0.24s cubic-bezier(0.22, 1, 0.36, 1);
`;

const PanelHeader = styled.header`
  min-height: 52px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 12px 9px 14px;
  border-bottom: 1px solid ${props => props.theme.border || 'rgba(0,0,0,0.12)'};
`;

const TitleGroup = styled.div`
  min-width: 0;
  flex: 1;
`;

const PanelTitle = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.95rem;
  font-weight: 520;
`;

const PanelSubtitle = styled.div`
  margin-top: 2px;
  font-size: 0.75rem;
  opacity: 0.55;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
`;

const Segmented = styled.div`
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 2px;
  border: 1px solid ${props => props.theme.border || 'rgba(0,0,0,0.12)'};
  border-radius: 999px;
  background: ${props => props.theme.inputBackground || 'transparent'};
`;

const SegmentButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 26px;
  padding: 0 9px;
  border: 0;
  border-radius: 999px;
  background: ${props => props.$active ? (props.theme.sidebar || props.theme.background || '#fff') : 'transparent'};
  color: ${props => props.theme.text || '#111'};
  font: inherit;
  font-size: 0.78rem;
  cursor: pointer;
  opacity: ${props => props.$active ? '1' : '0.68'};

  svg {
    width: 14px;
    height: 14px;
  }
`;

const IconButton = styled.button`
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${props => props.theme.border || 'rgba(0,0,0,0.12)'};
  border-radius: 999px;
  background: transparent;
  color: ${props => props.theme.text || '#111'};
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;

  &:hover {
    background: ${props => props.theme.inputBackground || (props.theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)')};
    border-color: ${props => props.theme.text || 'rgba(0,0,0,0.35)'};
  }

  svg {
    width: 15px;
    height: 15px;
  }
`;

const PanelBody = styled.div`
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: ${props => props.$code ? (props.theme.codeBlockBg || props.theme.inputBackground || 'rgba(0,0,0,0.04)') : 'transparent'};
`;

const CodeView = styled.pre`
  height: 100%;
  margin: 0;
  padding: 16px;
  overflow: auto;
  white-space: pre;
  color: ${props => props.theme.text || '#111'};
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
  font-size: 0.82rem;
  line-height: 1.5;
  background: transparent;
`;

const StatusText = styled.span`
  font-size: 0.75rem;
  opacity: 0.62;
`;

const ArtifactFrame = ({ code, title, theme = {}, variant = 'side' }) => {
  const iframeRef = useRef(null);
  const [height, setHeight] = useState(variant === 'inline' ? 320 : null);
  const documentSource = useMemo(() => buildArtifactDocument(code), [code]);

  useEffect(() => {
    const handleMessage = async (event) => {
      const iframeWindow = iframeRef.current?.contentWindow;
      const data = event.data || {};

      if (event.source !== iframeWindow) {
        return;
      }

      if (data.type === 'sculptor-artifact-resize' && variant === 'inline') {
        const nextHeight = Number(data.height);
        if (Number.isFinite(nextHeight)) {
          setHeight(clamp(Math.ceil(nextHeight), 220, 720));
        }
        return;
      }

      if (data.type !== 'sculptor-artifact-chat') {
        return;
      }

      const prompt = typeof data.prompt === 'string' ? data.prompt.trim() : '';
      if (!prompt || prompt.length > 8000) {
        postArtifactChatResult(iframeWindow, data.requestId, {
          ok: false,
          error: 'Artifact chat prompts must be between 1 and 8000 characters.'
        });
        return;
      }

      try {
        const content = await sendArtifactChat({
          artifactTitle: title,
          artifactId: title || 'local',
          html: code,
          prompt
        });
        postArtifactChatResult(iframeWindow, data.requestId, { ok: true, content });
      } catch (error) {
        postArtifactChatResult(iframeWindow, data.requestId, {
          ok: false,
          error: error.message || 'Artifact chat failed'
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [code, title, variant]);

  return (
    <ArtifactIframe
      ref={iframeRef}
      srcDoc={documentSource}
      sandbox="allow-scripts allow-forms"
      referrerPolicy="no-referrer"
      title={title}
      $height={variant === 'inline' ? `${height}px` : '100%'}
      $variant={variant}
      theme={theme}
    />
  );
};

export const InlineHtmlArtifact = ({ code, title = 'Inline artifact', theme = {} }) => (
  <InlineArtifactWrap theme={theme}>
    <ArtifactFrame code={code} title={title} theme={theme} variant="inline" />
  </InlineArtifactWrap>
);

const ArtifactPanel = ({ open, onClose, code, title, theme = {} }) => {
  const [view, setView] = useState('preview');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (open) {
      setView('preview');
      setStatus('');
    }
  }, [open]);

  const showStatus = (message) => {
    setStatus(message);
    window.setTimeout(() => setStatus(''), 2200);
  };

  const handleCopy = async () => {
    try {
      await copyText(code);
      showStatus('Copied');
    } catch (error) {
      showStatus('Copy failed');
    }
  };

  const handleDownload = () => {
    downloadText(code, slugifyFilename(title));
    showStatus('Downloaded');
  };

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <>
      <Backdrop $open={open} onClick={onClose} />
      <Panel $open={open} theme={theme} aria-hidden={!open}>
        <PanelHeader theme={theme}>
          <FileCode2 size={18} />
          <TitleGroup>
            <PanelTitle>{title}</PanelTitle>
            <PanelSubtitle>Sandboxed artifact</PanelSubtitle>
          </TitleGroup>
          <HeaderActions>
            {status && <StatusText>{status}</StatusText>}
            <Segmented theme={theme} role="tablist" aria-label="Artifact view">
              <SegmentButton
                type="button"
                $active={view === 'preview'}
                theme={theme}
                onClick={() => setView('preview')}
              >
                <Eye />
                Preview
              </SegmentButton>
              <SegmentButton
                type="button"
                $active={view === 'code'}
                theme={theme}
                onClick={() => setView('code')}
              >
                <Code2 />
                Code
              </SegmentButton>
            </Segmented>
            <IconButton type="button" theme={theme} onClick={handleCopy} aria-label="Copy artifact code" title="Copy code">
              <Copy />
            </IconButton>
            <IconButton type="button" theme={theme} onClick={handleDownload} aria-label="Download artifact" title="Download HTML">
              <Download />
            </IconButton>
            <IconButton type="button" theme={theme} onClick={onClose} aria-label="Close artifact">
              <X />
            </IconButton>
          </HeaderActions>
        </PanelHeader>
        <PanelBody theme={theme} $code={view === 'code'}>
          {view === 'preview' ? (
            <ArtifactFrame code={code} title={title} theme={theme} variant="side" />
          ) : (
            <CodeView theme={theme}>{code}</CodeView>
          )}
        </PanelBody>
      </Panel>
    </>,
    document.body
  );
};

export const SideArtifactChip = ({ code, title = 'Artifact', theme = {} }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ChipButton type="button" theme={theme} onClick={() => setOpen(true)}>
        <PanelRightOpen />
        <ChipText>{title}</ChipText>
        <ChipMeta theme={theme}>Open artifact</ChipMeta>
      </ChipButton>
      <ArtifactPanel
        open={open}
        onClose={() => setOpen(false)}
        code={code}
        title={title}
        theme={theme}
      />
    </>
  );
};

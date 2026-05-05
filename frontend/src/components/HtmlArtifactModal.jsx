import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { buildArtifactDocument, postArtifactChatResult } from '../utils/artifactBridge';
import { createSharedArtifact, getSharedArtifactUrl, sendArtifactChat } from '../services/shareService';

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.42);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(6px);
`;

const ModalContainer = styled.div`
  background: ${props => props.theme.background};
  border: 1px solid ${props => props.theme.border};
  border-radius: 10px;
  width: 96vw;
  height: 94vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.32);
  overflow: hidden;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-bottom: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.background};
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
  color: ${props => props.theme.text};
  opacity: 0.72;
`;

const BrandLogo = styled.img`
  width: 22px;
  height: 22px;
  object-fit: contain;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: inherit;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

const StatusText = styled.span`
  color: ${props => props.theme.text};
  opacity: 0.62;
  font-size: 12px;
`;

const ActionButton = styled.button`
  border: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.inputBackground || 'transparent'};
  color: ${props => props.theme.text};
  cursor: pointer;
  height: 32px;
  padding: 0 10px;
  border-radius: 7px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  transition: background 0.15s ease, border-color 0.15s ease;

  &:hover:not(:disabled) {
    background: ${props => props.theme.border};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  svg {
    width: 15px;
    height: 15px;
  }
`;

const IconButton = styled(ActionButton)`
  width: 32px;
  padding: 0;
`;

const ArtifactContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ArtifactIframe = styled.iframe`
  flex: 1;
  border: none;
  width: 100%;
  height: 100%;
  background: white;
`;

const HtmlArtifactModal = ({
  isOpen,
  onClose,
  htmlContent,
  title = 'Sculptor artifact',
  sourceChatId,
  sourceMessageId
}) => {
  const iframeRef = useRef(null);
  const [shareStatus, setShareStatus] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const artifactDocument = useMemo(() => buildArtifactDocument(htmlContent), [htmlContent]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleMessage = async (event) => {
      const iframeWindow = iframeRef.current?.contentWindow;
      const data = event.data || {};

      if (event.source !== iframeWindow || data.type !== 'sculptor-artifact-chat') {
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
          artifactId: sourceMessageId || sourceChatId || 'local',
          html: htmlContent,
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
  }, [htmlContent, isOpen, sourceChatId, sourceMessageId, title]);

  if (!isOpen || !htmlContent) return null;

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    setShareStatus('');

    try {
      const result = await createSharedArtifact({
        title,
        html: htmlContent,
        sourceChatId,
        sourceMessageId
      });
      const shareUrl = getSharedArtifactUrl(result);
      await navigator.clipboard.writeText(shareUrl);
      setShareStatus('Link copied');
    } catch (error) {
      console.error('Failed to share artifact:', error);
      setShareStatus(error.message || 'Could not share');
    } finally {
      setIsSharing(false);
      window.setTimeout(() => setShareStatus(''), 3500);
    }
  };

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContainer>
        <ModalHeader>
          <Brand>
            <BrandLogo src="/images/sculptor.svg" alt="" />
            <ModalTitle>{title}</ModalTitle>
          </Brand>
          <HeaderActions>
            {shareStatus && <StatusText>{shareStatus}</StatusText>}
            <ActionButton onClick={handleShare} disabled={isSharing}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                <polyline points="16 6 12 2 8 6"></polyline>
                <line x1="12" y1="2" x2="12" y2="15"></line>
              </svg>
              Share
            </ActionButton>
            <IconButton onClick={onClose} aria-label="Close artifact">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </IconButton>
          </HeaderActions>
        </ModalHeader>
        <ArtifactContent>
          <ArtifactIframe
            ref={iframeRef}
            srcDoc={artifactDocument}
            sandbox="allow-scripts allow-forms"
            referrerPolicy="no-referrer"
            title="HTML artifact preview"
          />
        </ArtifactContent>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default HtmlArtifactModal;

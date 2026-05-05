import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { useParams } from 'react-router-dom';
import { buildArtifactDocument, postArtifactChatResult } from '../utils/artifactBridge';
import { AuthRequiredError, fetchSharedArtifact, sendArtifactChat } from '../services/shareService';
import LoginModal from './LoginModal';

const Page = styled.main`
  min-height: 100vh;
  height: 100vh;
  background: ${props => props.theme.background};
  color: ${props => props.theme.text};
  display: flex;
  flex-direction: column;
`;

const Header = styled.header`
  height: 44px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  border-bottom: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.background};
`;

const Logo = styled.img`
  width: 22px;
  height: 22px;
  object-fit: contain;
  opacity: 0.75;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme.text};
  opacity: 0.74;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ArtifactFrame = styled.iframe`
  flex: 1;
  border: 0;
  width: 100%;
  min-height: 0;
  background: white;
`;

const CenterState = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
  color: ${props => props.theme.text};
  opacity: 0.72;
`;

const DialogOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.42);
  backdrop-filter: blur(4px);
`;

const Dialog = styled.div`
  width: min(420px, 100%);
  border: 1px solid ${props => props.theme.border};
  border-radius: 14px;
  background: ${props => props.theme.sidebar || props.theme.background};
  color: ${props => props.theme.text};
  padding: 20px;
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.22);
`;

const DialogTitle = styled.h2`
  margin: 0 0 8px;
  font-size: 1.05rem;
`;

const DialogText = styled.p`
  margin: 0 0 18px;
  font-size: 0.92rem;
  line-height: 1.5;
  opacity: 0.76;
`;

const DialogActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

const DialogButton = styled.button`
  border: 1px solid ${props => props.theme.border};
  border-radius: 999px;
  padding: 9px 14px;
  background: ${props => props.$primary ? (props.theme.primary || '#111') : 'transparent'};
  color: ${props => props.$primary ? '#fff' : props.theme.text};
  cursor: pointer;
`;

const SharedArtifactView = () => {
  const { artifactId } = useParams();
  const iframeRef = useRef(null);
  const [artifact, setArtifact] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const artifactDocument = useMemo(() => buildArtifactDocument(artifact?.html || ''), [artifact?.html]);

  useEffect(() => {
    let cancelled = false;

    const loadArtifact = async () => {
      if (!artifactId) {
        setError('No artifact id was provided.');
        setLoading(false);
        return;
      }

      try {
        const data = await fetchSharedArtifact(artifactId);
        if (!cancelled) {
          setArtifact(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message || 'Could not load this artifact.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadArtifact();
    return () => {
      cancelled = true;
    };
  }, [artifactId]);

  useEffect(() => {
    const handleMessage = async (event) => {
      const iframeWindow = iframeRef.current?.contentWindow;
      const data = event.data || {};

      if (event.source !== iframeWindow || data.type !== 'sculptor-artifact-chat') {
        return;
      }

      const prompt = typeof data.prompt === 'string' ? data.prompt.trim() : '';
      if (!artifact?.allowModelChat) {
        postArtifactChatResult(iframeWindow, data.requestId, {
          ok: false,
          error: 'Model chat is disabled for this artifact.'
        });
        return;
      }

      if (!prompt || prompt.length > 8000) {
        postArtifactChatResult(iframeWindow, data.requestId, {
          ok: false,
          error: 'Artifact chat prompts must be between 1 and 8000 characters.'
        });
        return;
      }

      try {
        const content = await sendArtifactChat({
          artifactTitle: artifact.title,
          artifactId: artifact.id,
          html: artifact.html,
          prompt,
          shared: true
        });
        postArtifactChatResult(iframeWindow, data.requestId, { ok: true, content });
      } catch (chatError) {
        if (chatError instanceof AuthRequiredError || chatError.code === 'auth_required') {
          setShowAuthDialog(true);
          postArtifactChatResult(iframeWindow, data.requestId, {
            ok: false,
            error: 'Sign in to use AI inside this artifact.'
          });
          return;
        }

        postArtifactChatResult(iframeWindow, data.requestId, {
          ok: false,
          error: chatError.message || 'Artifact chat failed'
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [artifact]);

  if (loading) {
    return <CenterState>Loading artifact...</CenterState>;
  }

  if (error) {
    return <CenterState>{error}</CenterState>;
  }

  return (
    <Page>
      <Header>
        <Logo src="/images/sculptor.svg" alt="" />
        <Title>{artifact.title || 'Sculptor artifact'}</Title>
      </Header>
      <ArtifactFrame
        ref={iframeRef}
        srcDoc={artifactDocument}
        sandbox="allow-scripts allow-forms"
        referrerPolicy="no-referrer"
        title={artifact.title || 'Sculptor artifact'}
      />
      {showAuthDialog && (
        <DialogOverlay>
          <Dialog>
            <DialogTitle>Sign in to use artifact AI</DialogTitle>
            <DialogText>
              This artifact is public, but AI interaction requires an authenticated Sculptor account.
            </DialogText>
            <DialogActions>
              <DialogButton type="button" onClick={() => setShowAuthDialog(false)}>Cancel</DialogButton>
              <DialogButton
                type="button"
                $primary
                onClick={() => {
                  setShowAuthDialog(false);
                  setShowLoginModal(true);
                }}
              >
                Sign in
              </DialogButton>
            </DialogActions>
          </Dialog>
        </DialogOverlay>
      )}
      {showLoginModal && <LoginModal closeModal={() => setShowLoginModal(false)} />}
    </Page>
  );
};

export default SharedArtifactView;

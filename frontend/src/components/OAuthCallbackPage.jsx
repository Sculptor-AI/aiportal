import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { completeOAuthLogin } from '../services/authService';

let hasProcessedCallback = false;

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background:
    radial-gradient(circle at top, rgba(66, 133, 244, 0.12), transparent 40%),
    linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
`;

const Card = styled.div`
  width: min(480px, 100%);
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 20px;
  padding: 32px 28px;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
  text-align: center;
`;

const Title = styled.h1`
  margin: 0 0 12px;
  color: #111827;
  font-size: 1.75rem;
  font-weight: 700;
`;

const Message = styled.p`
  margin: 0;
  color: #475569;
  font-size: 1rem;
  line-height: 1.6;
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  margin: 0 auto 20px;
  border: 3px solid rgba(59, 130, 246, 0.16);
  border-top-color: #3b82f6;
  border-radius: 999px;
  animation: spin 0.9s linear infinite;

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const ActionButton = styled.button`
  margin-top: 20px;
  padding: 12px 18px;
  border: none;
  border-radius: 12px;
  background: #111827;
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.18s ease, opacity 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    opacity: 0.92;
  }
`;

const getOauthResultToken = () => {
  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;

  return new URLSearchParams(hash).get('oauth_result');
};

const OAuthCallbackPage = () => {
  const hasProcessedRef = useRef(false);
  const [state, setState] = useState({
    kind: 'loading',
    title: 'Finishing Google sign-in',
    message: 'We’re securely completing your sign-in now.'
  });

  useEffect(() => {
    if (hasProcessedRef.current || hasProcessedCallback) {
      return;
    }

    hasProcessedRef.current = true;
    hasProcessedCallback = true;

    const resultToken = getOauthResultToken();
    const cleanUrl = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState({}, document.title, cleanUrl);

    if (!resultToken) {
      setState({
        kind: 'error',
        title: 'Google sign-in failed',
        message: 'The callback token was missing. Please try signing in again.'
      });
      return;
    }

    const run = async () => {
      try {
        const result = await completeOAuthLogin(resultToken);

        if (result.status === 'authenticated') {
          setState({
            kind: 'loading',
            title: 'Signed in successfully',
            message: 'Redirecting you back into Sculptor.'
          });
          window.location.replace(result.returnTo || '/');
          return;
        }

        if (result.status === 'pending') {
          setState({
            kind: 'pending',
            title: 'Account pending approval',
            message: result.message || 'Your account is awaiting admin approval.'
          });
          return;
        }

        setState({
          kind: 'error',
          title: 'Google sign-in failed',
          message: 'We could not finish your Google sign-in. Please try again.'
        });
      } catch (error) {
        setState({
          kind: 'error',
          title: 'Google sign-in failed',
          message: error.message || 'We could not finish your Google sign-in. Please try again.'
        });
      }
    };

    run();
  }, []);

  return (
    <Page>
      <Card>
        {state.kind === 'loading' && <Spinner />}
        <Title>{state.title}</Title>
        <Message>{state.message}</Message>
        {state.kind !== 'loading' && (
          <ActionButton type="button" onClick={() => window.location.replace('/')}>
            Back to sign-in
          </ActionButton>
        )}
      </Card>
    </Page>
  );
};

export default OAuthCallbackPage;

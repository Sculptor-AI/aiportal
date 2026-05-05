import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fetchSharedChat } from '../services/shareService';

const Page = styled.main`
  min-height: 100vh;
  background: ${props => props.theme.chat || props.theme.background};
  color: ${props => props.theme.text};
`;

const Shell = styled.div`
  width: min(820px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 36px 0 56px;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 20px;
  margin-bottom: 26px;
  border-bottom: 1px solid ${props => props.theme.border};
`;

const Logo = styled.img`
  width: 24px;
  height: 24px;
  object-fit: contain;
  opacity: 0.8;
`;

const TitleGroup = styled.div`
  min-width: 0;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 22px;
  line-height: 1.25;
  font-weight: 560;
  overflow-wrap: anywhere;
`;

const Meta = styled.div`
  margin-top: 5px;
  font-size: 13px;
  color: ${props => props.theme.text};
  opacity: 0.58;
`;

const MessageList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 26px;
`;

const Message = styled.article`
  display: grid;
  grid-template-columns: 86px minmax(0, 1fr);
  gap: 18px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 6px;
  }
`;

const Role = styled.div`
  color: ${props => props.theme.text};
  opacity: 0.54;
  font-size: 13px;
  text-transform: capitalize;
`;

const Content = styled.div`
  font-size: 15px;
  line-height: 1.65;
  overflow-wrap: anywhere;

  p {
    margin: 0 0 12px;
  }

  p:last-child {
    margin-bottom: 0;
  }

  pre {
    overflow-x: auto;
    padding: 12px;
    border-radius: 8px;
    background: ${props => props.theme.inputBackground || 'rgba(0, 0, 0, 0.04)'};
  }
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

const SharedChatView = () => {
  const params = useParams();
  const [chat, setChat] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const shareId = useMemo(() => {
    if (params.shareId) return params.shareId;
    return new URLSearchParams(window.location.search).get('id');
  }, [params.shareId]);

  useEffect(() => {
    let cancelled = false;

    const loadShare = async () => {
      if (!shareId) {
        setError('No shared chat id was provided.');
        setLoading(false);
        return;
      }

      try {
        const data = await fetchSharedChat(shareId);
        if (!cancelled) {
          setChat(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message || 'Could not load this shared chat.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadShare();
    return () => {
      cancelled = true;
    };
  }, [shareId]);

  if (loading) {
    return <CenterState>Loading shared chat...</CenterState>;
  }

  if (error) {
    return <CenterState>{error}</CenterState>;
  }

  return (
    <Page>
      <Shell>
        <Header>
          <Logo src="/images/sculptor.svg" alt="" />
          <TitleGroup>
            <Title>{chat.title || 'Shared chat'}</Title>
            <Meta>Shared from Sculptor</Meta>
          </TitleGroup>
        </Header>
        <MessageList>
          {(chat.messages || []).map((message, index) => (
            <Message key={message.id || `${message.role}-${index}`}>
              <Role>{message.role}</Role>
              <Content>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content || ''}
                </ReactMarkdown>
              </Content>
            </Message>
          ))}
        </MessageList>
      </Shell>
    </Page>
  );
};

export default SharedChatView;

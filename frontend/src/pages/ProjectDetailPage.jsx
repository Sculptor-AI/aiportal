import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import styled, { useTheme } from 'styled-components';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from '../contexts/TranslationContext';
import ChatMessage from '../components/ChatMessage';
import ModelSelector from '../components/ModelSelector';

const PAGE_SIDEBAR_OFFSET = 320;
const KNOWLEDGE_CAPACITY_BYTES = 10 * 1024 * 1024;

const PageContainer = styled.div`
  flex: 1;
  min-height: 100vh;
  color: ${props => props.theme.text};
  background: ${props => props.theme.background};
  overflow-y: auto;
  transition: margin-left 0.3s cubic-bezier(0.25, 1, 0.5, 1), width 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  width: ${props => (props.$collapsed ? '100%' : `calc(100% - ${PAGE_SIDEBAR_OFFSET}px)`)};
  margin-left: ${props => (props.$collapsed ? '0' : `${PAGE_SIDEBAR_OFFSET}px`)};

  @media (max-width: 1024px) {
    width: 100%;
    margin-left: 0;
  }
`;

const ContentWrapper = styled.div`
  max-width: 1180px;
  margin: 0 auto;
  padding: 28px 36px 60px;

  @media (max-width: 900px) {
    padding: 20px 16px 40px;
  }
`;

const BackLink = styled(Link)`
  display: block;
  color: ${props => props.theme.text};
  text-decoration: none;
  font-size: 0.88rem;
  opacity: 0.6;
  margin-bottom: 16px;
  transition: opacity 0.15s ease;

  &:hover {
    opacity: 1;
  }
`;

const TitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 28px;
`;

const ProjectTitle = styled.h1`
  margin: 0;
  font-size: clamp(1.6rem, 2.8vw, 2.1rem);
  letter-spacing: -0.025em;
  font-weight: 500;
  line-height: 1.2;
`;

const TitleActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
`;

const IconBtn = styled.button`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  color: ${props => props.theme.text};
  opacity: 0.5;
  cursor: pointer;
  border-radius: 8px;
  transition: opacity 0.15s, background 0.15s;

  &:hover {
    opacity: 1;
    background: ${props => props.theme.hover || 'rgba(128,128,128,0.1)'};
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const LayoutGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 28px;
  align-items: start;

  @media (max-width: 1080px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const MainColumn = styled.div`
  min-width: 0;
`;

/* ── Simple composer (matches Claude's "Reply..." box) ── */

const ComposerCard = styled.div`
  background: ${props => props.theme.sidebar};
  border: 1px solid ${props => props.theme.border};
  border-radius: 16px;
  overflow: hidden;
`;

const ComposerInner = styled.div`
  padding: 16px 18px;
`;

const ComposerTextarea = styled.textarea`
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  color: ${props => props.theme.text};
  font-size: 1rem;
  line-height: 1.5;
  font-family: ${props => props.theme.fontFamily || 'inherit'};
  min-height: 40px;
  max-height: 160px;

  &::placeholder {
    color: ${props => props.theme.text}50;
  }
`;

const ComposerFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  border-top: 1px solid ${props => props.theme.border};
`;

const ComposerLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ComposerBtn = styled.button`
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  color: ${props => props.theme.text};
  opacity: 0.45;
  cursor: pointer;
  border-radius: 8px;
  transition: opacity 0.15s, background 0.15s;

  &:hover {
    opacity: 0.9;
    background: ${props => props.theme.hover || 'rgba(128,128,128,0.1)'};
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const SendBtn = styled.button`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 10px;
  background: ${props => props.theme.text};
  color: ${props => props.theme.background};
  cursor: pointer;
  opacity: ${props => (props.disabled ? 0.3 : 1)};
  transition: opacity 0.15s;

  svg {
    width: 16px;
    height: 16px;
  }
`;

/* ── Messages area ── */

const MessagesArea = styled.div`
  margin-top: 20px;
  max-height: 55vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 0;

  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.border};
    border-radius: 4px;
  }
`;

const EmptyMessages = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px 20px;
  opacity: 0.55;

  svg {
    width: 36px;
    height: 36px;
    margin-bottom: 14px;
    opacity: 0.5;
  }
`;

const EmptyMsgTitle = styled.div`
  font-size: 1.05rem;
  font-weight: 500;
  margin-bottom: 6px;
`;

const EmptyMsgSub = styled.div`
  font-size: 0.84rem;
  max-width: 340px;
  line-height: 1.5;
`;

/* ── Chat list ── */

const ChatSection = styled.section`
  margin-top: 28px;
`;

const ChatSectionHead = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 4px;
`;

const NewChatBtn = styled.button`
  border: none;
  background: none;
  color: ${props => props.theme.text};
  font-size: 0.82rem;
  opacity: 0.6;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: opacity 0.15s, background 0.15s;

  &:hover {
    opacity: 1;
    background: ${props => props.theme.hover || 'rgba(128,128,128,0.08)'};
  }
`;

const ChatsList = styled.div`
  display: flex;
  flex-direction: column;
`;

const ChatRow = styled.button`
  width: 100%;
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 16px 6px;
  border: none;
  border-bottom: 1px solid ${props => props.theme.border};
  background: ${props => (props.$active ? (props.theme.hover || 'rgba(128,128,128,0.08)') : 'transparent')};
  color: ${props => props.theme.text};
  text-align: left;
  cursor: pointer;
  transition: background 0.12s;

  &:hover {
    background: ${props => props.theme.hover || 'rgba(128,128,128,0.06)'};
  }

  &:last-child {
    border-bottom: none;
  }
`;

const ChatInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ChatName = styled.div`
  font-size: 0.95rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ChatSub = styled.div`
  margin-top: 3px;
  font-size: 0.82rem;
  opacity: 0.55;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ChatTime = styled.div`
  font-size: 0.78rem;
  opacity: 0.5;
  white-space: nowrap;
  flex-shrink: 0;
`;

const EmptyChats = styled.div`
  border: 1px dashed ${props => props.theme.border};
  border-radius: 14px;
  padding: 28px;
  text-align: center;
  font-size: 0.9rem;
  opacity: 0.6;
`;

/* ── Right panel ── */

const SidePanel = styled.aside`
  background: ${props => props.theme.sidebar};
  border: 1px solid ${props => props.theme.border};
  border-radius: 18px;
  padding: 18px 18px 14px;
  position: sticky;
  top: 24px;

  @media (max-width: 1080px) {
    position: static;
  }
`;

const PanelHeadRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
`;

const PanelTitle = styled.div`
  font-size: 0.92rem;
  font-weight: 600;
`;

const BadgePill = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid ${props => props.theme.border};
  font-size: 0.72rem;
  opacity: 0.8;
`;

const Section = styled.section`
  padding: 14px 0 10px;
  border-top: 1px solid ${props => props.theme.border};
`;

const SectionHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const SectionLabel = styled.h3`
  margin: 0;
  font-size: 0.95rem;
  font-weight: 500;
`;

const SectionBtn = styled.button`
  border: none;
  background: none;
  color: ${props => props.theme.text};
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 0.84rem;
  opacity: 0.7;
  cursor: pointer;
  transition: opacity 0.15s, background 0.15s;

  &:hover {
    opacity: 1;
    background: ${props => props.theme.hover || 'rgba(128,128,128,0.08)'};
  }
`;

const BodyText = styled.p`
  margin: 0;
  font-size: 0.84rem;
  line-height: 1.55;
  opacity: 0.82;
`;

const Muted = styled.p`
  margin: 5px 0 0;
  font-size: 0.74rem;
  opacity: 0.55;
`;

const InstructionsTextarea = styled.textarea`
  width: 100%;
  min-height: 90px;
  border-radius: 10px;
  border: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.inputBackground};
  color: ${props => props.theme.text};
  padding: 10px;
  resize: vertical;
  font-size: 0.84rem;
  font-family: ${props => props.theme.fontFamily || 'inherit'};

  &:focus {
    outline: none;
    border-color: ${props => props.theme.primary || '#007AFF'};
  }
`;

const InstructionBtns = styled.div`
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const SmallBtn = styled.button`
  border: 1px solid ${props => (props.$ghost ? props.theme.border : props.theme.primary || '#007AFF')};
  background: ${props => (props.$ghost ? 'transparent' : props.theme.primary || '#007AFF')};
  color: ${props => (props.$ghost ? props.theme.text : props.theme.primaryForeground || '#fff')};
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 0.78rem;
  cursor: pointer;
`;

const UsageRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.73rem;
  opacity: 0.65;
  margin-bottom: 6px;
`;

const StatusDot = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;

  &::before {
    content: '';
    width: 5px;
    height: 5px;
    border-radius: 999px;
    background: currentColor;
  }
`;

const Bar = styled.div`
  width: 100%;
  height: 4px;
  border-radius: 999px;
  background: ${props => props.theme.inputBackground};
  overflow: hidden;
`;

const BarFill = styled.div`
  width: ${props => props.$pct}%;
  height: 100%;
  background: ${props => props.theme.primary || props.theme.text};
  border-radius: 999px;
  opacity: 0.6;
`;

const FileList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
`;

const FileRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.inputBackground};
  border-radius: 10px;
  padding: 8px 10px;
`;

const FileBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 38px;
  padding: 2px 7px;
  border: 1px solid ${props => props.theme.border};
  border-radius: 5px;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  flex-shrink: 0;
`;

const FileDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const FileName = styled.div`
  font-size: 0.82rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FileSize = styled.div`
  font-size: 0.72rem;
  opacity: 0.55;
  margin-top: 1px;
`;

const RemoveBtn = styled.button`
  border: none;
  background: none;
  color: ${props => props.theme.text};
  opacity: 0.4;
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;
  padding: 2px 4px;
  border-radius: 4px;
  transition: opacity 0.15s;

  &:hover {
    opacity: 1;
  }
`;

const AddFileBtn = styled.button`
  width: 100%;
  margin-top: 8px;
  border: 1px dashed ${props => props.theme.border};
  border-radius: 10px;
  background: transparent;
  color: ${props => props.theme.text};
  font-size: 0.8rem;
  padding: 9px;
  opacity: 0.65;
  cursor: pointer;
  transition: opacity 0.15s, border-color 0.15s;

  &:hover {
    opacity: 1;
    border-color: ${props => props.theme.primary || '#007AFF'};
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

/* ── Helpers ── */

const relTime = (input) => {
  if (!input) return '';
  const d = typeof input === 'number' ? new Date(input) : new Date(input);
  if (Number.isNaN(d.getTime())) return '';

  const ms = Date.now() - d.getTime();
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  const days = Math.floor(h / 24);

  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString();
};

const fmtBytes = (bytes) => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const fileTag = (name = '', type = '') => {
  if (type.includes('pdf') || name.toLowerCase().endsWith('.pdf')) return 'PDF';
  const parts = name.split('.');
  const ext = parts.length > 1 ? parts.pop().toUpperCase() : 'FILE';
  return ext.length > 5 ? ext.slice(0, 5) : ext;
};

const chatTs = (chat) => {
  const last = chat?.messages?.[chat.messages.length - 1];
  if (last?.createdAt) return new Date(last.createdAt).getTime();
  if (typeof last?.id === 'number') return last.id;
  return 0;
};

const chatPreview = (chat) => {
  const last = chat?.messages?.[chat.messages.length - 1];
  if (typeof last?.content === 'string' && last.content.trim()) {
    return last.content.replace(/\s+/g, ' ');
  }
  return null;
};

/* ── Component ── */

const ProjectDetailPage = (props) => {
  const {
    projects = [],
    chats = [],
    addMessage,
    createNewChat,
    activeChat,
    setActiveChat,
    addKnowledgeToProject,
    updateProjectInstructions,
    removeKnowledgeFromProject,
    collapsed = true,
    availableModels = [],
    selectedModel,
    onModelChange,
    settings = {},
  } = props;

  const { t } = useTranslation();
  const theme = useTheme();
  const { projectId } = useParams();
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [draft, setDraft] = useState('');
  const [isEditingInstructions, setIsEditingInstructions] = useState(false);
  const [instrDraft, setInstrDraft] = useState('');

  const project = projects.find(p => p.id === projectId);

  const projectChats = useMemo(() => {
    return chats
      .filter(c => c.projectId === projectId)
      .sort((a, b) => chatTs(b) - chatTs(a));
  }, [chats, projectId]);

  const currentChat = useMemo(
    () => projectChats.find(c => c.id === activeChat) || projectChats[0] || null,
    [projectChats, activeChat]
  );

  const currentMessages = currentChat?.messages || [];

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages.length, scrollToBottom]);

  const totalBytes = useMemo(
    () => (project?.knowledge || []).reduce((s, f) => s + (f.size || 0), 0),
    [project]
  );
  const usagePct = Math.min(100, Math.round((totalBytes / KNOWLEDGE_CAPACITY_BYTES) * 100));

  useEffect(() => {
    setInstrDraft(project?.projectInstructions || '');
  }, [project?.projectInstructions]);

  useEffect(() => {
    if (projectChats.length > 0 && !projectChats.some(c => c.id === activeChat)) {
      setActiveChat(projectChats[0].id);
    }
  }, [projectChats, activeChat, setActiveChat]);

  const ensureChatId = () => {
    const existing = projectChats.find(c => c.id === activeChat);
    if (existing) return existing.id;
    const created = createNewChat(projectId, { stayOnCurrentRoute: true });
    if (created?.id) { setActiveChat(created.id); return created.id; }
    return null;
  };

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    const chatId = ensureChatId();
    if (!chatId) return;
    addMessage(chatId, { id: Date.now(), role: 'user', content: text, model: selectedModel || 'user' });
    setDraft('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaInput = (e) => {
    setDraft(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  const handleNewChat = () => {
    const created = createNewChat(projectId, { stayOnCurrentRoute: true });
    if (created?.id) setActiveChat(created.id);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !addKnowledgeToProject) return;
    const reader = new FileReader();
    reader.onload = () => {
      addKnowledgeToProject(projectId, {
        name: file.name, type: file.type, size: file.size,
        content: reader.result, lastModified: file.lastModified,
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveInstructions = () => {
    updateProjectInstructions?.(projectId, instrDraft);
    setIsEditingInstructions(false);
  };

  if (!project) {
    return (
      <PageContainer $collapsed={collapsed}>
        <ContentWrapper>
          <EmptyChats>
            {t('projects.notFound', 'Project not found')}
            <div style={{ marginTop: 10 }}>
              <BackLink to="/projects">← {t('projects.backToProjects', 'Back to projects')}</BackLink>
            </div>
          </EmptyChats>
        </ContentWrapper>
      </PageContainer>
    );
  }

  return (
    <PageContainer $collapsed={collapsed}>
      <ContentWrapper>
        <BackLink to="/projects">← All projects</BackLink>

        <TitleRow>
          <ProjectTitle>{project.projectName}</ProjectTitle>
          <TitleActions>
            <IconBtn title="Star">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </IconBtn>
          </TitleActions>
        </TitleRow>

        <LayoutGrid>
          <MainColumn>
            <ComposerCard>
              <ComposerInner>
                <ComposerTextarea
                  ref={textareaRef}
                  rows={1}
                  value={draft}
                  onChange={handleTextareaInput}
                  onKeyDown={handleKeyDown}
                  placeholder="Reply..."
                />
              </ComposerInner>
              <ComposerFooter>
                <ComposerLeft>
                  <ComposerBtn title="Attach file" onClick={() => fileInputRef.current?.click()}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </ComposerBtn>
                </ComposerLeft>
                <ModelSelector
                  selectedModel={selectedModel}
                  models={availableModels}
                  onChange={onModelChange}
                  theme={theme}
                />
                <SendBtn disabled={!draft.trim()} onClick={handleSend}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 19V5" /><path d="M5 12l7-7 7 7" />
                  </svg>
                </SendBtn>
              </ComposerFooter>
            </ComposerCard>

            {currentMessages.length > 0 ? (
              <MessagesArea>
                {currentMessages.map(msg => (
                  <ChatMessage key={msg.id} message={msg} settings={settings} theme={theme} />
                ))}
                <div ref={messagesEndRef} />
              </MessagesArea>
            ) : (
              <EmptyMessages>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <EmptyMsgTitle>{t('projects.startConversation', 'Start a conversation')}</EmptyMsgTitle>
                <EmptyMsgSub>{t('projects.conversationContext', 'Your project instructions and knowledge files will be included as context in every message.')}</EmptyMsgSub>
              </EmptyMessages>
            )}

            <ChatSection>
              <ChatSectionHead>
                <NewChatBtn onClick={handleNewChat}>+ New chat</NewChatBtn>
              </ChatSectionHead>
              {projectChats.length > 0 ? (
                <ChatsList>
                  {projectChats.map(chat => {
                    const preview = chatPreview(chat);
                    const ts = chatTs(chat);
                    return (
                      <ChatRow
                        key={chat.id}
                        $active={chat.id === activeChat}
                        onClick={() => setActiveChat(chat.id)}
                      >
                        <ChatInfo>
                          <ChatName>{chat.title || t('chat.defaultTitle', 'New Chat')}</ChatName>
                          <ChatSub>
                            {preview
                              ? preview
                              : t('projects.noMessagesYet', 'No messages yet')}
                          </ChatSub>
                        </ChatInfo>
                        {ts > 0 && <ChatTime>Last message {relTime(ts)}</ChatTime>}
                      </ChatRow>
                    );
                  })}
                </ChatsList>
              ) : (
                <EmptyChats>
                  {t('projects.startConversation', 'Start a conversation')}
                </EmptyChats>
              )}
            </ChatSection>
          </MainColumn>

          <SidePanel>
            <PanelHeadRow>
              <PanelTitle>{t('projects.memory', 'Memory')}</PanelTitle>
              <BadgePill>
                <span>🔒</span> Only you
              </BadgePill>
            </PanelHeadRow>
            <BodyText>
              {project.projectDescription || t('projects.noDescription', 'No project description.')}
            </BodyText>
            <Muted>Last updated {relTime(project.updatedAt || project.createdAt)}</Muted>

            <Section>
              <SectionHead>
                <SectionLabel>{t('projects.instructions', 'Instructions')}</SectionLabel>
                <SectionBtn onClick={() => setIsEditingInstructions(prev => !prev)}>
                  {isEditingInstructions ? 'Cancel' : '+'}
                </SectionBtn>
              </SectionHead>

              {isEditingInstructions ? (
                <>
                  <InstructionsTextarea
                    value={instrDraft}
                    onChange={e => setInstrDraft(e.target.value)}
                    placeholder="Add instructions to tailor responses..."
                  />
                  <InstructionBtns>
                    <SmallBtn $ghost onClick={() => { setInstrDraft(project.projectInstructions || ''); setIsEditingInstructions(false); }}>Cancel</SmallBtn>
                    <SmallBtn onClick={handleSaveInstructions}>Save</SmallBtn>
                  </InstructionBtns>
                </>
              ) : (
                <BodyText>
                  {project.projectInstructions || 'Add instructions to tailor responses.'}
                </BodyText>
              )}
            </Section>

            <Section>
              <SectionHead>
                <SectionLabel>{t('projects.files', 'Files')}</SectionLabel>
                <SectionBtn onClick={() => fileInputRef.current?.click()}>+</SectionBtn>
              </SectionHead>

              <UsageRow>
                <span>{usagePct}% of project capacity used</span>
                <StatusDot>Indexing</StatusDot>
              </UsageRow>
              <Bar><BarFill $pct={usagePct} /></Bar>

              {(project.knowledge || []).length > 0 ? (
                <FileList>
                  {(project.knowledge || []).map(item => (
                    <FileRow key={item.id}>
                      <FileBadge>{fileTag(item.name, item.type)}</FileBadge>
                      <FileDetails>
                        <FileName>{item.name}</FileName>
                        <FileSize>{fmtBytes(item.size)}</FileSize>
                      </FileDetails>
                      <RemoveBtn onClick={() => removeKnowledgeFromProject?.(projectId, item.id)} title="Remove">×</RemoveBtn>
                    </FileRow>
                  ))}
                </FileList>
              ) : (
                <Muted>No files added yet</Muted>
              )}

              <AddFileBtn onClick={() => fileInputRef.current?.click()}>
                + Add files
              </AddFileBtn>
              <HiddenInput
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".txt,.md,.json,.js,.jsx,.ts,.tsx,.py,.html,.css,.csv,.pdf"
              />
            </Section>
          </SidePanel>
        </LayoutGrid>
      </ContentWrapper>
    </PageContainer>
  );
};

export default ProjectDetailPage;

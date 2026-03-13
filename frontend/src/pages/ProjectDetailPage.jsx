import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import styled, { useTheme } from 'styled-components';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/TranslationContext';
import ModelSelector from '../components/ModelSelector';

const PAGE_SIDEBAR_OFFSET = 320;
const KNOWLEDGE_CAPACITY_BYTES = 10 * 1024 * 1024;
const MAX_INSTRUCTIONS_LENGTH = 8000;

/* ── Layout ── */

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
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: ${props => props.theme.text};
  text-decoration: none;
  font-size: 0.88rem;
  opacity: 0.6;
  margin-bottom: 20px;
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
  margin-bottom: 24px;
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
  gap: 6px;
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
  color: ${props => props.$starred ? '#FFB800' : props.theme.text};
  opacity: ${props => props.$starred ? 1 : 0.5};
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
    fill: ${props => props.$starred ? '#FFB800' : 'none'};
  }
`;

const LayoutGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 24px;
  align-items: start;

  @media (max-width: 1080px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const MainColumn = styled.div`
  min-width: 0;
`;

/* ── Composer ── */

const ComposerCard = styled.div`
  background: ${props => props.theme.sidebar};
  border: 1px solid ${props => props.theme.border};
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 4px;
`;

const ComposerInner = styled.div`
  padding: 14px 16px 10px;
`;

const ComposerTextarea = styled.textarea`
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  color: ${props => props.theme.text};
  font-size: 0.975rem;
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
  padding: 6px 12px 8px;
`;

const ComposerLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
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

  svg { width: 18px; height: 18px; }
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

  svg { width: 16px; height: 16px; }
`;

/* ── Chat list ── */

const ChatsList = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 8px;
`;

const ChatRow = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 8px;
  border: none;
  border-bottom: 1px solid ${props => props.theme.border};
  background: transparent;
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
  font-size: 0.93rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ChatTime = styled.div`
  font-size: 0.78rem;
  opacity: 0.5;
  white-space: nowrap;
  flex-shrink: 0;
  margin-top: 2px;
`;

const EmptyChats = styled.div`
  padding: 32px 20px;
  text-align: center;
  font-size: 0.88rem;
  opacity: 0.5;
`;

/* ── Right panel ── */

const SidePanel = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 0;
  background: ${props => props.theme.sidebar};
  border: 1px solid ${props => props.theme.border};
  border-radius: 14px;
  overflow: hidden;
  position: sticky;
  top: 24px;

  @media (max-width: 1080px) {
    position: static;
  }
`;

const PanelSection = styled.div`
  padding: 14px 16px;
  border-bottom: 1px solid ${props => props.theme.border};

  &:last-child {
    border-bottom: none;
  }
`;

const PanelHeadRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const PanelTitle = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
`;

const BadgePill = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid ${props => props.theme.border};
  font-size: 0.7rem;
  opacity: 0.75;
`;

const PanelEditBtn = styled.button`
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  color: ${props => props.theme.text};
  opacity: 0.45;
  cursor: pointer;
  border-radius: 6px;
  transition: opacity 0.15s, background 0.15s;

  &:hover {
    opacity: 0.9;
    background: ${props => props.theme.hover || 'rgba(128,128,128,0.1)'};
  }

  svg { width: 15px; height: 15px; }
`;

const PanelActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const BodyText = styled.p`
  margin: 0;
  font-size: 0.83rem;
  line-height: 1.55;
  opacity: 0.8;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const Muted = styled.p`
  margin: 6px 0 0;
  font-size: 0.73rem;
  opacity: 0.5;
`;

/* ── Inline editor ── */

const EditTextarea = styled.textarea`
  width: 100%;
  min-height: 80px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.inputBackground || props.theme.background};
  color: ${props => props.theme.text};
  padding: 8px 10px;
  resize: vertical;
  font-size: 0.83rem;
  font-family: ${props => props.theme.fontFamily || 'inherit'};
  line-height: 1.5;
  outline: none;

  &:focus {
    border-color: ${props => props.theme.primary || '#007AFF'};
  }
`;

const EditBtns = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 6px;
`;

const SmallBtn = styled.button`
  border: 1px solid ${props => (props.$ghost ? props.theme.border : 'transparent')};
  background: ${props => (props.$ghost ? 'transparent' : props.theme.primary || '#007AFF')};
  color: ${props => (props.$ghost ? props.theme.text : '#fff')};
  border-radius: 6px;
  padding: 5px 11px;
  font-size: 0.77rem;
  cursor: pointer;
  transition: opacity 0.15s;

  &:hover { opacity: 0.85; }
`;

/* ── Files area ── */

const FilesArea = styled.div`
  min-height: 64px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FileRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.inputBackground || props.theme.background};
  border-radius: 8px;
  padding: 7px 10px;
`;

const FileBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  padding: 2px 5px;
  border: 1px solid ${props => props.theme.border};
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  flex-shrink: 0;
`;

const FileDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const FileName = styled.div`
  font-size: 0.8rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FileSize = styled.div`
  font-size: 0.7rem;
  opacity: 0.5;
`;

const RemoveBtn = styled.button`
  border: none;
  background: none;
  color: ${props => props.theme.text};
  opacity: 0.4;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  padding: 2px 4px;
  border-radius: 4px;
  transition: opacity 0.15s;
  flex-shrink: 0;

  &:hover { opacity: 1; }
`;

const AddFileBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 6px;
  border: 1px dashed ${props => props.theme.border};
  border-radius: 8px;
  background: transparent;
  color: ${props => props.theme.text};
  font-size: 0.78rem;
  padding: 8px;
  opacity: 0.55;
  cursor: pointer;
  transition: opacity 0.15s, border-color 0.15s;

  &:hover {
    opacity: 1;
    border-color: ${props => props.theme.primary || '#007AFF'};
  }

  svg { width: 14px; height: 14px; }
`;

const HiddenInput = styled.input`
  display: none;
`;

/* ── Helpers ── */

const relTime = (input) => {
  if (!input) return '';
  const d = new Date(input);
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
  return new Date(chat?.createdAt || 0).getTime();
};

/* ── Component ── */

const ProjectDetailPage = (props) => {
  const {
    projects = [],
    chats = [],
    createNewChat,
    setActiveChat,
    addKnowledgeToProject,
    updateProjectInstructions,
    updateProjectDescription,
    removeKnowledgeFromProject,
    toggleProjectStar,
    collapsed = true,
    availableModels = [],
    selectedModel,
    onModelChange,
    settings = {},
  } = props;

  const { t } = useTranslation();
  const theme = useTheme();
  const { projectId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const [draft, setDraft] = useState('');
  const [editingInstructions, setEditingInstructions] = useState(false);
  const [instrDraft, setInstrDraft] = useState('');
  const [editingMemory, setEditingMemory] = useState(false);
  const [memoryDraft, setMemoryDraft] = useState('');

  const project = projects.find(p => p.id === projectId);

  const projectChats = useMemo(() => {
    return chats
      .filter(c => c.projectId === projectId)
      .sort((a, b) => chatTs(b) - chatTs(a));
  }, [chats, projectId]);

  useEffect(() => {
    setInstrDraft(project?.projectInstructions || '');
  }, [project?.projectInstructions]);

  useEffect(() => {
    setMemoryDraft(project?.projectDescription || '');
  }, [project?.projectDescription]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text || !createNewChat) return;
    const newChat = createNewChat(projectId, { stayOnCurrentRoute: false, initialMessage: text });
    if (newChat?.id) {
      setActiveChat(newChat.id);
    }
    setDraft('');
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
    const newChat = createNewChat(projectId, { stayOnCurrentRoute: false });
    if (newChat?.id) setActiveChat(newChat.id);
  };

  const handleChatClick = (chat) => {
    setActiveChat(chat.id);
    navigate('/');
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
    setEditingInstructions(false);
  };

  const handleSaveMemory = () => {
    updateProjectDescription?.(projectId, memoryDraft);
    setEditingMemory(false);
  };

  if (!project) {
    return (
      <PageContainer $collapsed={collapsed}>
        <ContentWrapper>
          <BackLink to="/projects">← All projects</BackLink>
          <EmptyChats>Project not found.</EmptyChats>
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
            <IconBtn
              title={project.starred ? 'Remove star' : 'Star project'}
              $starred={project.starred}
              onClick={() => toggleProjectStar?.(projectId)}
            >
              <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </IconBtn>
          </TitleActions>
        </TitleRow>

        <LayoutGrid>
          {/* ── Left column ── */}
          <MainColumn>
            <ComposerCard>
              <ComposerInner>
                <ComposerTextarea
                  ref={textareaRef}
                  rows={1}
                  value={draft}
                  onChange={handleTextareaInput}
                  onKeyDown={handleKeyDown}
                  placeholder="How can I help you today?"
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

            {projectChats.length > 0 ? (
              <ChatsList>
                {projectChats.map(chat => (
                  <ChatRow key={chat.id} onClick={() => handleChatClick(chat)}>
                    <ChatInfo>
                      <ChatName>{chat.title || 'New Chat'}</ChatName>
                      <ChatTime>Last message {relTime(chatTs(chat) || chat.createdAt)}</ChatTime>
                    </ChatInfo>
                  </ChatRow>
                ))}
              </ChatsList>
            ) : (
              <EmptyChats>No conversations yet. Start one above.</EmptyChats>
            )}
          </MainColumn>

          {/* ── Right panel ── */}
          <SidePanel>
            {/* Memory */}
            <PanelSection>
              <PanelHeadRow>
                <PanelTitle>Memory</PanelTitle>
                <PanelActions>
                  <BadgePill>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 11, height: 11 }}>
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Only you
                  </BadgePill>
                  <PanelEditBtn onClick={() => setEditingMemory(prev => !prev)} title="Edit description">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </PanelEditBtn>
                </PanelActions>
              </PanelHeadRow>

              {editingMemory ? (
                <>
                  <EditTextarea
                    value={memoryDraft}
                    onChange={e => setMemoryDraft(e.target.value)}
                    placeholder="Describe this project..."
                    rows={4}
                  />
                  <EditBtns>
                    <SmallBtn $ghost onClick={() => { setMemoryDraft(project.projectDescription || ''); setEditingMemory(false); }}>Cancel</SmallBtn>
                    <SmallBtn onClick={handleSaveMemory}>Save</SmallBtn>
                  </EditBtns>
                </>
              ) : (
                <>
                  <BodyText>{project.projectDescription || 'No project description.'}</BodyText>
                  <Muted>Last updated {relTime(project.updatedAt || project.createdAt)}</Muted>
                </>
              )}
            </PanelSection>

            {/* Instructions */}
            <PanelSection>
              <PanelHeadRow>
                <PanelTitle>Instructions</PanelTitle>
                <PanelEditBtn onClick={() => setEditingInstructions(prev => !prev)} title="Edit instructions">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </PanelEditBtn>
              </PanelHeadRow>

              {editingInstructions ? (
                <>
                  <EditTextarea
                    value={instrDraft}
                    onChange={e => setInstrDraft(e.target.value)}
                    placeholder="Add instructions to tailor responses..."
                    rows={5}
                    maxLength={MAX_INSTRUCTIONS_LENGTH}
                  />
                  <EditBtns>
                    <SmallBtn $ghost onClick={() => { setInstrDraft(project.projectInstructions || ''); setEditingInstructions(false); }}>Cancel</SmallBtn>
                    <SmallBtn onClick={handleSaveInstructions}>Save</SmallBtn>
                  </EditBtns>
                </>
              ) : (
                <BodyText style={{ WebkitLineClamp: 5 }}>
                  {project.projectInstructions || 'No instructions set.'}
                </BodyText>
              )}
            </PanelSection>

            {/* Files */}
            <PanelSection>
              <PanelHeadRow>
                <PanelTitle>Files</PanelTitle>
                <PanelEditBtn onClick={() => fileInputRef.current?.click()} title="Add file">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </PanelEditBtn>
              </PanelHeadRow>

              <FilesArea>
                {(project.knowledge || []).length > 0 ? (
                  (project.knowledge || []).map(item => (
                    <FileRow key={item.id}>
                      <FileBadge>{fileTag(item.name, item.type)}</FileBadge>
                      <FileDetails>
                        <FileName>{item.name}</FileName>
                        <FileSize>{fmtBytes(item.size)}</FileSize>
                      </FileDetails>
                      <RemoveBtn onClick={() => removeKnowledgeFromProject?.(projectId, item.id)} title="Remove">×</RemoveBtn>
                    </FileRow>
                  ))
                ) : (
                  <AddFileBtn onClick={() => fileInputRef.current?.click()}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add files to this project
                  </AddFileBtn>
                )}
              </FilesArea>

              <HiddenInput
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".txt,.md,.json,.js,.jsx,.ts,.tsx,.py,.html,.css,.csv,.pdf"
              />
            </PanelSection>
          </SidePanel>
        </LayoutGrid>
      </ContentWrapper>
    </PageContainer>
  );
};

export default ProjectDetailPage;

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ChatInputArea from '../components/ChatInputArea';
import ChatMessage from '../components/ChatMessage';
import { useTranslation } from '../contexts/TranslationContext';

const PageContainer = styled.div`
  display: flex;
  height: 100vh;
  width: 100%;
  background: ${props => props.theme.background};
  color: ${props => props.theme.text};
`;

// Left Sidebar for Project Context
const ProjectSidebar = styled.div`
  width: 320px;
  min-width: 320px;
  height: 100vh;
  background: ${props => props.theme.sidebar};
  border-right: 1px solid ${props => props.theme.border};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  
  @media (max-width: 900px) {
    position: fixed;
    left: ${props => props.$collapsed ? '-320px' : '0'};
    z-index: 100;
    transition: left 0.3s ease;
  }
`;

const SidebarHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid ${props => props.theme.border};
  display: flex;
  align-items: center;
  gap: 12px;
`;

const BackButton = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  color: ${props => props.theme.text};
  background: transparent;
  text-decoration: none;
  transition: all 0.15s ease;
  
  &:hover {
    background: ${props => props.theme.hover};
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const ProjectTitleArea = styled.div`
  flex: 1;
  min-width: 0;
`;

const ProjectIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${props => props.$color || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
`;

const ProjectName = styled.h1`
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: ${props => props.theme.fontFamily || 'inherit'};
`;

const SidebarScrollArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
`;

const SidebarSection = styled.div`
  margin-bottom: 24px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const SectionTitle = styled.h3`
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${props => props.theme.text}70;
  margin: 0;
  font-family: ${props => props.theme.fontFamily || 'inherit'};
`;

const SectionAction = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.primary || '#007AFF'};
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.15s ease;
  font-family: ${props => props.theme.fontFamily || 'inherit'};
  
  &:hover {
    background: ${props => props.theme.hover};
  }
`;

const InstructionsBox = styled.div`
  background: ${props => props.theme.inputBackground};
  border: 1px solid ${props => props.theme.border};
  border-radius: 10px;
  padding: 14px;
`;

const InstructionsText = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme.text}90;
  line-height: 1.6;
  white-space: pre-wrap;
  font-family: ${props => props.theme.fontFamily || 'inherit'};
  max-height: 200px;
  overflow-y: auto;
`;

const EmptyInstructions = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme.text}50;
  font-style: italic;
  font-family: ${props => props.theme.fontFamily || 'inherit'};
`;

const InstructionsTextarea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.inputBackground};
  color: ${props => props.theme.text};
  font-size: 0.875rem;
  font-family: ${props => props.theme.fontFamily || 'inherit'};
  resize: vertical;
  line-height: 1.6;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.primary || '#007AFF'};
  }
`;

const KnowledgeList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const KnowledgeItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: ${props => props.theme.inputBackground};
  border: 1px solid ${props => props.theme.border};
  border-radius: 8px;
  transition: all 0.15s ease;
  
  &:hover {
    border-color: ${props => props.theme.primary || '#007AFF'}40;
  }
`;

const FileIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: ${props => props.$color || 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  svg {
    width: 16px;
    height: 16px;
    color: white;
  }
`;

const FileInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const FileName = styled.div`
  font-size: 0.85rem;
  font-weight: 500;
  color: ${props => props.theme.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: ${props => props.theme.fontFamily || 'inherit'};
`;

const FileSize = styled.div`
  font-size: 0.75rem;
  color: ${props => props.theme.text}60;
  font-family: ${props => props.theme.fontFamily || 'inherit'};
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.text}40;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #dc3545;
    background: #dc354520;
  }
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

const AddKnowledgeButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px;
  border: 2px dashed ${props => props.theme.border};
  border-radius: 10px;
  background: transparent;
  color: ${props => props.theme.text}70;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: ${props => props.theme.fontFamily || 'inherit'};
  
  &:hover {
    border-color: ${props => props.theme.primary || '#007AFF'};
    color: ${props => props.theme.primary || '#007AFF'};
    background: ${props => props.theme.primary || '#007AFF'}08;
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

// Chat List in Sidebar
const ChatListSection = styled.div`
  margin-top: auto;
  border-top: 1px solid ${props => props.theme.border};
  padding: 16px;
`;

const ChatListItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  background: ${props => props.$active ? props.theme.hover : 'transparent'};
  transition: all 0.15s ease;
  
  &:hover {
    background: ${props => props.theme.hover};
  }
`;

const ChatItemIcon = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: ${props => props.theme.inputBackground};
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 14px;
    height: 14px;
    color: ${props => props.theme.text}60;
  }
`;

const ChatItemTitle = styled.div`
  flex: 1;
  font-size: 0.85rem;
  color: ${props => props.theme.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: ${props => props.theme.fontFamily || 'inherit'};
`;

const NewChatButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 8px;
  background: ${props => props.theme.primary || '#007AFF'};
  color: white;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: ${props => props.theme.fontFamily || 'inherit'};
  margin-bottom: 12px;
  
  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

// Main Chat Area
const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  position: relative;
`;

const ChatHeader = styled.div`
  padding: 16px 24px;
  border-bottom: 1px solid ${props => props.theme.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${props => props.theme.sidebar};
`;

const ChatTitleArea = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: ${props => props.theme.text};
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  
  @media (max-width: 900px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const ChatTitle = styled.h2`
  font-size: 1rem;
  font-weight: 500;
  margin: 0;
  color: ${props => props.theme.text};
  font-family: ${props => props.theme.fontFamily || 'inherit'};
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
`;

const MessagesList = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
`;

const EmptyChat = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px;
`;

const EmptyChatIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: ${props => props.theme.inputBackground};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  
  svg {
    width: 32px;
    height: 32px;
    color: ${props => props.theme.text}40;
  }
`;

const EmptyChatTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: ${props => props.theme.text};
  font-family: ${props => props.theme.fontFamily || 'inherit'};
`;

const EmptyChatDescription = styled.p`
  font-size: 0.9rem;
  color: ${props => props.theme.text}70;
  margin: 0;
  max-width: 400px;
  line-height: 1.6;
  font-family: ${props => props.theme.fontFamily || 'inherit'};
`;

const InputWrapper = styled.div`
  padding: 16px 24px;
  border-top: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.sidebar};
`;

const InputContainer = styled.div`
  max-width: 900px;
  margin: 0 auto;
`;

const MobileOverlay = styled.div`
  display: none;
  
  @media (max-width: 900px) {
    display: ${props => props.$visible ? 'block' : 'none'};
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 99;
  }
`;

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileColor = (type) => {
  if (type?.startsWith('image/')) return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
  if (type?.includes('pdf')) return 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)';
  if (type?.includes('text') || type?.includes('json')) return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
};

const ProjectDetailPage = (props) => {
  const { 
    projects, 
    chats, 
    addMessage, 
    createNewChat, 
    activeChat, 
    setActiveChat, 
    addKnowledgeToProject,
    updateProjectInstructions,
    removeKnowledgeFromProject,
    ...chatInputProps 
  } = props;
  
  const { t } = useTranslation();
  const { projectId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isEditingInstructions, setIsEditingInstructions] = useState(false);
  const [instructionsText, setInstructionsText] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  const project = projects?.find(p => p.id === projectId);
  const projectChats = chats?.filter(c => c.projectId === projectId) || [];
  
  useEffect(() => {
    if (project) {
      setInstructionsText(project.projectInstructions || '');
    }
  }, [project?.projectInstructions]);
  
  useEffect(() => {
    if (projectChats.length > 0 && !projectChats.find(c => c.id === activeChat)) {
      setActiveChat(projectChats[0].id);
    }
  }, [projectChats, activeChat, setActiveChat]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chats, activeChat, scrollToBottom]);

  const currentChat = chats?.find(c => c.id === activeChat);

  const handleFileSelected = (file) => {
    setUploadedFile(file);
  };
  
  const handleClearAttachment = () => {
    setUploadedFile(null);
  };

  const handleSubmitMessage = (messageData) => {
    let targetChatId = activeChat;

    if (!currentChat || currentChat.projectId !== projectId) {
      const newChat = createNewChat(projectId);
      targetChatId = newChat.id;
      setActiveChat(targetChatId);
    }

    addMessage(targetChatId, {
      id: Date.now(),
      role: 'user',
      content: messageData.text,
      model: 'user',
    });
    
    handleClearAttachment();
    scrollToBottom();
  };

  const handleAddKnowledge = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      const fileData = {
        name: file.name,
        type: file.type,
        size: file.size,
        content: reader.result,
        lastModified: file.lastModified,
      };
      addKnowledgeToProject(projectId, fileData);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleRemoveKnowledge = (knowledgeId) => {
    if (removeKnowledgeFromProject) {
      removeKnowledgeFromProject(projectId, knowledgeId);
    }
  };

  const handleSaveInstructions = () => {
    if (updateProjectInstructions) {
      updateProjectInstructions(projectId, instructionsText);
    }
    setIsEditingInstructions(false);
  };

  const handleNewChat = () => {
    const newChat = createNewChat(projectId);
    setActiveChat(newChat.id);
    setMobileSidebarOpen(false);
  };

  if (!project) {
    return (
      <PageContainer>
        <MainContent>
          <EmptyChat>
            <EmptyChatTitle>{t('projects.notFound', 'Project not found')}</EmptyChatTitle>
            <EmptyChatDescription>
              {t('projects.notFoundDesc', 'This project may have been deleted.')}
            </EmptyChatDescription>
            <Link to="/projects" style={{ marginTop: 20, color: 'inherit' }}>
              ← {t('projects.backToProjects', 'Back to projects')}
            </Link>
          </EmptyChat>
        </MainContent>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <MobileOverlay $visible={mobileSidebarOpen} onClick={() => setMobileSidebarOpen(false)} />
      
      <ProjectSidebar $collapsed={!mobileSidebarOpen}>
        <SidebarHeader>
          <BackButton to="/projects">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </BackButton>
          <ProjectIcon $color={project.color}>
            {project.icon || '📁'}
          </ProjectIcon>
          <ProjectTitleArea>
            <ProjectName>{project.projectName}</ProjectName>
          </ProjectTitleArea>
        </SidebarHeader>
        
        <SidebarScrollArea>
          {/* Project Instructions */}
          <SidebarSection>
            <SectionHeader>
              <SectionTitle>{t('projects.instructions', 'Instructions')}</SectionTitle>
              <SectionAction onClick={() => setIsEditingInstructions(!isEditingInstructions)}>
                {isEditingInstructions ? t('common.save', 'Save') : t('common.edit', 'Edit')}
              </SectionAction>
            </SectionHeader>
            
            {isEditingInstructions ? (
              <div>
                <InstructionsTextarea
                  value={instructionsText}
                  onChange={(e) => setInstructionsText(e.target.value)}
                  placeholder={t('projects.instructionsPlaceholder', 'Add custom instructions for this project...')}
                  onBlur={handleSaveInstructions}
                />
              </div>
            ) : (
              <InstructionsBox>
                {project.projectInstructions ? (
                  <InstructionsText>{project.projectInstructions}</InstructionsText>
                ) : (
                  <EmptyInstructions>
                    {t('projects.noInstructions', 'No custom instructions set. Click Edit to add instructions that will be included with every message.')}
                  </EmptyInstructions>
                )}
              </InstructionsBox>
            )}
          </SidebarSection>
          
          {/* Knowledge Files */}
          <SidebarSection>
            <SectionHeader>
              <SectionTitle>{t('projects.knowledge', 'Knowledge')} ({project.knowledge?.length || 0})</SectionTitle>
            </SectionHeader>
            
            <KnowledgeList>
              {(project.knowledge || []).map(item => (
                <KnowledgeItem key={item.id}>
                  <FileIcon $color={getFileColor(item.type)}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                  </FileIcon>
                  <FileInfo>
                    <FileName>{item.name}</FileName>
                    <FileSize>{formatFileSize(item.size)}</FileSize>
                  </FileInfo>
                  <RemoveButton onClick={() => handleRemoveKnowledge(item.id)}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </RemoveButton>
                </KnowledgeItem>
              ))}
              
              <AddKnowledgeButton onClick={handleAddKnowledge}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                {t('projects.addKnowledge', 'Add files')}
              </AddKnowledgeButton>
              <HiddenInput 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange}
                accept=".txt,.md,.json,.js,.jsx,.ts,.tsx,.py,.html,.css,.csv"
              />
            </KnowledgeList>
          </SidebarSection>
        </SidebarScrollArea>
        
        {/* Chat List */}
        <ChatListSection>
          <NewChatButton onClick={handleNewChat}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            {t('projects.newChat', 'New chat')}
          </NewChatButton>
          
          {projectChats.map(chat => (
            <ChatListItem 
              key={chat.id}
              $active={chat.id === activeChat}
              onClick={() => {
                setActiveChat(chat.id);
                setMobileSidebarOpen(false);
              }}
            >
              <ChatItemIcon>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </ChatItemIcon>
              <ChatItemTitle>
                {chat.title || t('chat.defaultTitle', 'New Chat')}
              </ChatItemTitle>
            </ChatListItem>
          ))}
        </ChatListSection>
      </ProjectSidebar>
      
      <MainContent>
        <ChatHeader>
          <ChatTitleArea>
            <MobileMenuButton onClick={() => setMobileSidebarOpen(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </MobileMenuButton>
            <ChatTitle>
              {currentChat?.title || t('projects.selectChat', 'Select or start a chat')}
            </ChatTitle>
          </ChatTitleArea>
        </ChatHeader>
        
        <MessagesContainer>
          {currentChat && currentChat.projectId === projectId && currentChat.messages?.length > 0 ? (
            <MessagesList>
              {currentChat.messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </MessagesList>
          ) : (
            <EmptyChat>
              <EmptyChatIcon>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </EmptyChatIcon>
              <EmptyChatTitle>{t('projects.startConversation', 'Start a conversation')}</EmptyChatTitle>
              <EmptyChatDescription>
                {t('projects.conversationContext', 'Your project instructions and knowledge files will be included as context in every message.')}
              </EmptyChatDescription>
            </EmptyChat>
          )}
        </MessagesContainer>
        
        <InputWrapper>
          <InputContainer>
            <ChatInputArea 
              {...chatInputProps}
              onSubmitMessage={handleSubmitMessage}
              onFileSelected={handleFileSelected}
              uploadedFile={uploadedFile}
              onClearAttachment={handleClearAttachment}
            />
          </InputContainer>
        </InputWrapper>
      </MainContent>
    </PageContainer>
  );
};

export default ProjectDetailPage;

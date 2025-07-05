import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, Link } from 'react-router-dom';
import ProjectKnowledgeSidebar from '../components/ProjectKnowledgeSidebar';
import ChatInputArea from '../components/ChatInputArea';
import ChatMessage from '../components/ChatMessage';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  background-color: ${props => props.theme.background};
`;

const Header = styled.div`
  padding: 20px 40px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid ${props => props.theme.border};
`;

const BackLink = styled(Link)`
  color: ${props => props.theme.text};
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ContentContainer = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const MainPanel = styled.div`
  flex: 2;
  display: flex;
  flex-direction: column;
  padding: 20px 40px;
  position: relative;
`;

const ProjectHeader = styled.h1`
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 20px;
`;

const ChatHistoryContainer = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  padding-right: 15px;
`;

const InputWrapper = styled.div`
    padding-top: 20px;
`;

const ProjectDetailPage = (props) => {
  const { 
    projects, chats, addMessage, createNewChat, activeChat, setActiveChat, addKnowledgeToProject, ...chatInputProps 
  } = props;
  const { projectId } = useParams();
  
  const [uploadedFile, setUploadedFile] = useState(null);
  
  const project = projects.find(p => p.id === projectId);
  const projectChats = chats.filter(c => c.projectId === projectId);
  
  useEffect(() => {
    if (projectChats.length > 0 && !projectChats.find(c => c.id === activeChat)) {
      setActiveChat(projectChats[0].id);
    }
  }, [projectChats, activeChat, setActiveChat]);

  const currentChat = chats.find(c => c.id === activeChat);

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
  };

  if (!project) {
    return <div>Project not found. <Link to="/projects">Go back</Link></div>;
  }

  return (
    <PageContainer>
        <Header>
            <BackLink to="/projects">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                <span>All projects</span>
            </BackLink>
        </Header>
        <ContentContainer>
            <MainPanel>
                <ProjectHeader>{project.projectName}</ProjectHeader>
                <ChatHistoryContainer>
                {currentChat && currentChat.projectId === projectId ? (
                    currentChat.messages.map((msg) => (
                        <ChatMessage key={msg.id} message={msg} />
                    ))
                ) : (
                    <p>No active chat in this project. Send a message to start one.</p>
                )}
                </ChatHistoryContainer>
                <InputWrapper>
                    <ChatInputArea 
                        {...chatInputProps}
                        onSubmitMessage={handleSubmitMessage}
                        onFileSelected={handleFileSelected}
                        uploadedFile={uploadedFile}
                        onClearAttachment={handleClearAttachment}
                    />
                </InputWrapper>
            </MainPanel>
            <ProjectKnowledgeSidebar project={project} addKnowledgeToProject={addKnowledgeToProject} />
        </ContentContainer>
    </PageContainer>
  );
};

export default ProjectDetailPage; 
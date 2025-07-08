import React from 'react';
import styled from 'styled-components';

const WorkspaceContainer = styled.div`
  flex: 1;
  padding: 40px;
  background-color: ${props => props.theme.background};
  color: ${props => props.theme.text};
  overflow-y: auto;
  width: ${props => (props.$collapsed ? '100%' : 'calc(100% - 280px)')};
  margin-left: ${props => (props.$collapsed ? '0' : '280px')};
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
`;

const Header = styled.div`
  margin-bottom: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 15px;
`;

const ContentArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const WelcomeCard = styled.div`
  background-color: ${props => props.theme.sidebar};
  border-radius: 15px;
  padding: 30px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
`;

const WelcomeText = styled.p`
  font-size: 1.2rem;
  color: ${props => props.theme.textSecondary};
  margin-top: 10px;
`;

const WorkspacePage = ({ collapsed }) => {
  return (
    <WorkspaceContainer $collapsed={collapsed}>
      <Header>
        <Title>
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
          Workspace
        </Title>
      </Header>

      <ContentArea>
        <WelcomeCard>
          <h2>Welcome to Your Workspace</h2>
          <WelcomeText>
            This is your personal workspace where you can build, create, and manage your projects.
          </WelcomeText>
        </WelcomeCard>
      </ContentArea>
    </WorkspaceContainer>
  );
};

export default WorkspacePage; 
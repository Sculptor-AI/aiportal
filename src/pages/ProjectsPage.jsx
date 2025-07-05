import React, { useState } from 'react';
import styled from 'styled-components';
import NewProjectModal from '../components/NewProjectModal';

const ProjectsPageContainer = styled.div`
  flex: 1;
  padding: 40px;
  background-color: ${props => props.theme.background};
  color: ${props => props.theme.text};
  overflow-y: auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 15px;
`;

const NewProjectButton = styled.button`
  background-color: ${props => props.theme.name === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)'};
  color: ${props => props.theme.text};
  border: 1px solid ${props => props.theme.border};
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${props => props.theme.name === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)'};
  }
`;

const SearchContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
`;

const SearchInput = styled.input`
    flex-grow: 1;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid ${props => props.theme.border};
    background-color: ${props => props.theme.inputBackground};
    color: ${props => props.theme.text};
    font-size: 1rem;
    margin-right: 20px;
`;

const ProjectsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`;

const EmptyProjectsContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    height: calc(100vh - 300px);
    color: ${props => props.theme.textSecondary};
`;

const EmptyProjectsTitle = styled.h2`
    font-size: 1.5rem;
    margin-bottom: 10px;
`;

const EmptyProjectsText = styled.p`
    font-size: 1rem;
    max-width: 400px;
`;

const ProjectCard = styled.div`
  background-color: ${props => props.theme.inputBackground};
  padding: 20px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.border};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  }
`;

const ProjectTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 10px;
`;

const ProjectsPage = ({ projects, createNewProject }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <ProjectsPageContainer>
      <Header>
        <Title>
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4l2 3h10a2 2 0 0 1 2 2z"></path>
          </svg>
          Projects
        </Title>
        <NewProjectButton onClick={() => setIsModalOpen(true)}>Create project</NewProjectButton>
      </Header>
      <SearchContainer>
          <SearchInput placeholder="Search projects..." />
      </SearchContainer>
      <ProjectsGrid>
        {projects && projects.map(project => (
          <ProjectCard key={project.id}>
            <ProjectTitle>{project.projectName}</ProjectTitle>
          </ProjectCard>
        ))}
      </ProjectsGrid>
      {(!projects || projects.length === 0) && (
        <EmptyProjectsContainer>
            <EmptyProjectsTitle>No projects yet</EmptyProjectsTitle>
            <EmptyProjectsText>Get started by creating a new project. It's a great way to organize your work.</EmptyProjectsText>
        </EmptyProjectsContainer>
      )}
      {isModalOpen && <NewProjectModal closeModal={() => setIsModalOpen(false)} createNewProject={createNewProject} />}
    </ProjectsPageContainer>
  );
};

export default ProjectsPage;
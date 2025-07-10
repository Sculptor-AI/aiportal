import React, { useState } from 'react';
import styled from 'styled-components';
import NewProjectModal from '../components/NewProjectModal';
import { Link } from 'react-router-dom';

const ProjectsPageContainer = styled.div`
  flex: 1;
  padding: 40px;
  background-color: ${props => props.theme.background};
  color: ${props => props.theme.text};
  overflow-y: auto;
  width: ${props => (props.$collapsed ? '100%' : 'calc(100% - 320px)')};
  margin-left: ${props => (props.$collapsed ? '0' : '320px')};
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
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

const DeleteButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: transparent;
  border: none;
  color: ${props => props.theme.text};
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;

  &:hover {
    color: #d32f2f;
  }
`;

const ProjectCard = styled.div`
  background-color: ${props => props.theme.inputBackground};
  padding: 20px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.border};
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);

    ${DeleteButton} {
      opacity: 1;
    }
  }
`;

const ProjectTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 10px;
`;

const ProjectDescription = styled.p`
  font-size: 0.9rem;
  color: ${props => props.theme.textSecondary};
  margin-bottom: 15px;
  height: 4.5em; /* Limit to 3 lines */
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
`;

const ProjectDate = styled.p`
  font-size: 0.8rem;
  color: ${props => props.theme.textSecondary};
  text-align: right;
`;

const ProjectsPage = ({ projects, createNewProject, collapsed, deleteProject }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <ProjectsPageContainer $collapsed={collapsed}>
      <Header>
        <Title>
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '15px' }}>
            <rect x="3" y="3" width="7" height="7" rx="1"></rect>
            <rect x="14" y="3" width="7" height="7" rx="1"></rect>
            <rect x="3" y="14" width="7" height="7" rx="1"></rect>
            <rect x="14" y="14" width="7" height="7" rx="1"></rect>
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
            <Link to={`/projects/${project.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <ProjectTitle>{project.projectName}</ProjectTitle>
              <ProjectDescription>{project.projectDescription}</ProjectDescription>
              <ProjectDate>{new Date(project.createdAt).toLocaleDateString()}</ProjectDate>
            </Link>
            <DeleteButton onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1-2-2h4a2 2 0 0 1-2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </DeleteButton>
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
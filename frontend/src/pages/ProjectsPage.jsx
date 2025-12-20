import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import NewProjectModal from '../components/NewProjectModal';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/TranslationContext';

const PageContainer = styled.div`
  flex: 1;
  min-height: 100vh;
  background: ${props => props.theme.background};
  color: ${props => props.theme.text};
  overflow-y: auto;
  width: ${props => (props.$collapsed ? '100%' : 'calc(100% - 320px)')};
  margin-left: ${props => (props.$collapsed ? '0' : '320px')};
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 48px;
  
  @media (max-width: 768px) {
    padding: 24px 20px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  gap: 24px;
  
  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const TitleSection = styled.div`
  flex: 1;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  margin: 0 0 8px 0;
  letter-spacing: -0.02em;
  font-family: ${props => props.theme.fontFamily || 'inherit'};
`;

const Subtitle = styled.p`
  font-size: 0.95rem;
  color: ${props => props.theme.text}80;
  margin: 0;
  line-height: 1.5;
  font-family: ${props => props.theme.fontFamily || 'inherit'};
`;

const CreateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: ${props => props.theme.primary || '#007AFF'};
  color: ${props => props.theme.primaryForeground || 'white'};
  border: none;
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: ${props => props.theme.fontFamily || 'inherit'};
  white-space: nowrap;
  
  &:hover {
    filter: brightness(1.1);
  }
  
  &:active {
    filter: brightness(0.95);
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const SearchAndFilters = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 28px;
  
  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const SearchWrapper = styled.div`
  position: relative;
  flex: 1;
  max-width: 400px;
  
  @media (max-width: 640px) {
    max-width: 100%;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 16px 12px 44px;
  border-radius: 10px;
  border: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.inputBackground};
  color: ${props => props.theme.text};
  font-size: 0.9rem;
  font-family: ${props => props.theme.fontFamily || 'inherit'};
  transition: all 0.2s ease;
  
  &::placeholder {
    color: ${props => props.theme.text}50;
  }
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.primary || '#007AFF'};
    box-shadow: 0 0 0 3px ${props => props.theme.primary || '#007AFF'}20;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme.text}50;
  display: flex;
  align-items: center;
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const FilterTabs = styled.div`
  display: flex;
  gap: 4px;
  background: ${props => props.theme.inputBackground};
  padding: 4px;
  border-radius: 10px;
  border: 1px solid ${props => props.theme.border};
`;

const FilterTab = styled.button`
  padding: 8px 16px;
  border: none;
  background: ${props => props.$active ? props.theme.primary || '#007AFF' : 'transparent'};
  color: ${props => props.$active ? 'white' : props.theme.text};
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: ${props => props.theme.fontFamily || 'inherit'};
  
  &:hover {
    background: ${props => props.$active ? props.theme.primary || '#007AFF' : props.theme.hover};
  }
`;

const ProjectsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const ProjectCard = styled.div`
  background: ${props => props.theme.sidebar};
  border: 1px solid ${props => props.theme.border};
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 180px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px ${props => props.theme.shadow || 'rgba(0,0,0,0.12)'};
    border-color: ${props => props.theme.primary || '#007AFF'}40;
  }
`;

const ProjectHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 14px;
`;

const ProjectIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${props => props.$color || props.theme.primary || '#5B6AD0'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
`;

const ProjectInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ProjectTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: ${props => props.theme.text};
  font-family: ${props => props.theme.fontFamily || 'inherit'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ProjectDescription = styled.p`
  font-size: 0.875rem;
  color: ${props => props.theme.text}80;
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-family: ${props => props.theme.fontFamily || 'inherit'};
`;

const ProjectMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid ${props => props.theme.border};
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: ${props => props.theme.text}60;
  font-family: ${props => props.theme.fontFamily || 'inherit'};
  
  svg {
    width: 14px;
    height: 14px;
    opacity: 0.7;
  }
`;

const StarButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  color: ${props => props.$starred ? '#FFB800' : props.theme.text + '40'};
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: ${props => props.theme.hover};
    color: ${props => props.$starred ? '#FFB800' : props.theme.text};
  }
  
  svg {
    width: 18px;
    height: 18px;
    fill: ${props => props.$starred ? '#FFB800' : 'none'};
  }
`;

const ActionMenu = styled.div`
  position: absolute;
  bottom: 16px;
  right: 16px;
  opacity: 0;
  transition: opacity 0.15s ease;
  
  ${ProjectCard}:hover & {
    opacity: 1;
  }
`;

const ActionButton = styled.button`
  background: ${props => props.theme.inputBackground};
  border: 1px solid ${props => props.theme.border};
  color: ${props => props.$danger ? '#dc3545' : props.theme.text};
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: ${props => props.$danger ? '#dc354520' : props.theme.hover};
    border-color: ${props => props.$danger ? '#dc3545' : props.theme.border};
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 80px 20px;
  max-width: 400px;
  margin: 40px auto;
`;

const EmptyIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: ${props => props.theme.inputBackground};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  
  svg {
    width: 40px;
    height: 40px;
    color: ${props => props.theme.text}40;
  }
`;

const EmptyTitle = styled.h2`
  font-size: 1.4rem;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: ${props => props.theme.text};
  font-family: ${props => props.theme.fontFamily || 'inherit'};
`;

const EmptyDescription = styled.p`
  font-size: 0.95rem;
  color: ${props => props.theme.text}70;
  margin: 0 0 28px 0;
  line-height: 1.6;
  font-family: ${props => props.theme.fontFamily || 'inherit'};
`;

const PROJECT_COLORS = [
  '#5B6AD0',
  '#E85D75',
  '#3B9ED8',
  '#36B37E',
  '#F5A623',
  '#9B6BD1',
  '#E87D8A',
  '#4C6EF5',
];

const PROJECT_ICONS = ['📁', '💼', '🎨', '🔬', '📊', '💡', '🚀', '📝', '🎯', '⚡'];

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      return diffMinutes <= 1 ? 'Just now' : `${diffMinutes}m ago`;
    }
    return `${diffHours}h ago`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
};

const ProjectsPage = ({ projects = [], createNewProject, collapsed, deleteProject, toggleProjectStar, chats = [] }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'starred', 'recent'

  const filteredProjects = useMemo(() => {
    let result = [...projects];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.projectName?.toLowerCase().includes(term) || 
        p.projectDescription?.toLowerCase().includes(term)
      );
    }
    
    // Apply tab filter
    if (filter === 'starred') {
      result = result.filter(p => p.starred);
    }
    
    // Sort by date (most recent first)
    result.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
    
    return result;
  }, [projects, searchTerm, filter]);

  const getProjectChatCount = (projectId) => {
    return chats.filter(chat => chat.projectId === projectId).length;
  };

  const getProjectKnowledgeCount = (project) => {
    return project.knowledge?.length || 0;
  };

  const handleProjectClick = (projectId) => {
    navigate(`/projects/${projectId}`);
  };

  const handleStarClick = (e, projectId) => {
    e.stopPropagation();
    if (toggleProjectStar) {
      toggleProjectStar(projectId);
    }
  };

  const handleDeleteClick = (e, projectId) => {
    e.stopPropagation();
    if (deleteProject) {
      deleteProject(projectId);
    }
  };

  return (
    <PageContainer $collapsed={collapsed}>
      <ContentWrapper>
        <Header>
          <TitleSection>
            <Title>{t('projects.title', 'Projects')}</Title>
            <Subtitle>{t('projects.subtitle', 'Organize your work with custom instructions and knowledge files')}</Subtitle>
          </TitleSection>
          <CreateButton onClick={() => setIsModalOpen(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            {t('projects.createButton', 'Create project')}
          </CreateButton>
        </Header>

        <SearchAndFilters>
          <SearchWrapper>
            <SearchIcon>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </SearchIcon>
            <SearchInput 
              type="text"
              placeholder={t('projects.searchPlaceholder', 'Search projects...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchWrapper>
          <FilterTabs>
            <FilterTab 
              $active={filter === 'all'} 
              onClick={() => setFilter('all')}
            >
              {t('projects.filter.all', 'All')}
            </FilterTab>
            <FilterTab 
              $active={filter === 'starred'} 
              onClick={() => setFilter('starred')}
            >
              {t('projects.filter.starred', 'Starred')}
            </FilterTab>
          </FilterTabs>
        </SearchAndFilters>

        {filteredProjects.length > 0 ? (
          <ProjectsGrid>
            {filteredProjects.map((project, index) => (
              <ProjectCard 
                key={project.id} 
                onClick={() => handleProjectClick(project.id)}
              >
                <StarButton 
                  $starred={project.starred}
                  onClick={(e) => handleStarClick(e, project.id)}
                  title={project.starred ? 'Remove from starred' : 'Add to starred'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                </StarButton>
                
                <ProjectHeader>
                  <ProjectIcon $color={project.color || PROJECT_COLORS[index % PROJECT_COLORS.length]}>
                    {project.icon || PROJECT_ICONS[index % PROJECT_ICONS.length]}
                  </ProjectIcon>
                  <ProjectInfo>
                    <ProjectTitle>{project.projectName}</ProjectTitle>
                    <ProjectDescription>
                      {project.projectDescription || t('projects.noDescription', 'No description')}
                    </ProjectDescription>
                  </ProjectInfo>
                </ProjectHeader>
                
                <ProjectMeta>
                  <MetaItem>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    {getProjectChatCount(project.id)} {t('projects.chats', 'chats')}
                  </MetaItem>
                  <MetaItem>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    {getProjectKnowledgeCount(project)} {t('projects.files', 'files')}
                  </MetaItem>
                  <MetaItem style={{ marginLeft: 'auto' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    {formatDate(project.updatedAt || project.createdAt)}
                  </MetaItem>
                </ProjectMeta>
                
                <ActionMenu>
                  <ActionButton 
                    $danger 
                    onClick={(e) => handleDeleteClick(e, project.id)}
                    title={t('projects.delete', 'Delete project')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </ActionButton>
                </ActionMenu>
              </ProjectCard>
            ))}
          </ProjectsGrid>
        ) : (
          <EmptyState>
            <EmptyIcon>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                <line x1="12" y1="11" x2="12" y2="17"></line>
                <line x1="9" y1="14" x2="15" y2="14"></line>
              </svg>
            </EmptyIcon>
            <EmptyTitle>
              {searchTerm 
                ? t('projects.noResults', 'No projects found') 
                : t('projects.emptyTitle', 'Create your first project')}
            </EmptyTitle>
            <EmptyDescription>
              {searchTerm 
                ? t('projects.noResultsDesc', `No projects match "${searchTerm}"`)
                : t('projects.emptyDescription', 'Projects help you organize conversations with custom instructions and knowledge files that provide context across all chats.')}
            </EmptyDescription>
            {!searchTerm && (
              <CreateButton onClick={() => setIsModalOpen(true)}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                {t('projects.createButton', 'Create project')}
              </CreateButton>
            )}
          </EmptyState>
        )}
      </ContentWrapper>
      
      {isModalOpen && (
        <NewProjectModal 
          closeModal={() => setIsModalOpen(false)} 
          createNewProject={createNewProject}
          projectColors={PROJECT_COLORS}
          projectIcons={PROJECT_ICONS}
        />
      )}
    </PageContainer>
  );
};

export default ProjectsPage;

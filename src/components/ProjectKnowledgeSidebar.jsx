import React, { useRef } from 'react';
import styled from 'styled-components';

const SidebarContainer = styled.div`
  flex: 1;
  padding: 40px;
  background-color: ${props => props.theme.sidebar};
  border-left: 1px solid ${props => props.theme.border};
  display: flex;
  flex-direction: column;
  color: ${props => props.theme.text};
`;

const SidebarTitle = styled.h2`
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 20px;
`;

const UploadIcon = styled.label`
    font-size: 2rem;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.2s;
    
    &:hover {
        opacity: 1;
    }
`;

const HiddenInput = styled.input`
    display: none;
`;

const KnowledgeList = styled.div`
    margin-top: 20px;
`;

const KnowledgeItem = styled.div`
    background-color: ${props => props.theme.inputBackground};
    padding: 10px;
    border-radius: 6px;
    margin-bottom: 10px;
`;

const ProjectKnowledgeSidebar = ({ project, addKnowledgeToProject }) => {
  const fileInputRef = useRef(null);

  const handleFileSelected = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileData = {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
    };
    addKnowledgeToProject(project.id, fileData);
  }

  const handleIconClick = () => {
    fileInputRef.current.click();
  }

  return (
    <SidebarContainer>
        <SidebarTitle>Project Knowledge</SidebarTitle>
        <UploadIcon onClick={handleIconClick}>
            📎
            <HiddenInput type="file" ref={fileInputRef} onChange={handleFileSelected} />
        </UploadIcon>
        <KnowledgeList>
            {(project.knowledge || []).map(item => (
                <KnowledgeItem key={item.id}>
                    {item.name}
                </KnowledgeItem>
            ))}
        </KnowledgeList>
    </SidebarContainer>
  );
};

export default ProjectKnowledgeSidebar; 
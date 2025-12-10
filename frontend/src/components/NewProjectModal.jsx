import React, { useState } from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: ${props => props.theme.background};
  padding: 40px;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  color: ${props => props.theme.text};
`;

const Title = styled.h2`
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 30px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 1rem;
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.border};
  background-color: ${props => props.theme.inputBackground};
  color: ${props => props.theme.text};
  font-size: 1rem;
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.border};
  background-color: ${props => props.theme.inputBackground};
  color: ${props => props.theme.text};
  font-size: 1rem;
  height: 120px;
  resize: none;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 30px;
`;

const Button = styled.button`
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  border: none;
`;

const CancelButton = styled(Button)`
  background-color: transparent;
  color: ${props => props.theme.text};
  border: 1px solid ${props => props.theme.border};
`;

const CreateButton = styled(Button)`
  background-color: #4a90e2;
  color: white;
`;

const NewProjectModal = ({ closeModal, createNewProject }) => {
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');

  const handleCreateProject = () => {
    if (!projectName) return; // Basic validation
    createNewProject({
      projectName,
      projectDescription,
    });
    closeModal();
  };

  return (
    <ModalOverlay onClick={closeModal}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <Title>Create a personal project</Title>
        <FormGroup>
          <Label>What are you working on?</Label>
          <Input 
            type="text" 
            placeholder="Name your project" 
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
          />
        </FormGroup>
        <FormGroup>
          <Label>What are you trying to achieve?</Label>
          <Textarea 
            placeholder="Describe your project, goals, subject, etc..."
            value={projectDescription}
            onChange={e => setProjectDescription(e.target.value)}
          />
        </FormGroup>
        <ButtonContainer>
          <CancelButton onClick={closeModal}>Cancel</CancelButton>
          <CreateButton onClick={handleCreateProject}>Create project</CreateButton>
        </ButtonContainer>
      </ModalContent>
    </ModalOverlay>
  );
};

export default NewProjectModal; 
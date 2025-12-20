import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from '../contexts/TranslationContext';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: ${props => props.theme.sidebar};
  border: 1px solid ${props => props.theme.border};
  border-radius: 16px;
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  color: ${props => props.theme.text};
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.25s ease-out;
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;

const ModalHeader = styled.div`
  padding: 24px 28px 0;
`;

const ModalBody = styled.div`
  padding: 20px 28px 28px;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 8px 0;
  font-family: ${props => props.theme.fontFamily || 'inherit'};
  letter-spacing: -0.02em;
`;

const Subtitle = styled.p`
  font-size: 0.9rem;
  color: ${props => props.theme.text}70;
  margin: 0;
  line-height: 1.5;
  font-family: ${props => props.theme.fontFamily || 'inherit'};
`;

const FormGroup = styled.div`
  margin-bottom: 24px;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 8px;
  color: ${props => props.theme.text};
  font-family: ${props => props.theme.fontFamily || 'inherit'};
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.inputBackground};
  color: ${props => props.theme.text};
  font-size: 0.95rem;
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

const Textarea = styled.textarea`
  width: 100%;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.inputBackground};
  color: ${props => props.theme.text};
  font-size: 0.95rem;
  font-family: ${props => props.theme.fontFamily || 'inherit'};
  resize: vertical;
  min-height: ${props => props.$large ? '150px' : '100px'};
  transition: all 0.2s ease;
  line-height: 1.5;
  
  &::placeholder {
    color: ${props => props.theme.text}50;
  }
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.primary || '#007AFF'};
    box-shadow: 0 0 0 3px ${props => props.theme.primary || '#007AFF'}20;
  }
`;

const CharCount = styled.span`
  display: block;
  text-align: right;
  font-size: 0.75rem;
  color: ${props => props.$near ? '#ff9500' : props.$over ? '#dc3545' : props.theme.text + '50'};
  margin-top: 6px;
  font-family: ${props => props.theme.fontFamily || 'inherit'};
`;

const IconColorSection = styled.div`
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
  
  @media (max-width: 480px) {
    flex-direction: column;
    gap: 20px;
  }
`;

const IconSection = styled.div`
  flex: 1;
`;

const ColorSection = styled.div`
  flex: 1;
`;

const SectionTitle = styled.div`
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 10px;
  color: ${props => props.theme.text};
  font-family: ${props => props.theme.fontFamily || 'inherit'};
`;

const IconGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const IconOption = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 2px solid ${props => props.$selected ? props.theme.primary || '#007AFF' : props.theme.border};
  background: ${props => props.$selected ? (props.theme.primary || '#007AFF') + '15' : props.theme.inputBackground};
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  
  &:hover {
    border-color: ${props => props.theme.primary || '#007AFF'};
    transform: scale(1.05);
  }
`;

const ColorGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const ColorOption = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 2px solid ${props => props.$selected ? 'white' : 'transparent'};
  background: ${props => props.$color};
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: ${props => props.$selected ? '0 0 0 2px ' + (props.theme.primary || '#007AFF') : 'none'};
  
  &:hover {
    transform: scale(1.1);
  }
`;

const PreviewSection = styled.div`
  background: ${props => props.theme.inputBackground};
  border: 1px solid ${props => props.theme.border};
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 14px;
`;

const PreviewIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${props => props.$color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
`;

const PreviewInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const PreviewTitle = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: ${props => props.theme.text};
  font-family: ${props => props.theme.fontFamily || 'inherit'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const PreviewDescription = styled.div`
  font-size: 0.8rem;
  color: ${props => props.theme.text}70;
  font-family: ${props => props.theme.fontFamily || 'inherit'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 8px;
`;

const Button = styled.button`
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: ${props => props.theme.fontFamily || 'inherit'};
`;

const CancelButton = styled(Button)`
  background: transparent;
  color: ${props => props.theme.text};
  border: 1px solid ${props => props.theme.border};
  
  &:hover {
    background: ${props => props.theme.hover};
  }
`;

const CreateButton = styled(Button)`
  background: ${props => props.theme.primary || '#007AFF'};
  color: white;
  border: none;
  
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px ${props => props.theme.primary || '#007AFF'}40;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ExpandableSection = styled.div`
  margin-bottom: 24px;
`;

const ExpandableHeader = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.inputBackground};
  color: ${props => props.theme.text};
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: ${props => props.theme.fontFamily || 'inherit'};
  
  &:hover {
    border-color: ${props => props.theme.primary || '#007AFF'};
  }
`;

const ExpandableTitle = styled.span`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
  font-weight: 500;
  
  svg {
    width: 18px;
    height: 18px;
    opacity: 0.7;
  }
`;

const ExpandableChevron = styled.span`
  transition: transform 0.2s ease;
  transform: ${props => props.$expanded ? 'rotate(180deg)' : 'rotate(0)'};
  
  svg {
    width: 18px;
    height: 18px;
    opacity: 0.5;
  }
`;

const ExpandableContent = styled.div`
  display: ${props => props.$expanded ? 'block' : 'none'};
  padding-top: 12px;
`;

const HelpText = styled.p`
  font-size: 0.8rem;
  color: ${props => props.theme.text}60;
  margin: 0 0 10px 0;
  line-height: 1.5;
  font-family: ${props => props.theme.fontFamily || 'inherit'};
`;

const DEFAULT_COLORS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
];

const DEFAULT_ICONS = ['📁', '💼', '🎨', '🔬', '📊', '💡', '🚀', '📝', '🎯', '⚡'];

const MAX_INSTRUCTIONS_LENGTH = 8000;

const NewProjectModal = ({ 
  closeModal, 
  createNewProject, 
  projectColors = DEFAULT_COLORS, 
  projectIcons = DEFAULT_ICONS 
}) => {
  const { t } = useTranslation();
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectInstructions, setProjectInstructions] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(projectIcons[0]);
  const [selectedColor, setSelectedColor] = useState(projectColors[0]);
  const [showInstructions, setShowInstructions] = useState(false);

  const handleCreateProject = () => {
    if (!projectName.trim()) return;
    createNewProject({
      projectName: projectName.trim(),
      projectDescription: projectDescription.trim(),
      projectInstructions: projectInstructions.trim(),
      icon: selectedIcon,
      color: selectedColor,
    });
    closeModal();
  };

  const instructionsLength = projectInstructions.length;
  const isNearLimit = instructionsLength > MAX_INSTRUCTIONS_LENGTH * 0.8;
  const isOverLimit = instructionsLength > MAX_INSTRUCTIONS_LENGTH;

  return (
    <ModalOverlay onClick={closeModal}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <Title>{t('projects.modal.title', 'Create a new project')}</Title>
          <Subtitle>{t('projects.modal.subtitle', 'Set up custom instructions and context for your conversations')}</Subtitle>
        </ModalHeader>
        
        <ModalBody>
          {/* Preview */}
          <PreviewSection>
            <PreviewIcon $color={selectedColor}>
              {selectedIcon}
            </PreviewIcon>
            <PreviewInfo>
              <PreviewTitle>{projectName || t('projects.modal.untitled', 'Untitled Project')}</PreviewTitle>
              <PreviewDescription>
                {projectDescription || t('projects.modal.noDescription', 'No description')}
              </PreviewDescription>
            </PreviewInfo>
          </PreviewSection>
          
          {/* Name */}
          <FormGroup>
            <Label>{t('projects.modal.nameLabel', 'Project name')}</Label>
            <Input 
              type="text" 
              placeholder={t('projects.modal.namePlaceholder', 'Enter a name for your project')}
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              autoFocus
            />
          </FormGroup>
          
          {/* Description */}
          <FormGroup>
            <Label>{t('projects.modal.descriptionLabel', 'Description')} <span style={{ opacity: 0.5 }}>({t('common.optional', 'optional')})</span></Label>
            <Textarea 
              placeholder={t('projects.modal.descriptionPlaceholder', 'What is this project about?')}
              value={projectDescription}
              onChange={e => setProjectDescription(e.target.value)}
            />
          </FormGroup>
          
          {/* Icon & Color */}
          <IconColorSection>
            <IconSection>
              <SectionTitle>{t('projects.modal.icon', 'Icon')}</SectionTitle>
              <IconGrid>
                {projectIcons.map((icon, index) => (
                  <IconOption 
                    key={index}
                    $selected={selectedIcon === icon}
                    onClick={() => setSelectedIcon(icon)}
                  >
                    {icon}
                  </IconOption>
                ))}
              </IconGrid>
            </IconSection>
            
            <ColorSection>
              <SectionTitle>{t('projects.modal.color', 'Color')}</SectionTitle>
              <ColorGrid>
                {projectColors.map((color, index) => (
                  <ColorOption 
                    key={index}
                    $color={color}
                    $selected={selectedColor === color}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </ColorGrid>
            </ColorSection>
          </IconColorSection>
          
          {/* Project Instructions (Expandable) */}
          <ExpandableSection>
            <ExpandableHeader onClick={() => setShowInstructions(!showInstructions)}>
              <ExpandableTitle>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                {t('projects.modal.instructions', 'Custom instructions')}
                {projectInstructions && <span style={{ opacity: 0.5, marginLeft: 4 }}>({instructionsLength})</span>}
              </ExpandableTitle>
              <ExpandableChevron $expanded={showInstructions}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </ExpandableChevron>
            </ExpandableHeader>
            <ExpandableContent $expanded={showInstructions}>
              <HelpText>
                {t('projects.modal.instructionsHelp', 'These instructions will be included with every message in this project. Use them to set context, define how the AI should respond, or provide relevant background information.')}
              </HelpText>
              <Textarea 
                $large
                placeholder={t('projects.modal.instructionsPlaceholder', 'e.g., "You are helping me write a fantasy novel. The story is set in a medieval world with magic..."')}
                value={projectInstructions}
                onChange={e => setProjectInstructions(e.target.value)}
              />
              <CharCount $near={isNearLimit} $over={isOverLimit}>
                {instructionsLength.toLocaleString()} / {MAX_INSTRUCTIONS_LENGTH.toLocaleString()}
              </CharCount>
            </ExpandableContent>
          </ExpandableSection>
          
          <ButtonContainer>
            <CancelButton onClick={closeModal}>{t('common.cancel', 'Cancel')}</CancelButton>
            <CreateButton 
              onClick={handleCreateProject}
              disabled={!projectName.trim() || isOverLimit}
            >
              {t('projects.modal.create', 'Create project')}
            </CreateButton>
          </ButtonContainer>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

export default NewProjectModal;

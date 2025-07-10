import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const WorkspaceContainer = styled.div`
  flex: 1;
  padding: 20px 40px;
  background-color: ${props => props.theme.background};
  color: ${props => props.theme.text};
  overflow-y: auto;
  width: ${props => (props.$collapsed ? '100%' : 'calc(100% - 320px)')};
  margin-left: ${props => (props.$collapsed ? '0' : '320px')};
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  min-height: 100vh;
`;

const Header = styled.div`
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  gap: 30px;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 400;
  color: ${props => props.theme.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 15px;
`;

const ModelCount = styled.span`
  font-size: 1.8rem;
  color: ${props => props.theme.textSecondary || props.theme.text};
  opacity: 0.7;
  font-weight: 300;
  margin-left: 10px;
`;

const SearchContainer = styled.div`
  flex: 1;
  max-width: 400px;
  position: relative;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 8px 12px 8px 36px;
  background-color: ${props => props.theme.inputBackground || props.theme.sidebar};
  border: 1px solid ${props => props.theme.border};
  border-radius: 6px;
  color: ${props => props.theme.text};
  font-size: 0.9rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    background-color: ${props => props.theme.hover};
    border-color: ${props => props.theme.primary};
  }

  &::placeholder {
    color: ${props => props.theme.textSecondary || props.theme.text};
    opacity: 0.5;
  }
`;

const SearchIcon = styled.svg`
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: ${props => props.theme.textSecondary || props.theme.text};
  opacity: 0.5;
`;

const AddButton = styled.button`
  background: ${props => props.theme.primary};
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  margin-left: auto;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
`;

const ModelsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
`;

const ModelCard = styled.div`
  background-color: ${props => props.theme.sidebar};
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.2s ease;
  border: 1px solid ${props => props.theme.border};

  &:hover {
    background-color: ${props => props.theme.hover};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${props => props.theme.shadow};
  }
`;

const ModelHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const ModelAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${props => props.$bgColor || props.theme.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1.2rem;
  font-weight: 500;
  color: #ffffff;
`;

const ModelInfo = styled.div`
  flex: 1;
`;

const ModelName = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 500;
  color: ${props => props.theme.text};
`;

const ModelDescription = styled.p`
  margin: 4px 0 0 0;
  font-size: 0.85rem;
  color: ${props => props.theme.textSecondary || props.theme.text};
  opacity: 0.8;
  line-height: 1.4;
`;

const ModelAuthor = styled.p`
  margin: 8px 0 0 0;
  font-size: 0.8rem;
  color: ${props => props.theme.textSecondary || props.theme.text};
  opacity: 0.6;
`;

const BaseModelInfo = styled.p`
  margin: 4px 0 0 0;
  font-size: 0.75rem;
  color: ${props => props.theme.textSecondary || props.theme.text};
  opacity: 0.5;
  font-style: italic;
`;

const ModelActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.textSecondary || props.theme.text};
  opacity: 0.6;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.hover};
    opacity: 1;
  }
`;

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  margin-left: auto;
`;

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;

  &:checked + span {
    background: ${props => props.theme.primary};
  }

  &:checked + span:before {
    transform: translateX(20px);
  }
`;

const ToggleSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${props => props.theme.border};
  transition: .3s;
  border-radius: 24px;

  &:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: .3s;
    border-radius: 50%;
  }
`;

// Modal styles
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: ${props => props.theme.sidebar};
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px ${props => props.theme.shadow};
  border: 1px solid ${props => props.theme.border};
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  color: ${props => props.theme.text};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.textSecondary || props.theme.text};
  font-size: 1.5rem;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;

  &:hover {
    color: ${props => props.theme.text};
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  color: ${props => props.theme.textSecondary || props.theme.text};
  font-size: 0.9rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  background-color: ${props => props.theme.inputBackground || props.theme.background};
  border: 1px solid ${props => props.theme.border};
  border-radius: 6px;
  color: ${props => props.theme.text};
  font-size: 0.95rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.primary};
    background-color: ${props => props.theme.hover};
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  background-color: ${props => props.theme.inputBackground || props.theme.background};
  border: 1px solid ${props => props.theme.border};
  border-radius: 6px;
  color: ${props => props.theme.text};
  font-size: 0.95rem;
  resize: vertical;
  min-height: 100px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.primary};
    background-color: ${props => props.theme.hover};
  }
`;

const SystemPromptArea = styled(TextArea)`
  min-height: 200px;
  font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
  font-size: 0.9rem;
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  background-color: ${props => props.theme.inputBackground || props.theme.background};
  border: 1px solid ${props => props.theme.border};
  border-radius: 6px;
  color: ${props => props.theme.text};
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.primary};
    background-color: ${props => props.theme.hover};
  }

  option {
    background-color: ${props => props.theme.sidebar};
    color: ${props => props.theme.text};
  }
`;

const HelperText = styled.p`
  font-size: 0.8rem;
  color: ${props => props.theme.textSecondary || props.theme.text};
  opacity: 0.7;
  margin-top: 4px;
  margin-bottom: 0;
`;

const AvatarPicker = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const AvatarOption = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${props => props.$selected ? props.theme.primary : props.theme.hover};
  border: 2px solid ${props => props.$selected ? props.theme.primary : 'transparent'};
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.$selected ? props.theme.primary : props.theme.hover};
    transform: scale(1.1);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
`;

const PrimaryButton = styled(Button)`
  background: ${props => props.theme.primary};
  color: white;

  &:hover {
    opacity: 0.9;
  }
`;

const SecondaryButton = styled(Button)`
  background-color: ${props => props.theme.hover};
  color: ${props => props.theme.text};

  &:hover {
    background-color: ${props => props.theme.border};
  }
`;

const DeleteButton = styled(Button)`
  background-color: #DC3545;
  color: white;

  &:hover {
    background-color: #c82333;
  }
`;

const OptionsMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background-color: ${props => props.theme.sidebar};
  border: 1px solid ${props => props.theme.border};
  border-radius: 6px;
  box-shadow: 0 4px 12px ${props => props.theme.shadow};
  z-index: 10;
  min-width: 120px;
`;

const OptionItem = styled.button`
  width: 100%;
  padding: 8px 12px;
  background: none;
  border: none;
  color: ${props => props.theme.text};
  text-align: left;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${props => props.theme.hover};
  }

  &:first-child {
    border-radius: 6px 6px 0 0;
  }

  &:last-child {
    border-radius: 0 0 6px 6px;
  }
`;

const ActionButtonWrapper = styled.div`
  position: relative;
`;

const WorkspacePage = ({ collapsed }) => {
  const [models, setModels] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredModels, setFilteredModels] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingModel, setEditingModel] = useState(null);
  const [activeOptionsMenu, setActiveOptionsMenu] = useState(null);
  const [availableBaseModels, setAvailableBaseModels] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    avatar: '🤖',
    systemPrompt: '',
    baseModel: ''
  });

  const avatarOptions = ['🤖', '✍️', '🎨', '💡', '🔬', '📚', '🎭', '🎯', '🚀', '💻', '🎵', '🏥'];

  // Load available base models from the main app
  useEffect(() => {
    const loadBaseModels = async () => {
      try {
        // Try to fetch models from backend using the same logic as App.jsx
        const { fetchModelsFromBackend } = await import('../services/aiService');
        const backendModels = await fetchModelsFromBackend();
        
        if (backendModels && backendModels.length > 0) {
          setAvailableBaseModels(backendModels);
          // Set default base model if not already set
          if (!formData.baseModel && backendModels.length > 0) {
            setFormData(prev => ({ ...prev, baseModel: backendModels[0].id }));
          }
        }
      } catch (error) {
        console.error('Error loading base models:', error);
      }
    };
    
    loadBaseModels();
  }, []);

  // Load custom models from localStorage
  useEffect(() => {
    const savedModels = localStorage.getItem('customModels');
    if (savedModels) {
      const parsedModels = JSON.parse(savedModels);
      // Ensure all models have a baseModel (for backward compatibility)
      const modelsWithBaseModel = parsedModels.map(model => ({
        ...model,
        baseModel: model.baseModel || (availableBaseModels.length > 0 ? availableBaseModels[0].id : 'gpt-3.5-turbo') // Use first available or fallback
      }));
      setModels(modelsWithBaseModel);
      setFilteredModels(modelsWithBaseModel);
      // Update localStorage with the migrated models
      if (parsedModels.some(m => !m.baseModel)) {
        localStorage.setItem('customModels', JSON.stringify(modelsWithBaseModel));
      }
    } else {
      // Don't initialize with example models until we have base models loaded
      if (availableBaseModels.length > 0) {
        // Initialize with some example models
        const exampleModels = [
          {
            id: Date.now(),
            name: 'Code Assistant',
            description: 'A helpful AI assistant specialized in coding and software development.',
            author: 'You',
            enabled: false, // Start disabled so user must explicitly enable
            avatar: '🤖',
            systemPrompt: 'You are a helpful coding assistant specializing in software development. Provide clear, concise code examples and explanations.',
            baseModel: availableBaseModels[0].id // Use first available base model
          },
          {
            id: Date.now() + 1,
            name: 'Creative Writer',
            description: 'An AI focused on creative writing, storytelling, and narrative development.',
            author: 'You',
            enabled: false, // Start disabled
            avatar: '✍️',
            systemPrompt: 'You are a creative writing assistant. Help with storytelling, character development, and narrative structure. Be imaginative and inspiring.',
            baseModel: availableBaseModels[0].id // Use first available base model
          }
        ];
        setModels(exampleModels);
        setFilteredModels(exampleModels);
        localStorage.setItem('customModels', JSON.stringify(exampleModels));
      }
    }
  }, [availableBaseModels]); // Add availableBaseModels as dependency

  // Filter models based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredModels(models);
    } else {
      const filtered = models.filter(model => 
        model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredModels(filtered);
    }
  }, [searchQuery, models]);

  const toggleModel = (modelId) => {
    const updatedModels = models.map(model => 
      model.id === modelId ? { ...model, enabled: !model.enabled } : model
    );
    setModels(updatedModels);
    localStorage.setItem('customModels', JSON.stringify(updatedModels));
    
    // Trigger storage event to refresh models in the app
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'customModels',
      newValue: JSON.stringify(updatedModels),
      url: window.location.href
    }));
  };

  const getRandomColor = () => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B500', '#6C5CE7'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleNewModel = () => {
    setEditingModel(null);
    setFormData({
      name: '',
      description: '',
      avatar: '🤖',
      systemPrompt: '',
      baseModel: availableBaseModels.length > 0 ? availableBaseModels[0].id : ''
    });
    setShowModal(true);
  };

  const handleEditModel = (model) => {
    setEditingModel(model);
    setFormData({
      name: model.name,
      description: model.description,
      avatar: model.avatar || '🤖',
      systemPrompt: model.systemPrompt || '',
      baseModel: model.baseModel || (availableBaseModels.length > 0 ? availableBaseModels[0].id : '')
    });
    setShowModal(true);
    setActiveOptionsMenu(null);
  };

  const handleDeleteModel = (modelId) => {
    const updatedModels = models.filter(model => model.id !== modelId);
    setModels(updatedModels);
    setFilteredModels(updatedModels);
    localStorage.setItem('customModels', JSON.stringify(updatedModels));
    setActiveOptionsMenu(null);
    
    // Trigger storage event to refresh models in the app
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'customModels',
      newValue: JSON.stringify(updatedModels),
      url: window.location.href
    }));
  };

  const handleSaveModel = () => {
    if (!formData.name || !formData.systemPrompt) {
      alert('Please provide a name and system prompt for your model.');
      return;
    }

    if (!formData.baseModel) {
      alert('Please select a base model for your custom model.');
      return;
    }

    let updatedModels;
    if (editingModel) {
      // Update existing model
      updatedModels = models.map(model => 
        model.id === editingModel.id 
          ? { ...model, ...formData }
          : model
      );
      setModels(updatedModels);
      localStorage.setItem('customModels', JSON.stringify(updatedModels));
    } else {
      // Create new model
      const newModel = {
        id: Date.now(),
        ...formData,
        author: 'You',
        enabled: false,
        avatarColor: getRandomColor()
      };
      updatedModels = [...models, newModel];
      setModels(updatedModels);
      localStorage.setItem('customModels', JSON.stringify(updatedModels));
    }

    // Trigger storage event to refresh models in the app
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'customModels',
      newValue: JSON.stringify(updatedModels),
      url: window.location.href
    }));

    setShowModal(false);
    setFormData({
      name: '',
      description: '',
      avatar: '🤖',
      systemPrompt: '',
      baseModel: availableBaseModels.length > 0 ? availableBaseModels[0].id : ''
    });
  };

  const toggleOptionsMenu = (modelId) => {
    setActiveOptionsMenu(activeOptionsMenu === modelId ? null : modelId);
  };

  // Close options menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (activeOptionsMenu && !e.target.closest('.options-menu-wrapper')) {
        setActiveOptionsMenu(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeOptionsMenu]);

  return (
    <WorkspaceContainer $collapsed={collapsed}>
      <Header>
        <Title>
          Models
          <ModelCount>{models.length}</ModelCount>
        </Title>
        
        <SearchContainer>
          <SearchIcon xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </SearchIcon>
          <SearchInput 
            type="text" 
            placeholder="Search Models"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SearchContainer>

        <AddButton onClick={handleNewModel}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Model
        </AddButton>
      </Header>

      <ModelsGrid>
        {filteredModels.map((model) => {
          // Find the base model name for display
          const baseModelInfo = availableBaseModels.find(m => m.id === model.baseModel);
          const baseModelName = baseModelInfo ? `${baseModelInfo.name} (${baseModelInfo.provider})` : model.baseModel || 'Unknown';
          
          return (
            <ModelCard key={model.id}>
              <ModelHeader>
                <ModelAvatar $bgColor={model.avatarColor || getRandomColor()}>
                  {model.avatar || model.name.charAt(0).toUpperCase()}
                </ModelAvatar>
                <ModelInfo>
                  <ModelName>{model.name}</ModelName>
                  <ModelDescription>{model.description}</ModelDescription>
                  {model.baseModel && (
                    <BaseModelInfo>Based on: {baseModelName}</BaseModelInfo>
                  )}
                </ModelInfo>
              </ModelHeader>
              
              <ModelAuthor>By {model.author}</ModelAuthor>
              
              <ModelActions>
                <ActionButton title="Edit" onClick={() => handleEditModel(model)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </ActionButton>
                
                <ActionButtonWrapper className="options-menu-wrapper">
                  <ActionButton title="More options" onClick={() => toggleOptionsMenu(model.id)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="5" r="2"/>
                      <circle cx="12" cy="12" r="2"/>
                      <circle cx="12" cy="19" r="2"/>
                    </svg>
                  </ActionButton>
                  {activeOptionsMenu === model.id && (
                    <OptionsMenu>
                      <OptionItem onClick={() => handleEditModel(model)}>Edit</OptionItem>
                      <OptionItem onClick={() => handleDeleteModel(model.id)}>Delete</OptionItem>
                    </OptionsMenu>
                  )}
                </ActionButtonWrapper>
                
                <ToggleSwitch>
                  <ToggleInput 
                    type="checkbox" 
                    checked={model.enabled}
                    onChange={() => toggleModel(model.id)}
                  />
                  <ToggleSlider />
                </ToggleSwitch>
              </ModelActions>
            </ModelCard>
          );
        })}
      </ModelsGrid>

      {showModal && (
        <ModalOverlay onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>{editingModel ? 'Edit Model' : 'Create New Model'}</ModalTitle>
              <CloseButton onClick={() => setShowModal(false)}>×</CloseButton>
            </ModalHeader>

            <FormGroup>
              <Label>Model Name</Label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Code Assistant, Creative Writer"
              />
            </FormGroup>

            <FormGroup>
              <Label>Description</Label>
              <TextArea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Briefly describe what this model specializes in..."
              />
            </FormGroup>

            <FormGroup>
              <Label>Avatar</Label>
              <AvatarPicker>
                {avatarOptions.map((avatar) => (
                  <AvatarOption
                    key={avatar}
                    $selected={formData.avatar === avatar}
                    onClick={() => setFormData({ ...formData, avatar })}
                    type="button"
                  >
                    {avatar}
                  </AvatarOption>
                ))}
              </AvatarPicker>
            </FormGroup>

            <FormGroup>
              <Label>Base Model</Label>
              <Select
                value={formData.baseModel}
                onChange={(e) => setFormData({ ...formData, baseModel: e.target.value })}
              >
                {availableBaseModels.length > 0 ? (
                  availableBaseModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} ({model.provider})
                    </option>
                  ))
                ) : (
                  <option value="">Loading models...</option>
                )}
              </Select>
              <HelperText>
                Select which AI model this custom model should use
              </HelperText>
            </FormGroup>

            <FormGroup>
              <Label>System Prompt</Label>
              <SystemPromptArea
                value={formData.systemPrompt}
                onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                placeholder="Enter the system prompt that defines how this model should behave..."
              />
            </FormGroup>

            <ButtonGroup>
              {editingModel && (
                <DeleteButton 
                  onClick={() => {
                    handleDeleteModel(editingModel.id);
                    setShowModal(false);
                  }}
                  style={{ marginRight: 'auto' }}
                >
                  Delete Model
                </DeleteButton>
              )}
              <SecondaryButton onClick={() => setShowModal(false)}>
                Cancel
              </SecondaryButton>
              <PrimaryButton onClick={handleSaveModel}>
                {editingModel ? 'Save Changes' : 'Create Model'}
              </PrimaryButton>
            </ButtonGroup>
          </ModalContent>
        </ModalOverlay>
      )}
    </WorkspaceContainer>
  );
};

export default WorkspacePage; 
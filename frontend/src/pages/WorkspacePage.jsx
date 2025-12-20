import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useTranslation } from '../contexts/TranslationContext';

// ============================================================================
// ANIMATIONS
// ============================================================================

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideInFromRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const scaleIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

// ============================================================================
// MAIN LAYOUT
// ============================================================================

const PageContainer = styled.div`
  flex: 1;
  min-height: 100vh;
  color: ${props => props.theme.text};
  overflow-y: auto;
  overflow-x: hidden;
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);

  width: ${props => props.$collapsed ? '100%' : 'calc(100% - 320px)'};
  margin-left: ${props => props.$collapsed ? '0' : '320px'};

  @media (max-width: 1024px) {
    width: 100%;
    margin-left: 0;
  }
`;

const ContentWrapper = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 48px 40px 80px;

  @media (max-width: 768px) {
    padding: 32px 20px 60px;
  }
`;

// ============================================================================
// HEADER
// ============================================================================

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 40px;
  gap: 24px;
  animation: ${fadeIn} 0.5s ease-out;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 20px;
  }
`;

const TitleSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const PageTitle = styled.h1`
  font-size: 2.25rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 16px;

  @media (max-width: 640px) {
    font-size: 1.875rem;
  }
`;

const ModelCount = styled.span`
  font-size: 1rem;
  font-weight: 500;
  padding: 4px 12px;
  background: ${props => props.theme.accentSurface || `${props.theme.primary}15`};
  color: ${props => props.theme.accentColor || props.theme.primary};
  border-radius: 20px;
`;

const Subtitle = styled.p`
  font-size: 0.9375rem;
  color: ${props => props.theme.textSecondary || `${props.theme.text}80`};
  margin: 0;
  letter-spacing: -0.01em;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  width: 280px;

  @media (max-width: 768px) {
    flex: 1;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 16px 10px 42px;
  background: ${props => props.theme.inputBackground || props.theme.sidebar};
  border: 1px solid ${props => props.theme.border};
  border-radius: 12px;
  color: ${props => props.theme.text};
  font-size: 0.875rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.accentColor || props.theme.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.accentSurface || `${props.theme.primary}15`};
  }

  &::placeholder {
    color: ${props => props.theme.textSecondary || `${props.theme.text}60`};
  }
`;

const SearchIcon = styled.svg`
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: ${props => props.theme.textSecondary || `${props.theme.text}60`};
  pointer-events: none;
`;

const CreateButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: ${props => props.theme.accentBackground || props.theme.primary};
  color: ${props => props.theme.accentText || '#fff'};
  border: none;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px ${props => props.theme.accentColor || props.theme.primary}40;
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

// ============================================================================
// FILTER TABS
// ============================================================================

const FilterContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 32px;
  flex-wrap: wrap;
  animation: ${slideUp} 0.5s ease-out;
  animation-delay: 0.1s;
  animation-fill-mode: backwards;
`;

const FilterTab = styled.button`
  padding: 8px 16px;
  background: ${props => props.$active
    ? (props.theme.accentSurface || `${props.theme.primary}15`)
    : 'transparent'};
  color: ${props => props.$active
    ? (props.theme.accentColor || props.theme.primary)
    : (props.theme.textSecondary || `${props.theme.text}80`)};
  border: 1px solid ${props => props.$active
    ? (props.theme.accentColor || props.theme.primary)
    : props.theme.border};
  border-radius: 20px;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.accentSurface || `${props.theme.primary}15`};
    border-color: ${props => props.theme.accentColor || props.theme.primary};
    color: ${props => props.theme.accentColor || props.theme.primary};
  }
`;

// ============================================================================
// MODELS GRID
// ============================================================================

const ModelsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 24px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const ModelCard = styled.article`
  background: ${props => props.theme.sidebar};
  border: 1px solid ${props => props.theme.border};
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  animation: ${scaleIn} 0.4s ease-out;
  animation-delay: ${props => props.$index * 0.05}s;
  animation-fill-mode: backwards;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${props => props.$enabled
      ? (props.theme.accentBackground || props.theme.primary)
      : 'transparent'};
    transition: background 0.3s ease;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px ${props => props.theme.shadow || 'rgba(0,0,0,0.15)'};
    border-color: ${props => props.theme.accentColor || props.theme.primary}40;
  }

  ${props => props.$enabled && css`
    border-color: ${props.theme.accentColor || props.theme.primary}30;
  `}
`;

const CardHeader = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
`;

const ModelAvatar = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: ${props => props.$bgColor || props.theme.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1.75rem;
  color: #fff;
  overflow: hidden;
  box-shadow: 0 4px 12px ${props => props.$bgColor || props.theme.primary}40;
  transition: transform 0.3s ease;

  ${ModelCard}:hover & {
    transform: scale(1.05);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ModelInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ModelName = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 4px;
  letter-spacing: -0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ModelDescription = styled.p`
  font-size: 0.875rem;
  color: ${props => props.theme.textSecondary || `${props.theme.text}80`};
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid ${props => props.theme.border};
`;

const BaseModelTag = styled.span`
  font-size: 0.75rem;
  padding: 4px 10px;
  background: ${props => props.theme.inputBackground || props.theme.background};
  border: 1px solid ${props => props.theme.border};
  border-radius: 6px;
  color: ${props => props.theme.textSecondary || `${props.theme.text}80`};
  max-width: 180px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CardActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ToggleSwitch = styled.button`
  position: relative;
  width: 44px;
  height: 24px;
  border-radius: 12px;
  border: none;
  background: ${props => props.$enabled
    ? (props.theme.accentBackground || props.theme.primary)
    : props.theme.border};
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${props => props.$enabled ? '22px' : '2px'};
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #fff;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }

  &:hover {
    opacity: 0.9;
  }
`;

const IconButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: ${props => props.theme.textSecondary || `${props.theme.text}80`};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.hover || props.theme.inputBackground};
    color: ${props => props.theme.text};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

// ============================================================================
// EMPTY STATE
// ============================================================================

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  text-align: center;
  animation: ${fadeIn} 0.5s ease-out;
`;

const EmptyIcon = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 32px;
  background: ${props => props.theme.accentSurface || `${props.theme.primary}15`};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  animation: ${float} 3s ease-in-out infinite;

  svg {
    width: 56px;
    height: 56px;
    color: ${props => props.theme.accentColor || props.theme.primary};
  }
`;

const EmptyTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 12px;
  letter-spacing: -0.02em;
`;

const EmptyDescription = styled.p`
  font-size: 0.9375rem;
  color: ${props => props.theme.textSecondary || `${props.theme.text}80`};
  margin: 0 0 32px;
  max-width: 420px;
  line-height: 1.6;
`;

// ============================================================================
// SLIDE-IN PANEL
// ============================================================================

const PanelOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 1000;
  opacity: ${props => props.$visible ? 1 : 0};
  pointer-events: ${props => props.$visible ? 'auto' : 'none'};
  transition: opacity 0.3s ease;
`;

const EditPanel = styled.aside`
  position: fixed;
  top: 0;
  right: 0;
  width: 520px;
  max-width: 100%;
  height: 100vh;
  background: ${props => props.theme.sidebar};
  border-left: 1px solid ${props => props.theme.border};
  z-index: 1001;
  display: flex;
  flex-direction: column;
  transform: translateX(${props => props.$visible ? '0' : '100%'});
  transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
  box-shadow: -20px 0 60px ${props => props.theme.shadow || 'rgba(0,0,0,0.2)'};
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid ${props => props.theme.border};
  flex-shrink: 0;
`;

const PanelTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  letter-spacing: -0.02em;
`;

const CloseButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: none;
  background: ${props => props.theme.hover || props.theme.inputBackground};
  color: ${props => props.theme.text};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.border};
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const PanelContent = styled.div`
  flex: 1;
  padding: 24px;
  overflow-y: auto;
`;

const PanelFooter = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 20px 24px;
  border-top: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.inputBackground || props.theme.background};
  flex-shrink: 0;
`;

// ============================================================================
// FORM ELEMENTS
// ============================================================================

const FormGroup = styled.div`
  margin-bottom: 24px;
`;

const Label = styled.label`
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: ${props => props.theme.textSecondary || `${props.theme.text}80`};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 10px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  background: ${props => props.theme.inputBackground || props.theme.background};
  border: 1px solid ${props => props.theme.border};
  border-radius: 10px;
  color: ${props => props.theme.text};
  font-size: 0.9375rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.accentColor || props.theme.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.accentSurface || `${props.theme.primary}15`};
  }

  &::placeholder {
    color: ${props => props.theme.textSecondary || `${props.theme.text}60`};
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  background: ${props => props.theme.inputBackground || props.theme.background};
  border: 1px solid ${props => props.theme.border};
  border-radius: 10px;
  color: ${props => props.theme.text};
  font-size: 0.9375rem;
  resize: vertical;
  min-height: 100px;
  transition: all 0.2s ease;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.accentColor || props.theme.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.accentSurface || `${props.theme.primary}15`};
  }

  &::placeholder {
    color: ${props => props.theme.textSecondary || `${props.theme.text}60`};
  }
`;

const SystemPromptArea = styled(TextArea)`
  min-height: 160px;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
`;

const Select = styled.select`
  width: 100%;
  padding: 12px 16px;
  background: ${props => props.theme.inputBackground || props.theme.background};
  border: 1px solid ${props => props.theme.border};
  border-radius: 10px;
  color: ${props => props.theme.text};
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.accentColor || props.theme.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.accentSurface || `${props.theme.primary}15`};
  }

  option {
    background: ${props => props.theme.sidebar};
    color: ${props => props.theme.text};
  }
`;

const HelperText = styled.p`
  font-size: 0.8125rem;
  color: ${props => props.theme.textSecondary || `${props.theme.text}60`};
  margin: 8px 0 0;
  line-height: 1.5;
`;

// ============================================================================
// AVATAR PICKER
// ============================================================================

const AvatarSection = styled.div`
  margin-bottom: 24px;
`;

const AvatarPreview = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
`;

const LargeAvatar = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: ${props => props.$bgColor || props.theme.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  color: #fff;
  overflow: hidden;
  box-shadow: 0 4px 16px ${props => props.$bgColor || props.theme.primary}40;
  transition: all 0.3s ease;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const AvatarActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const UploadButton = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: ${props => props.theme.inputBackground || props.theme.background};
  border: 1px solid ${props => props.theme.border};
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: ${props => props.theme.text};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.hover || props.theme.inputBackground};
    border-color: ${props => props.theme.accentColor || props.theme.primary};
  }

  input {
    display: none;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const RemoveImageButton = styled.button`
  padding: 6px 12px;
  background: transparent;
  border: none;
  font-size: 0.75rem;
  color: ${props => props.theme.textSecondary || `${props.theme.text}60`};
  cursor: pointer;
  transition: color 0.2s ease;

  &:hover {
    color: #e53935;
  }
`;

const EmojiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8px;
`;

const EmojiButton = styled.button`
  width: 44px;
  height: 44px;
  border-radius: 10px;
  border: 2px solid ${props => props.$selected
    ? (props.theme.accentColor || props.theme.primary)
    : 'transparent'};
  background: ${props => props.$selected
    ? (props.theme.accentSurface || `${props.theme.primary}15`)
    : (props.theme.inputBackground || props.theme.background)};
  cursor: pointer;
  font-size: 1.25rem;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.hover || props.theme.inputBackground};
    transform: scale(1.1);
  }
`;

// ============================================================================
// BUTTONS
// ============================================================================

const Button = styled.button`
  padding: 12px 24px;
  border-radius: 10px;
  border: none;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
`;

const PrimaryButton = styled(Button)`
  background: ${props => props.theme.accentBackground || props.theme.primary};
  color: ${props => props.theme.accentText || '#fff'};

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px ${props => props.theme.accentColor || props.theme.primary}40;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const SecondaryButton = styled(Button)`
  background: ${props => props.theme.inputBackground || props.theme.background};
  color: ${props => props.theme.text};
  border: 1px solid ${props => props.theme.border};

  &:hover {
    background: ${props => props.theme.hover || props.theme.inputBackground};
  }
`;

const DeleteButton = styled(Button)`
  background: transparent;
  color: #e53935;
  padding: 12px 16px;

  &:hover {
    background: rgba(229, 57, 53, 0.1);
  }
`;

// ============================================================================
// COMPONENT
// ============================================================================

const WorkspacePage = ({ collapsed }) => {
  const { t } = useTranslation();
  const [models, setModels] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredModels, setFilteredModels] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [panelVisible, setPanelVisible] = useState(false);
  const [editingModel, setEditingModel] = useState(null);
  const [availableBaseModels, setAvailableBaseModels] = useState([]);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    avatar: '🤖',
    avatarImage: null,
    systemPrompt: '',
    baseModel: '',
    avatarColor: ''
  });

  const avatarOptions = ['🤖', '✍️', '🎨', '💡', '🔬', '📚', '🎭', '🎯', '🚀', '💻', '🎵', '🏥', '🧠', '⚡', '🌟', '🔮'];

  const filters = [
    { id: 'all', label: 'All Models' },
    { id: 'enabled', label: 'Enabled' },
    { id: 'disabled', label: 'Disabled' },
  ];

  // Load available base models
  useEffect(() => {
    const loadBaseModels = async () => {
      try {
        const { fetchModelsFromBackend } = await import('../services/aiService');
        const backendModels = await fetchModelsFromBackend();

        if (backendModels && backendModels.length > 0) {
          setAvailableBaseModels(backendModels);
          if (!formData.baseModel) {
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
      const modelsWithBaseModel = parsedModels.map(model => ({
        ...model,
        baseModel: model.baseModel || (availableBaseModels.length > 0 ? availableBaseModels[0].id : 'gpt-3.5-turbo')
      }));
      setModels(modelsWithBaseModel);
      setFilteredModels(modelsWithBaseModel);
      if (parsedModels.some(m => !m.baseModel)) {
        localStorage.setItem('customModels', JSON.stringify(modelsWithBaseModel));
      }
    }
  }, [availableBaseModels]);

  // Filter models based on search and filter
  useEffect(() => {
    let filtered = models;

    if (searchQuery.trim()) {
      filtered = filtered.filter(model =>
        model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeFilter === 'enabled') {
      filtered = filtered.filter(model => model.enabled);
    } else if (activeFilter === 'disabled') {
      filtered = filtered.filter(model => !model.enabled);
    }

    setFilteredModels(filtered);
  }, [searchQuery, models, activeFilter]);

  const getRandomColor = () => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B500', '#6C5CE7', '#00B894', '#E17055', '#81ECEC', '#A29BFE'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const toggleModel = (e, modelId) => {
    e.stopPropagation();
    const updatedModels = models.map(model =>
      model.id === modelId ? { ...model, enabled: !model.enabled } : model
    );
    setModels(updatedModels);
    localStorage.setItem('customModels', JSON.stringify(updatedModels));

    window.dispatchEvent(new StorageEvent('storage', {
      key: 'customModels',
      newValue: JSON.stringify(updatedModels),
      url: window.location.href
    }));
  };

  const handleNewModel = () => {
    setEditingModel(null);
    setFormData({
      name: '',
      description: '',
      avatar: '🤖',
      avatarImage: null,
      systemPrompt: '',
      baseModel: availableBaseModels.length > 0 ? availableBaseModels[0].id : '',
      avatarColor: getRandomColor()
    });
    setPanelVisible(true);
  };

  const handleEditModel = (model) => {
    setEditingModel(model);
    setFormData({
      name: model.name,
      description: model.description,
      avatar: model.avatar || '🤖',
      avatarImage: model.avatarImage || null,
      systemPrompt: model.systemPrompt || '',
      baseModel: model.baseModel || (availableBaseModels.length > 0 ? availableBaseModels[0].id : ''),
      avatarColor: model.avatarColor || getRandomColor()
    });
    setPanelVisible(true);
  };

  const handleClosePanel = () => {
    setPanelVisible(false);
    setTimeout(() => {
      setEditingModel(null);
    }, 300);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({
          ...prev,
          avatarImage: event.target.result,
          avatar: '' // Clear emoji when image is set
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      avatarImage: null,
      avatar: '🤖'
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteModel = () => {
    if (!editingModel) return;

    const updatedModels = models.filter(model => model.id !== editingModel.id);
    setModels(updatedModels);
    localStorage.setItem('customModels', JSON.stringify(updatedModels));
    handleClosePanel();

    window.dispatchEvent(new StorageEvent('storage', {
      key: 'customModels',
      newValue: JSON.stringify(updatedModels),
      url: window.location.href
    }));
  };

  const handleSaveModel = () => {
    if (!formData.name || !formData.systemPrompt) {
      return;
    }

    if (!formData.baseModel) {
      return;
    }

    let updatedModels;
    if (editingModel) {
      updatedModels = models.map(model =>
        model.id === editingModel.id
          ? { ...model, ...formData }
          : model
      );
    } else {
      const newModel = {
        id: Date.now(),
        ...formData,
        author: 'You',
        enabled: false,
        avatarColor: formData.avatarColor || getRandomColor()
      };
      updatedModels = [...models, newModel];
    }

    setModels(updatedModels);
    localStorage.setItem('customModels', JSON.stringify(updatedModels));
    handleClosePanel();

    window.dispatchEvent(new StorageEvent('storage', {
      key: 'customModels',
      newValue: JSON.stringify(updatedModels),
      url: window.location.href
    }));
  };

  return (
    <PageContainer $collapsed={collapsed}>
      <ContentWrapper>
        <Header>
          <TitleSection>
            <PageTitle>
              {t('workspace.title')}
              <ModelCount>{models.length}</ModelCount>
            </PageTitle>
            <Subtitle>Create custom AI personalities with unique system prompts</Subtitle>
          </TitleSection>

          <HeaderActions>
            <SearchContainer>
              <SearchIcon xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </SearchIcon>
              <SearchInput
                type="text"
                placeholder={t('workspace.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </SearchContainer>

            <CreateButton onClick={handleNewModel}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              {t('workspace.button.newModel')}
            </CreateButton>
          </HeaderActions>
        </Header>

        <FilterContainer>
          {filters.map(filter => (
            <FilterTab
              key={filter.id}
              $active={activeFilter === filter.id}
              onClick={() => setActiveFilter(filter.id)}
            >
              {filter.label}
            </FilterTab>
          ))}
        </FilterContainer>

        {filteredModels.length === 0 ? (
          <EmptyState>
            <EmptyIcon>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="8" r="5"/>
                <path d="M20 21a8 8 0 0 0-16 0"/>
                <path d="M12 13v4"/>
                <path d="M10 15h4"/>
              </svg>
            </EmptyIcon>
            <EmptyTitle>No custom models yet</EmptyTitle>
            <EmptyDescription>
              Create your first custom AI model with a unique personality, specialized knowledge, and custom instructions.
            </EmptyDescription>
            <CreateButton onClick={handleNewModel}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Create Your First Model
            </CreateButton>
          </EmptyState>
        ) : (
          <ModelsGrid>
            {filteredModels.map((model, index) => {
              const baseModelInfo = availableBaseModels.find(m => m.id === model.baseModel);
              const baseModelName = baseModelInfo
                ? `${baseModelInfo.name}`
                : (model.baseModel || t('workspace.baseModelFallback'));

              return (
                <ModelCard
                  key={model.id}
                  $index={index}
                  $enabled={model.enabled}
                  onClick={() => handleEditModel(model)}
                >
                  <CardHeader>
                    <ModelAvatar $bgColor={model.avatarColor || getRandomColor()}>
                      {model.avatarImage ? (
                        <img src={model.avatarImage} alt={model.name} />
                      ) : (
                        model.avatar || model.name.charAt(0).toUpperCase()
                      )}
                    </ModelAvatar>
                    <ModelInfo>
                      <ModelName>{model.name}</ModelName>
                      <ModelDescription>{model.description || 'No description'}</ModelDescription>
                    </ModelInfo>
                  </CardHeader>

                  <CardFooter>
                    <BaseModelTag title={baseModelName}>
                      {baseModelName}
                    </BaseModelTag>
                    <CardActions>
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditModel(model);
                        }}
                        title={t('workspace.actions.edit')}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </IconButton>
                      <ToggleSwitch
                        $enabled={model.enabled}
                        onClick={(e) => toggleModel(e, model.id)}
                        title={model.enabled ? 'Disable model' : 'Enable model'}
                      />
                    </CardActions>
                  </CardFooter>
                </ModelCard>
              );
            })}
          </ModelsGrid>
        )}
      </ContentWrapper>

      {/* Edit/Create Panel */}
      <PanelOverlay $visible={panelVisible} onClick={handleClosePanel} />
      <EditPanel $visible={panelVisible}>
        <PanelHeader>
          <PanelTitle>
            {editingModel ? t('workspace.modal.titleEdit') : t('workspace.modal.titleCreate')}
          </PanelTitle>
          <CloseButton onClick={handleClosePanel}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </CloseButton>
        </PanelHeader>

        <PanelContent>
          <AvatarSection>
            <Label>{t('workspace.modal.fieldAvatar')}</Label>
            <AvatarPreview>
              <LargeAvatar $bgColor={formData.avatarColor}>
                {formData.avatarImage ? (
                  <img src={formData.avatarImage} alt="Avatar preview" />
                ) : (
                  formData.avatar || '🤖'
                )}
              </LargeAvatar>
              <AvatarActions>
                <UploadButton>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  Upload Image
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </UploadButton>
                {formData.avatarImage && (
                  <RemoveImageButton onClick={handleRemoveImage}>
                    Remove image
                  </RemoveImageButton>
                )}
              </AvatarActions>
            </AvatarPreview>

            {!formData.avatarImage && (
              <EmojiGrid>
                {avatarOptions.map(emoji => (
                  <EmojiButton
                    key={emoji}
                    $selected={formData.avatar === emoji}
                    onClick={() => setFormData(prev => ({ ...prev, avatar: emoji }))}
                    type="button"
                  >
                    {emoji}
                  </EmojiButton>
                ))}
              </EmojiGrid>
            )}
          </AvatarSection>

          <FormGroup>
            <Label>{t('workspace.modal.fieldName')}</Label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={t('workspace.modal.placeholderExamples')}
            />
          </FormGroup>

          <FormGroup>
            <Label>{t('workspace.modal.fieldDescription')}</Label>
            <TextArea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={t('workspace.modal.placeholderDescription')}
            />
          </FormGroup>

          <FormGroup>
            <Label>{t('workspace.modal.fieldBaseModel')}</Label>
            <Select
              value={formData.baseModel}
              onChange={(e) => setFormData(prev => ({ ...prev, baseModel: e.target.value }))}
            >
              {availableBaseModels.length > 0 ? (
                availableBaseModels.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name} ({model.provider})
                  </option>
                ))
              ) : (
                <option value="">{t('workspace.modal.status.loadingModels')}</option>
              )}
            </Select>
            <HelperText>{t('workspace.modal.helperBaseModel')}</HelperText>
          </FormGroup>

          <FormGroup>
            <Label>{t('workspace.modal.fieldSystemPrompt')}</Label>
            <SystemPromptArea
              value={formData.systemPrompt}
              onChange={(e) => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
              placeholder={t('workspace.modal.placeholderSystemPrompt')}
            />
          </FormGroup>
        </PanelContent>

        <PanelFooter>
          {editingModel ? (
            <DeleteButton onClick={handleDeleteModel}>
              {t('workspace.modal.button.delete')}
            </DeleteButton>
          ) : (
            <div />
          )}
          <div style={{ display: 'flex', gap: '12px' }}>
            <SecondaryButton onClick={handleClosePanel}>
              {t('workspace.modal.button.cancel')}
            </SecondaryButton>
            <PrimaryButton
              onClick={handleSaveModel}
              disabled={!formData.name || !formData.systemPrompt || !formData.baseModel}
            >
              {editingModel ? t('workspace.modal.button.save') : t('workspace.modal.button.create')}
            </PrimaryButton>
          </div>
        </PanelFooter>
      </EditPanel>
    </PageContainer>
  );
};

export default WorkspacePage;

import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { useTranslation } from '../contexts/TranslationContext';
import { DEFAULT_CUSTOM_BASE_MODEL_ID, getPreferredModelId } from '../config/modelConfig';
import {
  copyToClipboard,
  createSharedModel,
  getSharedModelUrl,
  isShareChatAvailable
} from '../services/shareService';
import { safeAvatarImageSrc } from '../utils/avatarImage';

// ============================================================================
// ANIMATIONS
// ============================================================================

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const scaleIn = keyframes`
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const toastIn = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

// ============================================================================
// LAYOUT
// ============================================================================

const PageContainer = styled.div`
  flex: 1;
  min-height: 100vh;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  color: ${props => props.theme.text};
  overflow-y: auto;
  overflow-x: hidden;
  padding-left: ${props => (props.$collapsed ? '0' : '280px')};
  transition: padding-left 0.42s cubic-bezier(0.22, 1, 0.36, 1);

  @media (max-width: 1024px) {
    padding-left: 0;
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

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 40px;
  gap: 24px;
  animation: ${fadeIn} 0.5s ease-out;

  @media (max-width: 640px) {
    flex-direction: column;
    gap: 20px;
  }
`;

const TitleSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Title = styled.h1`
  font-size: 2.25rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin: 0;

  @media (max-width: 640px) {
    font-size: 1.875rem;
  }
`;

const Subtitle = styled.p`
  font-size: 0.9375rem;
  color: ${props => props.theme.textSecondary || `${props.theme.text}80`};
  margin: 0;
  letter-spacing: -0.01em;
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
// SEARCH + FILTERS
// ============================================================================

const SearchAndFilters = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
  animation: ${slideUp} 0.5s ease-out;
  animation-delay: 0.1s;
  animation-fill-mode: backwards;

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

const SearchIcon = styled.div`
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme.textSecondary || `${props.theme.text}60`};
  pointer-events: none;
  display: flex;
  align-items: center;

  svg {
    width: 16px;
    height: 16px;
  }
`;

const FilterTabs = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const FilterTab = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
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

const FilterCount = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  opacity: 0.75;
`;

// ============================================================================
// MODEL GRID
// ============================================================================

const ModelsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;

  @media (max-width: 480px) {
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
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 180px;
  animation: ${scaleIn} 0.4s ease-out;
  animation-delay: ${props => (props.$index || 0) * 0.04}s;
  animation-fill-mode: backwards;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px ${props => props.theme.shadow || 'rgba(0,0,0,0.15)'};
    border-color: ${props => props.theme.accentColor || props.theme.primary}40;
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 14px;
`;

const ModelAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${props => props.theme.accentSurface || `${props.theme.primary}15`};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1.5rem;
  overflow: hidden;
  color: ${props => props.theme.text};

  img { width: 100%; height: 100%; object-fit: cover; }
`;

const ModelInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ModelNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
`;

const ModelName = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  letter-spacing: -0.02em;
  color: ${props => props.theme.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StatusDot = styled.span`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${props => props.$enabled ? (props.theme.accentColor || props.theme.primary) : 'transparent'};
  border: 1px solid ${props => props.$enabled ? 'transparent' : (props.theme.textSecondary || `${props.theme.text}50`)};
  flex-shrink: 0;
  ${props => props.$enabled && `box-shadow: 0 0 0 3px ${props.theme.accentSurface || `${props.theme.primary}20`};`}
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
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid ${props => props.theme.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const BaseModelTag = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8125rem;
  color: ${props => props.theme.textSecondary || `${props.theme.text}60`};
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  svg {
    width: 14px;
    height: 14px;
    opacity: 0.7;
    flex-shrink: 0;
  }
`;

const CardActions = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ToggleSwitch = styled.button`
  position: relative;
  width: 32px;
  height: 18px;
  border-radius: 10px;
  border: 1px solid ${props => props.$enabled
    ? (props.theme.accentColor || props.theme.primary)
    : props.theme.border};
  background: ${props => props.$enabled
    ? (props.theme.accentColor || props.theme.primary)
    : 'transparent'};
  cursor: pointer;
  transition: all 0.18s ease;
  padding: 0;
  flex-shrink: 0;

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${props => props.$enabled ? '15px' : '2px'};
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: ${props => props.$enabled ? '#fff' : (props.theme.textSecondary || `${props.theme.text}55`)};
    transition: all 0.18s ease;
  }
`;

const IconButton = styled.button`
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.inputBackground || 'transparent'};
  color: ${props => props.theme.textSecondary || `${props.theme.text}80`};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: ${props => props.theme.hover || 'rgba(128,128,128,0.08)'};
    color: ${props => props.theme.text};
    border-color: ${props => props.theme.border};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:disabled svg {
    animation: ${spin} 1s linear infinite;
  }

  svg { width: 14px; height: 14px; }
`;

const ShareToast = styled.div`
  position: fixed;
  bottom: 32px;
  right: 32px;
  z-index: 1100;
  padding: 12px 18px;
  border-radius: 12px;
  background: ${props => props.theme.sidebar};
  color: ${props => props.theme.text};
  border: 1px solid ${props => props.theme.border};
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.18);
  font-size: 0.875rem;
  font-weight: 500;
  animation: ${toastIn} 0.2s ease-out;
  max-width: min(360px, calc(100vw - 64px));
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
// MODAL
// ============================================================================

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  opacity: ${props => (props.$visible ? 1 : 0)};
  pointer-events: ${props => (props.$visible ? 'auto' : 'none')};
  transition: opacity 0.2s ease;

  @media (max-width: 640px) {
    padding: 0;
    align-items: flex-end;
  }
`;

const ModalDialog = styled.div`
  position: relative;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  background: ${props => props.theme.sidebar};
  border: 1px solid ${props => props.theme.border};
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  transform: ${props => (props.$visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.98)')};
  opacity: ${props => (props.$visible ? 1 : 0)};
  transition: all 0.25s ease;

  @media (max-width: 640px) {
    max-width: 100%;
    max-height: 92vh;
    border-radius: 16px 16px 0 0;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px 28px 20px;
  border-bottom: 1px solid ${props => props.theme.border};
  gap: 16px;
`;

const ModalTitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  letter-spacing: -0.02em;
  color: ${props => props.theme.text};
`;

const ModalSubtitle = styled.p`
  font-size: 0.9rem;
  color: ${props => props.theme.textSecondary || `${props.theme.text}70`};
  margin: 0;
  line-height: 1.5;
`;

const CloseButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  color: ${props => props.theme.textSecondary || `${props.theme.text}80`};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  flex-shrink: 0;

  &:hover {
    background: ${props => props.theme.hover || 'rgba(128,128,128,0.08)'};
    color: ${props => props.theme.text};
  }

  svg { width: 16px; height: 16px; }
`;

const ModalContent = styled.div`
  flex: 1;
  padding: 24px 28px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.border};
    border-radius: 3px;
  }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 28px;
  border-top: 1px solid ${props => props.theme.border};
  flex-shrink: 0;
  gap: 12px;
`;

// ============================================================================
// FORM
// ============================================================================

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.theme.text};
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 14px;
  background: ${props => props.theme.inputBackground};
  border: 1px solid ${props => props.theme.border};
  border-radius: 10px;
  color: ${props => props.theme.text};
  font-size: 0.95rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.accentColor || props.theme.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.accentSurface || `${props.theme.primary}20`};
  }

  &::placeholder {
    color: ${props => props.theme.textSecondary || `${props.theme.text}50`};
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px 14px;
  background: ${props => props.theme.inputBackground};
  border: 1px solid ${props => props.theme.border};
  border-radius: 10px;
  color: ${props => props.theme.text};
  font-size: 0.95rem;
  resize: vertical;
  min-height: 80px;
  line-height: 1.5;
  transition: all 0.2s ease;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.accentColor || props.theme.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.accentSurface || `${props.theme.primary}20`};
  }

  &::placeholder {
    color: ${props => props.theme.textSecondary || `${props.theme.text}50`};
  }
`;

const SystemPromptArea = styled(TextArea)`
  min-height: 160px;
  font-size: 0.9rem;
  line-height: 1.6;
`;

const Select = styled.select`
  width: 100%;
  padding: 12px 36px 12px 14px;
  background: ${props => props.theme.inputBackground};
  border: 1px solid ${props => props.theme.border};
  border-radius: 10px;
  color: ${props => props.theme.text};
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.accentColor || props.theme.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.accentSurface || `${props.theme.primary}20`};
  }

  option {
    background: ${props => props.theme.sidebar || props.theme.chat};
    color: ${props => props.theme.text};
  }
`;

// ============================================================================
// AVATAR PICKER
// ============================================================================

const AvatarSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 24px;
  border-bottom: 1px solid ${props => props.theme.border};
`;

const AvatarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const LargeAvatar = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 14px;
  background: ${props => props.theme.accentSurface || `${props.theme.primary}15`};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.875rem;
  overflow: hidden;
  color: ${props => props.theme.text};
  flex-shrink: 0;

  img { width: 100%; height: 100%; object-fit: cover; }
`;

const AvatarControls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
`;

const AvatarButtonRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
`;

const UploadButton = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: ${props => props.theme.inputBackground};
  border: 1px solid ${props => props.theme.border};
  border-radius: 10px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: ${props => props.theme.text};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${props => props.theme.hover || 'rgba(128,128,128,0.08)'};
    border-color: ${props => props.theme.accentColor || props.theme.primary};
  }

  input { display: none; }
  svg { width: 13px; height: 13px; }
`;

const RemoveImageButton = styled.button`
  padding: 8px 14px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 10px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: ${props => props.theme.textSecondary || `${props.theme.text}70`};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    color: #dc3545;
    background: rgba(220, 53, 69, 0.08);
  }
`;

const EmojiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 6px;
`;

const EmojiButton = styled.button`
  aspect-ratio: 1;
  border-radius: 10px;
  border: 2px solid ${props => props.$selected
    ? (props.theme.accentColor || props.theme.primary)
    : props.theme.border};
  background: ${props => props.$selected
    ? (props.theme.accentSurface || `${props.theme.primary}15`)
    : props.theme.inputBackground};
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.15s ease;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    border-color: ${props => props.theme.accentColor || props.theme.primary};
    transform: scale(1.05);
  }
`;

// ============================================================================
// BUTTONS
// ============================================================================

const Button = styled.button`
  padding: 10px 18px;
  border-radius: 10px;
  border: 1px solid transparent;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
`;

const PrimaryButton = styled(Button)`
  background: ${props => props.theme.accentBackground || props.theme.primary};
  color: ${props => props.theme.accentText || '#fff'};
  font-weight: 600;
  border-color: transparent;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px ${props => props.theme.accentColor || props.theme.primary}40;
  }
  &:active { transform: translateY(0); }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const SecondaryButton = styled(Button)`
  background: transparent;
  color: ${props => props.theme.text};
  border-color: ${props => props.theme.border};

  &:hover {
    background: ${props => props.theme.hover || 'rgba(128,128,128,0.08)'};
    border-color: ${props => props.theme.textSecondary || `${props.theme.text}50`};
  }
`;

const DeleteButton = styled(Button)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  color: ${props => props.theme.textSecondary || `${props.theme.text}70`};
  border-color: transparent;

  &:hover {
    color: #dc3545;
    background: rgba(220, 53, 69, 0.08);
  }

  svg { width: 14px; height: 14px; }
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
  const [shareStatus, setShareStatus] = useState('');
  const [sharingModelId, setSharingModelId] = useState(null);
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

  const enabledCount = models.filter(m => m.enabled).length;
  const disabledCount = models.length - enabledCount;

  const filters = [
    { id: 'all', label: t('workspace.filter.all', 'All'), count: models.length },
    { id: 'enabled', label: t('workspace.filter.enabled', 'Enabled'), count: enabledCount },
    { id: 'disabled', label: t('workspace.filter.disabled', 'Disabled'), count: disabledCount },
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
            setFormData(prev => ({ ...prev, baseModel: getPreferredModelId(backendModels, DEFAULT_CUSTOM_BASE_MODEL_ID) }));
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
        baseModel: model.baseModel || getPreferredModelId(availableBaseModels, DEFAULT_CUSTOM_BASE_MODEL_ID)
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

  const flashShareStatus = (message) => {
    setShareStatus(message);
    setTimeout(() => setShareStatus(''), 3000);
  };

  const handleShareModel = async (e, model) => {
    e.stopPropagation();

    if (!isShareChatAvailable()) {
      flashShareStatus(t('workspace.share.signInRequired', 'Sign in to share models.'));
      return;
    }

    if (sharingModelId) return;

    const confirmed = window.confirm(
      t(
        'workspace.share.confirm',
        'Share this model? Anyone with the link can preview the system prompt and copy this model into their own workspace.'
      )
    );
    if (!confirmed) return;

    setSharingModelId(model.id);

    let shareUrl;
    try {
      const payload = {
        name: model.name,
        description: model.description || '',
        avatar: model.avatar || '🤖',
        avatarImage: model.avatarImage || null,
        avatarColor: model.avatarColor || '',
        systemPrompt: model.systemPrompt || '',
        baseModel: model.baseModel || '',
        author: model.author || ''
      };
      const result = await createSharedModel(payload);
      shareUrl = getSharedModelUrl(result);
    } catch (shareError) {
      console.error('Failed to create model share link:', shareError);
      flashShareStatus(t('workspace.share.failure', 'Could not create share link.'));
      setSharingModelId(null);
      return;
    }

    const copied = await copyToClipboard(shareUrl);
    if (copied) {
      flashShareStatus(t('workspace.share.success', 'Share link copied to clipboard.'));
    } else {
      window.prompt(t('workspace.share.copyManual', 'Copy this share link:'), shareUrl);
      flashShareStatus(t('workspace.share.copyFailure', 'Could not auto-copy — link shown above.'));
    }

    setSharingModelId(null);
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
      avatarColor: ''
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
      avatarColor: model.avatarColor || ''
    });
    setPanelVisible(true);
  };

  const handleClosePanel = () => {
    setPanelVisible(false);
    setTimeout(() => {
      setEditingModel(null);
    }, 250);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a JPEG or PNG image file.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Image size should be less than 2MB.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageSource = event.target?.result;
      if (typeof imageSource !== 'string') {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      const img = new Image();
      img.onload = () => {
        const maxSize = 200;
        let width = img.width;
        let height = img.height;

        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height / width) * maxSize);
            width = maxSize;
          } else {
            width = Math.round((width / height) * maxSize);
            height = maxSize;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.error('Unable to obtain 2D canvas context for avatar image resizing.');
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const resizedDataUrl = file.type === 'image/png'
          ? canvas.toDataURL('image/png')
          : canvas.toDataURL('image/jpeg', 0.85);

        setFormData(prev => ({
          ...prev,
          avatarImage: resizedDataUrl,
          avatar: '' // Clear emoji when image is set
        }));
      };

      img.onerror = () => {
        alert('Invalid or corrupted image file. Please choose another image.');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };

      img.src = imageSource;
    };

    reader.readAsDataURL(file);
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
            <Title>{t('workspace.title')}</Title>
            <Subtitle>
              {t('workspace.subtitle', 'Private models shaped by your own system prompts and base configuration.')}
            </Subtitle>
          </TitleSection>
          <CreateButton onClick={handleNewModel}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {t('workspace.button.newModel')}
          </CreateButton>
        </Header>

        <SearchAndFilters>
          <SearchWrapper>
            <SearchIcon>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </SearchIcon>
            <SearchInput
              type="text"
              placeholder={t('workspace.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SearchWrapper>
          <FilterTabs>
            {filters.map(filter => (
              <FilterTab
                key={filter.id}
                $active={activeFilter === filter.id}
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.label}
                <FilterCount>{filter.count}</FilterCount>
              </FilterTab>
            ))}
          </FilterTabs>
        </SearchAndFilters>

        {filteredModels.length === 0 ? (
          <EmptyState>
            <EmptyIcon>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="9" cy="10" r="1.5" />
                <circle cx="15" cy="10" r="1.5" />
                <path d="M8 15c1.333 1 2.667 1.5 4 1.5s2.667-.5 4-1.5" />
              </svg>
            </EmptyIcon>
            <EmptyTitle>
              {models.length === 0
                ? t('workspace.empty.title', 'Create your first model')
                : t('workspace.empty.noResults', 'No models match')}
            </EmptyTitle>
            <EmptyDescription>
              {models.length === 0
                ? t('workspace.empty.description', 'Configure a custom AI with its own instructions, persona, and base model.')
                : t('workspace.empty.tryAdjusting', 'Try adjusting the filter or search above.')}
            </EmptyDescription>
            {models.length === 0 && (
              <CreateButton onClick={handleNewModel}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                {t('workspace.button.newModel')}
              </CreateButton>
            )}
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
                  onClick={() => handleEditModel(model)}
                >
                  <CardHeader>
                    <ModelAvatar>
                      {(() => {
                        const safeAvatar = safeAvatarImageSrc(model.avatarImage);
                        return safeAvatar
                          ? <img src={safeAvatar} alt={model.name} />
                          : (model.avatar || model.name.charAt(0).toUpperCase());
                      })()}
                    </ModelAvatar>
                    <ModelInfo>
                      <ModelNameRow>
                        <StatusDot $enabled={model.enabled} />
                        <ModelName>{model.name}</ModelName>
                      </ModelNameRow>
                      <ModelDescription>
                        {model.description || t('workspace.noDescription', 'No description')}
                      </ModelDescription>
                    </ModelInfo>
                  </CardHeader>

                  <CardFooter>
                    <BaseModelTag title={baseModelName}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <path d="M2 17l10 5 10-5" />
                        <path d="M2 12l10 5 10-5" />
                      </svg>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{baseModelName}</span>
                    </BaseModelTag>
                    <CardActions>
                      <IconButton
                        onClick={(e) => handleShareModel(e, model)}
                        disabled={sharingModelId === model.id}
                        title={t('workspace.actions.share', 'Share model')}
                      >
                        {sharingModelId === model.id ? (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="2" x2="12" y2="6" />
                            <line x1="12" y1="18" x2="12" y2="22" />
                            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                            <line x1="2" y1="12" x2="6" y2="12" />
                            <line x1="18" y1="12" x2="22" y2="12" />
                            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="18" cy="5" r="3" />
                            <circle cx="6" cy="12" r="3" />
                            <circle cx="18" cy="19" r="3" />
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                          </svg>
                        )}
                      </IconButton>
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditModel(model);
                        }}
                        title={t('workspace.actions.edit')}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
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

      {shareStatus && <ShareToast role="status">{shareStatus}</ShareToast>}

      {/* Edit/Create Modal */}
      <ModalOverlay $visible={panelVisible} onClick={handleClosePanel}>
        <ModalDialog $visible={panelVisible} onClick={e => e.stopPropagation()}>
          <ModalHeader>
            <ModalTitleGroup>
              <ModalTitle>
                {editingModel ? t('workspace.modal.titleEdit') : t('workspace.modal.titleCreate')}
              </ModalTitle>
              <ModalSubtitle>
                {editingModel
                  ? t('workspace.modal.subtitleEdit', `Editing "${editingModel.name}"`)
                  : t('workspace.modal.subtitleCreate', 'Configure a new AI personality with custom instructions')}
              </ModalSubtitle>
            </ModalTitleGroup>
            <CloseButton onClick={handleClosePanel}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </CloseButton>
          </ModalHeader>

          <ModalContent>
            <AvatarSection>
              <AvatarRow>
                <LargeAvatar>
                  {(() => {
                    const safeAvatar = safeAvatarImageSrc(formData.avatarImage);
                    return safeAvatar
                      ? <img src={safeAvatar} alt="Avatar preview" />
                      : (formData.avatar || '🤖');
                  })()}
                </LargeAvatar>
                <AvatarControls>
                  <Label>{t('workspace.modal.fieldAvatar')}</Label>
                  <AvatarButtonRow>
                    <UploadButton>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      {t('workspace.modal.button.upload', 'Upload')}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={handleImageUpload}
                      />
                    </UploadButton>
                    {formData.avatarImage && (
                      <RemoveImageButton onClick={handleRemoveImage}>
                        {t('workspace.modal.button.remove', 'Remove')}
                      </RemoveImageButton>
                    )}
                  </AvatarButtonRow>
                </AvatarControls>
              </AvatarRow>

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

            <FormRow>
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
              </FormGroup>
            </FormRow>

            <FormGroup>
              <Label>{t('workspace.modal.fieldDescription')}</Label>
              <TextArea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('workspace.modal.placeholderDescription')}
                style={{ minHeight: '80px' }}
              />
            </FormGroup>

            <FormGroup>
              <Label>{t('workspace.modal.fieldSystemPrompt')}</Label>
              <SystemPromptArea
                value={formData.systemPrompt}
                onChange={(e) => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
                placeholder={t('workspace.modal.placeholderSystemPrompt')}
              />
            </FormGroup>
          </ModalContent>

          <ModalFooter>
            {editingModel ? (
              <DeleteButton onClick={handleDeleteModel}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
                {t('workspace.modal.button.delete')}
              </DeleteButton>
            ) : (
              <div />
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
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
          </ModalFooter>
        </ModalDialog>
      </ModalOverlay>
    </PageContainer>
  );
};

export default WorkspacePage;

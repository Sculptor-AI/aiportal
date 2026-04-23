import React, { useState, useEffect, useRef } from 'react';
import styled, { createGlobalStyle, keyframes } from 'styled-components';
import { useTranslation } from '../contexts/TranslationContext';
import { DEFAULT_CUSTOM_BASE_MODEL_ID, getPreferredModelId } from '../config/modelConfig';

// ============================================================================
// TYPOGRAPHY — small dose of flavor layered onto the theme font
// ============================================================================

const WorkspaceFonts = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap');
`;

const MONO = `'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
const DISPLAY = `'Instrument Serif', 'Cormorant Garamond', Georgia, serif`;

// ============================================================================
// MOTION — one page-level settle, nothing cascading
// ============================================================================

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
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
  color: ${p => p.theme.text};
  overflow-y: auto;
  overflow-x: hidden;
  transition: padding-left 0.42s cubic-bezier(0.22, 1, 0.36, 1);
  padding-left: ${p => p.$collapsed ? '0' : '280px'};

  @media (max-width: 1024px) {
    padding-left: 0;
  }
`;

const ContentWrapper = styled.div`
  max-width: 1080px;
  margin: 0 auto;
  padding: 72px 48px 96px;
  animation: ${fadeIn} 0.35s ease-out;

  @media (max-width: 768px) {
    padding: 40px 20px 64px;
  }
`;

// ============================================================================
// HEADER
// ============================================================================

const Eyebrow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;
  font-family: ${MONO};
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: ${p => p.theme.textSecondary || `${p.theme.text}70`};
`;

const EyebrowDot = styled.span`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: ${p => p.theme.accentColor || p.theme.primary};
  display: inline-block;
  box-shadow: 0 0 0 3px ${p => p.theme.accentSurface || `${p.theme.primary}14`};
`;

const TitleRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 14px;
  flex-wrap: wrap;
`;

const PageTitle = styled.h1`
  font-size: 2rem;
  font-weight: 500;
  letter-spacing: -0.028em;
  line-height: 1.05;
  margin: 0;

  @media (max-width: 640px) {
    font-size: 1.625rem;
  }
`;

const TitleCount = styled.span`
  font-family: ${DISPLAY};
  font-style: italic;
  font-weight: 400;
  font-size: 1.75rem;
  letter-spacing: -0.01em;
  color: ${p => p.theme.textSecondary || `${p.theme.text}55`};

  @media (max-width: 640px) {
    font-size: 1.375rem;
  }
`;

const Subtitle = styled.p`
  font-size: 0.9375rem;
  color: ${p => p.theme.textSecondary || `${p.theme.text}75`};
  margin: 10px 0 0;
  max-width: 520px;
  line-height: 1.55;
`;

// ============================================================================
// TOOLBAR — filters left, search + create right
// ============================================================================

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 40px;
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 1px solid ${p => p.theme.border};
  flex-wrap: wrap;
`;

const FilterRow = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
`;

const FilterTab = styled.button`
  position: relative;
  padding: 7px 12px 9px;
  background: transparent;
  border: none;
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: -0.005em;
  color: ${p => p.$active
    ? p.theme.text
    : (p.theme.textSecondary || `${p.theme.text}65`)};
  cursor: pointer;
  transition: color 0.15s ease;

  &:hover { color: ${p => p.theme.text}; }

  &::after {
    content: '';
    position: absolute;
    left: 12px;
    right: 12px;
    bottom: -14px;
    height: 1px;
    background: ${p => p.$active ? (p.theme.accentColor || p.theme.primary) : 'transparent'};
    transition: background 0.15s ease;
  }
`;

const FilterCount = styled.span`
  display: inline-block;
  margin-left: 6px;
  font-family: ${MONO};
  font-size: 10.5px;
  font-weight: 500;
  color: ${p => p.theme.textSecondary || `${p.theme.text}55`};
`;

const ToolbarRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SearchContainer = styled.div`
  position: relative;
  width: 220px;

  @media (max-width: 640px) {
    width: 100%;
    flex: 1;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 7px 10px 7px 30px;
  background: transparent;
  border: 1px solid ${p => p.theme.border};
  border-radius: 6px;
  color: ${p => p.theme.text};
  font-size: 0.8125rem;
  transition: border-color 0.15s ease, background 0.15s ease;

  &:focus {
    outline: none;
    border-color: ${p => p.theme.textSecondary || `${p.theme.text}50`};
    background: ${p => p.theme.inputBackground || 'transparent'};
  }

  &::placeholder {
    color: ${p => p.theme.textSecondary || `${p.theme.text}50`};
  }
`;

const SearchIcon = styled.svg`
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 13px;
  height: 13px;
  color: ${p => p.theme.textSecondary || `${p.theme.text}50`};
  pointer-events: none;
`;

const CreateButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  background: ${p => p.theme.text};
  color: ${p => p.theme.sidebar || '#fff'};
  border: 1px solid ${p => p.theme.text};
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: -0.005em;
  cursor: pointer;
  transition: opacity 0.15s ease;
  white-space: nowrap;

  &:hover { opacity: 0.88; }
  &:active { opacity: 0.75; }

  svg { width: 13px; height: 13px; }
`;

// ============================================================================
// MODEL GRID — hairline seams instead of card shadows
// ============================================================================

const ModelsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1px;
  background: ${p => p.theme.border};
  border: 1px solid ${p => p.theme.border};
  border-radius: 8px;
  overflow: hidden;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const ModelCard = styled.article`
  background: ${p => p.theme.sidebar || p.theme.chat};
  padding: 18px 20px;
  cursor: pointer;
  transition: background 0.15s ease;
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 148px;

  &:hover {
    background: ${p => p.theme.hover || p.theme.inputBackground};
  }
`;

const CardHeader = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
`;

const ModelAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 7px;
  background: ${p => p.theme.inputBackground || `${p.theme.text}08`};
  border: 1px solid ${p => p.theme.border};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1.0625rem;
  overflow: hidden;
  color: ${p => p.theme.text};

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
  margin-bottom: 3px;
`;

const StatusDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${p => p.$enabled ? (p.theme.accentColor || p.theme.primary) : 'transparent'};
  border: 1px solid ${p => p.$enabled ? 'transparent' : p.theme.border};
  flex-shrink: 0;
  ${p => p.$enabled && `box-shadow: 0 0 0 3px ${p.theme.accentSurface || `${p.theme.primary}12`};`}
`;

const ModelName = styled.h3`
  font-size: 0.9375rem;
  font-weight: 600;
  margin: 0;
  letter-spacing: -0.015em;
  color: ${p => p.theme.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ModelDescription = styled.p`
  font-size: 0.8125rem;
  color: ${p => p.theme.textSecondary || `${p.theme.text}70`};
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CardFooter = styled.div`
  margin-top: auto;
  padding-top: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const BaseModelTag = styled.span`
  font-family: ${MONO};
  font-size: 10.5px;
  letter-spacing: -0.003em;
  color: ${p => p.theme.textSecondary || `${p.theme.text}70`};
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CardActions = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
`;

const ToggleSwitch = styled.button`
  position: relative;
  width: 26px;
  height: 15px;
  border-radius: 8px;
  border: 1px solid ${p => p.$enabled
    ? (p.theme.accentColor || p.theme.primary)
    : p.theme.border};
  background: ${p => p.$enabled
    ? (p.theme.accentColor || p.theme.primary)
    : 'transparent'};
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease;
  padding: 0;
  flex-shrink: 0;

  &::after {
    content: '';
    position: absolute;
    top: 1px;
    left: ${p => p.$enabled ? '12px' : '1px'};
    width: 11px;
    height: 11px;
    border-radius: 50%;
    background: ${p => p.$enabled ? '#fff' : (p.theme.textSecondary || `${p.theme.text}55`)};
    transition: left 0.18s ease, background 0.18s ease;
  }
`;

const IconButton = styled.button`
  width: 26px;
  height: 26px;
  border-radius: 5px;
  border: none;
  background: transparent;
  color: ${p => p.theme.textSecondary || `${p.theme.text}65`};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    background: ${p => p.theme.inputBackground || `${p.theme.text}08`};
    color: ${p => p.theme.text};
  }

  svg { width: 13px; height: 13px; }
`;

// ============================================================================
// EMPTY STATE
// ============================================================================

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 84px 32px;
  text-align: center;
  border: 1px dashed ${p => p.theme.border};
  border-radius: 10px;
`;

const EmptyMark = styled.div`
  font-family: ${DISPLAY};
  font-style: italic;
  font-size: 2.5rem;
  font-weight: 400;
  line-height: 1;
  color: ${p => p.theme.textSecondary || `${p.theme.text}35`};
  margin-bottom: 12px;
  letter-spacing: -0.02em;
`;

const EmptyTitle = styled.h2`
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 6px;
  letter-spacing: -0.015em;
  color: ${p => p.theme.text};
`;

const EmptyDescription = styled.p`
  font-size: 0.875rem;
  color: ${p => p.theme.textSecondary || `${p.theme.text}70`};
  margin: 0 0 22px;
  max-width: 380px;
  line-height: 1.55;
`;

const EmptyAction = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: transparent;
  color: ${p => p.theme.text};
  border: 1px solid ${p => p.theme.border};
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;

  &:hover {
    border-color: ${p => p.theme.textSecondary || `${p.theme.text}50`};
    background: ${p => p.theme.inputBackground || `${p.theme.text}06`};
  }

  svg { width: 12px; height: 12px; }
`;

// ============================================================================
// MODAL
// ============================================================================

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  opacity: ${p => p.$visible ? 1 : 0};
  pointer-events: ${p => p.$visible ? 'auto' : 'none'};
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
  max-height: 88vh;
  background: ${p => p.theme.sidebar || p.theme.chat};
  border: 1px solid ${p => p.theme.border};
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.16);
  overflow: hidden;
  transform: ${p => p.$visible ? 'translateY(0)' : 'translateY(6px)'};
  opacity: ${p => p.$visible ? 1 : 0};
  transition: transform 0.2s ease, opacity 0.2s ease;

  @media (max-width: 640px) {
    max-width: 100%;
    max-height: 92vh;
    border-radius: 10px 10px 0 0;
    border-bottom: none;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 22px 24px 18px;
  border-bottom: 1px solid ${p => p.theme.border};
`;

const ModalTitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ModalEyebrow = styled.div`
  font-family: ${MONO};
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: ${p => p.theme.textSecondary || `${p.theme.text}55`};
  margin-bottom: 4px;
`;

const ModalTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  letter-spacing: -0.02em;
  color: ${p => p.theme.text};
`;

const ModalSubtitle = styled.p`
  font-size: 0.8125rem;
  color: ${p => p.theme.textSecondary || `${p.theme.text}70`};
  margin: 0;
`;

const CloseButton = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 5px;
  border: none;
  background: transparent;
  color: ${p => p.theme.textSecondary || `${p.theme.text}60`};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  flex-shrink: 0;

  &:hover {
    background: ${p => p.theme.inputBackground || `${p.theme.text}08`};
    color: ${p => p.theme.text};
  }

  svg { width: 14px; height: 14px; }
`;

const ModalContent = styled.div`
  flex: 1;
  padding: 22px 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb {
    background: ${p => p.theme.border};
    border-radius: 3px;
  }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 24px;
  border-top: 1px solid ${p => p.theme.border};
  flex-shrink: 0;
  gap: 12px;
`;

// ============================================================================
// FORM
// ============================================================================

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
`;

const Label = styled.label`
  font-family: ${MONO};
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: ${p => p.theme.textSecondary || `${p.theme.text}65`};
`;

const Input = styled.input`
  width: 100%;
  padding: 9px 12px;
  background: transparent;
  border: 1px solid ${p => p.theme.border};
  border-radius: 6px;
  color: ${p => p.theme.text};
  font-size: 0.875rem;
  transition: border-color 0.15s ease, background 0.15s ease;

  &:focus {
    outline: none;
    border-color: ${p => p.theme.textSecondary || `${p.theme.text}55`};
    background: ${p => p.theme.inputBackground || 'transparent'};
  }

  &::placeholder {
    color: ${p => p.theme.textSecondary || `${p.theme.text}50`};
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  background: transparent;
  border: 1px solid ${p => p.theme.border};
  border-radius: 6px;
  color: ${p => p.theme.text};
  font-size: 0.875rem;
  resize: vertical;
  min-height: 72px;
  line-height: 1.55;
  transition: border-color 0.15s ease, background 0.15s ease;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: ${p => p.theme.textSecondary || `${p.theme.text}55`};
    background: ${p => p.theme.inputBackground || 'transparent'};
  }

  &::placeholder {
    color: ${p => p.theme.textSecondary || `${p.theme.text}50`};
  }
`;

const SystemPromptArea = styled(TextArea)`
  min-height: 148px;
  font-family: ${MONO};
  font-size: 0.8125rem;
  line-height: 1.65;
`;

const Select = styled.select`
  width: 100%;
  padding: 9px 32px 9px 12px;
  background: transparent;
  border: 1px solid ${p => p.theme.border};
  border-radius: 6px;
  color: ${p => p.theme.text};
  font-size: 0.875rem;
  cursor: pointer;
  transition: border-color 0.15s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;

  &:focus {
    outline: none;
    border-color: ${p => p.theme.textSecondary || `${p.theme.text}55`};
  }

  option {
    background: ${p => p.theme.sidebar || p.theme.chat};
    color: ${p => p.theme.text};
  }
`;

// ============================================================================
// AVATAR PICKER
// ============================================================================

const AvatarSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-bottom: 20px;
  border-bottom: 1px solid ${p => p.theme.border};
`;

const AvatarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;

const LargeAvatar = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 8px;
  background: ${p => p.theme.inputBackground || `${p.theme.text}08`};
  border: 1px solid ${p => p.theme.border};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  overflow: hidden;
  color: ${p => p.theme.text};
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
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
`;

const UploadButton = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  background: transparent;
  border: 1px solid ${p => p.theme.border};
  border-radius: 5px;
  font-size: 0.75rem;
  font-weight: 500;
  color: ${p => p.theme.text};
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;

  &:hover {
    border-color: ${p => p.theme.textSecondary || `${p.theme.text}50`};
    background: ${p => p.theme.inputBackground || `${p.theme.text}06`};
  }

  input { display: none; }
  svg { width: 11px; height: 11px; }
`;

const RemoveImageButton = styled.button`
  padding: 6px 10px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 5px;
  font-size: 0.75rem;
  font-weight: 500;
  color: ${p => p.theme.textSecondary || `${p.theme.text}60`};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    color: #c53030;
    background: rgba(197, 48, 48, 0.06);
  }
`;

const EmojiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
`;

const EmojiButton = styled.button`
  aspect-ratio: 1;
  border-radius: 5px;
  border: 1px solid ${p => p.$selected
    ? (p.theme.accentColor || p.theme.primary)
    : 'transparent'};
  background: ${p => p.$selected
    ? (p.theme.accentSurface || `${p.theme.primary}12`)
    : 'transparent'};
  cursor: pointer;
  font-size: 1.05rem;
  transition: all 0.12s ease;
  padding: 4px;

  &:hover {
    background: ${p => p.theme.inputBackground || `${p.theme.text}08`};
  }
`;

// ============================================================================
// BUTTONS
// ============================================================================

const Button = styled.button`
  padding: 8px 14px;
  border-radius: 6px;
  border: 1px solid transparent;
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: -0.005em;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
`;

const PrimaryButton = styled(Button)`
  background: ${p => p.theme.text};
  color: ${p => p.theme.sidebar || '#fff'};
  border-color: ${p => p.theme.text};

  &:hover { opacity: 0.88; }
  &:active { opacity: 0.75; }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled(Button)`
  background: transparent;
  color: ${p => p.theme.text};
  border-color: ${p => p.theme.border};

  &:hover {
    border-color: ${p => p.theme.textSecondary || `${p.theme.text}50`};
    background: ${p => p.theme.inputBackground || `${p.theme.text}06`};
  }
`;

const DeleteButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: 5px;
  background: transparent;
  color: ${p => p.theme.textSecondary || `${p.theme.text}70`};
  border-color: transparent;
  padding: 8px 10px;

  &:hover {
    color: #c53030;
    background: rgba(197, 48, 48, 0.06);
  }

  svg { width: 12px; height: 12px; }
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

  const enabledCount = models.filter(m => m.enabled).length;
  const disabledCount = models.length - enabledCount;

  const filters = [
    { id: 'all', label: 'All', count: models.length },
    { id: 'enabled', label: 'Enabled', count: enabledCount },
    { id: 'disabled', label: 'Disabled', count: disabledCount },
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
      <WorkspaceFonts />
      <ContentWrapper>
        <Eyebrow>
          <EyebrowDot />
          Workspace
        </Eyebrow>

        <TitleRow>
          <PageTitle>{t('workspace.title')}</PageTitle>
          <TitleCount>{models.length}</TitleCount>
        </TitleRow>

        <Subtitle>
          Private models shaped by your own system prompts and base configuration.
        </Subtitle>

        <Toolbar>
          <FilterRow>
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
          </FilterRow>

          <ToolbarRight>
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
          </ToolbarRight>
        </Toolbar>

        {filteredModels.length === 0 ? (
          <EmptyState>
            <EmptyMark>—</EmptyMark>
            <EmptyTitle>
              {models.length === 0 ? 'No models yet' : 'Nothing matches'}
            </EmptyTitle>
            <EmptyDescription>
              {models.length === 0
                ? 'Configure a custom AI with its own instructions, persona, and base model.'
                : 'Try adjusting the filter or search above.'}
            </EmptyDescription>
            {models.length === 0 && (
              <EmptyAction onClick={handleNewModel}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                New model
              </EmptyAction>
            )}
          </EmptyState>
        ) : (
          <ModelsGrid>
            {filteredModels.map((model) => {
              const baseModelInfo = availableBaseModels.find(m => m.id === model.baseModel);
              const baseModelName = baseModelInfo
                ? `${baseModelInfo.name}`
                : (model.baseModel || t('workspace.baseModelFallback'));

              return (
                <ModelCard
                  key={model.id}
                  onClick={() => handleEditModel(model)}
                >
                  <CardHeader>
                    <ModelAvatar>
                      {model.avatarImage ? (
                        <img src={model.avatarImage} alt={model.name} />
                      ) : (
                        model.avatar || model.name.charAt(0).toUpperCase()
                      )}
                    </ModelAvatar>
                    <ModelInfo>
                      <ModelNameRow>
                        <StatusDot $enabled={model.enabled} />
                        <ModelName>{model.name}</ModelName>
                      </ModelNameRow>
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

      {/* Edit/Create Modal */}
      <ModalOverlay $visible={panelVisible} onClick={handleClosePanel}>
        <ModalDialog $visible={panelVisible} onClick={e => e.stopPropagation()}>
          <ModalHeader>
            <ModalTitleGroup>
              <ModalEyebrow>
                {editingModel ? 'Edit' : 'New'}
              </ModalEyebrow>
              <ModalTitle>
                {editingModel ? t('workspace.modal.titleEdit') : t('workspace.modal.titleCreate')}
              </ModalTitle>
              <ModalSubtitle>
                {editingModel
                  ? `Editing "${editingModel.name}"`
                  : 'Configure a new AI personality with custom instructions'}
              </ModalSubtitle>
            </ModalTitleGroup>
            <CloseButton onClick={handleClosePanel}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </CloseButton>
          </ModalHeader>

          <ModalContent>
            {/* Avatar Section */}
            <AvatarSection>
              <AvatarRow>
                <LargeAvatar>
                  {formData.avatarImage ? (
                    <img src={formData.avatarImage} alt="Avatar preview" />
                  ) : (
                    formData.avatar || '🤖'
                  )}
                </LargeAvatar>
                <AvatarControls>
                  <Label>{t('workspace.modal.fieldAvatar')}</Label>
                  <AvatarButtonRow>
                    <UploadButton>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      Upload
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={handleImageUpload}
                      />
                    </UploadButton>
                    {formData.avatarImage && (
                      <RemoveImageButton onClick={handleRemoveImage}>
                        Remove
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

            {/* Name + Base Model row */}
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
                style={{ minHeight: '64px' }}
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
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6"/>
                  <path d="M14 11v6"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
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

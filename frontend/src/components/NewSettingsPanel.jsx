import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, useTheme } from 'styled-components';
import TetrisGame from './TetrisGame';
import { useAuth } from '../contexts/AuthContext';
import { accentOptions, getAccentSwatch } from '../styles/accentColors';
import { useTranslation } from '../contexts/TranslationContext';

const SettingsOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 102;
`;

const SettingsContainer = styled.div`
  background-color: ${props => 
    props.theme.name === 'dark' || props.theme.name === 'oled' ? 
    '#222' : 
    props.theme.sidebar || props.theme.background || '#f5f5f7'};
  color: ${props => props.theme.text};
  border-radius: 16px;
  width: 900px;
  height: 650px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  position: relative;
  display: flex;
  
  /* Specific styling for the retro theme */
  ${props => props.theme.name === 'retro' && `
    border-radius: 0;
    border: 2px solid;
    border-color: ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight};
    box-shadow: none;
  `}
  
  /* This forces dropdown options to match the background for dark themes */
  option {
    background-color: ${props => 
      props.theme.name === 'dark' || props.theme.name === 'oled' ? 
      '#333' : 
      props.theme.background || '#f5f5f7'};
    color: ${props => props.theme.text};
  }
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.border};
    border-radius: 10px;
  }
  
  @media (max-width: 768px) {
    width: 95%;
    height: 90vh;
    flex-direction: column;
  }
`;

const SettingsSidebar = styled.div`
  width: 230px;
  height: 650px;
  border-right: 1px solid ${props => props.theme.border};
  padding: 20px 0;
  overflow-y: auto;
  
  /* Specific styling for the retro theme */
  ${props => props.theme.name === 'retro' && `
    border-right: 1px solid ${props.theme.buttonShadowDark};
    padding: 2px 0;
  `}
  
  &::-webkit-scrollbar {
    width: 6px;
    
    /* Specific styling for the retro theme */
    ${props => props.theme.name === 'retro' && `
      width: 16px;
    `}
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
    
    /* Specific styling for the retro theme */
    ${props => props.theme.name === 'retro' && `
      background: ${props.theme.scrollbarTrack};
      border: 1px solid;
      border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
    `}
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.border};
    border-radius: 10px;
    
    /* Specific styling for the retro theme */
    ${props => props.theme.name === 'retro' && `
      background: ${props.theme.scrollbarThumb};
      border-radius: 0;
      border: 1px solid;
      border-color: ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight};
    `}
  }
  
  /* Add scroll buttons for retro theme */
  ${props => props.theme.name === 'retro' && `
    &::-webkit-scrollbar-button {
      display: block;
      background-color: ${props.theme.buttonFace};
      border: 1px solid;
      border-color: ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight};
      height: 16px;
      width: 16px;
    }
    
    &::-webkit-scrollbar-button:vertical:start {
      background-image: url('data:image/svg+xml;utf8,<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 10L8 6L12 10" stroke="black" stroke-width="1"/></svg>');
      background-repeat: no-repeat;
      background-position: center;
    }
    
    &::-webkit-scrollbar-button:vertical:end {
      background-image: url('data:image/svg+xml;utf8,<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6L8 10L12 6" stroke="black" stroke-width="1"/></svg>');
      background-repeat: no-repeat;
      background-position: center;
    }
  `}
  
  @media (max-width: 768px) {
    width: 100%;
    height: auto;
    border-right: none;
    border-bottom: 1px solid ${props => props.theme.border};
    // padding: 10px 0;
    
    /* Specific styling for the retro theme */
    ${props => props.theme.name === 'retro' && `
      padding: 2px 0;
      border-bottom: 1px solid ${props.theme.buttonShadowDark};
    `}
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px 20px;
  
  /* Specific styling for the retro theme */
  ${props => props.theme.name === 'retro' && `
    padding: 2px 4px;
    background-color: ${props.theme.windowTitleBarBackground};
    color: ${props.theme.windowTitleBarText};
  `}
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  
  /* Specific styling for the retro theme */
  ${props => props.theme.name === 'retro' && `
    font-size: 1rem;
    color: ${props.theme.windowTitleBarText};
  `}
`;

const CloseButton = styled.button`
  position: absolute;
  top: 26px;
  right: 36px;
  background: none;
  border: none;
  cursor: pointer;
  color: ${props => props.theme.text};
  opacity: 0.7;
  transition: all 0.2s ease;
  padding: 0;
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  text-align: center;

  svg {
    width: 18px;
    height: 18px;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  
  /* Specific styling for the retro theme */
  ${props => props.theme.name === 'retro' && `
    background-color: ${props.theme.buttonFace};
    border: 1px solid;
    border-color: ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight};
    box-shadow: 1px 1px 0 0 ${props.theme.buttonHighlightSoft} inset, -1px -1px 0 0 ${props.theme.buttonShadowSoft} inset;
    border-radius: 0 !important;
    padding: 0;
    width: 16px;
    height: 16px;
    top: 0;
    right: 0;
    opacity: 1;
    transition: none;
    margin-right: 2px;
    margin-top: 2px;
    color: black;
    svg {
      width: 12px;
      height: 12px;
    }
    
    &:active {
      border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
      box-shadow: -1px -1px 0 0 ${props.theme.buttonHighlightSoft} inset, 1px 1px 0 0 ${props.theme.buttonShadowSoft} inset;
      padding: 1px 0 0 1px;
    }
  `}
  
  &:hover {
    opacity: 1;
    background: rgba(0,0,0,0.05);
    
    /* Specific styling for the retro theme */
    ${props => props.theme.name === 'retro' && `
      background-color: ${props.theme.buttonFace};
      opacity: 1;
    `}
  }
  @media (max-width: 768px) {
    top: 24px;
    right: 16px;
    ${props => props.theme.name === 'retro' && `
      top: 3px;
      right: 0;
    `}
  }
`;

const NavItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 20px;
  cursor: pointer;
  transition: background-color 0.2s;
  background-color: ${props => props.$active ? props.theme.accentSurface : 'transparent'};
  color: ${props => props.$active ? props.theme.accentText : props.theme.text};
  border-left: 3px solid ${props => props.$active ? props.theme.accentColor : 'transparent'};
  font-weight: ${props => props.$active ? '500' : 'normal'};
  
  /* Specific styling for the retro theme */
  ${props => props.theme.name === 'retro' && `
    padding: 6px 10px;
    border: ${props.$active ? '1px solid' : 'none'};
    border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
    background-color: ${props.active ? props.theme.messageUser : 'transparent'};
    color: ${props.theme.text};
  `}
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
  
  svg {
    margin-right: 12px;
    width: 20px;
    height: 20px;
    opacity: 0.8;
  }
`;

const MainContent = styled.div`
  flex: 1;
  padding: 30px;
  padding-bottom: 50px;
  overflow-y: auto;
  max-height: 650px;
  background-color: ${props => 
    props.theme.name === 'dark' || props.theme.name === 'oled' ? 
    '#222' : 
    props.theme.background || '#f5f5f7'};
  
  /* Specific styling for the retro theme */
  ${props => props.theme.name === 'retro' && `
    background-color: ${props.theme.sidebar};
    padding: 2px;
  `}
  
  &::-webkit-scrollbar {
    width: 6px;
    
    /* Specific styling for the retro theme */
    ${props => props.theme.name === 'retro' && `
      width: 16px;
    `}
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
    
    /* Specific styling for the retro theme */
    ${props => props.theme.name === 'retro' && `
      background: ${props.theme.scrollbarTrack};
      border: 1px solid;
      border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
    `}
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.border};
    border-radius: 10px;
    
    /* Specific styling for the retro theme */
    ${props => props.theme.name === 'retro' && `
      background: ${props.theme.scrollbarThumb};
      border-radius: 0;
      border: 1px solid;
      border-color: ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight};
    `}
  }
  
  /* Add scroll buttons for retro theme */
  ${props => props.theme.name === 'retro' && `
    &::-webkit-scrollbar-button {
      display: block;
      background-color: ${props.theme.buttonFace};
      border: 1px solid;
      border-color: ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight};
      height: 16px;
      width: 16px;
    }
    
    &::-webkit-scrollbar-button:vertical:start {
      background-image: url('data:image/svg+xml;utf8,<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 10L8 6L12 10" stroke="black" stroke-width="1"/></svg>');
      background-repeat: no-repeat;
      background-position: center;
    }
    
    &::-webkit-scrollbar-button:vertical:end {
      background-image: url('data:image/svg+xml;utf8,<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6L8 10L12 6" stroke="black" stroke-width="1"/></svg>');
      background-repeat: no-repeat;
      background-position: center;
    }
  `}
  
  @media (max-width: 768px) {
    max-height: calc(90vh - 60px);
  }
`;

const SectionTitle = styled.h3`
  margin: 0 0 20px 0;
  font-size: 1.2rem;
  font-weight: 600;
`;

const SettingsRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const SettingsLabel = styled.div`
  font-size: 1rem;
`;

const ThemeSelect = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const ThemeOption = styled.label`
  display: flex;
  align-items: center;
  padding: 16px 12px;
  border-radius: 10px;
  border: 2px solid ${props => props.isSelected ? props.theme.accentColor : 'transparent'};
  background: ${props => props.isSelected ? props.theme.cardBackground : 'rgba(0,0,0,0.03)'};
  cursor: pointer;
  transition: all 0.25s ease;
  width: 100px;
  justify-content: center;
  position: relative;
  box-shadow: ${props => props.isSelected ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'};
  transform: ${props => props.isSelected ? 'translateY(-2px)' : 'none'};
  margin-bottom: 8px;
  
  /* Make bisexual theme option wider */
  &.bisexual-theme {
    width: 110px;
  }
  
  input {
    position: relative;
    opacity: 1;
    margin-right: 6px;
    width: 16px;
    height: 16px;
  }
  
  &:hover {
    background: ${props => props.isSelected ? props.theme.cardBackground : 'rgba(0,0,0,0.05)'};
    transform: ${props => props.isSelected ? 'translateY(-3px)' : 'translateY(-1px)'};
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  }
  
  /* Keep existing theme-specific styles but enhance them */
  &.light-theme {
    background: ${props => props.isSelected ? '#ffffff' : '#f5f5f7'};
    color: #222222;
    border-color: ${props => props.isSelected ? props.theme.accentColor : 'transparent'};
  }
  
  &.dark-theme {
    background: ${props => props.isSelected ? '#222222' : '#333333'};
    color: #ffffff;
    border-color: ${props => props.isSelected ? props.theme.accentColor : 'transparent'};
  }
  
  &.oled-theme {
    background: ${props => props.isSelected ? '#000000' : '#0a0a0a'};
    color: #ffffff;
    border-color: ${props => props.isSelected ? props.theme.accentColor : 'transparent'};
  }
  
  &.ocean-theme {
    background: ${props => props.isSelected ? 
      'linear-gradient(135deg, #0277bd, #039be5, #4fc3f7)' : 
      'linear-gradient(135deg, #0277bd80, #039be580, #4fc3f780)'};
    color: white;
    border-color: ${props => props.isSelected ? props.theme.accentColor : 'transparent'};
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  }
  
  &.forest-theme {
    background: ${props => props.isSelected ? 
      'linear-gradient(135deg, #2e7d32, #388e3c, #4caf50)' : 
      'linear-gradient(135deg, #2e7d3280, #388e3c80, #4caf5080)'};
    color: white;
    border-color: ${props => props.isSelected ? props.theme.accentColor : 'transparent'};
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  }
  
  &.bisexual-theme {
    background: ${props => props.isSelected ? 
      'linear-gradient(135deg, #D60270, #9B4F96, #0038A8)' : 
      'linear-gradient(135deg, #D6027080, #9B4F9680, #0038A880)'};
    color: white;
    border-color: ${props => props.isSelected ? props.theme.accentColor : 'transparent'};
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  }
  
  &.pride-theme {
    background: ${props => props.isSelected ? 
      'linear-gradient(135deg, #ff0000, #ff9900, #ffff00, #33cc33, #3399ff, #9933ff)' : 
      'linear-gradient(135deg, #ff000080, #ff990080, #ffff0080, #33cc3380, #3399ff80, #9933ff80)'};
    color: white;
    border-color: ${props => props.isSelected ? props.theme.accentColor : 'transparent'};
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  }
  
  &.trans-theme {
    background: ${props => props.isSelected ? 
      'linear-gradient(135deg, #5BCEFA, #F5A9B8, #FFFFFF, #F5A9B8, #5BCEFA)' : 
      'linear-gradient(135deg, #5BCEFA80, #F5A9B880, #FFFFFF80, #F5A9B880, #5BCEFA80)'};
    color: #333;
    border-color: ${props => props.isSelected ? props.theme.accentColor : 'transparent'};
    text-shadow: 0 1px 2px rgba(0,0,0,0.2);
  }
  
  &.lakeside-theme {
    background: ${props => props.isSelected ? 
      'linear-gradient(145deg, #121218, #1a1a22)' : 
      'linear-gradient(145deg, #12121880, #1a1a2280)'};
    color: white;
    border-color: ${props => props.isSelected ? props.theme.accentColor : 'transparent'};
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  }
`;

const SelectBox = styled.select`
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid ${props => props.theme.border};
  background-color: ${props => props.theme.name === 'dark' || props.theme.name === 'oled' ? '#333' : props.theme.cardBackground || '#f5f5f7'};
  color: ${props => props.theme.text};
  font-size: 0.95rem;
  
  /* Specific styling for the retro theme */
  ${props => props.theme.name === 'retro' && `
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    padding: 2px 20px 2px 4px;
    border: 1px solid;
    border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
    background-color: ${props.theme.inputBackground};
    background-image: url('data:image/svg+xml;utf8,<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6L8 10L12 6" stroke="black" stroke-width="1"/></svg>');
    background-repeat: no-repeat;
    background-position: right 2px center;
    border-radius: 0;
    box-shadow: none;
    font-family: ${props.theme.fontFamily};
    font-size: 0.9rem;
  `}
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.primary}30;
    
    /* Specific styling for the retro theme */
    ${props => props.theme.name === 'retro' && `
      border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
      box-shadow: none;
    `}
  }
  
  option {
    background-color: ${props => props.theme.name === 'dark' || props.theme.name === 'oled' ? '#333' : props.theme.cardBackground || '#f5f5f7'};
    color: ${props => props.theme.text};
    
    /* Specific styling for the retro theme */
    ${props => props.theme.name === 'retro' && `
      background-color: ${props.theme.inputBackground};
      color: ${props.theme.text};
      font-family: ${props.theme.fontFamily};
      font-size: 0.9rem;
    `}
  }
`;

const ColorInputs = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  width: 100%;
`;

const ColorInputRow = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.cardBackground || props.theme.sidebar};
`;

const ColorInputLabel = styled.span`
  font-weight: 600;
  color: ${props => props.theme.text};
`;

const ColorInputField = styled.input`
  width: 64px;
  height: 36px;
  padding: 0;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.border};
  background: transparent;
  cursor: pointer;
`;

const AccentDropdown = styled.div`
  position: relative;
  width: 100%;
`;

const AccentTrigger = styled.button`
  width: 100%;
  border: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.cardBackground || props.theme.sidebar};
  color: ${props => props.theme.text};
  border-radius: 10px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  gap: 12px;
  font-size: 0.95rem;
  font-weight: 500;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:hover {
    border-color: ${props => props.theme.accentColor || props.theme.primary};
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  }
`;

const AccentMenu = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  width: 100%;
  background: ${props => props.theme.cardBackground || props.theme.sidebar};
  border: 1px solid ${props => props.theme.border};
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  z-index: 60;
  max-height: 240px;
  overflow-y: auto;
`;

const AccentOptionButton = styled.button`
  width: 100%;
  border: none;
  background: ${props => props.$isSelected ? props.theme.accentSurface : 'transparent'};
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: ${props => props.theme.text};
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  border-bottom: 1px solid ${props => props.theme.border};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${props => props.$isSelected ? props.theme.accentSurface : 'rgba(0, 0, 0, 0.03)'};
  }
`;

const AccentCircle = styled.span`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid ${props => props.theme.border};
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
`;

const AccentOptionLabel = styled.span`
  flex: 1;
  text-align: left;
`;

const AccentChevron = styled.span`
  transition: transform 0.2s ease;
  transform: ${props => props.$open ? 'rotate(-180deg)' : 'rotate(0deg)'};
`;

const RadioOption = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 12px 16px;
  border-radius: 10px;
  background-color: ${props => props.isSelected ? 
    props.theme.accentSurface : 
    'rgba(0, 0, 0, 0.03)'};
  border: 1px solid ${props => props.isSelected ? 
    props.theme.accentColor : 
    'transparent'};
  transition: all 0.2s ease;
  font-size: 0.95rem;
  input[type="radio"] {
    accent-color: ${props => props.theme.accentColor};
  }
  
  /* Specific styling for the retro theme */
  ${props => props.theme.name === 'retro' && `
    background-color: transparent;
    border: none;
    padding: 6px 8px;
    border-radius: 0;
    transition: none;
    font-family: ${props.theme.fontFamily};
    font-size: 0.9rem;
    
    input[type="radio"] {
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      width: 13px;
      height: 13px;
      border: 1px solid;
      border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
      background-color: ${props.theme.inputBackground};
      border-radius: 50% !important;
      position: relative;
      margin-right: 6px;
    }
    
    input[type="radio"]:checked:before {
      content: "";
      position: absolute;
      top: 3px;
      left: 3px;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background-color: ${props.theme.accentColor};
    }
  `}
  
  &:hover {
    background-color: ${props => props.isSelected ? 
      props.theme.accentSurface : 
      'rgba(0, 0, 0, 0.05)'};
      
    /* Specific styling for the retro theme */
    ${props => props.theme.name === 'retro' && `
      background-color: transparent;
    `}
  }
  
  input {
    margin: 0 10px 0 0;
  }
`;

const ToggleWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 18px;
  padding: 10px 0;
  
  /* Specific styling for the retro theme */
  ${props => props.theme.name === 'retro' && `
    margin-bottom: 10px;
    padding: 4px 0;
    font-family: ${props.theme.fontFamily};
    font-size: 0.9rem;
  `}
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const Toggle = styled.label`
  position: relative;
  display: inline-block;
  width: 48px;
  height: 26px;
  margin-right: 12px;
  
  /* Specific styling for the retro theme */
  ${props => props.theme.name === 'retro' && `
    width: 16px;
    height: 16px;
    margin-right: 8px;
    
    input {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      opacity: 0;
    }
  `}
  
  input {
    opacity: 0;
    width: 0;
    height: 0;
  }
`;

const Slider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 13px;
  background-color: ${props => props.checked ? props.theme.accentColor : '#ccc'};
  transition: background-color 0.3s;
  overflow: visible;
  
  &:after {
    content: '';
    position: absolute;
    top: 3px;
    left: ${props => props.checked ? '25px' : '3px'};
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: white;
    transition: left 0.3s;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  }

  /* Specific styling for the retro theme */
  ${props => props.theme.name === 'retro' && `
    border-radius: 0;
    border: 1px solid;
    border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
    background: ${props.theme.buttonFace};
    background-image: none;
    transition: none;

    /* hide the normal knob */
    &:after { display: none; }

    /* show checkmark svg when checked */
    ${props.checked && `
      &:after {
        content: '';
        display: block;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: transparent;
        background-repeat: no-repeat;
        background-position: center;
        background-size: 12px 12px;
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><path d='M3 8.5l3 3L13 4.5' fill='none' stroke='black' stroke-width='2' stroke-linecap='square' stroke-linejoin='miter'/></svg>");
      }
    `}
  `}


`;

const FontSizeOption = styled(RadioOption)`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 18px 20px;
  width: auto;
  min-width: 110px;
  
  .size-label {
    margin-top: 10px;
    font-weight: 500;
  }
  
  .sample-text {
    margin-top: 6px;
    white-space: nowrap;
    font-weight: 600;
  }
  
  .small {
    font-size: 0.9rem;
  }
  
  .medium {
    font-size: 1rem;
  }
  
  .large {
    font-size: 1.1rem;
  }
  input {
    margin: 0;
  }
`;

const TranslateLink = styled.a`
  color: ${props => props.theme.primary};
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

const NotificationToggle = styled.div`
  position: relative;
  width: 48px;
  height: 26px;
  border-radius: 13px;
  background-color: ${props => props.$isOn ? props.theme.primary : '#ccc'};
  cursor: pointer;
  transition: background-color 0.3s;
  
  &:after {
    content: '';
    position: absolute;
    top: 3px;
    left: ${props => props.$isOn ? '25px' : '3px'};
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: white;
    transition: left 0.3s;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  }
  
  ${props => props.theme.name === 'retro' && `
    width: 16px;
    height: 16px;
    border-radius: 0;
    border: 1px solid;
    border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
    background: ${props.theme.buttonFace};
    background-image: none;
    transition: none;

    /* hide the normal knob */
    &:after { display: none; }

    /* show checkmark svg when checked */
    ${props.$isOn && `
      &:after {
        content: '';
        display: block;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: transparent;
        background-repeat: no-repeat;
        background-position: center;
        background-size: 12px 12px;
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><path d='M3 8.5l3 3L13 4.5' fill='none' stroke='black' stroke-width='2' stroke-linecap='square' stroke-linejoin='miter'/></svg>");
      }
    `}
  `}
`;

const SystemPromptArea = styled.textarea`
  width: 100%;
  height: 150px;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid ${props => props.theme.border};
  background-color: ${props => props.theme.name === 'dark' || props.theme.name === 'oled' ? '#333' : props.theme.cardBackground || '#f5f5f7'};
  color: ${props => props.theme.text};
  font-family: inherit;
  resize: vertical;
  margin-top: 10px;
`;

const AdvancedButton = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 10px 0;
  margin-top: 20px;
  
  &:hover {
    opacity: 0.8;
  }
`;

const ChevronIcon = styled.span`
  display: inline-block;
  width: 20px;
  height: 20px;
  transition: transform 0.3s;
  transform: ${props => props.expanded ? 'rotate(180deg)' : 'rotate(0deg)'};
  
  svg {
    width: 100%;
    height: 100%;
  }
`;

const SaveButton = styled.button`
  position: absolute;
  bottom: 20px;
  right: 30px;
  background: ${props => props.theme.accentBackground};
  color: #FFFFFF;
  border: none;
  border-radius: 20px;
  padding: 10px 25px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: filter 0.2s, box-shadow 0.2s;
  box-shadow: 0 10px 20px rgba(0,0,0,0.15);
  
  /* Specific styling for the retro theme */
  ${props => props.theme.name === 'retro' && `
    background-color: ${props.theme.buttonFace};
    color: ${props.theme.buttonText};
    border: 1px solid;
    border-color: ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight};
    box-shadow: 1px 1px 0 0 ${props.theme.buttonHighlightSoft} inset, -1px -1px 0 0 ${props.theme.buttonShadowSoft} inset;
    border-radius: 0;
    padding: 4px 8px;
    font-weight: normal;
    font-size: 0.9rem;
    transition: none;
    
    &:active {
      border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
      box-shadow: -1px -1px 0 0 ${props.theme.buttonHighlightSoft} inset, 1px 1px 0 0 ${props.theme.buttonShadowSoft} inset;
      padding: 5px 7px 3px 9px;
    }
  `}
  
  &:hover {
    filter: brightness(0.95);
  }
`;

const RainbowText = styled.span`
  background: linear-gradient(
    to right,
    #ff0000,
    #ff9900,
    #ffff00,
    #33cc33,
    #3399ff,
    #9933ff,
    #ff0000
  );
  background-size: 200% auto;
  color: transparent;
  -webkit-background-clip: text;
  background-clip: text;
  animation: rainbow 6s linear infinite;
  font-weight: bold;
  
  @keyframes rainbow {
    to {
      background-position: 200% center;
    }
  }
`;

const AboutContainer = styled.div`
  padding: 20px 0;
`;

const AboutTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: bold;
  margin: 5px 0;
  text-align: center;
`;

const AboutText = styled.p`
  margin: 20px 0;
  font-size: 1.1rem;
  text-align: center;
`;

const VersionText = styled.div`
  font-size: 0.8rem;
  color: ${props => props.theme.textLight || props.theme.text + '80'};
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  text-align: center;
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40px;
  width: 100%;
`;

const LogoIcon = styled.div`
  margin-right: 15px;
  cursor: pointer;
  img {
    width: 60px;
    height: 60px;
  }
`;

const LogoTitle = styled.h2`
  margin: 0;
  font-size: 2.5rem;
  font-weight: 600;
  cursor: pointer;
  
  &:hover {
    opacity: 0.8;
  }
`;

const RadioGroup = styled.div`
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    gap: 10px;
  }
`;

const SettingGroup = styled.div`
  margin-bottom: 30px;
  position: relative;
  overflow: visible;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SettingLabel = styled.h4`
  margin: 0 0 16px 0;
  font-size: 1.05rem;
  font-weight: 500;
  color: ${props => props.theme.text}dd;
`;

const InputField = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid ${props => props.theme.border || 'rgba(0, 0, 0, 0.1)'};
  border-radius: 8px;
  background-color: ${props => props.theme.cardBackground || '#fff'};
  color: ${props => props.theme.text};
  font-size: 0.95rem;
  font-family: inherit;
  
  /* Specific styling for the retro theme */
  ${props => props.theme.name === 'retro' && `
    border: 1px solid;
    border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
    border-radius: 0;
    background-color: ${props.theme.inputBackground};
    font-family: ${props.theme.fontFamily};
    font-size: 0.9rem;
  `}
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.primary}30;
    
    /* Specific styling for the retro theme */
    ${props => props.theme.name === 'retro' && `
      border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
      box-shadow: none;
    `}
  }
  
  &::placeholder {
    color: ${props => props.theme.text}70;
  }
`;

const SettingDescription = styled.p`
  margin: 8px 0 0 0;
  font-size: 0.85rem;
  color: ${props => props.theme.text}99;
  line-height: 1.4;
  
  /* Specific styling for the retro theme */
  ${props => props.theme.name === 'retro' && `
    font-family: ${props.theme.fontFamily};
    font-size: 0.8rem;
  `}
`;

  const NewSettingsPanel = ({ settings, updateSettings, closeModal, onRestartOnboarding }) => {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState('general');
  const [localSettings, setLocalSettings] = useState(settings || {});
  const [showTetris, setShowTetris] = useState(false);
  const [isAccentMenuOpen, setIsAccentMenuOpen] = useState(false);
  const { adminUser } = useAuth();
  const theme = useTheme();
  const accentMenuRef = useRef(null);
  
  // Add a helper function to determine if in dark mode
  const isDarkMode = () => {
    return localSettings.theme === 'dark' || 
           localSettings.theme === 'oled' || 
           localSettings.theme === 'bisexual' ||
    localSettings.theme === 'ocean' ||
           localSettings.theme === 'lakeside';
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accentMenuRef.current && !accentMenuRef.current.contains(event.target)) {
        setIsAccentMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const defaultCustomTheme = {
    background: '#0f172a',
    text: '#e2e8f0',
    border: '#4f46e5'
  };

  const accentValue = localSettings.accentColor || 'theme';
  const selectedAccentLabel = accentOptions.find(option => option.value === accentValue)?.label || 'Same as theme';
  const customThemeValues = localSettings.customTheme || defaultCustomTheme;

  const getThemeLabel = (value) => {
    const translated = t(`settings.themeOptions.${value}`);
    if (!translated || translated === `settings.themeOptions.${value}`) {
      return value === 'custom' ? 'Custom' : value.charAt(0).toUpperCase() + value.slice(1);
    }
    return translated;
  };
  
  const handleChange = (key, value) => {
    const newSettings = { ...localSettings, [key]: value };
    if (key === 'theme' && value === 'custom' && !localSettings.customTheme) {
      newSettings.customTheme = { ...defaultCustomTheme };
    }
    setLocalSettings(newSettings);
    // Remove immediate parent update to prevent re-renders
    // updateSettings(newSettings);
  };

  const handleAccentSelect = (value) => {
    handleChange('accentColor', value);
    setIsAccentMenuOpen(false);
  };

  const handleCustomColorChange = (field, value) => {
    const nextTheme = { ...customThemeValues, [field]: value };
    handleChange('customTheme', nextTheme);
    if (localSettings.theme !== 'custom') {
      handleChange('theme', 'custom');
    }
  };

  const handleSave = () => {
    updateSettings(localSettings);
    closeModal();
  };

  const handleClose = () => {
    // Save settings when closing to maintain current UX behavior
    updateSettings(localSettings);
    closeModal();
  };

  const handleEasterEgg = () => {
    setShowTetris(true);
  };

  const handleExitTetris = () => {
    setShowTetris(false);
  };

  const themeOptionValues = [
    'light',
    'dark',
    'oled',
    'ocean',
    'forest',
    'bisexual',
    'pride',
    'trans',
    'lakeside',
    'retro',
    'galaxy',
    'sunset',
    'cyberpunk',
    'bubblegum',
    'desert',
    'matrix',
    'comic-book',
    'custom'
  ];

  const languageOptionValues = ['en-US', 'fr', 'es', 'de', 'zh'];

  const fontSizeOptions = [
    { value: 'small', sampleClass: 'small' },
    { value: 'medium', sampleClass: 'medium' },
    { value: 'large', sampleClass: 'large' }
  ];

  const fontFamilyOptions = [
    'system',
    'inter',
    'roboto',
    'opensans',
    'montserrat',
    'lato',
    'caveat',
    'georgia',
    'merriweather'
  ];

  const sidebarStyleOptions = ['floating', 'traditional'];

  const messageFeatureToggles = [
    { key: 'showTimestamps', labelKey: 'settings.chats.features.timestamps' },
    { key: 'showModelIcons', labelKey: 'settings.chats.features.modelIcons' },
    { key: 'codeHighlighting', labelKey: 'settings.chats.features.codeHighlighting' }
  ];

  const messageAlignmentOptions = ['left', 'right'];

  const layoutToggles = [
    { key: 'sidebarAutoCollapse', labelKey: 'settings.interface.layout.autoCollapse' },
    { key: 'focusMode', labelKey: 'settings.interface.layout.focusMode' },
    { key: 'showGreeting', labelKey: 'settings.interface.layout.showGreeting', invertDefault: true }
  ];

  const bubbleStyleOptions = ['minimal', 'modern', 'classic'];

  const messageSpacingOptions = ['compact', 'comfortable', 'spacious'];

  const textSpacingOptions = ['normal', 'relaxed', 'loose'];

  const navItems = [
    {
      id: 'general',
      labelKey: 'settings.nav.general',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      )
    },
    {
      id: 'appearance',
      labelKey: 'settings.nav.appearance',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <circle cx="12" cy="12" r="4"></circle>
        </svg>
      )
    },
    {
      id: 'interface',
      labelKey: 'settings.nav.interface',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"></rect>
          <line x1="3" y1="9" x2="21" y2="9"></line>
        </svg>
      )
    },
    {
      id: 'chats',
      labelKey: 'settings.nav.chats',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      )
    },
    {
      id: 'accessibility',
      labelKey: 'settings.nav.accessibility',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v8" />
          <path d="M8 12h8" />
        </svg>
      )
    },
    {
      id: 'developer',
      labelKey: 'settings.nav.developer',
      adminOnly: true,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
        </svg>
      )
    },
    {
      id: 'about',
      labelKey: 'settings.nav.about',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
      )
    }
  ];


  return (
    <SettingsOverlay>
      <SettingsContainer>
        <CloseButton onClick={handleClose} aria-label={t('settings.close')}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </CloseButton>
        <SettingsSidebar>
          <Header>
            <Title>{t('settings.title')}</Title>
          </Header>
          {navItems
            .filter(item => !item.adminOnly || adminUser)
            .map(item => (
              <NavItem
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                $active={activeSection === item.id}
              >
                {item.icon}
                {t(item.labelKey)}
              </NavItem>
            ))}
        </SettingsSidebar>
        
        <MainContent>
          {activeSection === 'general' && (
            <div>
              <SectionTitle>{t('settings.sections.general')}</SectionTitle>
              
              <SettingsRow>
                <SettingsLabel>{t('settings.general.theme.label')}</SettingsLabel>
                <SelectBox 
                  value={localSettings.theme || 'light'}
                  onChange={(e) => handleChange('theme', e.target.value)}
                >
                  {themeOptionValues.map(value => (
                    <option key={value} value={value}>
                      {getThemeLabel(value)}
                    </option>
                  ))}
                </SelectBox>
              </SettingsRow>
              {localSettings.theme === 'custom' && (
                <SettingGroup>
                  <SettingLabel>Custom Theme Colors</SettingLabel>
                  <ColorInputs>
                    <ColorInputRow>
                      <ColorInputLabel>Background</ColorInputLabel>
                      <ColorInputField
                        type="color"
                        value={customThemeValues.background}
                        onChange={(e) => handleCustomColorChange('background', e.target.value)}
                        title="Pick background color"
                      />
                    </ColorInputRow>
                    <ColorInputRow>
                      <ColorInputLabel>Text</ColorInputLabel>
                      <ColorInputField
                        type="color"
                        value={customThemeValues.text}
                        onChange={(e) => handleCustomColorChange('text', e.target.value)}
                        title="Pick text color"
                      />
                    </ColorInputRow>
                    <ColorInputRow>
                      <ColorInputLabel>Border</ColorInputLabel>
                      <ColorInputField
                        type="color"
                        value={customThemeValues.border}
                        onChange={(e) => handleCustomColorChange('border', e.target.value)}
                        title="Pick border color"
                      />
                    </ColorInputRow>
                  </ColorInputs>
                </SettingGroup>
              )}
              
              <SettingsRow>
                <SettingsLabel>{t('settings.general.language.label')}</SettingsLabel>
                <SelectBox 
                  value={localSettings.language || 'en-US'} 
                  onChange={e => handleChange('language', e.target.value)}
                >
                  {languageOptionValues.map(value => (
                    <option key={value} value={value}>
                      {t(`settings.languageOptions.${value}`)}
                    </option>
                  ))}
                </SelectBox>
              </SettingsRow>
                            
              <SettingsRow>
                <SettingsLabel>{t('settings.general.notifications.label')}</SettingsLabel>
                <NotificationToggle 
                  $isOn={localSettings.notifications || false} 
                  onClick={() => handleChange('notifications', !localSettings.notifications)}
                />
              </SettingsRow>
            </div>
          )}
          
          {activeSection === 'appearance' && (
            <div>
              <SectionTitle>{t('settings.sections.appearance')}</SectionTitle>
              
              <SettingGroup>
                <SettingLabel>{t('settings.appearance.fontSize.label')}</SettingLabel>
                <RadioGroup>
                  {fontSizeOptions.map(option => (
                    <FontSizeOption key={option.value} isSelected={localSettings.fontSize === option.value}>
                      <input
                        type="radio"
                        name="fontSize"
                        value={option.value}
                        checked={localSettings.fontSize === option.value}
                        onChange={() => handleChange('fontSize', option.value)}
                      />
                      <div className={`sample-text ${option.sampleClass}`}>Aa</div>
                      <div className="size-label">{t(`settings.fontSize.${option.value}`)}</div>
                    </FontSizeOption>
                  ))}
                </RadioGroup>
              </SettingGroup>

              <SettingGroup>
                <SettingLabel>{t('settings.appearance.fontFamily.label')}</SettingLabel>
                <SelectBox
                  value={localSettings.fontFamily || 'system'}
                  onChange={(e) => handleChange('fontFamily', e.target.value)}
                >
                  {fontFamilyOptions.map(option => (
                    <option key={option} value={option}>
                      {t(`settings.fontFamily.${option}`)}
                    </option>
                  ))}
                </SelectBox>
              </SettingGroup>

              <SettingGroup>
                <SettingLabel>Accent Color</SettingLabel>
                <AccentDropdown ref={accentMenuRef}>
                      <AccentTrigger
                        type="button"
                        onClick={() => setIsAccentMenuOpen(prev => !prev)}
                        aria-haspopup="listbox"
                        aria-expanded={isAccentMenuOpen}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <AccentCircle style={{ background: getAccentSwatch(accentValue, theme) }} />
                          <AccentOptionLabel>{selectedAccentLabel}</AccentOptionLabel>
                        </span>
                        <AccentChevron $open={isAccentMenuOpen}>▾</AccentChevron>
                      </AccentTrigger>
                      {isAccentMenuOpen && (
                        <AccentMenu role="listbox">
                          {accentOptions.map((option) => (
                        <AccentOptionButton
                          key={option.value}
                          type="button"
                          onClick={() => handleAccentSelect(option.value)}
                          $isSelected={accentValue === option.value}
                        >
                          <AccentCircle style={{ background: getAccentSwatch(option.value, theme) }} />
                          <AccentOptionLabel>{option.label}</AccentOptionLabel>
                        </AccentOptionButton>
                      ))}
                    </AccentMenu>
                  )}
                </AccentDropdown>
                <SettingDescription>
                  Accent colors update buttons, bubbles, toggles, and other highlights throughout the interface.
                </SettingDescription>
              </SettingGroup>

              <SettingGroup>
                <SettingLabel>{t('settings.appearance.sidebarStyle.label')}</SettingLabel>
                <RadioGroup>
                  {sidebarStyleOptions.map(option => (
                    <RadioOption
                      key={option}
                      isSelected={localSettings.sidebarStyle === option || (!localSettings.sidebarStyle && option === 'floating')}
                    >
                      <input
                        type="radio"
                        name="sidebarStyle"
                        value={option}
                        checked={localSettings.sidebarStyle === option || (!localSettings.sidebarStyle && option === 'floating')}
                        onChange={() => handleChange('sidebarStyle', option)}
                      />
                      {t(`settings.appearance.sidebarStyle.${option}`)}
                    </RadioOption>
                  ))}
                </RadioGroup>
                <SettingDescription>
                  {t('settings.appearance.sidebarStyle.description')}
                </SettingDescription>
              </SettingGroup>
            </div>
          )}
          
          {activeSection === 'chats' && (
            <div>
              <SectionTitle>{t('settings.sections.chats')}</SectionTitle>
              
              <SettingGroup>
                <SettingLabel>{t('settings.chats.features.label')}</SettingLabel>
                
                {messageFeatureToggles.map(feature => (
                  <ToggleWrapper key={feature.key}>
                    <Toggle checked={!!localSettings[feature.key]}>
                      <input
                        type="checkbox"
                        checked={!!localSettings[feature.key]}
                        onChange={() => handleChange(feature.key, !localSettings[feature.key])}
                      />
                      <Slider checked={!!localSettings[feature.key]} />
                    </Toggle>
                    {t(feature.labelKey)}
                  </ToggleWrapper>
                ))}
              </SettingGroup>
              
              <SettingGroup>
                <SettingLabel>{t('settings.chats.sending.label')}</SettingLabel>
                <ToggleWrapper>
                  <Toggle checked={localSettings.sendWithEnter}>
                    <input
                      type="checkbox"
                      checked={localSettings.sendWithEnter}
                      onChange={() => handleChange('sendWithEnter', !localSettings.sendWithEnter)}
                    />
                    <Slider checked={localSettings.sendWithEnter} />
                  </Toggle>
                  {t('settings.chats.sending.sendWithEnter')}
                </ToggleWrapper>
              </SettingGroup>
              
            <SettingGroup>
              <SettingLabel>{t('settings.appearance.accent.color', 'Accent Color')}</SettingLabel>
              <AccentDropdown ref={accentMenuRef}>
                <AccentTrigger
                  type="button"
                  onClick={() => setIsAccentMenuOpen(prev => !prev)}
                  aria-haspopup="listbox"
                  aria-expanded={isAccentMenuOpen}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <AccentCircle style={{ background: getAccentSwatch(accentValue, theme) }} />
                    <AccentOptionLabel>{selectedAccentLabel}</AccentOptionLabel>
                  </span>
                  <AccentChevron $open={isAccentMenuOpen}>▾</AccentChevron>
                </AccentTrigger>
                {isAccentMenuOpen && (
                  <AccentMenu role="listbox">
                    {accentOptions.map((option) => (
                      <AccentOptionButton
                        key={option.value}
                        type="button"
                        onClick={() => handleAccentSelect(option.value)}
                        $isSelected={accentValue === option.value}
                      >
                        <AccentCircle style={{ background: getAccentSwatch(option.value, theme) }} />
                        <AccentOptionLabel>{option.label}</AccentOptionLabel>
                      </AccentOptionButton>
                    ))}
                  </AccentMenu>
                )}
              </AccentDropdown>
              <SettingDescription>
                {t('settings.appearance.accent.description')}
              </SettingDescription>
            </SettingGroup>

            <SettingGroup>
              <SettingLabel>{t('settings.chats.alignment.label')}</SettingLabel>
              <RadioGroup>
                {['default', 'left', 'right'].map(option => (
                  <RadioOption
                    key={option}
                    isSelected={(localSettings.messageAlignment || 'default') === option}
                  >
                    <input
                      type="radio"
                      name="messageAlignment"
                      value={option}
                      checked={(localSettings.messageAlignment || 'default') === option}
                      onChange={() => handleChange('messageAlignment', option)}
                    />
                    {t(`settings.chats.alignment.${option}`, option.charAt(0).toUpperCase() + option.slice(1))}
                  </RadioOption>
                ))}
              </RadioGroup>
            </SettingGroup>

            <SettingGroup>
              <SettingLabel>{t('settings.chats.profiles.toggleVisibility.label', 'Toggle profile icon visibility')}</SettingLabel>
              <ToggleWrapper>
                <Toggle checked={localSettings.showProfilePicture !== false}>
                  <input
                    type="checkbox"
                    checked={localSettings.showProfilePicture !== false}
                    onChange={() => handleChange('showProfilePicture', !(localSettings.showProfilePicture !== false))}
                  />
                  <Slider checked={localSettings.showProfilePicture !== false} />
                </Toggle>
                {t('settings.chats.profiles.toggleVisibility.description', 'Show profile icon in chats')}
              </ToggleWrapper>
            </SettingGroup>

            </div>
          )}
          
          {activeSection === 'interface' && (
            <div>
              <SectionTitle>{t('settings.sections.interface')}</SectionTitle>
              
              <SettingGroup>
                <SettingLabel>{t('settings.interface.layout.label')}</SettingLabel>
                {layoutToggles.map(toggle => {
                  const isOn = toggle.invertDefault ? localSettings[toggle.key] !== false : !!localSettings[toggle.key];
                  return (
                    <ToggleWrapper key={toggle.key}>
                      <Toggle checked={isOn}>
                        <input
                          type="checkbox"
                          checked={isOn}
                          onChange={() => {
                            if (toggle.invertDefault) {
                              handleChange(toggle.key, localSettings[toggle.key] === false ? true : false);
                            } else {
                              handleChange(toggle.key, !localSettings[toggle.key]);
                            }
                          }}
                        />
                        <Slider checked={isOn} />
                      </Toggle>
                      {t(toggle.labelKey)}
                    </ToggleWrapper>
                  );
                })}
              </SettingGroup>
              
              <SettingGroup>
                <SettingLabel>{t('settings.interface.bubbles.label')}</SettingLabel>
                <RadioGroup>
                  {bubbleStyleOptions.map(option => (
                  <RadioOption
                    key={option}
                    isSelected={localSettings.bubbleStyle === option || (!localSettings.bubbleStyle && option === 'minimal')}
                  >
                    <input
                      type="radio"
                      name="bubbleStyle"
                      value={option}
                      checked={localSettings.bubbleStyle === option || (!localSettings.bubbleStyle && option === 'minimal')}
                      onChange={() => handleChange('bubbleStyle', option)}
                    />
                    {t(`settings.interface.bubbles.${option}`)}
                  </RadioOption>
                  ))}
                </RadioGroup>
              </SettingGroup>
              
              <SettingGroup>
                <SettingLabel>{t('settings.interface.spacing.label')}</SettingLabel>
                <RadioGroup>
                  {messageSpacingOptions.map(option => (
                    <RadioOption
                      key={option}
                      isSelected={localSettings.messageSpacing === option || (!localSettings.messageSpacing && option === 'comfortable')}
                    >
                      <input
                        type="radio"
                        name="messageSpacing"
                        value={option}
                        checked={localSettings.messageSpacing === option || (!localSettings.messageSpacing && option === 'comfortable')}
                        onChange={() => handleChange('messageSpacing', option)}
                      />
                      {t(`settings.interface.spacing.${option}`)}
                    </RadioOption>
                  ))}
                </RadioGroup>
              </SettingGroup>
            </div>
          )}
          
          {activeSection === 'accessibility' && (
            <div>
              <SectionTitle>{t('settings.sections.accessibility')}</SectionTitle>
              
              <SettingGroup>
                <SettingLabel>{t('settings.accessibility.visual.label')}</SettingLabel>
                <ToggleWrapper>
                  <Toggle checked={localSettings.highContrast || false}>
                    <input
                      type="checkbox"
                      checked={localSettings.highContrast || false}
                      onChange={() => handleChange('highContrast', !localSettings.highContrast)}
                    />
                    <Slider checked={localSettings.highContrast || false} />
                  </Toggle>
                  {t('settings.accessibility.visual.highContrast')}
                </ToggleWrapper>
                
                <ToggleWrapper>
                  <Toggle checked={localSettings.reducedMotion || false}>
                    <input
                      type="checkbox"
                      checked={localSettings.reducedMotion || false}
                      onChange={() => handleChange('reducedMotion', !localSettings.reducedMotion)}
                    />
                    <Slider checked={localSettings.reducedMotion || false} />
                  </Toggle>
                  {t('settings.accessibility.visual.reducedMotion')}
                </ToggleWrapper>
              </SettingGroup>
              
              <SettingGroup>
                <SettingLabel>{t('settings.accessibility.textSpacing.label')}</SettingLabel>
                <RadioGroup>
                  {textSpacingOptions.map(option => (
                    <RadioOption
                      key={option}
                      isSelected={localSettings.lineSpacing === option || (!localSettings.lineSpacing && option === 'normal')}
                    >
                      <input
                        type="radio"
                        name="lineSpacing"
                        value={option}
                        checked={localSettings.lineSpacing === option || (!localSettings.lineSpacing && option === 'normal')}
                        onChange={() => handleChange('lineSpacing', option)}
                      />
                      {t(`settings.accessibility.textSpacing.${option}`)}
                    </RadioOption>
                  ))}
                </RadioGroup>
              </SettingGroup>
            </div>
          )}
          
          {activeSection === 'developer' && adminUser && (
            <div>
              <SectionTitle>{t('settings.sections.developer')}</SectionTitle>
              
              <SettingGroup>
                <SettingLabel>{t('settings.developer.onboarding.label')}</SettingLabel>
                <SettingDescription>
                  {t('settings.developer.onboarding.description')}
                </SettingDescription>
                <SaveButton 
                  onClick={() => {
                    if (onRestartOnboarding) {
                      onRestartOnboarding();
                      closeModal();
                    }
                  }}
                  style={{ 
                    position: 'relative',
                    bottom: 'auto',
                    right: 'auto',
                    marginTop: '10px'
                  }}
                >
                  {t('settings.developer.onboarding.restart')}
                </SaveButton>
              </SettingGroup>
            </div>
          )}
          
          {activeSection === 'about' && (
            <AboutContainer>
              <SectionTitle>{t('settings.sections.about')}</SectionTitle>
              
              <LogoContainer>
                <LogoIcon onClick={handleEasterEgg}>
                  <img 
                    src={localSettings.theme === 'lakeside' ? 'https://demo-andromeda.me/static/favicon.png' : '/sculptor.svg'} 
                    alt={localSettings.theme === 'lakeside' ? t('settings.about.logoAlt.lakeside') : t('settings.about.logoAlt.default')} 
                    style={localSettings.theme === 'lakeside' ? {
                      filter: 'brightness(0) saturate(100%) invert(58%) sepia(53%) saturate(804%) hue-rotate(20deg) brightness(91%) contrast(85%)'
                    } : {}}
                  />
                </LogoIcon>
                <LogoTitle 
                  onClick={handleEasterEgg}
                  style={localSettings.theme === 'lakeside' ? { color: 'rgb(198, 146, 20)' } : {}}
                >
                  {localSettings.theme === 'lakeside' ? t('settings.about.logoTitle.lakeside') : t('settings.about.logoTitle.default')}
                </LogoTitle>
              </LogoContainer>
              
              <AboutTitle>
                {t('settings.about.madeWith')} <RainbowText>{t('settings.about.prideWord')}</RainbowText>
              </AboutTitle>
              
              <AboutText>{t('settings.about.teamMessage')}</AboutText>
              
              <VersionText>{t('settings.about.version')}</VersionText>
            </AboutContainer>
          )}
          
          <SaveButton onClick={handleSave}>{t('settings.saveButton')}</SaveButton>
        </MainContent>
      </SettingsContainer>
      
      {showTetris && (
        <TetrisGame onExit={handleExitTetris} />
      )}
    </SettingsOverlay>
  );
};

export default NewSettingsPanel; 

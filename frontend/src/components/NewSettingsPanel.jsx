import React, { useState } from 'react';
import styled from 'styled-components';
import TetrisGame from './TetrisGame';
import { useAuth } from '../contexts/AuthContext';

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
    padding: 10px 0;
    
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
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.5rem;
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
    font-size: 14px;
    line-height: 14px;
    opacity: 1;
    transition: none;
    margin-right: 2px;
    margin-top: 2px;
    color: black;
    
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
`;

const NavItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 20px;
  cursor: pointer;
  transition: background-color 0.2s;
  background-color: ${props => props.$active ? 'rgba(0, 0, 0, 0.05)' : 'transparent'};
  color: ${props => props.$active ? props.theme.primary : props.theme.text};
  font-weight: ${props => props.$active ? '500' : 'normal'};
  
  /* Specific styling for the retro theme */
  ${props => props.theme.name === 'retro' && `
    padding: 6px 10px;
    border: ${props.active ? '1px solid' : 'none'};
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
  border: 2px solid ${props => props.isSelected ? props.theme.primary : 'transparent'};
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
    border-color: ${props => props.isSelected ? '#0078d7' : 'transparent'};
  }
  
  &.dark-theme {
    background: ${props => props.isSelected ? '#222222' : '#333333'};
    color: #ffffff;
    border-color: ${props => props.isSelected ? '#0078d7' : 'transparent'};
  }
  
  &.oled-theme {
    background: ${props => props.isSelected ? '#000000' : '#0a0a0a'};
    color: #ffffff;
    border-color: ${props => props.isSelected ? '#0078d7' : 'transparent'};
  }
  
  &.ocean-theme {
    background: ${props => props.isSelected ? 
      'linear-gradient(135deg, #0277bd, #039be5, #4fc3f7)' : 
      'linear-gradient(135deg, #0277bd80, #039be580, #4fc3f780)'};
    color: white;
    border-color: ${props => props.isSelected ? '#0277bd' : 'transparent'};
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  }
  
  &.forest-theme {
    background: ${props => props.isSelected ? 
      'linear-gradient(135deg, #2e7d32, #388e3c, #4caf50)' : 
      'linear-gradient(135deg, #2e7d3280, #388e3c80, #4caf5080)'};
    color: white;
    border-color: ${props => props.isSelected ? '#2e7d32' : 'transparent'};
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  }
  
  &.bisexual-theme {
    background: ${props => props.isSelected ? 
      'linear-gradient(135deg, #D60270, #9B4F96, #0038A8)' : 
      'linear-gradient(135deg, #D6027080, #9B4F9680, #0038A880)'};
    color: white;
    border-color: ${props => props.isSelected ? '#D60270' : 'transparent'};
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  }
  
  &.pride-theme {
    background: ${props => props.isSelected ? 
      'linear-gradient(135deg, #ff0000, #ff9900, #ffff00, #33cc33, #3399ff, #9933ff)' : 
      'linear-gradient(135deg, #ff000080, #ff990080, #ffff0080, #33cc3380, #3399ff80, #9933ff80)'};
    color: white;
    border-color: ${props => props.isSelected ? '#ff0000' : 'transparent'};
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  }
  
  &.trans-theme {
    background: ${props => props.isSelected ? 
      'linear-gradient(135deg, #5BCEFA, #F5A9B8, #FFFFFF, #F5A9B8, #5BCEFA)' : 
      'linear-gradient(135deg, #5BCEFA80, #F5A9B880, #FFFFFF80, #F5A9B880, #5BCEFA80)'};
    color: #333;
    border-color: ${props => props.isSelected ? '#5BCEFA' : 'transparent'};
    text-shadow: 0 1px 2px rgba(0,0,0,0.2);
  }
  
  &.lakeside-theme {
    background: ${props => props.isSelected ? 
      'linear-gradient(145deg, #121218, #1a1a22)' : 
      'linear-gradient(145deg, #12121880, #1a1a2280)'};
    color: white;
    border-color: ${props => props.isSelected ? '#DAA520' : 'transparent'};
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  }
`;

const SelectBox = styled.select`
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid ${props => props.theme.border};
  background-color: ${props => props.theme.name === 'dark' || props.theme.name === 'oled' ? '#333' : props.theme.cardBackground || '#f5f5f7'};
  color: ${props => props.theme.text};
  font-family: inherit;
  width: 100%;
  margin-bottom: 15px;
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

const RadioOption = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 12px 16px;
  border-radius: 10px;
  background-color: ${props => props.isSelected ? 
    `${props.theme.primary}15` : 
    'rgba(0, 0, 0, 0.03)'};
  border: 1px solid ${props => props.isSelected ? 
    props.theme.primary : 
    'transparent'};
  transition: all 0.2s ease;
  font-size: 0.95rem;
  
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
      background-color: ${props.theme.text};
    }
  `}
  
  &:hover {
    background-color: ${props => props.isSelected ? 
      `${props.theme.primary}20` : 
      'rgba(0, 0, 0, 0.05)'};
      
    /* Specific styling for the retro theme */
    ${props => props.theme.name === 'retro' && `
      background-color: transparent;
    `}
  }
  
  input {
    margin-right: 10px;
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
  background-color: ${props => props.checked ? props.theme.primary : 'rgba(0,0,0,0.15)'};
  background-image: ${props => props.checked ? 
    `linear-gradient(to right, ${props.theme.primary}90, ${props.theme.primary})` : 
    'none'};
  transition: 0.3s;
  border-radius: 26px;
  overflow: visible;
  
  /* Specific styling for the retro theme */
  ${props => props.theme.name === 'retro' && `
    border-radius: 0;
    border: 1px solid;
    border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
    background: ${props.theme.buttonFace};
    background-image: none;
    transition: none;
    
    &:before {
      border-radius: 0;
      background: ${props.theme.buttonFace};
      border: 1px solid;
      border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
      height: 16px;
      width: 16px;
      transform: ${props.checked ? 'translateX(20px)' : 'translateX(0)'};
      content: '';
      background-color: ${props.theme.buttonFace};
      position: absolute;
      top: 3px;
      left: 3px;
    }
  `}
  
  &:before {
    position: absolute;
    content: "";
    height: ${props => props.checked ? '22px' : '20px'};
    width: ${props => props.checked ? '22px' : '20px'};
    left: ${props => props.checked ? '2px' : '3px'};
    bottom: ${props => props.checked ? '2px' : '3px'};
    background-color: ${props => props.checked ? '#4caf50' : 'white'};
    transition: 0.3s;
    border-radius: 50%;
    box-shadow: ${props => props.checked ? 
      `0 2px 5px rgba(0,0,0,0.2)` : 
      '0 2px 5px rgba(0,0,0,0.2)'};
    transform: ${props => props.checked ? 'translateX(22px)' : 'translateX(0)'};
  }
  
  /* Visual indicator on track */
  &:after {
    content: "";
    position: absolute;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: ${props => props.checked ? 'white' : 'transparent'};
    top: 10px;
    left: 9px;
    opacity: ${props => props.checked ? '0.7' : '0'};
    transition: 0.3s;
  }
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
`;

const LanguageSelect = styled.select`
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid ${props => props.theme.border};
  background-color: ${props => props.theme.name === 'dark' || props.theme.name === 'oled' ? '#333' : props.theme.cardBackground || '#f5f5f7'};
  color: ${props => props.theme.text};
  
  option {
    background-color: ${props => props.theme.name === 'dark' || props.theme.name === 'oled' ? '#333' : props.theme.cardBackground || '#f5f5f7'};
    color: ${props => props.theme.text};
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
  width: 50px;
  height: 26px;
  border-radius: 13px;
  background-color: ${props => props.$isOn ? props.theme.primary : '#ccc'};
  cursor: pointer;
  transition: background-color 0.3s;
  
  &:after {
    content: '';
    position: absolute;
    top: 3px;
    left: ${props => props.$isOn ? '27px' : '3px'};
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: white;
    transition: left 0.3s;
  }
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
  background-color: ${props => props.theme.primary};
  color: white;
  border: none;
  border-radius: 20px;
  padding: 10px 25px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  
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
    background-color: ${props => props.theme.primaryDark || props.theme.primary + 'dd'};
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
  const [activeSection, setActiveSection] = useState('general');
  const [localSettings, setLocalSettings] = useState(settings || {});
  const [showTetris, setShowTetris] = useState(false);
  const { adminUser } = useAuth();
  
  // Add a helper function to determine if in dark mode
  const isDarkMode = () => {
    return localSettings.theme === 'dark' || 
           localSettings.theme === 'oled' || 
           localSettings.theme === 'bisexual' ||
           localSettings.theme === 'ocean' ||
           localSettings.theme === 'lakeside';
  };
  
  const handleChange = (key, value) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    // Remove immediate parent update to prevent re-renders
    // updateSettings(newSettings);
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

  return (
    <SettingsOverlay>
      <SettingsContainer>
        <SettingsSidebar>
          <Header>
            <Title>Settings</Title>
          </Header>
          
          <NavItem 
            onClick={() => setActiveSection('general')} 
            $active={activeSection === 'general'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            General
          </NavItem>
          
          <NavItem 
            onClick={() => setActiveSection('appearance')} 
            $active={activeSection === 'appearance'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="12" cy="12" r="4"></circle>
            </svg>
            Appearance
          </NavItem>
          
          <NavItem 
            onClick={() => setActiveSection('interface')} 
            $active={activeSection === 'interface'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
            </svg>
            Interface
          </NavItem>
          
          <NavItem 
            onClick={() => setActiveSection('chats')} 
            $active={activeSection === 'chats'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            Chats
          </NavItem>
          
          
          <NavItem 
            onClick={() => setActiveSection('accessibility')} 
            $active={activeSection === 'accessibility'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v8" />
              <path d="M8 12h8" />
            </svg>
            Accessibility
          </NavItem>
          
          {adminUser && (
            <NavItem 
              onClick={() => setActiveSection('developer')} 
              $active={activeSection === 'developer'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
              </svg>
              Developer
            </NavItem>
          )}
          
          <NavItem 
            onClick={() => setActiveSection('about')} 
            $active={activeSection === 'about'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            About
          </NavItem>
        </SettingsSidebar>
        
        <MainContent>
          <CloseButton onClick={handleClose}>×</CloseButton>
          
          {activeSection === 'general' && (
            <div>
              <SectionTitle>General</SectionTitle>
              
              <SettingsRow>
                <SettingsLabel>Theme</SettingsLabel>
                <SelectBox 
                  value={localSettings.theme || 'light'}
                  onChange={(e) => handleChange('theme', e.target.value)}
                  style={{ 
                    backgroundColor: isDarkMode() ? '#333' : '#f5f5f7',
                    color: isDarkMode() ? '#fff' : '#000'
                  }}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="oled">OLED</option>
                  <option value="ocean">Ocean</option>
                  <option value="forest">Forest</option>
                  <option value="bisexual">Bisexual</option>
                  <option value="pride">Pride</option>
                  <option value="trans">Trans</option>
                  <option value="lakeside">Lakeside</option>
                  <option value="retro">Retro</option>
                  <option value="galaxy">Galaxy</option>
                  <option value="sunset">Sunset</option>
                  <option value="cyberpunk">Cyberpunk</option>
                  <option value="bubblegum">Bubblegum</option>
                  <option value="desert">Desert</option>
                  <option value="matrix">Matrix</option>
                  <option value="comic-book">Comic Book</option>
                </SelectBox>
              </SettingsRow>
              
              <SettingsRow>
                <SettingsLabel>Language</SettingsLabel>
                <LanguageSelect 
                  value={localSettings.language || 'en-US'} 
                  onChange={e => handleChange('language', e.target.value)}
                  style={{ 
                    backgroundColor: isDarkMode() ? '#333' : '#f5f5f7',
                    color: isDarkMode() ? '#fff' : '#000'
                  }}
                >
                  <option value="en-US">English (US)</option>
                  <option value="fr">French</option>
                  <option value="es">Spanish</option>
                  <option value="de">German</option>
                  <option value="zh">Chinese</option>
                </LanguageSelect>
              </SettingsRow>
                            
              <SettingsRow>
                <SettingsLabel>Notifications</SettingsLabel>
                <NotificationToggle 
                  $isOn={localSettings.notifications || false} 
                  onClick={() => handleChange('notifications', !localSettings.notifications)}
                />
              </SettingsRow>
            </div>
          )}
          
          {activeSection === 'appearance' && (
            <div>
              <SectionTitle>Appearance</SectionTitle>
              
              <SettingGroup>
                <SettingLabel>Font Size</SettingLabel>
                <RadioGroup>
                  <FontSizeOption isSelected={localSettings.fontSize === 'small'}>
                    <input
                      type="radio"
                      name="fontSize"
                      value="small"
                      checked={localSettings.fontSize === 'small'}
                      onChange={() => handleChange('fontSize', 'small')}
                    />
                    <div className="sample-text small">Aa</div>
                    <div className="size-label">Small</div>
                  </FontSizeOption>
                  <FontSizeOption isSelected={localSettings.fontSize === 'medium'}>
                    <input
                      type="radio"
                      name="fontSize"
                      value="medium"
                      checked={localSettings.fontSize === 'medium'}
                      onChange={() => handleChange('fontSize', 'medium')}
                    />
                    <div className="sample-text medium">Aa</div>
                    <div className="size-label">Medium</div>
                  </FontSizeOption>
                  <FontSizeOption isSelected={localSettings.fontSize === 'large'}>
                    <input
                      type="radio"
                      name="fontSize"
                      value="large"
                      checked={localSettings.fontSize === 'large'}
                      onChange={() => handleChange('fontSize', 'large')}
                    />
                    <div className="sample-text large">Aa</div>
                    <div className="size-label">Large</div>
                  </FontSizeOption>
                </RadioGroup>
              </SettingGroup>

              <SettingGroup>
                <SettingLabel>Font Family</SettingLabel>
                <SelectBox
                  value={localSettings.fontFamily || 'system'}
                  onChange={(e) => handleChange('fontFamily', e.target.value)}
                  style={{ 
                    backgroundColor: isDarkMode() ? '#333' : '#f5f5f7',
                    color: isDarkMode() ? '#fff' : '#000'
                  }}
                >
                  <option value="system">System Default</option>
                  <option value="inter">Inter</option>
                  <option value="roboto">Roboto</option>
                  <option value="opensans">Open Sans</option>
                  <option value="georgia">Georgia</option>
                  <option value="merriweather">Merriweather</option>
                </SelectBox>
              </SettingGroup>

              <SettingGroup>
                <SettingLabel>Sidebar Style</SettingLabel>
                <RadioGroup>
                  <RadioOption isSelected={localSettings.sidebarStyle === 'floating' || !localSettings.sidebarStyle}>
                    <input
                      type="radio"
                      name="sidebarStyle"
                      value="floating"
                      checked={localSettings.sidebarStyle === 'floating' || !localSettings.sidebarStyle}
                      onChange={() => handleChange('sidebarStyle', 'floating')}
                    />
                    Floating
                  </RadioOption>
                  <RadioOption isSelected={localSettings.sidebarStyle === 'traditional'}>
                    <input
                      type="radio"
                      name="sidebarStyle"
                      value="traditional"
                      checked={localSettings.sidebarStyle === 'traditional'}
                      onChange={() => handleChange('sidebarStyle', 'traditional')}
                    />
                    Traditional
                  </RadioOption>
                </RadioGroup>
                <SettingDescription>
                  Choose between a floating sidebar with rounded corners and margins, or a traditional sidebar that connects to the side of the screen.
                </SettingDescription>
              </SettingGroup>
            </div>
          )}
          
          {activeSection === 'chats' && (
            <div>
              <SectionTitle>Chat Settings</SectionTitle>
              
              <SettingGroup>
                <SettingLabel>Message Features</SettingLabel>
                
                <ToggleWrapper>
                  <Toggle checked={localSettings.showTimestamps}>
                    <input
                      type="checkbox"
                      checked={localSettings.showTimestamps}
                      onChange={() => handleChange('showTimestamps', !localSettings.showTimestamps)}
                    />
                    <Slider checked={localSettings.showTimestamps} />
                  </Toggle>
                  Show message timestamps
                </ToggleWrapper>
                
                <ToggleWrapper>
                  <Toggle checked={localSettings.showModelIcons}>
                    <input
                      type="checkbox"
                      checked={localSettings.showModelIcons}
                      onChange={() => handleChange('showModelIcons', !localSettings.showModelIcons)}
                    />
                    <Slider checked={localSettings.showModelIcons} />
                  </Toggle>
                  Show model icons in messages
                </ToggleWrapper>
                
                <ToggleWrapper>
                  <Toggle checked={localSettings.codeHighlighting}>
                    <input
                      type="checkbox"
                      checked={localSettings.codeHighlighting}
                      onChange={() => handleChange('codeHighlighting', !localSettings.codeHighlighting)}
                    />
                    <Slider checked={localSettings.codeHighlighting} />
                  </Toggle>
                  Enable code syntax highlighting
                </ToggleWrapper>
              </SettingGroup>
              
              <SettingGroup>
                <SettingLabel>Message Sending</SettingLabel>
                <ToggleWrapper>
                  <Toggle checked={localSettings.sendWithEnter}>
                    <input
                      type="checkbox"
                      checked={localSettings.sendWithEnter}
                      onChange={() => handleChange('sendWithEnter', !localSettings.sendWithEnter)}
                    />
                    <Slider checked={localSettings.sendWithEnter} />
                  </Toggle>
                  Send message with Enter (use Shift+Enter for new line)
                </ToggleWrapper>
              </SettingGroup>
              
              <SettingGroup>
                <SettingLabel>Message Alignment</SettingLabel>
                <RadioGroup>
                  <RadioOption isSelected={localSettings.messageAlignment === 'left'}>
                    <input
                      type="radio"
                      name="messageAlignment"
                      value="left"
                      checked={localSettings.messageAlignment === 'left'}
                      onChange={() => handleChange('messageAlignment', 'left')}
                    />
                    Left
                  </RadioOption>
                  <RadioOption isSelected={localSettings.messageAlignment === 'right'}>
                    <input
                      type="radio"
                      name="messageAlignment"
                      value="right"
                      checked={localSettings.messageAlignment === 'right'}
                      onChange={() => handleChange('messageAlignment', 'right')}
                    />
                    Right
                  </RadioOption>
                </RadioGroup>
              </SettingGroup>
            </div>
          )}
          
          {activeSection === 'interface' && (
            <div>
              <SectionTitle>Interface Settings</SectionTitle>
              
              <SettingGroup>
                <SettingLabel>Layout</SettingLabel>
                <ToggleWrapper>
                  <Toggle checked={localSettings.sidebarAutoCollapse || false}>
                    <input
                      type="checkbox"
                      checked={localSettings.sidebarAutoCollapse || false}
                      onChange={() => handleChange('sidebarAutoCollapse', !localSettings.sidebarAutoCollapse)}
                    />
                    <Slider checked={localSettings.sidebarAutoCollapse || false} />
                  </Toggle>
                  Auto-collapse sidebar when chatting
                </ToggleWrapper>
                
                <ToggleWrapper>
                  <Toggle checked={localSettings.focusMode || false}>
                    <input
                      type="checkbox"
                      checked={localSettings.focusMode || false}
                      onChange={() => handleChange('focusMode', !localSettings.focusMode)}
                    />
                    <Slider checked={localSettings.focusMode || false} />
                  </Toggle>
                  Focus mode (hide UI elements while typing)
                </ToggleWrapper>

                <ToggleWrapper>
                  <Toggle checked={localSettings.showGreeting !== false}>
                    <input
                      type="checkbox"
                      checked={localSettings.showGreeting !== false}
                      onChange={() => handleChange('showGreeting', localSettings.showGreeting === false ? true : false)}
                    />
                    <Slider checked={localSettings.showGreeting !== false} />
                  </Toggle>
                  Show greeting message on empty chat
                </ToggleWrapper>
              </SettingGroup>
              
              <SettingGroup>
                <SettingLabel>Message Bubbles</SettingLabel>
                <RadioGroup>
                  <RadioOption isSelected={localSettings.bubbleStyle === 'modern' || !localSettings.bubbleStyle}>
                    <input
                      type="radio"
                      name="bubbleStyle"
                      value="modern"
                      checked={localSettings.bubbleStyle === 'modern' || !localSettings.bubbleStyle}
                      onChange={() => handleChange('bubbleStyle', 'modern')}
                    />
                    Modern (rounded)
                  </RadioOption>
                  <RadioOption isSelected={localSettings.bubbleStyle === 'classic'}>
                    <input
                      type="radio"
                      name="bubbleStyle"
                      value="classic"
                      checked={localSettings.bubbleStyle === 'classic'}
                      onChange={() => handleChange('bubbleStyle', 'classic')}
                    />
                    Classic (rectangle)
                  </RadioOption>
                  <RadioOption isSelected={localSettings.bubbleStyle === 'minimal'}>
                    <input
                      type="radio"
                      name="bubbleStyle"
                      value="minimal"
                      checked={localSettings.bubbleStyle === 'minimal'}
                      onChange={() => handleChange('bubbleStyle', 'minimal')}
                    />
                    Minimal (no bubbles)
                  </RadioOption>
                </RadioGroup>
              </SettingGroup>
              
              <SettingGroup>
                <SettingLabel>Message Spacing</SettingLabel>
                <RadioGroup>
                  <RadioOption isSelected={localSettings.messageSpacing === 'compact'}>
                    <input
                      type="radio"
                      name="messageSpacing"
                      value="compact"
                      checked={localSettings.messageSpacing === 'compact'}
                      onChange={() => handleChange('messageSpacing', 'compact')}
                    />
                    Compact
                  </RadioOption>
                  <RadioOption isSelected={localSettings.messageSpacing === 'comfortable' || !localSettings.messageSpacing}>
                    <input
                      type="radio"
                      name="messageSpacing"
                      value="comfortable"
                      checked={localSettings.messageSpacing === 'comfortable' || !localSettings.messageSpacing}
                      onChange={() => handleChange('messageSpacing', 'comfortable')}
                    />
                    Comfortable
                  </RadioOption>
                  <RadioOption isSelected={localSettings.messageSpacing === 'spacious'}>
                    <input
                      type="radio"
                      name="messageSpacing"
                      value="spacious"
                      checked={localSettings.messageSpacing === 'spacious'}
                      onChange={() => handleChange('messageSpacing', 'spacious')}
                    />
                    Spacious
                  </RadioOption>
                </RadioGroup>
              </SettingGroup>
            </div>
          )}
          
          {activeSection === 'accessibility' && (
            <div>
              <SectionTitle>Accessibility</SectionTitle>
              
              <SettingGroup>
                <SettingLabel>Visual Comfort</SettingLabel>
                <ToggleWrapper>
                  <Toggle checked={localSettings.highContrast || false}>
                    <input
                      type="checkbox"
                      checked={localSettings.highContrast || false}
                      onChange={() => handleChange('highContrast', !localSettings.highContrast)}
                    />
                    <Slider checked={localSettings.highContrast || false} />
                  </Toggle>
                  High Contrast Mode
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
                  Reduce animations and motion
                </ToggleWrapper>
              </SettingGroup>
              
              <SettingGroup>
                <SettingLabel>Text Spacing</SettingLabel>
                <RadioGroup>
                  <RadioOption isSelected={localSettings.lineSpacing === 'normal' || !localSettings.lineSpacing}>
                    <input
                      type="radio"
                      name="lineSpacing"
                      value="normal"
                      checked={localSettings.lineSpacing === 'normal' || !localSettings.lineSpacing}
                      onChange={() => handleChange('lineSpacing', 'normal')}
                    />
                    Normal
                  </RadioOption>
                  <RadioOption isSelected={localSettings.lineSpacing === 'relaxed'}>
                    <input
                      type="radio"
                      name="lineSpacing"
                      value="relaxed"
                      checked={localSettings.lineSpacing === 'relaxed'}
                      onChange={() => handleChange('lineSpacing', 'relaxed')}
                    />
                    Relaxed
                  </RadioOption>
                  <RadioOption isSelected={localSettings.lineSpacing === 'loose'}>
                    <input
                      type="radio"
                      name="lineSpacing"
                      value="loose"
                      checked={localSettings.lineSpacing === 'loose'}
                      onChange={() => handleChange('lineSpacing', 'loose')}
                    />
                    Loose
                  </RadioOption>
                </RadioGroup>
              </SettingGroup>
            </div>
          )}
          
          {activeSection === 'developer' && adminUser && (
            <div>
              <SectionTitle>Developer</SectionTitle>
              
              <SettingGroup>
                <SettingLabel>Onboarding</SettingLabel>
                <SettingDescription>
                  Reset the onboarding flow for testing purposes. This will show the welcome tutorial again.
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
                  Restart Onboarding
                </SaveButton>
              </SettingGroup>
            </div>
          )}
          
          {activeSection === 'about' && (
            <AboutContainer>
              <SectionTitle>About</SectionTitle>
              
              <LogoContainer>
                <LogoIcon onClick={handleEasterEgg}>
                  <img 
                    src={localSettings.theme === 'lakeside' ? 'https://demo-andromeda.me/static/favicon.png' : '/sculptor.svg'} 
                    alt={localSettings.theme === 'lakeside' ? 'Andromeda Logo' : 'Sculptor Logo'} 
                    style={localSettings.theme === 'lakeside' ? {
                      filter: 'brightness(0) saturate(100%) invert(58%) sepia(53%) saturate(804%) hue-rotate(20deg) brightness(91%) contrast(85%)'
                    } : {}}
                  />
                </LogoIcon>
                <LogoTitle 
                  onClick={handleEasterEgg}
                  style={localSettings.theme === 'lakeside' ? { color: 'rgb(198, 146, 20)' } : {}}
                >
                  {localSettings.theme === 'lakeside' ? 'Andromeda' : 'Sculptor'}
                </LogoTitle>
              </LogoContainer>
              
              <AboutTitle>Made with <RainbowText>Pride</RainbowText></AboutTitle>
              
              <AboutText>From the Andromeda Team, with ❤️</AboutText>
              
              <VersionText>Sculptor Alpha 0.0.6</VersionText>
            </AboutContainer>
          )}
          
          <SaveButton onClick={handleSave}>Save</SaveButton>
        </MainContent>
      </SettingsContainer>
      
      {showTetris && (
        <TetrisGame onExit={handleExitTetris} />
      )}
    </SettingsOverlay>
  );
};

export default NewSettingsPanel; 
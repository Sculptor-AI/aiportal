import React, { useState, useEffect } from 'react';
import styled, { withTheme } from 'styled-components';
import ModelIcon from './ModelIcon'; // Assuming ModelIcon is correctly imported
import { Link, useLocation } from 'react-router-dom';

// Styled Components (Keep all your existing styled components definitions)
const SidebarContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: ${props => props.$collapsed ? '0' : '280px'};
  height: 100%;
  background: ${props => props.theme.sidebar};
  color: ${props => props.theme.text};
  border-right: 1px solid ${props => props.theme.border};
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  position: fixed;
  top: 0;
  left: ${props => props.$collapsed ? '-280px' : '0'};
  z-index: 101;
  opacity: ${props => props.$collapsed ? '0' : '1'};
  transform: translateX(0); /* Removed extra transform to fix alignment */
  
  @media (max-width: 768px) {
    left: ${props => (props.$collapsed ? '-100%' : '0')};
    top: 0;
    width: 100%;
    z-index: 100;
    border-right: none;
    transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
    transform: translateX(0); /* Removed extra transform to fix alignment */
  }
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  padding-left: 6px;

  img {
    height: 26px;
    width: 26px; /* Explicit width */
    margin-right: 10px;
    object-fit: contain; /* Added for better SVG scaling */
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const LogoText = styled.span`
  font-family: 'SegoeUI-Bold', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  font-weight: bold;
  font-size: 20px;
  letter-spacing: 0.5px;
  color: ${props => props.theme.name === 'lakeside' ? 'rgb(198, 146, 20)' : props.theme.text};
  padding-left: 2px;
`;

const CollapseButton = styled.button`
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  color: ${props => props.theme.name === 'lakeside' ? 'rgb(198, 146, 20)' : props.theme.text};
  display: ${props => props.theme.name === 'retro' ? 'none' : 'flex'}; /* Hide for retro theme */
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: ${props => props.$collapsed ? 'fixed' : 'relative'};
  top: ${props => props.$collapsed ? '14px' : '0'};
  left: ${props => props.$collapsed ? '18px' : '0'};
  z-index: 30;
  opacity: 0.7;

  svg {
    width: 18px;
    height: 18px;
    stroke-width: 1.5px;
  }

  &:hover {
    background: ${props => props.$collapsed ? 'transparent' : 'rgba(255,255,255,0.08)'};
    border-radius: ${props => props.$collapsed ? '0' : '6px'};
    opacity: 1;
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const TopBarContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 14px 12px 14px 16px;
  width: 100%;
  justify-content: space-between;
  flex-shrink: 0;

  @media (max-width: 768px) {
    &.mobile-top-bar {
        display: flex !important;
        padding: 14px 12px;
        width: 100%;
        justify-content: space-between;
    }
    &.desktop-top-bar {
        display: none;
    }
  }
`;

const MobileLogoContainer = styled.div`
  display: none; // Hidden by default
  align-items: center;
  margin-right: 10px; // Spacing between logo and toggle button

  img {
    height: 30px;
    margin-right: 5px;
  }

  @media (max-width: 768px) {
    display: flex; // Shown only on mobile
  }
`;

const MobileLogoText = styled.span`
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  font-weight: 600;
  font-size: 16px;
  letter-spacing: 0.5px;
  color: ${props => props.theme.name === 'lakeside' ? 'rgb(198, 146, 20)' : props.theme.text};
`;

const NewChatButton = styled.button`
  background: ${props => {
    if (props.theme.name === 'retro') return props.theme.buttonFace;
    if (props.theme.name === 'lakeside') return 'rgba(198, 146, 20, 0.12)';
    if (props.theme.name === 'dark') return 'rgba(255,255,255,0.05)';
    return '#ffffff';
  }};
  color: ${props => {
    if (props.theme.name === 'lakeside') return 'rgb(198, 146, 20)';
    if (props.theme.name === 'dark') return '#ffffff';
    return '#2d2d2d';
  }};
  border: ${props => {
    if (props.theme.name === 'retro') {
      return `1px solid ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight}`;
    }
    if (props.theme.name === 'lakeside') return '1px solid rgba(198, 146, 20, 0.2)';
    if (props.theme.name === 'dark') return '1px solid rgba(255,255,255,0.1)';
    return '1px solid rgba(0,0,0,0.08)';
  }};
  padding: ${props => props.theme.name === 'retro' ? '8px 15px' : '11px 16px'};
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '10px'};
  font-weight: 400;
  font-size: 14px;
  letter-spacing: -0.01em;
  display: flex;
  align-items: center;
  justify-content: ${props => props.theme.name === 'retro' ? 'flex-start' : 'flex-start'};
  gap: ${props => props.theme.name === 'retro' ? '12px' : '10px'};
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: ${props => {
    if (props.theme.name === 'retro') {
      return `1px 1px 0 0 ${props.theme.buttonHighlightSoft} inset, -1px -1px 0 0 ${props.theme.buttonShadowSoft} inset`;
    }
    if (props.theme.name === 'dark') return '0 1px 3px rgba(0,0,0,0.3)';
    return '0 1px 2px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.02)';
  }};
  margin: 12px 16px 20px;
  width: calc(100% - 32px);
  flex-shrink: 0;
  position: relative;
  overflow: hidden;

  /* Add subtle gradient overlay for depth */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${props => {
      if (props.theme.name === 'retro') return 'none';
      if (props.theme.name === 'dark') return 'linear-gradient(to bottom, rgba(255,255,255,0.03), transparent)';
      return 'linear-gradient(to bottom, rgba(255,255,255,0.8), transparent)';
    }};
    pointer-events: none;
  }

  &:hover {
    background: ${props => {
      if (props.theme.name === 'retro') return props.theme.buttonFace;
      if (props.theme.name === 'lakeside') return 'rgba(198, 146, 20, 0.18)';
      if (props.theme.name === 'dark') return 'rgba(255,255,255,0.08)';
      return '#f8f8f8';
    }};
    transform: ${props => props.theme.name === 'retro' ? 'none' : 'translateY(-0.5px)'};
    box-shadow: ${props => {
      if (props.theme.name === 'retro') {
        return `1px 1px 0 0 ${props.theme.buttonHighlightSoft} inset, -1px -1px 0 0 ${props.theme.buttonShadowSoft} inset`;
      }
      if (props.theme.name === 'dark') return '0 2px 6px rgba(0,0,0,0.4)';
      return '0 2px 5px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)';
    }};
    
    svg {
      transform: scale(1.05);
    }
  }

  &:active {
    ${props => props.theme.name === 'retro' && `
      border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
      box-shadow: -1px -1px 0 0 ${props.theme.buttonHighlightSoft} inset, 1px 1px 0 0 ${props.theme.buttonShadowSoft} inset;
      padding-top: 9px;
      padding-left: 16px;
    `}
    ${props => props.theme.name !== 'retro' && `
      transform: translateY(0);
      box-shadow: ${props.theme.name === 'dark' ? '0 1px 2px rgba(0,0,0,0.4)' : '0 1px 2px rgba(0,0,0,0.1)'};
    `}
  }

  svg {
    position: relative;
    z-index: 1;
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    margin-right: ${props => props.$collapsed ? '0' : (props.theme.name === 'retro' ? '0' : '2px')};
    color: ${props => {
      if (props.theme.name === 'lakeside') return 'rgb(198, 146, 20)';
      if (props.theme.name === 'dark') return '#ffffff';
      return '#2d2d2d';
    }};
    width: ${props => props.theme.name === 'retro' ? '14px' : '18px'};
    height: ${props => props.theme.name === 'retro' ? '14px' : '18px'};
    stroke-width: 2.5;
  }

  span {
    position: relative;
    z-index: 1;
    opacity: ${props => props.$collapsed ? '0' : '1'};
    transform: translateX(0);
    visibility: ${props => props.$collapsed ? 'hidden' : 'visible'};
    white-space: nowrap;
    transition: opacity 0.2s ease, visibility 0.2s;
    transition-delay: ${props => props.$collapsed ? '0s' : '0.05s'};
    ${props => props.theme.name === 'retro' && `
      font-family: 'MSW98UI', 'MS Sans Serif', 'Tahoma', sans-serif;
      font-size: 12px;
    `}
  }

  @media (max-width: 768px) {
    width: auto;
    margin: 0 10px 10px auto;
    padding: ${props => props.theme.name === 'retro' ? '8px 14px' : '10px 16px'};
    border-radius: ${props => props.theme.name === 'retro' ? '0' : '10px'};
    font-size: 14px;
    
    span {
        opacity: 1;
        transform: translateX(0);
        visibility: visible;
        display: inline-block;
    }
    svg {
        margin-right: ${props => props.theme.name === 'retro' ? '10px' : '6px'};
    }
  }
`;

const ScrollableContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-top: 5px;

  .mobile-only {
    display: none !important;
  }

  @media (max-width: 768px) {
    display: ${props => props.$isExpanded ? 'flex' : 'none'};
    overflow-y: auto;
    max-height: calc(40vh - 60px);
    
    .mobile-only {
      display: block !important;
    }
  }
`;

const ChatList = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  padding: 0 ${props => props.$collapsed ? '8px' : '12px'};
  display: flex;
  flex-direction: column;
  align-items: ${props => props.$collapsed ? 'center' : 'stretch'};
  margin-bottom: 10px;
  gap: 4px;

  @media (max-width: 768px) {
     max-height: none;
     padding: 0 12px;
     align-items: stretch;
     flex-grow: 0;
  }

  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.border};
    border-radius: 10px;
  }
`;

const ChatItem = styled.div`
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: ${props => props.$collapsed ? 'center' : 'space-between'};
  background: ${props => {
    if (!props.$active) return 'transparent';
    if (props.theme.name === 'lakeside') return 'rgba(198, 146, 20, 0.1)';
    if (props.theme.name === 'bisexual') return 'rgba(255, 255, 255, 0.15)';
    if (props.theme.name === 'dark') return 'rgba(255, 255, 255, 0.12)';
    return 'rgba(0, 0, 0, 0.06)'; // For light and other themes
  }};
  transition: all 0.15s ease;
  width: 100%;
  height: auto;
  position: relative;
  
  &:hover {
    background: ${props => {
      if (props.$active) {
        if (props.theme.name === 'lakeside') return 'rgba(198, 146, 20, 0.15)';
        if (props.theme.name === 'bisexual') return 'rgba(255, 255, 255, 0.20)';
        if (props.theme.name === 'dark') return 'rgba(255, 255, 255, 0.15)';
        return 'rgba(0, 0, 0, 0.08)'; // For light and other themes active hover
      } else { // Not active, but hovered
        if (props.theme.name === 'lakeside') return 'rgba(198, 146, 20, 0.07)';
        if (props.theme.name === 'bisexual') return 'rgba(255, 255, 255, 0.07)';
        if (props.theme.name === 'dark') return 'rgba(255, 255, 255, 0.07)';
        return 'rgba(0, 0, 0, 0.03)'; // For light and other themes non-active hover
      }
    }};
  }

  /* Special styling for lakeside theme active items */
  ${props => props.theme.name === 'lakeside' && props.$active && `
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      width: 4px;
      background: rgb(198, 146, 20);
      border-radius: 4px 0 0 4px;
    }
  `}

  /* Special styling for dark theme active items */
  ${props => props.theme.name === 'dark' && props.$active && `
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  `}
  
  /* Special styling for light theme active items */
  ${props => props.theme.name === 'light' && props.$active && `
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  `}
  
  /* Common active item styling */
  ${props => props.$active && `
  `}

  @media (max-width: 768px) {
      justify-content: space-between; /* Always space-between on mobile */
  }
`;

const ChatTitle = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1; /* Take available space */
  margin-right: 5px; /* Space before delete button */
  opacity: ${props => props.$collapsed ? '0' : '1'};
  visibility: ${props => props.$collapsed ? 'hidden' : 'visible'};
  transition: opacity 0.2s ease, visibility 0.2s;
  transition-delay: ${props => props.$collapsed ? '0s' : '0.05s'};
  color: ${props => props.theme.name === 'lakeside' ? 'rgb(198, 146, 20)' : 'inherit'};
  font-size: 14px;
  font-weight: 400;

  @media (max-width: 768px) {
      opacity: 1; /* Always visible on mobile */
      visibility: visible;
  }
`;

// New Share Button styled component
const ShareButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.name === 'lakeside' ? 'rgb(198, 146, 20)' : '#888'};
  cursor: pointer;
  padding: 5px;
  display: flex; /* Align icon nicely */
  align-items: center;
  justify-content: center;
  border-radius: 4px; /* Add slight rounding */
  opacity: 0; /* Hidden by default */
  visibility: hidden;
  transition: opacity 0.2s ease, visibility 0.2s ease, background-color 0.2s ease;
  flex-shrink: 0; /* Prevent shrinking */

  /* Show on ChatItem hover only when not collapsed */
  ${ChatItem}:hover & {
      opacity: ${props => props.$collapsed ? '0' : '1'};
      visibility: ${props => props.$collapsed ? 'hidden' : 'visible'};
  }

  &:hover {
    color: ${props => props.theme.name === 'lakeside' ? 'rgb(238, 186, 60)' : '#1e88e5'}; // Different hover color
    background-color: rgba(255, 255, 255, 0.08);
  }

  /* Ensure it's always visible & hoverable on mobile */
  @media (max-width: 768px) {
      opacity: 1;
      visibility: visible;
      ${ChatItem}:hover & { /* Keep styles consistent */
          opacity: 1;
          visibility: visible;
      }
  }
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.name === 'lakeside' ? 'rgb(198, 146, 20)' : '#888'};
  cursor: pointer;
  padding: 5px;
  display: flex; /* Align icon nicely */
  align-items: center;
  justify-content: center;
  border-radius: 4px; /* Add slight rounding */
  opacity: 0; /* Hidden by default */
  visibility: hidden;
  transition: opacity 0.2s ease, visibility 0.2s ease, background-color 0.2s ease;
  flex-shrink: 0; /* Prevent shrinking */

  /* Show on ChatItem hover only when not collapsed */
  ${ChatItem}:hover & {
      opacity: ${props => props.$collapsed ? '0' : '1'};
      visibility: ${props => props.$collapsed ? 'hidden' : 'visible'};
  }

  &:hover {
    color: ${props => props.theme.name === 'lakeside' ? 'rgb(238, 186, 60)' : '#d32f2f'};
    background-color: rgba(255, 255, 255, 0.08); /* Slight background on hover */
  }

  /* Ensure it's always visible & hoverable on mobile */
  @media (max-width: 768px) {
      opacity: 1;
      visibility: visible;
      ${ChatItem}:hover & { /* Keep styles consistent */
          opacity: 1;
          visibility: visible;
      }
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px; /* Space between buttons */
  flex-shrink: 0;

  /* Control visibility based on parent hover */
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease, visibility 0.2s ease;

  ${ChatItem}:hover & {
      opacity: ${props => props.$collapsed ? '0' : '1'};
      visibility: ${props => props.$collapsed ? 'hidden' : 'visible'};
  }

  /* Ensure buttons are always visible on mobile */
  @media (max-width: 768px) {
      opacity: 1;
      visibility: visible;
      ${ChatItem}:hover & {
          opacity: 1;
          visibility: visible;
      }
  }
`;

const BottomSection = styled.div`
  padding: ${props => props.$collapsed ? '10px 5px' : '15px'};
  border-top: 1px solid ${props => props.theme.border};
  margin-top: auto; /* Push to bottom */
  flex-shrink: 0; /* Prevent shrinking */

  /* Remove border and adjust padding for mobile view within ScrollableContent */
  @media (max-width: 768px) {
      border-top: none;
      padding: 10px 15px; /* Consistent padding */
  }
`;

const SectionHeader = styled.div`
  padding: 0 16px;
  margin-top: 8px;
  margin-bottom: 8px;
  font-size: 12px;
  text-transform: uppercase;
  color: ${props => props.theme.name === 'lakeside' ? 'rgb(198, 146, 20)' : props.theme.text};
  opacity: ${props => props.$collapsed ? '0' : (props.theme.name === 'lakeside' ? '1' : '0.7')};
  visibility: ${props => props.$collapsed ? 'hidden' : 'visible'};
  transition: opacity 0.2s ease, visibility 0.2s;
  transition-delay: ${props => props.$collapsed ? '0s' : '0.05s'};

  @media (max-width: 768px) {
      opacity: ${props => props.theme.name === 'lakeside' ? '1' : '0.7'};
      visibility: visible;
      margin-top: 4px; /* Reduced since mobile has its own new chat/search section */
  }
`;

const ModelDropdownContainer = styled.div`
  position: relative;
  width: 100%;
  padding: 5px 15px; /* Match button horizontal padding */

  @media (max-width: 768px) {
    padding: 0 10px 10px; /* Adjust padding */
  }
`;

const ModelDropdownButton = styled.button`
  width: 100%;
  background: ${props => props.theme.name === 'lakeside' ? 'rgba(91, 0, 25, 1)' : props.theme.inputBackground};
  border: 1px solid ${props => props.theme.name === 'lakeside' ? 'rgba(198, 146, 20, 0.3)' : props.theme.border};
  border-radius: 12px;
  padding: ${props => props.$collapsed ? '8px' : '10px 12px'}; /* Adjust padding */
  display: flex;
  align-items: center;
  justify-content: ${props => props.$collapsed ? 'center' : 'space-between'};
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 38px; /* Ensure consistent height */
  color: ${props => props.theme.name === 'lakeside' ? 'rgb(198, 146, 20)' : props.theme.text};

  &:hover {
    border-color: ${props => props.theme.name === 'lakeside' ? 'rgb(198, 146, 20)' : props.theme.border};
  }

  /* Icon and text container */
  > div {
      display: flex;
      align-items: center;
      gap: 8px; /* Space between icon and text */
      overflow: hidden; /* Prevent text overflow issues */
  }

  /* Dropdown arrow */
  > svg:last-child {
      transition: transform 0.2s;
      transform: ${props => props.$isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
      flex-shrink: 0; /* Prevent arrow shrinking */
      opacity: ${props => props.$collapsed ? '0' : '1'};
      visibility: ${props => props.$collapsed ? 'hidden' : 'visible'};
  }

  @media (max-width: 768px) {
      justify-content: space-between; /* Always space-between */
      padding: 10px 12px; /* Consistent padding */
       > svg:last-child { /* Ensure arrow is always visible */
           opacity: 1;
           visibility: visible;
       }
  }
`;

const ModelDropdownText = styled.span`
  opacity: ${props => props.$collapsed ? '0' : '1'};
  visibility: ${props => props.$collapsed ? 'hidden' : 'visible'};
  transition: opacity 0.2s ease, visibility 0.2s;
  transition-delay: ${props => props.$collapsed ? '0s' : '0.05s'};
  color: ${props => props.theme.name === 'lakeside' ? 'rgb(198, 146, 20)' : props.theme.text};
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 768px) {
      opacity: 1; /* Always visible on mobile */
      visibility: visible;
  }
`;

const ModelDropdownContent = styled.div`
  position: absolute;
  bottom: calc(100% + 5px); /* Position above the button with gap */
  left: 15px; /* Align with container padding */
  right: 15px; /* Align with container padding */
  background: ${props => props.theme.name === 'lakeside' ? 'rgba(91, 0, 25, 1)' : props.theme.inputBackground};
  border-radius: 12px;
  border: 1px solid ${props => props.theme.name === 'lakeside' ? 'rgba(198, 146, 20, 0.3)' : props.theme.border}; /* Add border */
  z-index: 30;
  overflow: hidden;
  max-height: 200px; /* Limit height */
  overflow-y: auto; /* Allow scrolling if needed */
  display: ${props => props.$isOpen ? 'block' : 'none'};
  animation: fadeIn 0.2s ease;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 768px) {
      left: 10px;
      right: 10px;
      /* Consider positioning below on mobile if space is limited */
      /* bottom: auto; top: calc(100% + 5px); */
  }
`;

const ModelOption = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  margin: 4px; /* Add margin around options */
  cursor: pointer;
  transition: background 0.2s ease;
  background: ${props => {
    if (props.$isSelected) {
      return props.theme.name === 'lakeside' ? 'rgba(198, 146, 20, 0.15)' : 'rgba(255,255,255,0.1)';
    }
    return 'transparent';
  }};
  border-radius: 8px; /* Match dropdown button */
  color: ${props => props.theme.name === 'lakeside' ? 'rgb(198, 146, 20)' : props.theme.text};

  &:hover {
    background: ${props => props.theme.name === 'lakeside' ? 'rgba(198, 146, 20, 0.1)' : 'rgba(255,255,255,0.05)'};
  }
`;

const ModelInfo = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Prevent text overflow */
  opacity: ${props => props.$collapsed ? '0' : '1'};
  visibility: ${props => props.$collapsed ? 'hidden' : 'visible'};
  transition: opacity 0.2s ease, visibility 0.2s;
  transition-delay: ${props => props.$collapsed ? '0s' : '0.05s'};

  @media (max-width: 768px) {
      opacity: 1; /* Always visible on mobile */
      visibility: visible;
  }
`;

const ModelName = styled.span`
  font-weight: ${props => props.$isSelected ? '600' : '400'};
  color: ${props => props.theme.name === 'lakeside' ? 'rgb(198, 146, 20)' : props.theme.text};
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ModelDescription = styled.span`
  font-size: 0.8rem;
  color: ${props => props.theme.name === 'lakeside' ? 'rgba(198, 146, 20, 0.7)' : `${props.theme.text}80`};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SidebarButton = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 12px;
  background: transparent;
  border: none;
  border-radius: 10px;
  color: ${props => props.theme.name === 'lakeside' ? 'rgb(198, 146, 20)' : props.theme.text};
  font-size: 14px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.2s ease;
  justify-content: flex-start;
  
  &:hover {
    background: ${props => props.theme.name === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.03)'};
  }
  
  svg {
    margin-right: 10px;
    width: 18px;
    height: 18px;
    opacity: 0.8;
    color: ${props => props.theme.name === 'lakeside' ? 'rgb(198, 146, 20)' : 'currentColor'};
  }
`;

const ProfileButton = styled(SidebarButton)`
 /* Inherits styles from SidebarButton */
 /* No specific overrides needed based on current styles */
`;

// Mobile dropdown toggle button
const MobileToggleButton = styled.button`
  display: none; // Hidden by default
  background: transparent;
  border: none;
  color: ${props => props.theme.name === 'lakeside' ? 'rgb(198, 146, 20)' : props.theme.text};
  border-radius: 4px;
  width: 36px;
  height: 36px;
  cursor: pointer;
  transition: all 0.2s ease;
  align-items: center;
  justify-content: center;

  @media (max-width: 768px) {
    display: ${props => props.theme.name === 'retro' ? 'none' : 'flex'}; // Hide in retro theme on mobile
    margin-left: 8px; /* Add space from logo */
  }

  &:hover {
    background: rgba(255,255,255,0.05);
  }

  svg {
    transition: transform 0.3s ease;
    transform: ${props => props.$isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'};
  }
`;

const SidebarSection = styled.div`
  border-top: 1px solid ${props => 
    props.theme.name === 'lakeside' ? 'rgba(198, 146, 20, 0.3)' : 
    (props.theme.name === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)')};
  padding: 8px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const NavLink = styled(Link)`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 12px;
  background: transparent;
  border: none;
  border-radius: 10px;
  color: ${props => props.theme.name === 'lakeside' ? 'rgb(198, 146, 20)' : props.theme.text};
  font-size: 14px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.2s ease;
  justify-content: flex-start;
  text-decoration: none;
  
  &:hover {
    background: ${props => props.theme.name === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.03)'};
  }
  
  svg {
    margin-right: 10px;
    width: 18px;
    height: 18px;
    opacity: 0.8;
    color: ${props => props.theme.name === 'lakeside' ? 'rgb(198, 146, 20)' : 'currentColor'};
  }
`;

const SearchInputContainer = styled.div`
  padding: 8px 16px;
  margin-bottom: 8px;
  display: ${props => props.$isSearching ? 'block' : 'none'};
  animation: slideDown 0.2s ease;

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const SearchInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  background: ${props => 
    props.theme.name === 'lakeside' ? 'rgba(91, 0, 25, 1)' : 
    props.theme.inputBackground};
  border: 1px solid ${props => 
    props.theme.name === 'lakeside' ? 'rgba(198, 146, 20, 0.3)' : 
    props.theme.border};
  border-radius: 10px;
  overflow: hidden;
  transition: border-color 0.2s ease;

  &:focus-within {
    border-color: ${props => 
      props.theme.name === 'lakeside' ? 'rgb(198, 146, 20)' : 
      props.theme.text};
  }
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 10px 12px;
  background: transparent;
  border: none;
  outline: none;
  color: ${props => 
    props.theme.name === 'lakeside' ? 'rgb(198, 146, 20)' : 
    props.theme.text};
  font-size: 14px;

  &::placeholder {
    color: ${props => 
      props.theme.name === 'lakeside' ? 'rgba(198, 146, 20, 0.5)' : 
      `${props.theme.text}66`};
  }
`;

const SearchCloseButton = styled.button`
  background: none;
  border: none;
  padding: 8px 12px;
  cursor: pointer;
  color: ${props => 
    props.theme.name === 'lakeside' ? 'rgba(198, 146, 20, 0.7)' : 
    `${props.theme.text}66`};
  transition: color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: ${props => 
      props.theme.name === 'lakeside' ? 'rgb(198, 146, 20)' : 
      props.theme.text};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const NoResultsMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: ${props => 
    props.theme.name === 'lakeside' ? 'rgba(198, 146, 20, 0.7)' : 
    `${props.theme.text}66`};
  font-size: 14px;
`;

// --- React Component ---

const Sidebar = ({
  chats = [], // Default to empty array
  activeChat,
  setActiveChat,
  createNewChat,
  deleteChat,
  availableModels = [], // Default to empty array
  selectedModel,
  setSelectedModel,
  toggleSettings,
  toggleProfile,
  isLoggedIn,
  username,
  isAdmin = false,
  collapsed: $collapsed,
  setCollapsed,
  theme
}) => {
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [showHamburger, setShowHamburger] = useState(true); // Show hamburger
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();

  // Ensure sidebar is always expanded in retro theme
  useEffect(() => {
    if (theme && theme.name === 'retro' && $collapsed) {
      setCollapsed(false);
    }
  }, [theme, $collapsed, setCollapsed]);

  // Toggle mobile content visibility
  const toggleMobileExpanded = () => {
    setIsMobileExpanded(!isMobileExpanded);
  };

  // Toggle desktop sidebar collapsed state
  const toggleCollapsed = () => {
    // Don't allow collapsing if retro theme
    if (theme && theme.name === 'retro') return;
    
    const newState = !$collapsed;
    setCollapsed(newState);
    setIsModelDropdownOpen(false); // Close dropdown when collapsing/expanding

    // Hamburger visibility logic for transition
    if (!newState) { // If expanding
      // No special logic needed on expand
    } else { // If collapsing
      setShowHamburger(false);
      setTimeout(() => setShowHamburger(true), 300); // Show after transition duration
    }
  };

  // Handle model selection from dropdown
  const handleSelectModel = (modelId) => {
    setSelectedModel(modelId);
    setIsModelDropdownOpen(false); // Close dropdown after selection
  };

  // Find the currently selected model object for display
  const currentModel = availableModels.find(m => m.id === selectedModel);

  // Handle sharing a chat
  const handleShareChat = async (chatId) => {
    // Updated share functionality: copy a static link to the clipboard
    const shareUrl = `${window.location.origin}/share-view?id=${chatId}`; // Use query param for ID
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Static share link copied to clipboard! You need to implement the /share-view route.');
    } catch (err) {
      console.error('Failed to copy share link: ', err);
      alert('Could not copy share link.');
    }
  };

  // Handle search functionality
  const handleSearchClick = () => {
    setIsSearching(true);
    setSearchTerm('');
  };

  const handleSearchClose = () => {
    setIsSearching(false);
    setSearchTerm('');
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter chats based on search term
  const filteredChats = chats.filter(chat => {
    if (!searchTerm) return true;
    const chatTitle = chat.title || `Chat ${chat.id.substring(0, 4)}`;
    return chatTitle.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <>
      {/* Main Sidebar container */}
      <SidebarContainer $isExpanded={isMobileExpanded} $collapsed={theme && theme.name === 'retro' ? false : $collapsed}>
        {/* Top Bar for Desktop */}
        <TopBarContainer className="desktop-top-bar" style={{ padding: '20px 15px 10px 15px', alignItems: 'center' }}>
           <LogoContainer>
             <img 
               src={'/images/sculptor.svg'} 
               alt={'Sculptor AI'} 
             />
             <LogoText>{'Sculptor'}</LogoText>
           </LogoContainer>
           
           {/* Left Collapse Button (now on the right) - hidden for retro theme */}
           {!$collapsed && theme && theme.name !== 'retro' && (
             <CollapseButton 
               onClick={toggleCollapsed} 
               $collapsed={$collapsed} 
               title="Collapse Sidebar"
               style={{ marginLeft: 'auto' }}>
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                 <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line>
               </svg>
             </CollapseButton>
           )}
        </TopBarContainer>
        
        {/* New Chat and Search Buttons Section */}
        {(!$collapsed || (theme && theme.name === 'retro')) && (
          <SidebarSection style={{ paddingTop: '8px', paddingBottom: '8px', borderTop: 'none' }}>
            <SidebarButton onClick={createNewChat}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
              <span>New chat</span>
            </SidebarButton>
            
            <SidebarButton onClick={handleSearchClick}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <span>Search chats</span>
            </SidebarButton>
          </SidebarSection>
        )}

        {/* Search Input Section */}
        {(!$collapsed || (theme && theme.name === 'retro')) && (
          <SearchInputContainer $isSearching={isSearching}>
            <SearchInputWrapper>
              <SearchInput
                type="text"
                placeholder="Search your chats..."
                value={searchTerm}
                onChange={handleSearchChange}
                autoFocus
              />
              <SearchCloseButton onClick={handleSearchClose}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </SearchCloseButton>
            </SearchInputWrapper>
          </SearchInputContainer>
        )}

        {/* --- Navigation Section --- */}
        {(!$collapsed || (theme && theme.name === 'retro')) && (
          <SidebarSection style={{ paddingTop: '8px', paddingBottom: '16px', borderTop: 'none' }}>
            {location.pathname !== '/' && (
              <NavLink to="/">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>Chat</span>
              </NavLink>
            )}
            {location.pathname !== '/media' && (
              <NavLink to="/media">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                <span>Media</span>
              </NavLink>
            )}
            {location.pathname !== '/news' && (
              <NavLink to="/news">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                </svg>
                <span>News</span>
              </NavLink>
            )}
            {location.pathname !== '/projects' && (
              <NavLink to="/projects">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1"></rect>
                  <rect x="14" y="3" width="7" height="7" rx="1"></rect>
                  <rect x="3" y="14" width="7" height="7" rx="1"></rect>
                  <rect x="14" y="14" width="7" height="7" rx="1"></rect>
                </svg>
                <span>Projects</span>
              </NavLink>
            )}
            {location.pathname !== '/workspace' && (
              <NavLink to="/workspace">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
                <span>Workspace</span>
              </NavLink>
            )}
            {isAdmin && location.pathname !== '/admin' && (
              <NavLink to="/admin">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                <span>Admin</span>
              </NavLink>
            )}
          </SidebarSection>
        )}

        {/* Top Bar for Mobile (Logo + Expander) */}
        <TopBarContainer className="mobile-top-bar" style={{ display: 'none' }}> {/* Managed by CSS */}
          <MobileLogoContainer>
            <img 
              src={'/images/sculptor.svg'} 
              alt={'Sculptor AI'} 
            />
            <MobileLogoText>{'Sculptor'}</MobileLogoText>
          </MobileLogoContainer>
          {/* Toggle Button */}
          <MobileToggleButton
              onClick={toggleMobileExpanded}
              $isExpanded={isMobileExpanded}
              title={isMobileExpanded ? "Collapse Menu" : "Expand Menu"}
              style={{ marginLeft: 'auto' }}
          >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                 {isMobileExpanded
                   ? <polyline points="18 15 12 9 6 15"></polyline> // Up arrow
                   : <polyline points="6 9 12 15 18 9"></polyline> // Down arrow
                 }
              </svg>
          </MobileToggleButton>
        </TopBarContainer>


        {/* --- START: Main content area (Scrollable + Bottom fixed) --- */}
        {/* This fragment wrapper is crucial for the original error fix */}
        {(!$collapsed || (theme && theme.name === 'retro')) && (
          <>
            {/* Scrollable Area (Models, Chats) */}
            <ScrollableContent $isExpanded={isMobileExpanded || (theme && theme.name === 'retro')}>
              
              {/* New Chat and Search Buttons for Mobile */}
              <div className="mobile-only" style={{ display: 'none' }}>
                <SidebarSection style={{ paddingTop: '8px', paddingBottom: '8px', borderTop: 'none' }}>
                  <SidebarButton onClick={createNewChat}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                    <span>New chat</span>
                  </SidebarButton>
                  
                  <SidebarButton onClick={handleSearchClick}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <span>Search chats</span>
                  </SidebarButton>
                </SidebarSection>

                {/* Search Input for Mobile */}
                <SearchInputContainer $isSearching={isSearching}>
                  <SearchInputWrapper>
                    <SearchInput
                      type="text"
                      placeholder="Search your chats..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      autoFocus
                    />
                    <SearchCloseButton onClick={handleSearchClose}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </SearchCloseButton>
                  </SearchInputWrapper>
                </SearchInputContainer>
              </div>

              {/* Models Section removed as requested */}

              {/* Section header for chats */}
              <SectionHeader $collapsed={$collapsed}>
                Chats
              </SectionHeader>

              {/* --- Chats Section --- */}
              <ChatList $collapsed={$collapsed}>
                {filteredChats.length === 0 && searchTerm && (
                  <NoResultsMessage>
                    No chats found for "{searchTerm}"
                  </NoResultsMessage>
                )}
                {filteredChats.map(chat => (
                  <ChatItem
                    key={chat.id}
                    $active={activeChat === chat.id}
                    onClick={() => setActiveChat(chat.id)}
                    $collapsed={$collapsed}
                    title={chat.title || `Chat ${chat.id.substring(0, 4)}`}
                  >
                    {/* TODO: Add chat icon if desired */}
                    <ChatTitle $collapsed={$collapsed}>{chat.title || `Chat ${chat.id.substring(0, 4)}`}</ChatTitle>
                    {/* Container for action buttons */}
                    <ButtonContainer $collapsed={$collapsed}>
                      <ShareButton
                        title="Share Chat"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent chat selection
                          handleShareChat(chat.id);
                        }}
                        $collapsed={$collapsed}
                      >
                        {/* Share Icon (Feather Icons) */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                          <polyline points="16 6 12 2 8 6"></polyline>
                          <line x1="12" y1="2" x2="12" y2="15"></line>
                        </svg>
                      </ShareButton>
                      <DeleteButton
                        title="Delete Chat"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent chat selection
                          deleteChat(chat.id);
                        }}
                        $collapsed={$collapsed}
                      >
                        {/* Trash Icon (Feather Icons) */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1-2-2h4a2 2 0 0 1-2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </DeleteButton>
                    </ButtonContainer>
                  </ChatItem>
                ))}
              </ChatList>
              {/* Display copy status message */}
              {copyStatus && <div style={{ padding: '5px 10px', fontSize: '11px', color: '#aaa', textAlign: 'center' }}>{copyStatus}</div>}
            </ScrollableContent>

            {/* --- Bottom Buttons Section (Profile, Settings) --- */}
            {/* Rendered outside ScrollableContent to stick to bottom */}
            <SidebarSection>
                {/* Profile / Sign In Button */}
                <SidebarButton
                  onClick={toggleProfile}
                  title={isLoggedIn ? `View profile: ${username}` : "Sign In"}
                >
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                     <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>
                   </svg>
                   <span>{isLoggedIn ? username : 'Sign In'}</span>
                </SidebarButton>

                {/* Settings Button */}
                <SidebarButton onClick={toggleSettings} title="Open Settings">
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                     <circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                   </svg>
                   <span>Settings</span>
                </SidebarButton>
              </SidebarSection>
          </>
        )}
        {/* --- END: Main content area --- */}

      </SidebarContainer>
    </>
  );
};

// Wrap our component with withTheme HOC to access the theme context
export default withTheme(Sidebar);

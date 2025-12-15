import React, { useState, useEffect } from 'react';
import styled, { withTheme } from 'styled-components';
import ModelIcon from './ModelIcon'; // Assuming ModelIcon is correctly imported
import { Link, useLocation } from 'react-router-dom';

// Styled Components - Updated for Grok.com-inspired design
const SidebarContainer = styled.div.attrs({ 'data-shadow': 'sidebar' })`
  display: flex;
  flex-direction: column;
  width: ${props => props.$collapsed ? '0' : '280px'};
  height: ${props => props.$sidebarStyle === 'traditional' ? '100vh' : 'calc(100vh - 40px)'};
  background: ${props => props.theme.sidebar};
  color: ${props => props.theme.text};
  border: ${props => props.$sidebarStyle === 'traditional' ? 'none' : `1px solid ${props.theme.border}`};
  border-right: ${props => props.$sidebarStyle === 'traditional' ? `1px solid ${props.theme.border}` : 'none'};
  border-radius: ${props => props.$sidebarStyle === 'traditional' ? '0' : '20px'};
  overflow: hidden;
  transition: all 0.3s ease;
  position: fixed;
  top: ${props => props.$sidebarStyle === 'traditional' ? '0' : '20px'};
  left: ${props => {
    if (props.$collapsed) {
      return '-280px';
    }
    return props.$sidebarStyle === 'traditional' ? '0' : '20px';
  }};
  z-index: 101;
  opacity: ${props => props.$collapsed ? '0' : '1'};
  box-shadow: ${props => props.$sidebarStyle === 'traditional' ? 'none' : '0 8px 28px rgba(0, 0, 0, 0.16)'};
  
  @media (max-width: 768px) {
    left: ${props => (props.$collapsed ? '-100%' : '0')};
    top: 0;
    width: 100%;
    height: 100vh;
    z-index: 100;
    border: none;
    border-radius: 0;
    box-shadow: none;
    transition: all 0.3s ease;
  }
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 0 6px;

  img {
    height: 32px;
    width: 32px;
    object-fit: contain;
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const LogoText = styled.span`
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-weight: 600;
  font-size: 18px;
  color: ${props => props.theme.name === 'lakeside' ? 'rgb(198, 146, 20)' : props.theme.text};
`;

const CollapseButton = styled.button`
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  color: ${props => props.theme.name === 'lakeside' ? 'rgb(198, 146, 20)' : props.theme.text};
  display: ${props => props.theme.name === 'retro' ? 'none' : 'flex'};
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: ${props => props.$collapsed ? 'fixed' : 'relative'};
  top: ${props => props.$collapsed ? '16px' : '0'};
  left: ${props => props.$collapsed ? '16px' : '0'};
  z-index: 30;
  opacity: 0.6;
  border-radius: 4px;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    background: ${props => props.theme.name === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'};
    opacity: 1;
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const TopBarContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 16px 16px 12px 16px;
  width: 100%;
  justify-content: space-between;
  flex-shrink: 0;

  @media (max-width: 768px) {
    &.mobile-top-bar {
        display: flex !important;
        padding: 16px;
        width: 100%;
        justify-content: space-between;
    }
    &.desktop-top-bar {
        display: none;
    }
  }
`;

const MobileLogoContainer = styled.div`
  display: none;
  align-items: center;
  margin-right: 10px;

  img {
    height: 32px;
  }

  @media (max-width: 768px) {
    display: flex;
  }
`;

const MobileLogoText = styled.span`
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-weight: 600;
  font-size: 16px;
  color: ${props => props.theme.name === 'lakeside' ? 'rgb(198, 146, 20)' : props.theme.text};
`;

const NewChatButton = styled.button`
  background: ${props => {
    if (props.theme.name === 'retro') return props.theme.buttonFace;
    if (props.theme.name === 'lakeside') return 'rgba(198, 146, 20, 0.1)';
    if (props.theme.name === 'dark') return 'rgba(255,255,255,0.06)';
    return 'rgba(0,0,0,0.03)';
  }};
  color: ${props => {
    if (props.theme.name === 'lakeside') return 'rgb(198, 146, 20)';
    return props.theme.text;
  }};
  border: ${props => {
    if (props.theme.name === 'retro') {
      return `1px solid ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight}`;
    }
    return '1px solid rgba(0,0,0,0.06)';
  }};
  padding: ${props => props.theme.name === 'retro' ? '8px 15px' : '10px 12px'};
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '6px'};
  font-weight: 400;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  transition: all 0.2s ease;
  margin: 0 16px 16px;
  width: calc(100% - 32px);
  flex-shrink: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  &:hover {
    background: ${props => {
    if (props.theme.name === 'retro') return props.theme.buttonFace;
    if (props.theme.name === 'lakeside') return 'rgba(198, 146, 20, 0.15)';
    if (props.theme.name === 'dark') return 'rgba(255,255,255,0.1)';
    return 'rgba(0,0,0,0.06)';
  }};
    cursor: pointer;
  }

  &:active {
    transform: translateY(1px);
  }

  svg {
    width: 16px;
    height: 16px;
    opacity: 0.8;
  }

  span {
    opacity: ${props => props.$collapsed ? '0' : '1'};
    visibility: ${props => props.$collapsed ? 'hidden' : 'visible'};
    transition: opacity 0.2s ease;
  }

  @media (max-width: 768px) {
    width: auto;
    margin: 0 10px 10px auto;
    padding: 10px 12px;
    
    span {
        opacity: 1;
        visibility: visible;
    }
  }
`;

const ScrollableContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;

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
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  margin-bottom: 8px;
  gap: 2px;

  @media (max-width: 768px) {
     max-height: none;
     padding: 0 16px;
     flex-grow: 0;
  }

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.border};
    border-radius: 2px;
  }
`;

const ChatItem = styled.div`
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${props => {
    if (!props.$active) return 'transparent';
    if (props.theme.name === 'lakeside') return 'rgba(198, 146, 20, 0.1)';
    if (props.theme.name === 'dark') return 'rgba(255, 255, 255, 0.08)';
    return 'rgba(0, 0, 0, 0.04)';
  }};
  transition: all 0.2s ease;
  width: 100%;
  position: relative;
  
  &:hover {
    background: ${props => {
    if (props.$active) {
      if (props.theme.name === 'lakeside') return 'rgba(198, 146, 20, 0.15)';
      if (props.theme.name === 'dark') return 'rgba(255, 255, 255, 0.12)';
      return 'rgba(0, 0, 0, 0.06)';
    } else {
      if (props.theme.name === 'lakeside') return 'rgba(198, 146, 20, 0.05)';
      if (props.theme.name === 'dark') return 'rgba(255, 255, 255, 0.04)';
      return 'rgba(0, 0, 0, 0.02)';
    }
  }};
  }

  @media (max-width: 768px) {
      justify-content: space-between;
  }
`;

const ChatTitle = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  margin-right: 8px;
  opacity: ${props => props.$collapsed ? '0' : '1'};
  visibility: ${props => props.$collapsed ? 'hidden' : 'visible'};
  transition: opacity 0.2s ease;
  color: ${props => props.theme.name === 'lakeside' ? 'rgb(198, 146, 20)' : 'inherit'};
  font-size: 14px;
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  @media (max-width: 768px) {
      opacity: 1;
      visibility: visible;
  }
`;

const ShareButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.name === 'lakeside' ? 'rgb(198, 146, 20)' : props.theme.text};
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  flex-shrink: 0;

  ${ChatItem}:hover & {
      opacity: ${props => props.$collapsed ? '0' : '0.6'};
      visibility: ${props => props.$collapsed ? 'hidden' : 'visible'};
  }

  &:hover {
    opacity: 1 !important;
    background-color: ${props => props.theme.name === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'};
  }

  @media (max-width: 768px) {
      opacity: 0.6;
      visibility: visible;
  }
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.name === 'lakeside' ? 'rgb(198, 146, 20)' : props.theme.text};
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  flex-shrink: 0;

  ${ChatItem}:hover & {
      opacity: ${props => props.$collapsed ? '0' : '0.6'};
      visibility: ${props => props.$collapsed ? 'hidden' : 'visible'};
  }

  &:hover {
    opacity: 1 !important;
    background-color: ${props => props.theme.name === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'};
  }

  @media (max-width: 768px) {
      opacity: 0.6;
      visibility: visible;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;

  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease, visibility 0.2s ease;

  ${ChatItem}:hover & {
      opacity: ${props => props.$collapsed ? '0' : '1'};
      visibility: ${props => props.$collapsed ? 'hidden' : 'visible'};
  }

  @media (max-width: 768px) {
      opacity: 1;
      visibility: visible;
  }
`;

const BottomSection = styled.div`
  padding: ${props => props.$collapsed ? '8px' : '12px 16px'};
  margin-top: auto;
  flex-shrink: 0;

  @media (max-width: 768px) {
      padding: 8px 16px;
  }
`;

const SectionHeader = styled.div`
  padding: 0 16px;
  margin: 12px 0 8px 0;
  font-size: 11px;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: ${props => props.theme.name === 'lakeside' ? 'rgb(198, 146, 20)' : props.theme.text};
  opacity: ${props => props.$collapsed ? '0' : '0.6'};
  visibility: ${props => props.$collapsed ? 'hidden' : 'visible'};
  transition: opacity 0.2s ease;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  @media (max-width: 768px) {
      opacity: 0.6;
      visibility: visible;
  }
`;

const ModelDropdownContainer = styled.div`
  position: relative;
  width: 100%;
  padding: 8px 16px;

  @media (max-width: 768px) {
    padding: 0 16px 8px;
  }
`;

const ModelDropdownButton = styled.button`
  width: 100%;
  background: ${props => props.theme.name === 'lakeside' ? 'rgba(91, 0, 25, 1)' : props.theme.inputBackground};
  border: 1px solid ${props => props.theme.border};
  border-radius: 6px;
  padding: ${props => props.$collapsed ? '8px' : '8px 12px'};
  display: flex;
  align-items: center;
  justify-content: ${props => props.$collapsed ? 'center' : 'space-between'};
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 36px;
  color: ${props => props.theme.name === 'lakeside' ? 'rgb(198, 146, 20)' : props.theme.text};
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  &:hover {
    border-color: ${props => props.theme.name === 'lakeside' ? 'rgb(198, 146, 20)' : props.theme.text};
    background: ${props => props.theme.name === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'};
  }

  > div {
      display: flex;
      align-items: center;
      gap: 8px;
      overflow: hidden;
  }

  > svg:last-child {
      transition: transform 0.2s;
      transform: ${props => props.$isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
      flex-shrink: 0;
      opacity: ${props => props.$collapsed ? '0' : '1'};
      visibility: ${props => props.$collapsed ? 'hidden' : 'visible'};
  }

  @media (max-width: 768px) {
      justify-content: space-between;
      padding: 8px 12px;
       > svg:last-child {
           opacity: 1;
           visibility: visible;
       }
  }
`;

const ModelDropdownText = styled.span`
  opacity: ${props => props.$collapsed ? '0' : '1'};
  visibility: ${props => props.$collapsed ? 'hidden' : 'visible'};
  transition: opacity 0.2s ease;
  color: ${props => props.theme.name === 'lakeside' ? 'rgb(198, 146, 20)' : props.theme.text};
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 768px) {
      opacity: 1;
      visibility: visible;
  }
`;

const ModelDropdownContent = styled.div`
  position: absolute;
  bottom: calc(100% + 8px);
  left: 16px;
  right: 16px;
  background: ${props => props.theme.name === 'lakeside' ? 'rgba(91, 0, 25, 1)' : props.theme.inputBackground};
  border-radius: 6px;
  border: 1px solid ${props => props.theme.border};
  z-index: 30;
  overflow: hidden;
  max-height: 200px;
  overflow-y: auto;
  display: ${props => props.$isOpen ? 'block' : 'none'};
  animation: fadeIn 0.2s ease;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 768px) {
      left: 16px;
      right: 16px;
  }
`;

const ModelOption = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin: 2px;
  cursor: pointer;
  transition: background 0.2s ease;
  background: ${props => {
    if (props.$isSelected) {
      return props.theme.name === 'lakeside' ? 'rgba(198, 146, 20, 0.1)' : 'rgba(0,0,0,0.06)';
    }
    return 'transparent';
  }};
  border-radius: 4px;
  color: ${props => props.theme.name === 'lakeside' ? 'rgb(198, 146, 20)' : props.theme.text};

  &:hover {
    background: ${props => props.theme.name === 'lakeside' ? 'rgba(198, 146, 20, 0.08)' : 'rgba(0,0,0,0.04)'};
  }
`;

const ModelInfo = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  opacity: ${props => props.$collapsed ? '0' : '1'};
  visibility: ${props => props.$collapsed ? 'hidden' : 'visible'};
  transition: opacity 0.2s ease;

  @media (max-width: 768px) {
      opacity: 1;
      visibility: visible;
  }
`;

const ModelName = styled.span`
  font-weight: ${props => props.$isSelected ? '500' : '400'};
  color: ${props => props.theme.name === 'lakeside' ? 'rgb(198, 146, 20)' : props.theme.text};
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const ModelDescription = styled.span`
  font-size: 12px;
  color: ${props => props.theme.name === 'lakeside' ? 'rgba(198, 146, 20, 0.7)' : `${props.theme.text}80`};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const SidebarButton = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: ${props => props.theme.name === 'lakeside' ? 'rgb(198, 146, 20)' : props.theme.text};
  font-size: 14px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.2s ease;
  justify-content: flex-start;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  
  &:hover {
    background: ${props => props.theme.name === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'};
  }
  
  svg {
    margin-right: 8px;
    width: 16px;
    height: 16px;
    opacity: 0.7;
    color: ${props => props.theme.name === 'lakeside' ? 'rgb(198, 146, 20)' : 'currentColor'};
  }
`;

const ProfileButton = styled(SidebarButton)`
 /* Inherits all styles from SidebarButton */
`;

const MobileToggleButton = styled.button`
  display: none;
  background: transparent;
  border: none;
  color: ${props => props.theme.name === 'lakeside' ? 'rgb(198, 146, 20)' : props.theme.text};
  border-radius: 4px;
  width: 32px;
  height: 32px;
  cursor: pointer;
  transition: all 0.2s ease;
  align-items: center;
  justify-content: center;

  @media (max-width: 768px) {
    display: ${props => props.theme.name === 'retro' ? 'none' : 'flex'};
    margin-left: 8px;
  }

  &:hover {
    background: ${props => props.theme.name === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'};
  }

  svg {
    transition: transform 0.3s ease;
    transform: ${props => props.$isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'};
  }
`;

const SidebarSection = styled.div`
  border-top: 1px solid ${props => props.theme.border};
  padding: 8px 16px;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const NavLink = styled(Link)`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: ${props => props.theme.name === 'lakeside' ? 'rgb(198, 146, 20)' : props.theme.text};
  font-size: 14px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.2s ease;
  justify-content: flex-start;
  text-decoration: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  
  &:hover {
    background: ${props => props.theme.name === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'};
  }
  
  svg {
    margin-right: 8px;
    width: 16px;
    height: 16px;
    opacity: 0.7;
    color: ${props => props.theme.name === 'lakeside' ? 'rgb(198, 146, 20)' : 'currentColor'};
  }
`;

const SearchInputContainer = styled.div`
  padding: 4px 16px;
  margin-bottom: 4px;
`;

const SearchInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  background: ${props =>
    props.theme.name === 'lakeside' ? 'rgba(91, 0, 25, 1)' :
      props.theme.inputBackground};
  border: 1px solid ${props => props.theme.border};
  border-radius: 20px;
  overflow: hidden;
  transition: border-color 0.2s ease;
  min-height: 32px;

  &:focus-within {
    border-color: ${props =>
    props.theme.name === 'lakeside' ? 'rgb(198, 146, 20)' :
      props.theme.text};
  }
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 6px 8px 6px 4px;
  background: transparent;
  border: none;
  outline: none;
  color: ${props =>
    props.theme.name === 'lakeside' ? 'rgb(198, 146, 20)' :
      props.theme.text};
  font-size: 13px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  &::placeholder {
    color: ${props =>
    props.theme.name === 'lakeside' ? 'rgba(198, 146, 20, 0.5)' :
      `${props.theme.text}60`};
  }
`;

const SearchCloseButton = styled.button`
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: ${props =>
    props.theme.name === 'lakeside' ? 'rgba(198, 146, 20, 0.7)' :
      `${props.theme.text}60`};
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
    width: 14px;
    height: 14px;
  }
`;

const NoResultsMessage = styled.div`
  text-align: center;
  padding: 16px;
  color: ${props =>
    props.theme.name === 'lakeside' ? 'rgba(198, 146, 20, 0.7)' :
      `${props.theme.text}60`};
  font-size: 14px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const ProfileDropdownContainer = styled.div`
  position: relative;
`;

const ProfileDropdown = styled.div`
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  right: 0;
  background: ${props =>
    props.theme.name === 'lakeside' ? 'rgba(91, 0, 25, 1)' :
      props.theme.inputBackground};
  border: 1px solid ${props => props.theme.border};
  border-radius: 6px;
  z-index: 30;
  overflow: hidden;
  display: ${props => props.$isOpen ? 'block' : 'none'};
  animation: fadeIn 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const ProfileDropdownItem = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 10px 12px;
  background: transparent;
  border: none;
  color: ${props => props.theme.name === 'lakeside' ? 'rgb(198, 146, 20)' : props.theme.text};
  font-size: 14px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.2s ease;
  justify-content: flex-start;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  
  &:hover {
    background: ${props => props.theme.name === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'};
  }
  
  svg {
    margin-right: 8px;
    width: 16px;
    height: 16px;
    opacity: 0.7;
    color: ${props => props.theme.name === 'lakeside' ? 'rgb(198, 146, 20)' : 'currentColor'};
  }
`;

const ProfileAvatar = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: ${props => props.theme.primary};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
  margin-right: 8px;
  background-image: ${props => props.$profilePicture ? `url(${props.$profilePicture})` : 'none'};
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
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
  theme,
  settings = {},
  onSignOut
}) => {
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [showHamburger, setShowHamburger] = useState(true); // Show hamburger
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [profilePicture, setProfilePicture] = useState(
    localStorage.getItem('profilePicture') || null
  );
  const location = useLocation();

  // Ensure sidebar is always expanded in retro theme
  useEffect(() => {
    if (theme && theme.name === 'retro' && $collapsed) {
      setCollapsed(false);
    }
  }, [theme, $collapsed, setCollapsed]);

  // Listen for profile picture changes
  useEffect(() => {
    const handleProfilePictureChange = (event) => {
      setProfilePicture(event.detail.profilePicture);
    };

    window.addEventListener('profilePictureChanged', handleProfilePictureChange);
    return () => {
      window.removeEventListener('profilePictureChanged', handleProfilePictureChange);
    };
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close profile dropdown if clicking outside
      if (isProfileDropdownOpen && !event.target.closest('[data-profile-dropdown]')) {
        setIsProfileDropdownOpen(false);
      }
      // Close model dropdown if clicking outside  
      if (isModelDropdownOpen && !event.target.closest('[data-model-dropdown]')) {
        setIsModelDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen, isModelDropdownOpen]);

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
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle profile dropdown
  const handleProfileClick = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const handleSettingsClick = () => {
    setIsProfileDropdownOpen(false);
    toggleSettings();
  };

  const handleInfoClick = () => {
    setIsProfileDropdownOpen(false);
    toggleProfile();
  };

  const handleSignOutClick = () => {
    setIsProfileDropdownOpen(false);
    if (onSignOut) {
      onSignOut();
    }
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
      <SidebarContainer
        $isExpanded={isMobileExpanded}
        $collapsed={theme && theme.name === 'retro' ? false : $collapsed}
        $sidebarStyle={settings.sidebarStyle || 'floating'}
      >
        {/* Top Bar for Desktop */}
        <TopBarContainer className="desktop-top-bar" style={{ padding: '20px 15px 10px 15px', alignItems: 'center' }}>
          <LogoContainer>
            <img
              src={'/images/sculptor.svg'}
              alt={'Sculptor AI'}
            />
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

        {/* New Chat Button Section */}
        {(!$collapsed || (theme && theme.name === 'retro')) && (
          <SidebarSection style={{ paddingTop: '8px', paddingBottom: '4px', borderTop: 'none' }}>
            <SidebarButton onClick={createNewChat}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
              <span>New Chat</span>
            </SidebarButton>
          </SidebarSection>
        )}

        {/* Persistent Search Input Section */}
        {(!$collapsed || (theme && theme.name === 'retro')) && (
          <SearchInputContainer>
            <SearchInputWrapper>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '12px', opacity: 0.6, color: 'currentColor' }}>
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <SearchInput
                type="text"
                placeholder="Search chats..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
              {searchTerm && (
                <SearchCloseButton onClick={() => setSearchTerm('')}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </SearchCloseButton>
              )}
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
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
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

              {/* New Chat Button for Mobile */}
              <div className="mobile-only" style={{ display: 'none' }}>
                <SidebarSection style={{ paddingTop: '8px', paddingBottom: '4px', borderTop: 'none' }}>
                  <SidebarButton onClick={createNewChat}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                    <span>New Chat</span>
                  </SidebarButton>
                </SidebarSection>

                {/* Persistent Search Input for Mobile */}
                <SearchInputContainer>
                  <SearchInputWrapper>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '12px', opacity: 0.6, color: 'currentColor' }}>
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <SearchInput
                      type="text"
                      placeholder="Search chats..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                    />
                    {searchTerm && (
                      <SearchCloseButton onClick={() => setSearchTerm('')}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </SearchCloseButton>
                    )}
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

            {/* --- Bottom Buttons Section (Profile with Dropdown) --- */}
            {/* Rendered outside ScrollableContent to stick to bottom */}
            <SidebarSection style={{ borderTop: 'none' }}>
              {/* Profile / Sign In Button with Dropdown */}
              <ProfileDropdownContainer data-profile-dropdown>
                <ProfileButton
                  onClick={handleProfileClick}
                  title={isLoggedIn ? `View profile: ${username}` : "Sign In"}
                >
                  {isLoggedIn ? (
                    <ProfileAvatar $profilePicture={profilePicture}>
                      {!profilePicture && username.charAt(0).toUpperCase()}
                    </ProfileAvatar>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  )}
                  <span>{isLoggedIn ? username : 'Sign In'}</span>
                </ProfileButton>

                {/* Profile Dropdown Menu */}
                <ProfileDropdown $isOpen={isProfileDropdownOpen}>
                  <ProfileDropdownItem onClick={handleSettingsClick}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                    <span>Settings</span>
                  </ProfileDropdownItem>

                  <ProfileDropdownItem onClick={handleInfoClick}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M12 16v-4"></path>
                      <path d="M12 8h.01"></path>
                    </svg>
                    <span>Info</span>
                  </ProfileDropdownItem>

                  {isLoggedIn && (
                    <ProfileDropdownItem onClick={handleSignOutClick}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                      <span>Sign Out</span>
                    </ProfileDropdownItem>
                  )}
                </ProfileDropdown>
              </ProfileDropdownContainer>
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

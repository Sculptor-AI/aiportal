import React from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
`;

const ModalContainer = styled.div`
  background: ${props => props.theme.background};
  border: 1px solid ${props => props.theme.border};
  border-radius: 12px;
  width: 90vw;
  height: 80vh;
  max-width: 1200px;
  max-height: 800px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  overflow: hidden;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.inputBackground};
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme.text};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.text};
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.border};
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const ArtifactContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ArtifactIframe = styled.iframe`
  flex: 1;
  border: none;
  width: 100%;
  height: 100%;
  background: white;
`;

const HtmlArtifactModal = ({ isOpen, onClose, htmlContent }) => {
  if (!isOpen || !htmlContent) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContainer>
        <ModalHeader>
          <ModalTitle>HTML Artifact</ModalTitle>
          <CloseButton onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </CloseButton>
        </ModalHeader>
        <ArtifactContent>
          <ArtifactIframe
            srcDoc={htmlContent}
            sandbox="allow-scripts"
            title="HTML Artifact Preview"
          />
        </ArtifactContent>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default HtmlArtifactModal; 
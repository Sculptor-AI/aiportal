import React, { useRef, useState, useEffect } from 'react';
import styled, { useTheme } from 'styled-components';

const UploadButton = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.theme.text};
  cursor: pointer;
  width: ${props => props.theme.name === 'retro' ? '24px' : '36px'};
  height: ${props => props.theme.name === 'retro' ? '24px' : '36px'};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  position: absolute;
  left: ${props => props.theme.name === 'retro' ? '-16px' : '15px'};
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  box-shadow: none;

  &:hover {
    background: ${props => props.theme.name === 'retro' ? 'transparent' : 'rgba(0, 0, 0, 0.05)'};
  }

  &:active:not(:disabled) {
    padding: ${props => props.theme.name === 'retro' ? '1px 0 0 1px' : '0'};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const PreviewContainer = styled.div`
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: ${props => props.theme.inputBackground};
  padding: 8px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  border: 1px solid ${props => props.theme.border};
  z-index: 10;
  max-width: calc(100% - 16px);
  display: ${props => props.$show ? 'flex' : 'none'};
  align-items: center;
  gap: 8px;
`;

const PreviewImage = styled.img`
  max-width: 60px; /* Smaller preview for images */
  max-height: 60px;
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '8px'};
  margin-right: 10px;
  border: ${props => props.theme.name === 'retro' ? `1px solid ${props.theme.border}` : 'none'};
`;

const FileInfo = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-size: 12px;
`;

const FileName = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
  margin-bottom: 3px;
`;

const FileType = styled.div`
  opacity: 0.7;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 5px;
  right: 5px;
  background: ${props => props.theme.name === 'retro' ? props.theme.buttonFace : 'rgba(0, 0, 0, 0.5)'};
  color: ${props => props.theme.name === 'retro' ? props.theme.buttonText : 'white'};
  border: ${props => props.theme.name === 'retro' ? 
    `1px solid ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight}` : 
    'none'};
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '50%'};
  width: ${props => props.theme.name === 'retro' ? '18px' : '22px'};
  height: ${props => props.theme.name === 'retro' ? '18px' : '22px'};
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
  box-shadow: ${props => props.theme.name === 'retro' ? 
    `1px 1px 0 0 ${props.theme.buttonHighlightSoft} inset, -1px -1px 0 0 ${props.theme.buttonShadowSoft} inset` : 
    'none'};
    
  &:active {
    ${props => props.theme.name === 'retro' && `
      border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
      box-shadow: -1px -1px 0 0 ${props.theme.buttonHighlightSoft} inset, 1px 1px 0 0 ${props.theme.buttonShadowSoft} inset;
      padding: 1px 0 0 1px;
    `}
  }
`;

const UploadIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${props => props.disabled ? 0.5 : 1};
  
  img {
    width: ${props => props.theme?.name === 'retro' ? '14px' : '16px'};
    height: ${props => props.theme?.name === 'retro' ? '14px' : '16px'};
  }
`;

// Generic File Icon (SVG)
const FileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px', color: 'grey' }}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
  </svg>
);


const FileUploadButton = ({ onFileSelected, disabled, resetFile, externalFile }) => {
  const fileInputRef = useRef(null);
  const [previewData, setPreviewData] = useState(null); // { src?: string, name: string, type: string }
  const theme = useTheme();
  
  // Effect to handle external file for preview (e.g., from paste)
  useEffect(() => {
    if (externalFile) {
      // Generate preview for the external file
      if (externalFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewData({
            src: reader.result,
            name: externalFile.name,
            type: externalFile.type
          });
        };
        reader.readAsDataURL(externalFile);
      } else {
        // For non-image files from external source, show file info
        setPreviewData({
          name: externalFile.name,
          type: externalFile.type
        });
      }
       // Reset the file input value in case it holds an old selection
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
       // If externalFile is null (e.g., cleared by parent), clear preview
       // This handles clearing after sending or manual clear
       setPreviewData(null);
    }
  }, [externalFile]); // Rerun when externalFile changes
  
  // Effect to handle the reset prop
  useEffect(() => {
    if (resetFile) {
      setPreviewData(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [resetFile]);
  
  const handleButtonClick = () => {
    fileInputRef.current.click();
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      alert('Unsupported file type. Please select an image (JPEG, PNG, GIF, WEBP), PDF, or TXT file.');
      // Clear the input if the file type is wrong
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    // Check file size (limit to 10MB for now)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size should be less than 10MB.');
       if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    // Create preview data
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewData({
          src: reader.result,
          name: file.name,
          type: file.type
        });
      };
      reader.readAsDataURL(file);
    } else {
      // For PDF/TXT, just show file info
      setPreviewData({
        name: file.name,
        type: file.type
      });
    }
    
    // Send the File object to parent
    onFileSelected(file);
  };
  
  const clearFile = () => {
    setPreviewData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileSelected(null); // Notify parent
  };
  
  return (
    <>
      <UploadButton onClick={handleButtonClick} disabled={disabled} title="Upload file (Image, PDF, TXT)">
        <UploadIcon disabled={disabled}>
          {theme.name === 'retro' ? (
            <img 
              src="/images/retroTheme/fileUpload.png" 
              alt="Upload File" 
              style={{ width: '16px', height: '16px' }} 
            />
          ) : (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="22" 
              height="22" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{ opacity: 0.7 }}
            >
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
            </svg>
          )}
        </UploadIcon>
      </UploadButton>
      <HiddenInput 
        type="file" 
        ref={fileInputRef}
        accept="image/jpeg, image/png, image/gif, image/webp, application/pdf, text/plain"
        onChange={handleFileChange}
      />
      <PreviewContainer $show={previewData !== null} theme={theme}>
        {previewData && (
          <>
            <CloseButton onClick={clearFile}>×</CloseButton>
            {previewData.src ? (
              <PreviewImage src={previewData.src} alt="Preview" />
            ) : (
              <FileIcon />
            )}
            <FileInfo>
              <FileName>{previewData.name}</FileName>
              <FileType>{previewData.type}</FileType>
            </FileInfo>
          </>
        )}
      </PreviewContainer>
    </>
  );
};

export default FileUploadButton;

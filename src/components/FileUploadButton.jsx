import React, { useRef, useState, useEffect } from 'react';
import styled from 'styled-components';

const UploadButton = styled.button`
  background: rgba(0, 0, 0, 0.05);
  border: none;
  color: ${props => props.theme.text};
  opacity: 0.8;
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  
  &:hover {
    background: rgba(0, 0, 0, 0.05);
    opacity: 1;
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
  bottom: 100%;
  left: 0;
  margin-bottom: 10px;
  background: ${props => props.theme.inputBackground};
  border-radius: 12px;
  border: 1px solid ${props => props.theme.border};
  padding: 10px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  display: ${props => props.show ? 'flex' : 'none'};
  align-items: center; /* Center items vertically */
  max-width: 250px;
`;

const PreviewImage = styled.img`
  max-width: 60px; /* Smaller preview for images */
  max-height: 60px;
  border-radius: 8px;
  margin-right: 10px;
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
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
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
        {/* Use a paperclip icon */}
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
        </svg>
      </UploadButton>
      <HiddenInput 
        type="file" 
        ref={fileInputRef}
        accept="image/jpeg, image/png, image/gif, image/webp, application/pdf, text/plain"
        onChange={handleFileChange}
      />
      <PreviewContainer show={previewData !== null}>
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

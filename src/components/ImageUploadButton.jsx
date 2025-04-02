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
  flex-direction: column;
  max-width: 250px;
`;

const PreviewImage = styled.img`
  max-width: 100%;
  border-radius: 8px;
  margin-bottom: 10px;
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

const ImageUploadButton = ({ onImageSelected, disabled, resetPreview }) => {
  const fileInputRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(null);
  
  // Effect to reset preview when parent component indicates
  useEffect(() => {
    if (resetPreview) {
      setPreviewImage(null);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [resetPreview]);
  
  const handleButtonClick = () => {
    fileInputRef.current.click();
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }
    
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB.');
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage({
        src: reader.result,
        name: file.name
      });
    };
    reader.readAsDataURL(file);
    
    // Send to parent
    onImageSelected(file);
  };
  
  const clearImage = () => {
    setPreviewImage(null);
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Notify parent
    onImageSelected(null);
  };
  
  return (
    <>
      <UploadButton onClick={handleButtonClick} disabled={disabled} title="Upload image">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </UploadButton>
      <HiddenInput 
        type="file" 
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
      />
      <PreviewContainer show={previewImage !== null}>
        {previewImage && (
          <>
            <CloseButton onClick={clearImage}>×</CloseButton>
            <PreviewImage src={previewImage.src} alt="Preview" />
            <div style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {previewImage.name}
            </div>
          </>
        )}
      </PreviewContainer>
    </>
  );
};

export default ImageUploadButton;
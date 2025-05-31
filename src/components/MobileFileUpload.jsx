import React, { useState } from 'react';
import styled from 'styled-components';

const FileUploadContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const FileInput = styled.input`
  display: none;
`;

const FilePreview = styled.div`
  margin-top: 8px;
  padding: 8px 12px;
  background: ${props => props.theme.inputBackground};
  border: 1px solid ${props => props.theme.border};
  border-radius: 8px;
  font-size: 14px;
  color: ${props => props.theme.text};
  
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const FileInfo = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
`;

const FileName = styled.div`
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FileSize = styled.div`
  font-size: 12px;
  color: ${props => props.theme.text}66;
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.text}66;
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  flex-shrink: 0;
  
  &:active {
    background: ${props => props.theme.border};
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const MobileFileUpload = ({ 
  onFileSelected, 
  disabled = false, 
  resetFile = false, 
  externalFile = null 
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  
  React.useEffect(() => {
    if (resetFile) {
      setSelectedFile(null);
    }
  }, [resetFile]);
  
  React.useEffect(() => {
    if (externalFile) {
      setSelectedFile(externalFile);
    }
  }, [externalFile]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      onFileSelected?.(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    onFileSelected?.(null);
  };

  if (selectedFile) {
    return (
      <FilePreview>
        <FileInfo>
          <FileName>{selectedFile.name}</FileName>
          <FileSize>{formatFileSize(selectedFile.size)}</FileSize>
        </FileInfo>
        <RemoveButton onClick={handleRemoveFile}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </RemoveButton>
      </FilePreview>
    );
  }

  return (
    <FileUploadContainer>
      <FileInput
        type="file"
        accept="image/*,.txt,.pdf"
        onChange={handleFileChange}
        disabled={disabled}
        id="mobile-file-upload"
      />
    </FileUploadContainer>
  );
};

export default MobileFileUpload;
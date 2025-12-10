import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styled, { useTheme } from 'styled-components';

const FileUploadContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  flex-shrink: 0;
`;

const UploadButton = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.theme.text};
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '50%'};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  margin-left: 20px;
  margin-right: -8px;
  z-index: 10;
  
  &:hover {
    background: ${props => props.theme.name === 'retro' ? 'rgba(0, 0, 0, 0.05)' : 'transparent'};
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
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
  bottom: calc(100% + 15px);
  left: 0;
  background: ${props => props.theme.inputBackground};
  padding: 8px 12px;
  border-radius: 24px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  border: 1px solid ${props => props.theme.border};
  z-index: 20;
  display: ${props => props.$show ? 'flex' : 'none'};
  align-items: center;
  gap: 10px;
  min-width: 200px;
  max-width: 600px;
  white-space: nowrap;
  flex-wrap: wrap;
`;

const FilePreviewItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background: ${props => props.theme.background};
  border: 1px solid ${props => props.theme.border};
  border-radius: 16px;
  position: relative;
  min-width: 120px;
  max-width: 180px;
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
  font-size: 13px;
  flex: 1;
`;

const FileName = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
  margin-bottom: 2px;
`;

const FileType = styled.div`
  opacity: 0.7;
  font-size: 11px;
`;

const PastedTextPreview = styled.div`
  cursor: pointer;
  transition: opacity 0.2s ease;
  
  &:hover {
    opacity: 0.8;
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
  box-sizing: border-box;
`;

const ModalContent = styled.div`
  background: ${props => props.theme.background};
  color: ${props => props.theme.text};
  padding: 20px;
  border-radius: 12px;
  width: 90vw;
  max-width: 800px;
  max-height: 80vh;
  overflow: hidden;
  border: 1px solid ${props => props.theme.border};
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  position: relative;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid ${props => props.theme.border};
  flex-shrink: 0;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
`;

const ModalCloseButton = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: ${props => props.theme.text};
  padding: 4px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  
  &:hover {
    background: ${props => props.theme.border};
    opacity: 0.7;
  }
`;

const ModalTextContainer = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ModalText = styled.pre`
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
  padding: 15px;
  background: ${props => props.theme.inputBackground};
  border: 1px solid ${props => props.theme.border};
  border-radius: 8px;
  flex: 1;
  overflow-y: auto;
  min-height: 200px;
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
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'grey', flexShrink: 0 }}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
  </svg>
);

// Pasted Text Icon (SVG)
const PastedTextIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#4F46E5', flexShrink: 0 }}>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
    <path d="M12 11h4"></path>
    <path d="M12 16h4"></path>
    <path d="M8 11h.01"></path>
    <path d="M8 16h.01"></path>
  </svg>
);


const FileUploadButton = ({ onFileSelected, disabled, resetFile, externalFile }) => {
  const fileInputRef = useRef(null);
  const [previewData, setPreviewData] = useState([]); // Array of files: [{ src?: string, name: string, type: string, isPastedText?: boolean, pastedContent?: string }]
  const [showPastedTextModal, setShowPastedTextModal] = useState(false);
  const [selectedPastedTextIndex, setSelectedPastedTextIndex] = useState(null);
  const theme = useTheme();
  
  // Effect to handle external file for preview (e.g., from paste)
  // Note: We don't need to show processed files here since ChatInputArea handles that
  useEffect(() => {
    if (externalFile && !Array.isArray(externalFile)) {
      // Only handle single external files (like pasted content)
      if (externalFile.isPastedText) {
        const newFile = {
          id: Date.now(),
          name: 'Pasted Text',
          type: 'text/plain',
          isPastedText: true,
          pastedContent: externalFile.pastedContent
        };
        setPreviewData([newFile]);
      }
      // Reset the file input value in case it holds an old selection
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
       // If externalFile is null or array (processed files), clear preview
       setPreviewData([]);
    }
  }, [externalFile]); // Rerun when externalFile changes
  
  // Effect to handle the reset prop
  useEffect(() => {
    if (resetFile) {
      setPreviewData([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [resetFile]);
  
  const handleButtonClick = () => {
    fileInputRef.current.click();
  };
  
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // The limit check is handled by the parent component

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'];

    // Code file extensions that should be accepted
    const codeExtensions = [
      'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs',  // JavaScript/TypeScript
      'py', 'pyw', 'pyi',                       // Python
      'java', 'kt', 'kts', 'scala',             // JVM languages
      'c', 'cpp', 'cc', 'cxx', 'h', 'hpp', 'hxx', // C/C++
      'cs',                                      // C#
      'go',                                      // Go
      'rs',                                      // Rust
      'rb', 'erb',                               // Ruby
      'php', 'phtml',                            // PHP
      'swift',                                   // Swift
      'sh', 'bash', 'zsh', 'fish',              // Shell scripts
      'ps1', 'psm1', 'psd1',                    // PowerShell
      'sql',                                     // SQL
      'r',                                       // R
      'lua',                                     // Lua
      'pl', 'pm',                                // Perl
      'ex', 'exs',                               // Elixir
      'erl', 'hrl',                              // Erlang
      'hs', 'lhs',                               // Haskell
      'clj', 'cljs', 'cljc', 'edn',             // Clojure
      'ml', 'mli',                               // OCaml
      'fs', 'fsi', 'fsx',                        // F#
      'dart',                                    // Dart
      'vue', 'svelte',                           // Frontend frameworks
      'html', 'htm', 'xml', 'xhtml',            // Markup
      'css', 'scss', 'sass', 'less', 'styl',   // Stylesheets
      'json', 'yaml', 'yml', 'toml',            // Config/data
      'md', 'markdown', 'rst', 'txt',           // Documentation
      'dockerfile', 'makefile', 'cmake',        // Build files
      'ini', 'cfg', 'conf', 'config',           // Config files
      'env', 'gitignore', 'editorconfig'        // Dotfiles
    ];

    const validFiles = [];

    for (const file of files) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      const isCodeFile = codeExtensions.includes(fileExtension) ||
                        file.name.toLowerCase() === 'dockerfile' ||
                        file.name.toLowerCase() === 'makefile' ||
                        file.name.toLowerCase().startsWith('.env');

      if (!allowedMimeTypes.includes(file.type) && !isCodeFile) {
        alert(`Unsupported file type for ${file.name}. Please select an image, PDF, text, or code file.`);
        continue;
      }

      // Check file size (limit to 10MB for now)
      if (file.size > 10 * 1024 * 1024) {
        alert(`File size for ${file.name} should be less than 10MB.`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Send all files to parent for processing
    onFileSelected(validFiles);
  };
  
  const clearFile = (fileId) => {
    if (fileId) {
      // Clear specific file from preview
      setPreviewData(prev => prev.filter(file => file.id !== fileId));
      // If this was a pasted text file, notify parent
      const fileToRemove = previewData.find(file => file.id === fileId);
      if (fileToRemove && fileToRemove.isPastedText) {
        onFileSelected(null);
      }
    } else {
      // Clear all files
      setPreviewData([]);
      setShowPastedTextModal(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onFileSelected(null); // Notify parent
    }
  };

  const handlePastedTextClick = (index) => {
    setSelectedPastedTextIndex(index);
    setShowPastedTextModal(true);
  };
  
  return (
    <FileUploadContainer>
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
        accept="image/jpeg, image/png, image/gif, image/webp, application/pdf, text/plain, text/*, .js, .jsx, .ts, .tsx, .py, .java, .c, .cpp, .h, .hpp, .cs, .go, .rs, .rb, .php, .swift, .sh, .bash, .sql, .r, .lua, .pl, .ex, .hs, .dart, .vue, .svelte, .html, .css, .scss, .json, .yaml, .yml, .toml, .md, .xml, .kt, .scala, .ini, .cfg, .conf"
        onChange={handleFileChange}
        multiple
      />
      <PreviewContainer $show={previewData.length > 0} theme={theme}>
        {previewData.map((file, index) => (
          <FilePreviewItem key={file.id} theme={theme}>
            <CloseButton onClick={() => clearFile(file.id)}>×</CloseButton>
            <PastedTextPreview onClick={file.isPastedText ? () => handlePastedTextClick(index) : undefined}>
              {file.src ? (
                <PreviewImage src={file.src} alt="Preview" />
              ) : file.isPastedText ? (
                <PastedTextIcon />
              ) : (
                <FileIcon />
              )}
              <FileInfo>
                <FileName>{file.name}</FileName>
                {!file.isPastedText && <FileType>{file.type}</FileType>}
              </FileInfo>
            </PastedTextPreview>
          </FilePreviewItem>
        ))}
      </PreviewContainer>
      
      {showPastedTextModal && selectedPastedTextIndex !== null && previewData[selectedPastedTextIndex]?.isPastedText && createPortal(
        <Modal onClick={() => setShowPastedTextModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Pasted Text Content</ModalTitle>
              <ModalCloseButton onClick={() => setShowPastedTextModal(false)}>×</ModalCloseButton>
            </ModalHeader>
            <ModalTextContainer>
              <ModalText>{previewData[selectedPastedTextIndex].pastedContent}</ModalText>
            </ModalTextContainer>
          </ModalContent>
        </Modal>,
        document.body
      )}
    </FileUploadContainer>
  );
};

export default FileUploadButton;

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useTheme } from 'styled-components';
import FileUploadButton from './FileUploadButton';
import PopupMenu from './ToolMenuModal';
import {
  InputContainer,
  MessageInputWrapper,
  InputRow,
  MessageInput,
  SendButton,
  ActionChipsContainer,
  ActionChip,
  RetroIconWrapper,
  HammerButton,
  ToolbarContainer,
  ToolbarItem
} from './ChatWindow.styled';

const ChatInputArea = forwardRef(({
  chatIsEmpty,
  animateDown,
  $sidebarCollapsed,
  settings,
  onSubmitMessage, // Replaces direct call to submitMessage
  onFileSelected,  // Prop for handleFileSelected
  isLoading,
  isProcessingFile,
  uploadedFile,      // Renamed from uploadedFileData for clarity as prop
  onClearAttachment, // Prop for clearUploadedFile
  resetFileUploadTrigger, // Renamed from resetFileUpload
  availableModels, // Needed for model-specific logic if any remains or for sub-components
  isWhiteboardOpen, // New prop
  onToggleWhiteboard, // New prop for toggling
  onCloseWhiteboard, // New prop for closing (can be same as onToggleWhiteboard if it's a pure toggle)
  isEquationEditorOpen, // New prop
  onToggleEquationEditor, // New prop for toggling
  onCloseEquationEditor, // New prop for closing
  isGraphingOpen, // New prop for graphing tool
  onToggleGraphing, // New prop for toggling graphing
  onCloseGraphing, // New prop for closing graphing
  onToolbarToggle,
}, ref) => {
  const theme = useTheme();
  const [inputMessage, setInputMessage] = useState('');
  const [selectedActionChip, setSelectedActionChip] = useState(null);
  const [showModeModal, setShowModeModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [thinkingMode, setThinkingMode] = useState(null);
  const [createType, setCreateType] = useState(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [modeMenuRect, setModeMenuRect] = useState(null);
  const [createMenuRect, setCreateMenuRect] = useState(null);

  const inputRef = useRef(null);
  const toolbarRef = useRef(null);
  const toolbarContainerRef = useRef(null);
  const modeAnchorRef = useRef(null);
  const createAnchorRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
      const lineHeight = parseInt(getComputedStyle(inputRef.current).lineHeight) || 20;
      const fourLinesHeight = lineHeight * 4;
      if (inputRef.current.scrollHeight > fourLinesHeight) {
        inputRef.current.classList.add('show-scrollbar');
      } else {
        inputRef.current.classList.remove('show-scrollbar');
      }
    }
  }, [inputMessage]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showToolbar &&
          toolbarRef.current && !toolbarRef.current.contains(event.target) &&
          toolbarContainerRef.current && !toolbarContainerRef.current.contains(event.target)) {
        setShowToolbar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showToolbar]);

  useEffect(() => {
    if (onToolbarToggle) {
      onToolbarToggle(showToolbar);
    }
  }, [showToolbar, onToolbarToggle]);

  const handleInternalSubmit = () => {
    if (isLoading || isProcessingFile) return;
    onSubmitMessage(inputMessage, uploadedFile, selectedActionChip, thinkingMode, createType);
    setInputMessage(''); // Clear input after submission attempt
    // Clearing uploadedFile and selectedActionChip should be handled by parent via props or after successful submission
  };

  const handleKeyDown = (event) => {
    if (settings.sendWithEnter && event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleInternalSubmit();
    } else if (!settings.sendWithEnter && event.key === 'Enter' && event.shiftKey) {
      event.preventDefault();
      handleInternalSubmit();
    } else if (event.key === 'Enter' && !event.shiftKey && !settings.sendWithEnter) {
      // Allow newline
    }
  };

  const handlePaste = (event) => {
    const items = event.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        event.preventDefault();
        const file = item.getAsFile();
        if (file) {
          onFileSelected(file);
        }
        break;
      }
    }
  };

  const getPlaceholderText = () => {
    if (isLoading) return "Waiting for response...";
    if (isProcessingFile) return "Processing file...";
    if (uploadedFile) return `Attached: ${uploadedFile.name}. Add text or send.`;
    return "Type message, paste image, or attach file...";
  };

  const handleWhiteboardSubmit = (file) => {
    onFileSelected(file);
  };

  const handleModeSelect = (mode) => {
    setThinkingMode(mode);
    setSelectedActionChip(null);
  };

  const handleCreateSelect = (type) => {
    setCreateType(type);
    if (type === 'image') {
      setSelectedActionChip('create-image');
    } else if (type === 'video') {
      setSelectedActionChip('create-video');
    } else {
      setSelectedActionChip(null);
    }
  };

  const isAnyModalOpen = isEquationEditorOpen || isWhiteboardOpen || showModeModal || showCreateModal || isGraphingOpen;

  // Expose methods through ref
  useImperativeHandle(ref, () => ({
    appendToInput: (text) => {
      setInputMessage(prev => prev + text);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }));

  return (
    <InputContainer 
      $isEmpty={chatIsEmpty} 
      $animateDown={animateDown} 
      $sidebarCollapsed={$sidebarCollapsed}
      $modalOpen={isAnyModalOpen}
    >
      <MessageInputWrapper $isEmpty={chatIsEmpty}>
        <InputRow>
          <FileUploadButton
            onFileSelected={onFileSelected}
            disabled={isLoading || isProcessingFile}
            resetFile={resetFileUploadTrigger}
            externalFile={uploadedFile?.file} // FileUploadButton expects 'file' prop
          />
          <MessageInput
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={getPlaceholderText()}
            disabled={isLoading || isProcessingFile}
            rows={1}
            style={{ maxHeight: '150px', overflowY: 'auto' }}
          />
          <SendButton
            onClick={handleInternalSubmit}
            disabled={isLoading || isProcessingFile || (!inputMessage.trim() && !uploadedFile)}
          >
            {theme.name === 'retro' ? (
              <img src="/images/retroTheme/sendIcon.png" alt="Send" style={{ width: '16px', height: '16px' }} />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13"></path>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            )}
          </SendButton>
        </InputRow>

        <ActionChipsContainer>
          <HammerButton
            ref={toolbarRef}
            $isOpen={showToolbar}
            onClick={() => setShowToolbar(!showToolbar)}
            title="Toggle Toolbar"
          >
            {theme.name === 'retro' ? (
              <img src="/images/retroTheme/hammerIcon.png" alt="Tools" style={{ width: '18px', height: '18px' }} />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
            )}
          </HammerButton>
          
          <ActionChip
            ref={modeAnchorRef}
            selected={thinkingMode !== null}
            onClick={() => {
              if (modeAnchorRef.current) {
                // Force a reflow before getting the rect might help in some edge cases
                // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                modeAnchorRef.current.offsetHeight;
                const currentRect = modeAnchorRef.current.getBoundingClientRect();
                console.log('[ChatInputArea] Mode Chip - Captured Rect:', JSON.stringify(currentRect));
                setModeMenuRect(currentRect);
              }
              setShowModeModal(true);
            }}
          >
            {theme.name === 'retro' ? (
              <RetroIconWrapper>
                <img src="/images/retroTheme/modeIcon.png" alt="Mode" style={{ width: '16px', height: '16px' }} />
              </RetroIconWrapper>
            ) : thinkingMode === 'thinking' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
                <line x1="16" y1="8" x2="2" y2="22"></line>
                <line x1="17.5" y1="15" x2="9" y2="15"></line>
              </svg>
            ) : thinkingMode === 'instant' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                <rect x="9" y="9" width="6" height="6"></rect>
                <line x1="9" y1="2" x2="9" y2="4"></line>
                <line x1="15" y1="2" x2="15" y2="4"></line>
                <line x1="9" y1="20" x2="9" y2="22"></line>
                <line x1="15" y1="20" x2="15" y2="22"></line>
                <line x1="20" y1="9" x2="22" y2="9"></line>
                <line x1="20" y1="14" x2="22" y2="14"></line>
                <line x1="2" y1="9" x2="4" y2="9"></line>
                <line x1="2" y1="14" x2="4" y2="14"></line>
              </svg>
            )}
            {thinkingMode === 'thinking' ? 'Thinking' : thinkingMode === 'instant' ? 'Instant' : 'Mode'}
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '3px', opacity: 0.7 }}>
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </ActionChip>
          
          <ActionChip
            selected={selectedActionChip === 'search'}
            onClick={() => {
              if (selectedActionChip === 'search') {
                setSelectedActionChip(null);
              } else {
                setSelectedActionChip('search');
                setThinkingMode(null); // Reset thinking mode
              }
            }}
          >
            {theme.name === 'retro' ? ( <RetroIconWrapper><img src="/images/retroTheme/searchIcon.png" alt="Search" style={{ width: '16px', height: '16px' }} /></RetroIconWrapper> ) : ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> )}
            Search
          </ActionChip>
          
          <ActionChip
            selected={selectedActionChip === 'deep-research'}
            onClick={() => {
              if (selectedActionChip === 'deep-research') {
                setSelectedActionChip(null);
              } else {
                setSelectedActionChip('deep-research');
                setThinkingMode(null); // Reset thinking mode
              }
            }}
          >
            {theme.name === 'retro' ? ( <RetroIconWrapper><img src="/images/retroTheme/deepResearch.png" alt="Deep Research" style={{ width: '16px', height: '16px' }} /></RetroIconWrapper> ) : ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"></path></svg> )}
            Deep research
          </ActionChip>
          
          <ActionChip
            ref={createAnchorRef}
            selected={selectedActionChip === 'create-image' || selectedActionChip === 'create-video'}
            onClick={() => {
              if (createAnchorRef.current) {
                // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                createAnchorRef.current.offsetHeight;
                const currentRect = createAnchorRef.current.getBoundingClientRect();
                console.log('[ChatInputArea] Create Chip - Captured Rect:', JSON.stringify(currentRect));
                setCreateMenuRect(currentRect);
              }
              setShowCreateModal(true);
            }}
          >
            {theme.name === 'retro' ? ( <RetroIconWrapper><img src="/images/retroTheme/createIcon.png" alt="Create" style={{ width: '16px', height: '16px' }} /></RetroIconWrapper> ) : createType === 'image' ? ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg> ) : createType === 'video' ? ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line></svg> ) : ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg> )}
            {createType === 'image' ? 'Create image' : createType === 'video' ? 'Create video' : 'Create'}
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '3px', opacity: 0.7 }}>
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </ActionChip>
        </ActionChipsContainer>

        <ToolbarContainer $isOpen={showToolbar} ref={toolbarContainerRef}>
          <ToolbarItem title="Equation Editor" onClick={onToggleEquationEditor}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/><path d="M15 4H9l6 8-6 8h6"/></svg>
          </ToolbarItem>
          <ToolbarItem title="Whiteboard" onClick={onToggleWhiteboard}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"></path><path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"></path></svg>
          </ToolbarItem>
          <ToolbarItem title="Graphing Calculator" onClick={onToggleGraphing}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
              <polyline points="17 6 23 6 23 12"></polyline>
            </svg>
          </ToolbarItem>
        </ToolbarContainer>
      </MessageInputWrapper>
      
      <PopupMenu 
        isOpen={showModeModal}
        onClose={() => setShowModeModal(false)}
        menuType="mode"
        currentValue={thinkingMode}
        onSelect={handleModeSelect}
        theme={theme}
        rect={modeMenuRect}
      />
      
      <PopupMenu
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        menuType="create"
        currentValue={createType}
        onSelect={handleCreateSelect}
        theme={theme}
        rect={createMenuRect}
      />
    </InputContainer>
  );
});

ChatInputArea.displayName = 'ChatInputArea';

export default ChatInputArea; 
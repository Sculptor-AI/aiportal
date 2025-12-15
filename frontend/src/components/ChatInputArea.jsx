import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { useTheme } from 'styled-components';
import FileUploadButton from './FileUploadButton';
import PopupMenu from './ToolMenuModal';
import DragDropOverlay from './DragDropOverlay';
import {
  InputContainer,
  ChipsDock,
  ComposerRow,
  ComposerPlusButton,
  MessageInputWrapper,
  InputRow,
  MessageInput,
  SendButton,
  WaveformButton,
  ActionChipsContainer,
  ActionChip,
  RetroIconWrapper,
  HammerButton,
  ToolbarContainer,
  ToolbarItem,
  FilesPreviewContainer,
  FilePreviewChip,
  FilePreviewIcon,
  FilePreviewName,
  FilePreviewRemove,
  FileTypeIcon,
  OverflowChipButton,
  OverflowDropdown
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
  onRemoveFile,      // Prop for removing individual files
  resetFileUploadTrigger, // Renamed from resetFileUpload
  availableModels, // Needed for model-specific logic if any remains or for sub-components
  currentModel, // Current selected model ID
  modelCapabilities = {}, // Capabilities of the current model (web_search, code_execution, etc.)
  isWhiteboardOpen, // New prop
  onToggleWhiteboard, // New prop for toggling
  onCloseWhiteboard, // New prop for closing (can be same as onToggleWhiteboard if it's a pure toggle)
  isEquationEditorOpen, // New prop
  onToggleEquationEditor, // New prop for toggling
  onCloseEquationEditor, // New prop for closing
  isGraphingOpen, // New prop for graphing tool
  onToggleGraphing, // New prop for toggling graphing
  onCloseGraphing, // New prop for closing graphing
  isFlowchartOpen, // New prop for flowchart tool
  onToggleFlowchart, // New prop for toggling flowchart
  onCloseFlowchart, // New prop for closing flowchart
  isSandbox3DOpen, // New prop for 3D sandbox tool
  onToggleSandbox3D, // New prop for toggling 3D sandbox
  onCloseSandbox3D, // New prop for closing 3D sandbox
  onToolbarToggle,
  onLiveModeToggle, // New prop for live mode toggle
  // Image mode props (state managed by parent)
  isImagePromptMode: isImagePromptModeProp,
  onImageModeChange,
  selectedImageModel,
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
  const [isVideoPromptMode, setIsVideoPromptMode] = useState(false);
  const [isFlowchartPromptMode, setIsFlowchartPromptMode] = useState(false);
  const [isLiveModeOpen, setIsLiveModeOpen] = useState(false);
  const [visibleChips, setVisibleChips] = useState(['mode', 'search', 'analysis-tool', 'create']);
  const [hiddenChips, setHiddenChips] = useState([]);
  const [showOverflowDropdown, setShowOverflowDropdown] = useState(false);
  const [chipsExpanded, setChipsExpanded] = useState(chatIsEmpty);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const dragCounterRef = useRef(0);

  // Use image mode from prop (state managed by parent)
  const isImagePromptMode = isImagePromptModeProp || false;
  const setIsImagePromptMode = onImageModeChange || (() => {});

  const inputRef = useRef(null);
  const prevChatIsEmptyRef = useRef(chatIsEmpty);
  const toolbarRef = useRef(null);
  const toolbarContainerRef = useRef(null);
  const modeAnchorRef = useRef(null);
  const createAnchorRef = useRef(null);
  const chipsContainerRef = useRef(null);
  const chipRefs = useRef([]);
  const overflowButtonRef = useRef(null);

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

  useEffect(() => {
    const wasEmpty = prevChatIsEmptyRef.current;
    prevChatIsEmptyRef.current = chatIsEmpty;

    if (chatIsEmpty) {
      setChipsExpanded(true);
      return;
    }

    if (wasEmpty) {
      setChipsExpanded(false);
      setShowToolbar(false);
      setShowModeModal(false);
      setShowCreateModal(false);
      setShowOverflowDropdown(false);
    }
  }, [chatIsEmpty]);

  // Responsive chip management
  useEffect(() => {
    const handleResize = () => {
      if (!chipsContainerRef.current) return;

      const containerWidth = chipsContainerRef.current.offsetWidth;
      const hammerButtonWidth = 44; // HammerButton width + gap
      const overflowButtonWidth = 50; // Width for "..." button
      let availableWidth = containerWidth - hammerButtonWidth;

      // Define all chips
      const allChips = ['mode', 'search', 'analysis-tool', 'create'];

      let currentWidth = 0;
      const visible = [];
      const hidden = [];

      for (let i = 0; i < allChips.length; i++) {
        const chipRef = chipRefs.current[i];
        if (chipRef) {
          const chipWidth = chipRef.offsetWidth + 8; // Include gap

          // Check if we need to show overflow button
          const needsOverflow = i < allChips.length - 1 && currentWidth + chipWidth > availableWidth - overflowButtonWidth;
          const isLastAndFits = i === allChips.length - 1 && currentWidth + chipWidth <= availableWidth;

          if (needsOverflow) {
            // This chip and remaining chips go to hidden
            hidden.push(...allChips.slice(i));
            break;
          } else if (isLastAndFits || currentWidth + chipWidth <= availableWidth) {
            // This chip fits
            visible.push(allChips[i]);
            currentWidth += chipWidth;
          } else {
            // This chip doesn't fit
            hidden.push(...allChips.slice(i));
            break;
          }
        } else {
          // Fallback if ref not available - assume it fits
          visible.push(allChips[i]);
        }
      }

      // Only update state if there's actually a change
      if (JSON.stringify(visible) !== JSON.stringify(visibleChips) ||
        JSON.stringify(hidden) !== JSON.stringify(hiddenChips)) {
        setVisibleChips(visible);
        setHiddenChips(hidden);
      }
    };

    // Use a timeout to ensure DOM is updated
    const timeoutId = setTimeout(handleResize, 100);

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [thinkingMode, selectedActionChip, createType, chipsExpanded, chatIsEmpty]);

  const handleToggleChips = () => {
    if (chipsExpanded) {
      setChipsExpanded(false);
      setShowToolbar(false);
      setShowModeModal(false);
      setShowCreateModal(false);
      setShowOverflowDropdown(false);
    } else {
      setChipsExpanded(true);
    }
  };

  // Close overflow dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showOverflowDropdown &&
        overflowButtonRef.current &&
        !overflowButtonRef.current.contains(event.target)) {
        setShowOverflowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showOverflowDropdown]);

  const handleInternalSubmit = () => {
    if (isLoading || isProcessingFile) return;

    // Handle image generation mode
    if (isImagePromptMode) {
      if (inputMessage.trim()) {
        onSubmitMessage({
          type: 'generate-image',
          prompt: inputMessage.trim(),
          imageModel: selectedImageModel?.id || selectedImageModel?.apiId
        });
        setInputMessage('');
        // Keep image mode active for multi-turn generation
        // User can click "Default" in Create menu to exit
      }
      return;
    }

    // Handle video generation mode
    if (isVideoPromptMode) {
      if (inputMessage.trim()) {
        onSubmitMessage({ type: 'generate-video', prompt: inputMessage.trim() });
        setInputMessage('');
        setIsVideoPromptMode(false);
        setCreateType(null);
        setSelectedActionChip(null);
      }
      return;
    }

    // Handle flowchart creation mode
    if (isFlowchartPromptMode) {
      if (inputMessage.trim()) {
        onSubmitMessage({
          type: 'create-flowchart',
          text: inputMessage.trim(),
          createType: 'flowchart'
        });
        setInputMessage('');
        setIsFlowchartPromptMode(false);
        setCreateType(null);
        setSelectedActionChip(null);
      }
      return;
    }

    // Handle regular messages
    onSubmitMessage({
      text: inputMessage,
      file: uploadedFile,
      actionChip: selectedActionChip,
      mode: thinkingMode,
      createType: createType
    });
    setInputMessage(''); // Clear input after submission attempt
    // Clearing uploadedFile and selectedActionChip should be handled by parent via props or after successful submission
  };

  const handleKeyDown = (event) => {
    // Always allow sending with Ctrl+Enter or Cmd+Enter
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      handleInternalSubmit();
      return;
    }

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

    // Check for file first (existing behavior)
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        event.preventDefault();
        const file = item.getAsFile();
        if (file) {
          onFileSelected(file);
        }
        return;
      }
    }

    // Check for text content - need to prevent default before async operation
    const textItem = Array.from(items).find(item => item.kind === 'string' && item.type === 'text/plain');
    if (textItem) {
      // Get the text synchronously from clipboard data
      const text = event.clipboardData.getData('text/plain');
      if (text && text.length > 1000) {
        event.preventDefault();

        // Create a virtual file object for the pasted text
        const blob = new Blob([text], { type: 'text/plain' });
        const file = new File([blob], 'pasted-text.txt', { type: 'text/plain' });
        file.isPastedText = true;
        file.pastedContent = text;

        onFileSelected(file);
      }
    }
  };

  // Drag and drop handlers
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;

    // Check if the drag contains files
    if (e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
      setIsDraggingOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;

    if (dragCounterRef.current === 0) {
      setIsDraggingOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDraggingOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // Convert FileList to array and process each file
      const fileArray = Array.from(files);
      fileArray.forEach(file => {
        onFileSelected(file);
      });
    }
  }, [onFileSelected]);

  // Set up global drag and drop listeners
  useEffect(() => {
    const handleWindowDragEnter = (e) => {
      e.preventDefault();
      if (e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
        dragCounterRef.current++;
        setIsDraggingOver(true);
      }
    };

    const handleWindowDragLeave = (e) => {
      e.preventDefault();
      dragCounterRef.current--;
      if (dragCounterRef.current === 0) {
        setIsDraggingOver(false);
      }
    };

    const handleWindowDragOver = (e) => {
      e.preventDefault();
    };

    const handleWindowDrop = (e) => {
      e.preventDefault();
      dragCounterRef.current = 0;
      setIsDraggingOver(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0 && !isLoading && !isProcessingFile) {
        const fileArray = Array.from(files);
        fileArray.forEach(file => {
          onFileSelected(file);
        });
      }
    };

    window.addEventListener('dragenter', handleWindowDragEnter);
    window.addEventListener('dragleave', handleWindowDragLeave);
    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('drop', handleWindowDrop);

    return () => {
      window.removeEventListener('dragenter', handleWindowDragEnter);
      window.removeEventListener('dragleave', handleWindowDragLeave);
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, [onFileSelected, isLoading, isProcessingFile]);

  const getPlaceholderText = () => {
    if (isImagePromptMode) return "Enter prompt for image generation...";
    if (isVideoPromptMode) return "Enter prompt for video generation...";
    if (isFlowchartPromptMode) return "Describe the flowchart you want to create...";
    if (isLoading) return "Waiting for response...";
    if (isProcessingFile) return "Processing file...";
    if (uploadedFile) {
      if (Array.isArray(uploadedFile)) {
        return `Attached: ${uploadedFile.length} file${uploadedFile.length > 1 ? 's' : ''}. Add text or send.`;
      } else {
        return `Attached: ${uploadedFile.name}. Add text or send.`;
      }
    }
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
    // Clear all creation modes first
    setIsImagePromptMode(false);
    setIsVideoPromptMode(false);
    setIsFlowchartPromptMode(false);

    setCreateType(type);
    if (type === 'image') {
      setSelectedActionChip('create-image');
      setIsImagePromptMode(true);
      setInputMessage('');
    } else if (type === 'video') {
      setSelectedActionChip('create-video');
      setIsVideoPromptMode(true);
      setInputMessage('');
    } else if (type === 'flowchart') {
      setSelectedActionChip('create-flowchart');
      setIsFlowchartPromptMode(true);
      setInputMessage('');
    } else if (type === 'sandbox3d') {
      setSelectedActionChip(null);
      setCreateType(null);
      onToggleSandbox3D();
    } else {
      // Default or other - clear everything
      setSelectedActionChip(null);
      setCreateType(null);
    }
    // The PopupMenu (ToolMenuModal) calls onClose itself after onSelect, so no need to setShowCreateModal(false) here.
  };

  const handleWaveformClick = () => {
    setIsLiveModeOpen(true);
    if (onLiveModeToggle) {
      onLiveModeToggle(true);
    }
  };

  // Update live mode state when it changes externally
  useEffect(() => {
    // If live mode is closed externally, update local state
    if (!onLiveModeToggle) {
      setIsLiveModeOpen(false);
    }
  }, [onLiveModeToggle]);

  const isAnyModalOpen = isEquationEditorOpen || isWhiteboardOpen || showModeModal || showCreateModal || isGraphingOpen || isFlowchartOpen || isSandbox3DOpen;

  // Helper function to render a chip
  const renderChip = (chipData, index, isHidden = false) => {
    const { type } = chipData;
    const ref = isHidden ? null : (el) => { chipRefs.current[index] = el; };

    if (type === 'mode') {
      return (
        <ActionChip
          key="mode"
          ref={isHidden ? null : (el) => {
            if (el) {
              modeAnchorRef.current = el;
              if (!isHidden) chipRefs.current[index] = el;
            }
          }}
          selected={thinkingMode === 'thinking'}
          onClick={() => {
            if (isHidden) setShowOverflowDropdown(false);
            // Toggle thinking mode directly
            setThinkingMode(prev => prev === 'thinking' ? null : 'thinking');
          }}
        >
          {theme.name === 'retro' ? (
            <RetroIconWrapper>
              <img src="/images/retroTheme/brainIcon.png" alt="Thinking" style={{ width: '16px', height: '16px' }} />
            </RetroIconWrapper>
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
          Thinking
        </ActionChip>
      );
    } else if (type === 'search') {
      return (
        <ActionChip
          key="search"
          ref={ref}
          selected={selectedActionChip === 'search'}
          onClick={() => {
            if (isHidden) setShowOverflowDropdown(false);
            if (selectedActionChip === 'search') {
              setSelectedActionChip(null);
            } else {
              setSelectedActionChip('search');
              setThinkingMode(null);
            }
          }}
        >
          {theme.name === 'retro' ? (
            <RetroIconWrapper>
              <img src="/images/retroTheme/searchIcon.png" alt="Search" style={{ width: '16px', height: '16px' }} />
            </RetroIconWrapper>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          )}
          Search
        </ActionChip>
      );
    } else if (type === 'analysis-tool') {
      // Only show analysis tool (code execution) if the current model supports it
      const supportsCodeExecution = modelCapabilities?.code_execution === true;

      if (!supportsCodeExecution) {
        // Don't render the chip if the model doesn't support code execution
        return null;
      }

      return (
        <ActionChip
          key="analysis-tool"
          ref={ref}
          selected={selectedActionChip === 'analysis-tool'}
          onClick={() => {
            if (isHidden) setShowOverflowDropdown(false);
            if (selectedActionChip === 'analysis-tool') {
              setSelectedActionChip(null);
            } else {
              setSelectedActionChip('analysis-tool');
              setThinkingMode(null);
            }
          }}
          title="Code Execution - Run code to analyze data, generate charts, and more"
        >
          {theme.name === 'retro' ? (
            <RetroIconWrapper>
              <img src="/images/retroTheme/deepResearch.png" alt="Analysis Tool" style={{ width: '16px', height: '16px' }} />
            </RetroIconWrapper>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6"></polyline>
              <polyline points="8 6 2 12 8 18"></polyline>
            </svg>
          )}
          Analysis
        </ActionChip>
      );
    } else if (type === 'create') {
      return (
        <ActionChip
          key="create"
          ref={isHidden ? null : (el) => {
            if (el) {
              createAnchorRef.current = el;
              if (!isHidden) chipRefs.current[index] = el;
            }
          }}
          selected={selectedActionChip === 'create-image' || selectedActionChip === 'create-video' || selectedActionChip === 'create-flowchart'}
          onClick={() => {
            if (isHidden) setShowOverflowDropdown(false);
            if (createAnchorRef.current) {
              createAnchorRef.current.offsetHeight;
              const currentRect = createAnchorRef.current.getBoundingClientRect();
              setCreateMenuRect(currentRect);
            }
            setShowCreateModal(true);
          }}
        >
          {theme.name === 'retro' ? (
            <RetroIconWrapper>
              <img src="/images/retroTheme/createIcon.png" alt="Create" style={{ width: '16px', height: '16px' }} />
            </RetroIconWrapper>
          ) : createType === 'image' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
          ) : createType === 'video' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
              <line x1="7" y1="2" x2="7" y2="22"></line>
              <line x1="17" y1="2" x2="17" y2="22"></line>
            </svg>
          ) : createType === 'flowchart' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="18" r="3"></circle>
              <circle cx="6" cy="6" r="3"></circle>
              <circle cx="18" cy="6" r="3"></circle>
              <path d="M18 9v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9"></path>
              <path d="M12 12v3"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
          )}
          {createType === 'image' ? 'Create image' : createType === 'video' ? 'Create video' : createType === 'flowchart' ? 'Create flowchart' : 'Create'}
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '3px', opacity: 0.7 }}>
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </ActionChip>
      );
    }
    return null;
  };

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
      $isWhiteboardOpen={isWhiteboardOpen}
      $isEquationEditorOpen={isEquationEditorOpen}
      $isGraphingOpen={isGraphingOpen}
      $isFlowchartOpen={isFlowchartOpen}
      $isSandbox3DOpen={isSandbox3DOpen}
    >
      <ChipsDock $visible={chatIsEmpty || chipsExpanded} $indent={chatIsEmpty || chipsExpanded}>
        <ActionChipsContainer ref={chipsContainerRef}>
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
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            )}
          </HammerButton>

          {/* Render visible chips */}
          {visibleChips.map((chip, index) => renderChip({
            type: chip
          }, index))}

          {/* Render overflow button if there are hidden chips */}
          {hiddenChips.length > 0 && (
            <div style={{ position: 'relative' }}>
              <OverflowChipButton
                ref={overflowButtonRef}
                onClick={() => setShowOverflowDropdown(!showOverflowDropdown)}
                theme={theme}
                aria-label="More actions"
              >
                ...
              </OverflowChipButton>

              {showOverflowDropdown && (
                <OverflowDropdown theme={theme}>
                  {hiddenChips.map((chip) => renderChip({
                    type: chip
                  }, -1, true))}
                </OverflowDropdown>
              )}
            </div>
          )}
        </ActionChipsContainer>
      </ChipsDock>

      <ComposerRow>
        <ComposerPlusButton
          type="button"
          onClick={handleToggleChips}
          $visible={!chatIsEmpty}
          $expanded={chipsExpanded}
          aria-label={chipsExpanded ? 'Hide actions' : 'Show actions'}
          title={chipsExpanded ? 'Hide actions' : 'Show actions'}
          disabled={chatIsEmpty || isLoading || isProcessingFile}
        >
          <span className="plus-icon" />
        </ComposerPlusButton>

        <MessageInputWrapper $isEmpty={chatIsEmpty}>
          <FilesPreviewContainer $show={uploadedFile && (Array.isArray(uploadedFile) ? uploadedFile.length > 0 : true)} theme={theme}>
            {uploadedFile && (Array.isArray(uploadedFile) ? uploadedFile : [uploadedFile]).map((file, index) => {
              // Helper to get file extension
              const getFileExtension = (filename) => {
                if (!filename) return '';
                const parts = filename.split('.');
                return parts.length > 1 ? parts.pop().toLowerCase() : '';
              };

              const ext = getFileExtension(file.name);
              const isImage = file.type?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
              const isPDF = file.type === 'application/pdf' || ext === 'pdf';
              const hasVisualPreview = isImage || (isPDF && file.pdfThumbnail);

              // Get preview URL for images
              const getPreviewUrl = () => {
                if (isImage) {
                  return file.dataUrl || (file instanceof File ? URL.createObjectURL(file) : null);
                }
                if (isPDF && file.pdfThumbnail) {
                  return file.pdfThumbnail;
                }
                return null;
              };

              const previewUrl = getPreviewUrl();

              // Render file type icon based on extension
              const renderFileTypeIcon = () => {
                // Pasted text icon
                if (file.isPastedText) {
                  return (
                    <FileTypeIcon $fileType="txt" theme={theme}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                      </svg>
                    </FileTypeIcon>
                  );
                }

                // PDF icon
                if (isPDF) {
                  return (
                    <FileTypeIcon $fileType="pdf" theme={theme}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <path d="M10 12h4"></path>
                        <path d="M10 16h4"></path>
                      </svg>
                    </FileTypeIcon>
                  );
                }

                // Word documents
                if (['doc', 'docx'].includes(ext)) {
                  return (
                    <FileTypeIcon $fileType={ext} theme={theme}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="8" y1="13" x2="16" y2="13"></line>
                        <line x1="8" y1="17" x2="16" y2="17"></line>
                      </svg>
                    </FileTypeIcon>
                  );
                }

                // Excel files
                if (['xls', 'xlsx', 'csv'].includes(ext)) {
                  return (
                    <FileTypeIcon $fileType={ext} theme={theme}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <rect x="8" y="12" width="8" height="6" rx="1"></rect>
                      </svg>
                    </FileTypeIcon>
                  );
                }

                // PowerPoint files
                if (['ppt', 'pptx'].includes(ext)) {
                  return (
                    <FileTypeIcon $fileType={ext} theme={theme}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <rect x="8" y="12" width="8" height="6" rx="1"></rect>
                      </svg>
                    </FileTypeIcon>
                  );
                }

                // Archive files
                if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
                  return (
                    <FileTypeIcon $fileType="zip" theme={theme}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <path d="M12 11v6"></path>
                        <path d="M9 14h6"></path>
                      </svg>
                    </FileTypeIcon>
                  );
                }

                // Shell scripts
                if (['sh', 'bash', 'zsh', 'fish'].includes(ext)) {
                  return (
                    <FileTypeIcon $fileType={ext} theme={theme}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="4 17 10 11 4 5"></polyline>
                        <line x1="12" y1="19" x2="20" y2="19"></line>
                      </svg>
                    </FileTypeIcon>
                  );
                }

                // PowerShell
                if (['ps1', 'psm1', 'psd1'].includes(ext)) {
                  return (
                    <FileTypeIcon $fileType={ext} theme={theme}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="4 17 10 11 4 5"></polyline>
                        <line x1="12" y1="19" x2="20" y2="19"></line>
                      </svg>
                    </FileTypeIcon>
                  );
                }

                // Code files (comprehensive list)
                const codeExts = [
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
                  'vue', 'svelte'                            // Frontend frameworks
                ];
                if (codeExts.includes(ext)) {
                  return (
                    <FileTypeIcon $fileType={ext} theme={theme}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="16 18 22 12 16 6"></polyline>
                        <polyline points="8 6 2 12 8 18"></polyline>
                      </svg>
                    </FileTypeIcon>
                  );
                }

                // JSON/YAML/TOML files
                if (['json', 'yaml', 'yml', 'toml'].includes(ext)) {
                  return (
                    <FileTypeIcon $fileType={ext} theme={theme}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h1"></path>
                        <path d="M16 3h1a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-1"></path>
                        <circle cx="12" cy="12" r="1"></circle>
                      </svg>
                    </FileTypeIcon>
                  );
                }

                // HTML/XML files
                if (['html', 'htm', 'xml', 'xhtml'].includes(ext)) {
                  return (
                    <FileTypeIcon $fileType={ext} theme={theme}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="16 18 22 12 16 6"></polyline>
                        <polyline points="8 6 2 12 8 18"></polyline>
                      </svg>
                    </FileTypeIcon>
                  );
                }

                // CSS/Style files
                if (['css', 'scss', 'sass', 'less', 'styl'].includes(ext)) {
                  return (
                    <FileTypeIcon $fileType={ext} theme={theme}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <path d="M2 15h10"></path>
                        <path d="M9 18l3-3-3-3"></path>
                      </svg>
                    </FileTypeIcon>
                  );
                }

                // Markdown files
                if (['md', 'markdown', 'rst'].includes(ext)) {
                  return (
                    <FileTypeIcon $fileType={ext === 'rst' ? 'rst' : 'md'} theme={theme}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <path d="M9 15l2-2 2 2"></path>
                        <path d="M11 13v4"></path>
                      </svg>
                    </FileTypeIcon>
                  );
                }

                // Config files
                if (['ini', 'cfg', 'conf', 'config', 'env'].includes(ext) ||
                  file.name.toLowerCase().startsWith('.env')) {
                  return (
                    <FileTypeIcon $fileType={ext || 'env'} theme={theme}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                      </svg>
                    </FileTypeIcon>
                  );
                }

                // Build files (Dockerfile, Makefile)
                if (['dockerfile', 'makefile', 'cmake'].includes(ext) ||
                  file.name.toLowerCase() === 'dockerfile' ||
                  file.name.toLowerCase() === 'makefile') {
                  const buildType = file.name.toLowerCase() === 'dockerfile' ? 'dockerfile' :
                    file.name.toLowerCase() === 'makefile' ? 'makefile' : ext;
                  return (
                    <FileTypeIcon $fileType={buildType} theme={theme}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                      </svg>
                    </FileTypeIcon>
                  );
                }

                // Text files
                if (['txt', 'log', 'rtf'].includes(ext)) {
                  return (
                    <FileTypeIcon $fileType="txt" theme={theme}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="8" y1="13" x2="16" y2="13"></line>
                        <line x1="8" y1="17" x2="12" y2="17"></line>
                      </svg>
                    </FileTypeIcon>
                  );
                }

                // Default file icon
                return (
                  <FileTypeIcon $fileType="default" theme={theme}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                  </FileTypeIcon>
                );
              };

              return (
                <FilePreviewChip key={index} theme={theme}>
                  <FilePreviewIcon theme={theme} $hasPreview={hasVisualPreview || !isImage}>
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" />
                    ) : (
                      renderFileTypeIcon()
                    )}
                  </FilePreviewIcon>
                  <FilePreviewName>{file.name}</FilePreviewName>
                  <FilePreviewRemove onClick={() => onRemoveFile && onRemoveFile(index)}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </FilePreviewRemove>
                </FilePreviewChip>
              );
            })}
          </FilesPreviewContainer>

          <InputRow>
            <FileUploadButton
              onFileSelected={onFileSelected}
              disabled={isLoading || isProcessingFile}
              resetFile={resetFileUploadTrigger}
              externalFile={uploadedFile} // Pass the uploadedFile data directly
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
            <WaveformButton
              onClick={handleWaveformClick}
              disabled={isLoading || isProcessingFile}
              title={isLiveModeOpen ? "Live Mode Active" : "Start Live Mode"}
              $isActive={isLiveModeOpen}
            >
              <img
                src="/images/waveform.svg"
                alt="Live Mode"
                style={{
                  width: '25px',
                  height: '25px',
                  filter: isLiveModeOpen ? 'invert(0) brightness(1)' : 'invert(1) brightness(2)',
                  opacity: isLiveModeOpen ? '1' : '0.8'
                }}
              />
              {isLiveModeOpen && (
                <div style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#ff4444',
                  animation: 'pulse 1.5s infinite'
                }} />
              )}
            </WaveformButton>
            <SendButton
              onClick={handleInternalSubmit}
              disabled={isLoading || isProcessingFile || (!inputMessage.trim() && !uploadedFile)}
            >
              {theme.name === 'retro' ? (
                <img src="/images/retroTheme/sendIcon.png" alt="Send" style={{ width: '16px', height: '16px' }} />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 19V5" />
                  <path d="M5 12l7-7 7 7" />
                </svg>
              )}
            </SendButton>
          </InputRow>

          <ToolbarContainer $isOpen={showToolbar} $isEmpty={chatIsEmpty} ref={toolbarContainerRef}>
            <ToolbarItem title="Equation Editor" onClick={onToggleEquationEditor}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 4H6L12 12L6 20H18" />
              </svg>
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
            <ToolbarItem title="Flowchart" onClick={onToggleFlowchart}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="18" r="3"></circle>
                <circle cx="6" cy="6" r="3"></circle>
                <circle cx="18" cy="6" r="3"></circle>
                <path d="M18 9v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9"></path>
                <path d="M12 12v3"></path>
              </svg>
            </ToolbarItem>
            <ToolbarItem title="3D Sandbox" onClick={onToggleSandbox3D}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
            </ToolbarItem>
          </ToolbarContainer>
        </MessageInputWrapper>
      </ComposerRow>

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

      <DragDropOverlay isVisible={isDraggingOver} />
    </InputContainer>
  );
});

ChatInputArea.displayName = 'ChatInputArea';

export default ChatInputArea; 

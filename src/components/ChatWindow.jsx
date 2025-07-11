import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, useCallback, useMemo } from 'react';
import { useTheme } from 'styled-components';
import ChatMessage from './ChatMessage';
import ModelSelector from './ModelSelector';
import HtmlArtifactModal from './HtmlArtifactModal';
import { useToast } from '../contexts/ToastContext';
import * as pdfjsLib from 'pdfjs-dist';
import PdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?worker';
import ChatInputArea from './ChatInputArea';
import LiveModeUI from './LiveModeUI';
import useMessageSender from '../hooks/useMessageSender';
import {
  ChatWindowContainer,
  ChatHeader,
  ChatTitleSection,
  ChatTitle,
  MessageList,
  EmptyState,
} from './ChatWindow.styled';

pdfjsLib.GlobalWorkerOptions.workerPort = new PdfWorker();

const ChatWindow = forwardRef(({ 
  chat, 
  addMessage,
  updateMessage,
  updateChatTitle,
  selectedModel: initialSelectedModel, 
  settings, 
  $sidebarCollapsed = false, 
  availableModels,
  onAttachmentChange,
  onModelChange,
  showGreeting = true,
  isWhiteboardOpen,
  onToggleWhiteboard,
  onCloseWhiteboard,
  isEquationEditorOpen,
  onToggleEquationEditor,
  onCloseEquationEditor,
  isGraphingOpen,
  onToggleGraphing,
  onCloseGraphing,
  isFlowchartOpen,
  onToggleFlowchart,
  onCloseFlowchart,
  isSandbox3DOpen,
  onToggleSandbox3D,
  onCloseSandbox3D,
  onToolbarToggle,
}, ref) => {
  // All hooks at the top level - no conditional returns before this
  const [selectedModel, setSelectedModel] = useState(initialSelectedModel || 'gemini-2-flash');
  const [isProcessingFile, setIsProcessingFile] = useState(false); 
  const [isLiveModeOpen, setIsLiveModeOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(chat?.title || 'New Conversation');
  const [uploadedFileData, setUploadedFileData] = useState(null); 
  const [resetFileUpload, setResetFileUpload] = useState(false);
  const [artifactHTML, setArtifactHTML] = useState(null);
  const [isArtifactModalOpen, setIsArtifactModalOpen] = useState(false);
  const [animateDown, setAnimateDown] = useState(false);
  
  const messagesEndRef = useRef(null);
  const chatInputAreaRef = useRef(null);
  const prevIsEmptyRef = useRef(false);
  
  const toast = useToast();
  const theme = useTheme();

  // Memoized values
  const chatIsEmpty = useMemo(() => {
    return !chat || !chat.messages || chat.messages.length === 0;
  }, [chat]);

  const shouldStartAnimationThisRender = useMemo(() => {
    return prevIsEmptyRef.current && !chatIsEmpty;
  }, [chatIsEmpty]);

  const effectiveAnimateDownSignal = useMemo(() => {
    return animateDown || shouldStartAnimationThisRender;
  }, [animateDown, shouldStartAnimationThisRender]);

  const showEmptyStateStatic = useMemo(() => {
    return showGreeting && chatIsEmpty && !effectiveAnimateDownSignal;
  }, [showGreeting, chatIsEmpty, effectiveAnimateDownSignal]);

  const animateEmptyStateOut = useMemo(() => {
    return (!chatIsEmpty || shouldStartAnimationThisRender || !showGreeting) && effectiveAnimateDownSignal;
  }, [chatIsEmpty, shouldStartAnimationThisRender, showGreeting, effectiveAnimateDownSignal]);

  // Callbacks
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleFileSelected = useCallback(async (files) => {
    if (!files) {
      setUploadedFileData(null);
      if (onAttachmentChange) onAttachmentChange(false);
      return;
    }

    // Handle single file (backward compatibility)
    if (!Array.isArray(files)) {
      files = [files];
    }

    if (files.length === 0) {
      setUploadedFileData(null);
      if (onAttachmentChange) onAttachmentChange(false);
      return;
    }

    // Get existing files to add to (but don't exceed 4 total)
    const existingFiles = uploadedFileData ? (Array.isArray(uploadedFileData) ? uploadedFileData : [uploadedFileData]) : [];
    const totalFiles = existingFiles.length + files.length;
    
    if (totalFiles > 4) {
      alert(`You can only upload up to 4 files total. You currently have ${existingFiles.length} files and are trying to add ${files.length} more.`);
      return;
    }

    setIsProcessingFile(true);
    if (onAttachmentChange) onAttachmentChange(true);

    try {
      const processedFiles = [...existingFiles]; // Start with existing files
      
      for (const file of files) {
        const isImage = file.type.startsWith('image/');
        const isText = file.type === 'text/plain' || file.isPastedText;
        const isPdf = file.type === 'application/pdf';

        if (!isImage && !isText && !isPdf) {
          alert(`Unsupported file type: ${file.name}`);
          continue;
        }

        if (file.size > 10 * 1024 * 1024) { 
          alert(`File too large: ${file.name}. Max size is 10MB.`);
          continue;
        }

        if (isImage) {
          const reader = new FileReader();
          const dataUrl = await new Promise((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          processedFiles.push({ 
            type: 'image', 
            content: dataUrl, 
            dataUrl: dataUrl, 
            name: file.name 
          });
        } else if (isText) {
          if (file.isPastedText) {
            // Handle pasted text
            processedFiles.push({ 
              type: 'text', 
              content: file.pastedContent, 
              text: file.pastedContent, 
              name: file.name,
              isPastedText: true
            });
          } else {
            // Handle regular text file
            const reader = new FileReader();
            const text = await new Promise((resolve, reject) => {
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsText(file);
            });
            processedFiles.push({ 
              type: 'text', 
              content: text, 
              text: text, 
              name: file.name 
            });
          }
        } else if (isPdf) {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map(item => item.str).join(' ') + '\n';
          }
          if (!fullText.trim()) {
            fullText = "This appears to be a scanned PDF without extractable text.";
          }
          const trimmedText = fullText.trim();
          processedFiles.push({ 
            type: 'pdf', 
            content: trimmedText, 
            text: trimmedText, 
            name: file.name 
          });
        }
      }

      if (processedFiles.length > 0) {
        setUploadedFileData(processedFiles);
      } else {
        setUploadedFileData(null);
        if (onAttachmentChange) onAttachmentChange(false);
      }
      
      setIsProcessingFile(false);
      setResetFileUpload(false);
    } catch (error) {
      console.error('Error processing file:', error);
      toast?.showToast('Error processing file', 'error');
      setIsProcessingFile(false);
      if (onAttachmentChange) onAttachmentChange(false);
    }
  }, [uploadedFileData, onAttachmentChange, toast]);

  const clearUploadedFile = useCallback(() => {
    setUploadedFileData(null);
    setResetFileUpload(prev => !prev);
    if (onAttachmentChange) {
      onAttachmentChange(false);
    }
  }, [onAttachmentChange]);

  const removeFileByIndex = useCallback((index) => {
    if (!uploadedFileData) return;
    
    const filesArray = Array.isArray(uploadedFileData) ? uploadedFileData : [uploadedFileData];
    const newFiles = filesArray.filter((_, i) => i !== index);
    
    if (newFiles.length === 0) {
      clearUploadedFile();
    } else {
      setUploadedFileData(newFiles);
    }
  }, [uploadedFileData, clearUploadedFile]);

  const handleModelChange = useCallback((modelId) => {
    setSelectedModel(modelId);
    if (availableModels) {
      localStorage.setItem('selectedModel', modelId);
      if (onModelChange && typeof onModelChange === 'function') {
        onModelChange(modelId);
      }
    }
  }, [availableModels, onModelChange]);

  const handleLiveModeToggle = useCallback((isOpen) => {
    setIsLiveModeOpen(isOpen);
  }, []);

  const handleCloseLiveMode = useCallback(() => {
    setIsLiveModeOpen(false);
  }, []);

  const handleStartEditing = useCallback(() => {
    setIsEditingTitle(true);
    setEditedTitle(chat?.title || 'New Conversation');
  }, [chat?.title]);

  const handleTitleChange = useCallback((e) => {
    setEditedTitle(e.target.value);
  }, []);

  const handleTitleSave = useCallback(() => {
    if (chat && updateChatTitle) {
      updateChatTitle(chat.id, editedTitle);
    }
    setIsEditingTitle(false);
  }, [chat, updateChatTitle, editedTitle]);

  const handleTitleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
      setEditedTitle(chat?.title || 'New Conversation');
    }
  }, [handleTitleSave, chat?.title]);

  // Message sender hook
  const { isLoading, submitMessage: sendChatMessage } = useMessageSender({
    chat,
    selectedModel,
    settings,
    availableModels,
    addMessage,
    updateMessage,
    updateChatTitle,
    toastContext: toast,
    scrollToBottom,
    setUploadedFileData, 
    setResetFileUpload,
    onAttachmentChange,
  });

  // Effects
  useEffect(() => {
    if (shouldStartAnimationThisRender) {
      setAnimateDown(true);
      const timer = setTimeout(() => {
        setAnimateDown(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [shouldStartAnimationThisRender]);

  useEffect(() => {
    prevIsEmptyRef.current = chatIsEmpty;
  }, [chatIsEmpty]);

  useEffect(() => {
    if (chatIsEmpty) {
      setAnimateDown(false);
    }
  }, [chatIsEmpty]);

  useEffect(() => {
    // Initial scroll and scroll on new messages
    scrollToBottom();
  }, [chat?.messages, scrollToBottom]);
  
  useEffect(() => {
    if (initialSelectedModel && initialSelectedModel !== selectedModel) {
      setSelectedModel(initialSelectedModel);
    }
  }, [initialSelectedModel, selectedModel]);
  
  useEffect(() => {
    if (chat?.id && initialSelectedModel && $sidebarCollapsed) {
      setSelectedModel(initialSelectedModel);
      setResetFileUpload(false);
    }
  }, [chat?.id, initialSelectedModel, $sidebarCollapsed]);

  useEffect(() => {
    if (chat && chat.messages && chat.messages.length > 0) {
      const lastMsg = chat.messages[chat.messages.length - 1];
      if (lastMsg.role === 'assistant' && lastMsg.content && !lastMsg.isLoading) {
        const htmlMatch = lastMsg.content.match(/```html\n([\s\S]*?)\n```/);
        if (htmlMatch && htmlMatch[1]) {
          setArtifactHTML(htmlMatch[1]);
          setIsArtifactModalOpen(true);
        } else {
          setArtifactHTML(null);
        }
      } else {
        setArtifactHTML(null);
      }
    } else {
      setArtifactHTML(null);
    }
  }, [chat?.messages]);

  useEffect(() => {
    if (onAttachmentChange) {
      onAttachmentChange(!!uploadedFileData);
    }
  }, [uploadedFileData, onAttachmentChange]);

  // Imperative handle
  useImperativeHandle(ref, () => ({
    handleFileSelected,
    appendToInput: (text) => {
      if (chatInputAreaRef.current && chatInputAreaRef.current.appendToInput) {
        chatInputAreaRef.current.appendToInput(text);
      }
    }
  }), [handleFileSelected]);

  // Early return for no chat - after all hooks
  if (!chat) {
    return (
      <ChatWindowContainer fontSize={settings?.fontSize} $sidebarCollapsed={$sidebarCollapsed}>
        <EmptyState $isExiting={animateEmptyStateOut}>
          {/* Minimal content for when no chat is selected */}
        </EmptyState>
         <ChatInputArea 
            chatIsEmpty={true} 
            animateDown={false} 
            $sidebarCollapsed={$sidebarCollapsed}
            settings={settings}
            onSubmitMessage={() => {}} // No-op for disabled state
            onFileSelected={() => {}}   // No-op
            isLoading={true} // Display as loading/disabled
            isProcessingFile={false}
            uploadedFile={null}
            onClearAttachment={() => {}}
            resetFileUploadTrigger={false}
            availableModels={availableModels}
          />
      </ChatWindowContainer>
    );
  }

  return (
    <ChatWindowContainer 
      fontSize={settings?.fontSize} 
      $sidebarCollapsed={$sidebarCollapsed}
    >
      <ChatHeader 
        style={{ opacity: ($sidebarCollapsed && isFocused) ? '0' : '1', transition: 'opacity 0.3s ease'}}
        $sidebarCollapsed={$sidebarCollapsed}
      >
        <ChatTitleSection $sidebarCollapsed={$sidebarCollapsed}>
          {selectedModel !== 'instant' && (
            <ModelSelector
              selectedModel={selectedModel}
              models={availableModels}
              onChange={handleModelChange}
              key="model-selector"
              theme={theme}
            />
          )}
        </ChatTitleSection>
      </ChatHeader>
      
      {(showGreeting && (showEmptyStateStatic || animateEmptyStateOut)) && !isLiveModeOpen && (
        <EmptyState $isExiting={animateEmptyStateOut}>
          {/* Content for empty state, e.g., a greeting message */}
        </EmptyState>
      )}
      
      {!chatIsEmpty && !isLiveModeOpen && chat && (
          <MessageList>
            {Array.isArray(chat.messages) && chat.messages.map(message => (
              <ChatMessage 
                key={message.id} 
                message={message} 
                showModelIcons={settings.showModelIcons}
                settings={settings}
                theme={theme}
              />
            ))}
            <div ref={messagesEndRef} />
          </MessageList>
      )}
      
      {isLiveModeOpen && (
        <MessageList>
          <LiveModeUI 
            selectedModel={selectedModel}
            onClose={handleCloseLiveMode}
          />
        </MessageList>
      )}
      
      {!isLiveModeOpen && (
        <ChatInputArea 
          ref={chatInputAreaRef}
          chatIsEmpty={chatIsEmpty} 
          animateDown={effectiveAnimateDownSignal} 
          $sidebarCollapsed={$sidebarCollapsed}
          settings={settings}
          onSubmitMessage={sendChatMessage}
          onFileSelected={handleFileSelected} 
          isLoading={isLoading}
          isProcessingFile={isProcessingFile}
          uploadedFile={uploadedFileData}
          onClearAttachment={clearUploadedFile}
          onRemoveFile={removeFileByIndex}
          resetFileUploadTrigger={resetFileUpload}
          availableModels={availableModels}
          isWhiteboardOpen={isWhiteboardOpen}
          onToggleWhiteboard={onToggleWhiteboard}
          onCloseWhiteboard={onCloseWhiteboard}
          isEquationEditorOpen={isEquationEditorOpen}
          onToggleEquationEditor={onToggleEquationEditor}
          onCloseEquationEditor={onCloseEquationEditor}
          isGraphingOpen={isGraphingOpen}
          onToggleGraphing={onToggleGraphing}
          onCloseGraphing={onCloseGraphing}
          isFlowchartOpen={isFlowchartOpen}
          onToggleFlowchart={onToggleFlowchart}
          onCloseFlowchart={onCloseFlowchart}
          isSandbox3DOpen={isSandbox3DOpen}
          onToggleSandbox3D={onToggleSandbox3D}
          onCloseSandbox3D={onCloseSandbox3D}
          onToolbarToggle={onToolbarToggle}
          onLiveModeToggle={handleLiveModeToggle}
        />
      )}

      <HtmlArtifactModal 
        isOpen={isArtifactModalOpen}
        onClose={() => setIsArtifactModalOpen(false)}
        htmlContent={artifactHTML}
      />
    </ChatWindowContainer>
  );
});

ChatWindow.displayName = 'ChatWindow';

export default ChatWindow;



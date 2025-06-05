import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useTheme } from 'styled-components';
import ChatMessage from './ChatMessage';
import ModelSelector from './ModelSelector';
import { useToast } from '../contexts/ToastContext';
import * as pdfjsLib from 'pdfjs-dist';
import PdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?worker';
import ChatInputArea from './ChatInputArea';
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
  onToolbarToggle,
}, ref) => {
  const [selectedModel, setSelectedModel] = useState(initialSelectedModel || 'gemini-2-flash');
  const [isProcessingFile, setIsProcessingFile] = useState(false); 
  
  const messagesEndRef = useRef(null);
  const chatInputAreaRef = useRef(null);
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(chat?.title || 'New Conversation');
  const [uploadedFileData, setUploadedFileData] = useState(null); 
  const [resetFileUpload, setResetFileUpload] = useState(false);
  const toast = useToast();
  const theme = useTheme();

  // Define scrollToBottom before passing it to the hook
  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

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

  const chatIsEmpty = !chat || chat.messages.length === 0;
  const prevIsEmptyRef = useRef(chatIsEmpty);
  const [animateDown, setAnimateDown] = useState(false);
  const shouldStartAnimationThisRender = prevIsEmptyRef.current && !chatIsEmpty;

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
  });

  useEffect(() => {
    if (chatIsEmpty) {
      setAnimateDown(false);
    }
  }, [chatIsEmpty]);

  const effectiveAnimateDownSignal = animateDown || shouldStartAnimationThisRender;
  
  useEffect(() => {
    // Initial scroll and scroll on new messages
    scrollToBottom();
  }, [chat?.messages]);
  
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

  const handleFileSelected = async (file) => {
    if (!file) {
      setUploadedFileData(null);
      if (onAttachmentChange) onAttachmentChange(false);
      return;
    }
    const isImage = file.type.startsWith('image/');
    const isText = file.type === 'text/plain';
    const isPdf = file.type === 'application/pdf';

    if (isImage || isText || isPdf) {
      if (file.size > 10 * 1024 * 1024) { 
        alert('File too large. Max size is 10MB.');
        return; 
      }
      setIsProcessingFile(true);
      setUploadedFileData({ file: file, type: file.type.split('/')[0], content: 'Processing...', name: file.name });
      if (onAttachmentChange) onAttachmentChange(true);

      try {
        if (isImage) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setUploadedFileData({ file: file, type: 'image', content: reader.result, dataUrl: reader.result, name: file.name });
            setIsProcessingFile(false);
          };
          reader.onerror = () => { 
            setIsProcessingFile(false); alert('Error reading image file.'); 
            if (onAttachmentChange) onAttachmentChange(false);
          };
          reader.readAsDataURL(file);
        } else if (isText) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setUploadedFileData({ file: file, type: 'text', content: reader.result, text: reader.result, name: file.name });
            setIsProcessingFile(false);
          };
          reader.onerror = () => { 
            setIsProcessingFile(false); alert('Error reading text file.');
            if (onAttachmentChange) onAttachmentChange(false);
          };
          reader.readAsText(file);
        } else if (isPdf) {
          try {
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
            const fileData = { file: file, type: 'pdf', content: trimmedText, text: trimmedText, name: file.name };
            setUploadedFileData(fileData);
            setIsProcessingFile(false);
          } catch (error) {
            console.error('Error extracting PDF text:', error);
            setIsProcessingFile(false); alert('Error extracting text from PDF: ' + error.message);
            if (onAttachmentChange) onAttachmentChange(false);
          }
        }
        setResetFileUpload(false);
      } catch (error) {
         console.error('Error processing file:', error);
         alert(`Error processing ${file.type} file: ${error.message}`);
         setUploadedFileData(null); setIsProcessingFile(false); setResetFileUpload(true);
         setTimeout(() => setResetFileUpload(false), 0);
         if (onAttachmentChange) onAttachmentChange(false);
      }
    } else {
       alert('Unsupported file type selected.');
       setUploadedFileData(null);
       if (onAttachmentChange) onAttachmentChange(false);
    }
  };

  const handleStartEditing = () => {
    setIsEditingTitle(true);
    setEditedTitle(chat?.title || 'New Conversation');
  };

  const handleTitleChange = (e) => {
    setEditedTitle(e.target.value);
  };

  const handleTitleSave = () => {
    if (editedTitle.trim()) {
      updateChatTitle(chat.id, editedTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
      setEditedTitle(chat?.title || 'New Conversation');
    }
  };

  const showEmptyStateStatic = showGreeting && chatIsEmpty && !effectiveAnimateDownSignal;
  const animateEmptyStateOut = (!chatIsEmpty || shouldStartAnimationThisRender || !showGreeting) && effectiveAnimateDownSignal;

  useEffect(() => {
    if (onAttachmentChange) {
      onAttachmentChange(!!uploadedFileData);
    }
  }, [uploadedFileData, onAttachmentChange]);

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
  
  const handleModelChange = (modelId) => {
    setSelectedModel(modelId);
    if (availableModels) {
      localStorage.setItem('selectedModel', modelId);
      if (onModelChange && typeof onModelChange === 'function') {
        onModelChange(modelId);
      }
    }
  };

  const [isFocused, setIsFocused] = useState(false);
  // const inputFocusChange = (isFocusedState) => { // This was not used, can be removed if ChatInputArea handles focus internally for sidebar effects
  //   if ($sidebarCollapsed) {
  //     setIsFocused(isFocusedState);
  //   }
  // };

  const clearUploadedFile = () => {
    setUploadedFileData(null);
    setResetFileUpload(prev => !prev);
    if (onAttachmentChange) {
      onAttachmentChange(false);
    }
  };

  // Expose handleFileSelected through ref
  useImperativeHandle(ref, () => ({
    handleFileSelected,
    appendToInput: (text) => {
      if (chatInputAreaRef.current && chatInputAreaRef.current.appendToInput) {
        chatInputAreaRef.current.appendToInput(text);
      }
    }
  }));

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
          {/* ModelSelector is displayed based on selectedModel, thinkingMode is handled by ChatInputArea */}
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
      
      {(showGreeting && (showEmptyStateStatic || animateEmptyStateOut)) && (
        <EmptyState $isExiting={animateEmptyStateOut}>
          {/* Content for empty state, e.g., a greeting message */}
        </EmptyState>
      )}
      
      {!chatIsEmpty && (
          <MessageList>
            {Array.isArray(chat.messages) && chat.messages.map(message => (
              <ChatMessage 
                key={message.id} 
                message={message} 
                showModelIcons={settings.showModelIcons}
                settings={settings}
              />
            ))}
            <div ref={messagesEndRef} />
          </MessageList>
      )}
      
      <ChatInputArea 
        ref={chatInputAreaRef}
        chatIsEmpty={chatIsEmpty} 
        animateDown={effectiveAnimateDownSignal} 
        $sidebarCollapsed={$sidebarCollapsed}
        settings={settings}
        onSubmitMessage={sendChatMessage} // Use the function from the hook
        onFileSelected={handleFileSelected} 
        isLoading={isLoading} // Use isLoading from the hook
        isProcessingFile={isProcessingFile} // Pass isProcessingFile state
        uploadedFile={uploadedFileData}
        onClearAttachment={clearUploadedFile}
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
        onToolbarToggle={onToolbarToggle}
        // Pass inputFocusChange if ChatInputArea needs to inform ChatWindow about focus for header opacity effect
        // onInputFocusChange={inputFocusChange}
      />
    </ChatWindowContainer>
  );
});

ChatWindow.displayName = 'ChatWindow';

export default ChatWindow;



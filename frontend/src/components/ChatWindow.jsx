import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, useCallback, useMemo } from 'react';
import { useTheme } from 'styled-components';
import ChatMessage from './ChatMessage';
import ModelSelector from './ModelSelector';
import ImageModelSelector from './ImageModelSelector';
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
  ModelSelectorsRow,
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

  // Image generation model state
  const [isImagePromptMode, setIsImagePromptMode] = useState(false);
  const [availableImageModels, setAvailableImageModels] = useState([]);
  const [selectedImageModel, setSelectedImageModel] = useState(null);

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

        // Check for code files by extension
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
          'r', 'R',                                  // R
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
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
        const isCodeFile = codeExtensions.includes(fileExtension) ||
          file.name.toLowerCase() === 'dockerfile' ||
          file.name.toLowerCase() === 'makefile' ||
          file.name.toLowerCase().startsWith('.env');

        if (!isImage && !isText && !isPdf && !isCodeFile) {
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
          let pdfThumbnail = null;

          // Generate thumbnail from first page
          try {
            const firstPage = await pdf.getPage(1);
            const viewport = firstPage.getViewport({ scale: 0.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            // Scale to fit within 80x80 while maintaining aspect ratio
            const maxSize = 80;
            const scale = Math.min(maxSize / viewport.width, maxSize / viewport.height);
            canvas.width = viewport.width * scale;
            canvas.height = viewport.height * scale;

            const scaledViewport = firstPage.getViewport({ scale: 0.5 * scale });

            await firstPage.render({
              canvasContext: context,
              viewport: scaledViewport
            }).promise;

            pdfThumbnail = canvas.toDataURL('image/png');
          } catch (thumbnailError) {
            console.warn('Could not generate PDF thumbnail:', thumbnailError);
          }

          // Extract text from all pages
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
            name: file.name,
            pdfThumbnail: pdfThumbnail
          });
        } else if (isCodeFile) {
          // Handle code files as text
          const reader = new FileReader();
          const text = await new Promise((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsText(file);
          });
          processedFiles.push({
            type: 'code',
            content: text,
            text: text,
            name: file.name,
            language: fileExtension
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

  // Fetch available image models from backend
  useEffect(() => {
    const fetchImageModels = async () => {
      try {
        const response = await fetch('/api/image/models');
        if (response.ok) {
          const data = await response.json();
          const models = data.models || [];
          setAvailableImageModels(models);
          // Set default model
          const defaultModel = models.find(m => m.isDefault) || models[0];
          if (defaultModel && !selectedImageModel) {
            setSelectedImageModel(defaultModel);
          }
        }
      } catch (error) {
        console.error('Failed to fetch image models:', error);
      }
    };
    fetchImageModels();
  }, []);

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
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <h3>No chat available</h3>
            <p>Creating a new chat...</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '10px',
                padding: '8px 16px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Refresh Page
            </button>
          </div>
        </EmptyState>
        <ChatInputArea
          chatIsEmpty={true}
          animateDown={false}
          $sidebarCollapsed={$sidebarCollapsed}
          settings={settings}
          onSubmitMessage={() => { }} // No-op for disabled state
          onFileSelected={() => { }}   // No-op
          isLoading={true} // Display as loading/disabled
          isProcessingFile={false}
          uploadedFile={null}
          onClearAttachment={() => { }}
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
        style={{ opacity: ($sidebarCollapsed && isFocused) ? '0' : '1', transition: 'opacity 0.3s ease' }}
        $sidebarCollapsed={$sidebarCollapsed}
      >
        <ChatTitleSection $sidebarCollapsed={$sidebarCollapsed}>
          <ModelSelectorsRow>
            {selectedModel !== 'instant' && (
              <ModelSelector
                selectedModel={selectedModel}
                models={availableModels}
                onChange={handleModelChange}
                key="model-selector"
                theme={theme}
              />
            )}
            <ImageModelSelector
              availableModels={availableImageModels}
              selectedModel={selectedImageModel}
              onSelectModel={setSelectedImageModel}
              isVisible={isImagePromptMode}
              theme={theme}
            />
          </ModelSelectorsRow>
        </ChatTitleSection>
      </ChatHeader>

      {(showGreeting && (showEmptyStateStatic || animateEmptyStateOut)) && !isLiveModeOpen && (
        <EmptyState $isExiting={animateEmptyStateOut}>
          {/* Content for empty state, e.g., a greeting message */}
        </EmptyState>
      )}

      {/* Main Chat Content */}
      <MessageList>
        {!chatIsEmpty && !isLiveModeOpen && chat && Array.isArray(chat.messages) && chat.messages.map(message => (
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

      {/* Live Mode Overlay - Now sibling to MessageList */}
      {isLiveModeOpen && (
        <LiveModeUI
          selectedModel={selectedModel}
          onClose={handleCloseLiveMode}
        />
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
          currentModel={selectedModel}
          modelCapabilities={availableModels?.find(m => m.id === selectedModel)?.capabilities || {}}
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
          isImagePromptMode={isImagePromptMode}
          onImageModeChange={setIsImagePromptMode}
          selectedImageModel={selectedImageModel}
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



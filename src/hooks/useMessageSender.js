import { useState } from 'react';
import { sendMessage, sendMessageToBackend, streamMessageFromBackend, generateChatTitle } from '../services/aiService';
import { generateImageApi } from '../services/imageService';
import { getFlowchartSystemPrompt } from '../utils/flowchartTools';
import { useToast } from '../contexts/ToastContext'; // If addAlert is used directly or via prop

// Helper function (can be outside or passed in if it uses external context like toast)
const generateId = () => {
  return Date.now().toString() + Math.floor(Math.random() * 1000).toString();
};

const useMessageSender = ({
  chat,
  selectedModel,
  settings,
  availableModels,
  addMessage, // (chatId, message) => void
  updateMessage, // (chatId, messageId, updates) => void
  updateChatTitle, // (chatId, title) => void
  // addAlert, // (options) => void - Assuming addAlert is passed if needed, or useToast is used internally
  toastContext, // Pass the toast context directly
  scrollToBottom, // () => void
  setUploadedFileData, // (data) => void
  setResetFileUpload, // (bool) => void
  onAttachmentChange, // (bool) => void
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const toast = toastContext; // Use the passed toast context

  const addAlert = (alertOptions) => {
    if (toast && toast.showToast) {
      toast.showToast(alertOptions.message, alertOptions.type, {
        autoHide: alertOptions.autoHide,
        actionText: alertOptions.actionText,
        onAction: alertOptions.onAction
      });
    } else {
      console.warn("Toast notification failed:", alertOptions.message);
      alert(alertOptions.message);
    }
  };

  const submitMessage = async (messagePayload) => {
    // Check if this is an image generation request
    if (messagePayload.type === 'generate-image') {
      const prompt = messagePayload.prompt;
      
      if (!prompt || !chat?.id) return;
      
      setIsLoading(true);
      
      // Add user message indicating the prompt
      const userPromptMessage = {
        id: generateId(),
        role: 'user',
        content: `Generate image: "${prompt}"`,
        timestamp: new Date().toISOString(),
      };
      addMessage(chat.id, userPromptMessage);
      
      // Add placeholder message for the generated image
      const imagePlaceholderId = generateId();
      const imagePlaceholderMessage = {
        id: imagePlaceholderId,
        role: 'assistant',
        type: 'generated-image',
        prompt: prompt,
        status: 'loading',
        imageUrl: null,
        content: '',
        timestamp: new Date().toISOString(),
        modelId: 'image-generator',
      };
      addMessage(chat.id, imagePlaceholderMessage);
      
      if (scrollToBottom) setTimeout(scrollToBottom, 100);
      
      try {
        const response = await generateImageApi(prompt);
        const imageUrl = response.imageData || response.imageUrl;
        
        if (!imageUrl) {
          throw new Error('No image URL returned from API');
        }
        
        updateMessage(chat.id, imagePlaceholderId, { 
          status: 'completed', 
          imageUrl: imageUrl, 
          isLoading: false 
        });
        
        // Generate title for new chat if this is the first message
        if (chat.messages.length === 0) {
          const title = `Image: ${prompt.substring(0, 30)}${prompt.length > 30 ? '...' : ''}`;
          if (updateChatTitle) updateChatTitle(chat.id, title);
        }
      } catch (error) {
        console.error('[useMessageSender] Error generating image:', error);
        updateMessage(chat.id, imagePlaceholderId, { 
          status: 'error', 
          content: error.message || 'Failed to generate image', 
          isLoading: false, 
          isError: true 
        });
        addAlert({
          message: `Image generation failed: ${error.message || 'Unknown error'}`,
          type: 'error',
          autoHide: true
        });
      } finally {
        setIsLoading(false);
      }
      
      return;
    }

    // Check if this is a flowchart creation request
    if (messagePayload.type === 'create-flowchart') {
      const prompt = messagePayload.text;
      
      if (!prompt || !chat?.id) return;
      
      setIsLoading(true);
      
      // Add user message indicating the flowchart request
      const userPromptMessage = {
        id: generateId(),
        role: 'user',
        content: `Create flowchart: "${prompt}"`,
        timestamp: new Date().toISOString(),
      };
      addMessage(chat.id, userPromptMessage);
      
      // Add placeholder message for the generated flowchart
      const flowchartPlaceholderId = generateId();
      const flowchartPlaceholderMessage = {
        id: flowchartPlaceholderId,
        role: 'assistant',
        type: 'generated-flowchart',
        prompt: prompt,
        status: 'loading',
        flowchartData: null,
        content: '',
        timestamp: new Date().toISOString(),
        modelId: selectedModel,
      };
      addMessage(chat.id, flowchartPlaceholderMessage);
      
      if (scrollToBottom) setTimeout(scrollToBottom, 100);
      
      try {
        // Get flowchart system prompt
        const flowchartSystemPrompt = getFlowchartSystemPrompt();
        
        // Send message to AI with flowchart instructions
        const formattedHistory = chat.messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        
        let streamedContent = '';
        const messageGenerator = sendMessage(
          prompt, 
          selectedModel, 
          formattedHistory, 
          null, // no image
          null, // no file text
          false, // not search
          false, // not deep research
          false, // not create image
          flowchartSystemPrompt // flowchart system prompt
        );
        
        for await (const chunk of messageGenerator) {
          streamedContent += chunk;
          updateMessage(chat.id, flowchartPlaceholderId, { 
            content: streamedContent, 
            status: 'loading',
            flowchartData: streamedContent 
          });
        }
        
        updateMessage(chat.id, flowchartPlaceholderId, { 
          status: 'completed', 
          flowchartData: streamedContent,
          content: streamedContent,
          isLoading: false 
        });
        
        // Generate title for new chat if this is the first message
        if (chat.messages.length === 0) {
          const title = `Flowchart: ${prompt.substring(0, 30)}${prompt.length > 30 ? '...' : ''}`;
          if (updateChatTitle) updateChatTitle(chat.id, title);
        }
        
      } catch (error) {
        console.error('[useMessageSender] Error generating flowchart:', error);
        updateMessage(chat.id, flowchartPlaceholderId, { 
          status: 'error', 
          content: error.message || 'Failed to generate flowchart', 
          isLoading: false, 
          isError: true 
        });
        addAlert({
          message: `Flowchart generation failed: ${error.message || 'Unknown error'}`,
          type: 'error',
          autoHide: true
        });
      } finally {
        setIsLoading(false);
      }
      
      return;
    }
    
    // Extract values from messagePayload for regular messages
    const messageText = messagePayload.text;
    const attachedFile = messagePayload.file;
    const actionChip = messagePayload.actionChip;
    const thinkingMode = messagePayload.mode;
    const createType = messagePayload.createType;
    
    const messageToSend = messageText ? messageText.trim() : '';
    
    // Handle multiple files
    let currentImageData = null;
    let currentFileText = null;
    let allFiles = [];
    
    if (attachedFile) {
      if (Array.isArray(attachedFile)) {
        allFiles = attachedFile;
        // For backward compatibility, use the first image and first text file
        const firstImage = attachedFile.find(f => f.type === 'image');
        const firstText = attachedFile.find(f => f.type === 'text' || f.type === 'pdf');
        currentImageData = firstImage?.dataUrl || null;
        currentFileText = firstText?.text || null;
      } else {
        allFiles = [attachedFile];
        currentImageData = attachedFile?.type === 'image' ? attachedFile.dataUrl : null;
        currentFileText = (attachedFile?.type === 'text' || attachedFile?.type === 'pdf') ? attachedFile.text : null;
      }
    }

    if (!messageToSend && !currentImageData && !currentFileText) return;
    if (isLoading || !chat?.id) return; // Removed isProcessingFile as it's managed by parent ChatWindow for UI disabling

    const currentActionChip = actionChip;
    const currentChatId = chat.id;
    const currentModel = selectedModel;
    const currentHistory = chat.messages;
    const currentModelObj = availableModels.find(model => model.id === currentModel);
    const isBackendModel = currentModelObj?.isBackendModel === true;

    // All models now go through backend API - no local API key validation needed

    setIsLoading(true);

    const userMessage = {
      id: generateId(),
      role: 'user',
      content: messageToSend || '',
      timestamp: new Date().toISOString(),
    };

    if (currentImageData) {
      userMessage.image = currentImageData;
    }
    if (allFiles.length > 0) {
      userMessage.files = allFiles.map(file => ({
        type: file.type,
        name: file.name
      }));
      // For backward compatibility, keep the old file property for single files
      if (allFiles.length === 1) {
        userMessage.file = {
          type: allFiles[0].type,
          name: allFiles[0].name
        };
      }
    }

    addMessage(currentChatId, userMessage);

    const fileTextToSend = currentFileText;
    const imageDataToSend = currentImageData;

    if (setUploadedFileData) setUploadedFileData(null);
    if (setResetFileUpload) setResetFileUpload(true);
    if (setResetFileUpload) setTimeout(() => setResetFileUpload(false), 0);
    if (onAttachmentChange) onAttachmentChange(false);

    const formattedHistory = currentHistory.map(msg => ({
      role: msg.role,
      content: msg.content,
      ...(msg.image && { image: msg.image })
    }));

    // Convert history to API format (exclude images for backend API calls)
    const apiHistory = currentHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const aiMessageId = generateId();
    const aiMessage = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      isLoading: true,
      timestamp: new Date().toISOString(),
      modelId: currentModel,
    };
    addMessage(currentChatId, aiMessage);

    if (currentHistory.length === 0 && messageToSend) { // Ensure title is updated only if there's text
      if (updateChatTitle) updateChatTitle(currentChatId, messageToSend);
    }

    if (scrollToBottom) setTimeout(scrollToBottom, 100);
    let streamedContent = '';
    let finalAssistantContent = '';

    try {
        const thinkingModeSystemPrompt = thinkingMode === 'thinking' ?
            `You are a Deep Analysis Chain of Thought model. You MUST provide both thinking and a final answer.

CRITICAL: Your response must have TWO parts:

1. FIRST: Put your thinking inside <think></think> tags with your reasoning process.

2. SECOND: After the </think> tag, you MUST provide your actual answer to the user's question. Do not stop after the thinking block.

Example format:
<think>
[Your reasoning here]
</think>

[Your actual answer here]

IMPORTANT: Always provide content after the </think> tag. Never end your response with just the thinking block.` : null;

        // UNIFIED LOGIC: All models are sent through the sendMessage generator,
        // which handles routing to the backend. The isBackendModel check is removed.
        const messageGenerator = sendMessage(
          messageToSend, currentModel, formattedHistory, imageDataToSend, fileTextToSend,
          currentActionChip === 'search', currentActionChip === 'deep-research', currentActionChip === 'create-image',
          thinkingModeSystemPrompt
        );
        for await (const chunk of messageGenerator) {
          streamedContent += chunk;
          updateMessage(currentChatId, aiMessageId, { content: streamedContent, isLoading: true });
        }
        finalAssistantContent = streamedContent;
        
        const messageUpdates = { content: streamedContent, isLoading: false };
        if (window.__lastSearchSources && Array.isArray(window.__lastSearchSources) && (currentActionChip === 'search' || currentActionChip === 'deep-research')) {
            messageUpdates.sources = window.__lastSearchSources;
            window.__lastSearchSources = null;
        }
        updateMessage(currentChatId, aiMessageId, messageUpdates);

    } catch (error) {
      console.error('[useMessageSender] Error generating response:', error);
      updateMessage(currentChatId, aiMessageId, {
        content: `Error: ${error.message || 'Failed to generate response'}`,
        isLoading: false, isError: true
      });
      addAlert({
        message: `Error with ${currentModel}: ${error.message || 'Failed to generate response'}`,
        type: 'error', autoHide: true
      });
    } finally {
      setIsLoading(false);
      if (currentHistory.length === 0 && messageToSend && finalAssistantContent) {
        generateChatTitle(messageToSend, finalAssistantContent).then(title => {
          if (title && updateChatTitle) {
            updateChatTitle(currentChatId, title);
          }
        });
      }
    }
  };

  return { isLoading, submitMessage };
};

export default useMessageSender; 
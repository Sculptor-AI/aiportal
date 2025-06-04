import { useState } from 'react';
import { sendMessage, sendMessageToBackend, streamMessageFromBackend, generateChatTitle } from '../services/aiService';
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

  const submitMessage = async (messageText, attachedFile, actionChip, thinkingMode, createType) => {
    const messageToSend = messageText ? messageText.trim() : '';
    const currentImageData = attachedFile?.type === 'image' ? attachedFile.dataUrl : null;
    const currentFileText = (attachedFile?.type === 'text' || attachedFile?.type === 'pdf') ? attachedFile.text : null;

    if (!messageToSend && !currentImageData && !currentFileText) return;
    if (isLoading || !chat?.id) return; // Removed isProcessingFile as it's managed by parent ChatWindow for UI disabling

    const currentActionChip = actionChip;
    const currentChatId = chat.id;
    const currentModel = selectedModel;
    const currentHistory = chat.messages;
    const currentModelObj = availableModels.find(model => model.id === currentModel);
    const isBackendModel = currentModelObj?.isBackendModel === true;

    let apiKeyMissing = false;
    let apiKeyMessage = "";
    const activeSettings = settings || {};

    if (currentModel.startsWith('gemini') && !activeSettings.googleApiKey && !import.meta.env.VITE_GOOGLE_API_KEY) {
      apiKeyMissing = true;
      apiKeyMessage = "Google API key is missing. Please add it in Settings.";
    }
    if (currentModel.startsWith('gpt-') && !activeSettings.openaiApiKey && !import.meta.env.VITE_OPENAI_API_KEY) {
      apiKeyMissing = true;
      apiKeyMessage = "OpenAI API key is missing. Please add it in Settings.";
    }
    if (currentModel.startsWith('claude-') && !activeSettings.anthropicApiKey && !import.meta.env.VITE_ANTHROPIC_API_KEY) {
      apiKeyMissing = true;
      apiKeyMessage = "Anthropic API key is missing. Please add it in Settings.";
    }

    if (apiKeyMissing) {
      addAlert({
        message: apiKeyMessage,
        type: 'error',
        autoHide: true,
        actionText: 'Settings',
        // onAction: () => { /* Logic to open settings modal needs to be handled by consumer */ }
      });
      return;
    }

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
    if (attachedFile) {
      userMessage.file = {
        type: attachedFile.type,
        name: attachedFile.name
      };
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
            `You are a Deep Analysis Chain of Thought model that provides thorough, well-structured explanations. For every response:

1. FIRST: Put your comprehensive thinking process inside <think></think> tags following these steps:
   - Begin with problem decomposition - break down the question into its core components and underlying assumptions
   - Explore the conceptual space deeply, considering multiple perspectives and approaches
   - When providing solutions (including code):
     * Focus on developing one high-quality solution
     * Prioritize clarity and simplicity unless complexity is justified
     * Think through tradeoffs and design decisions explicitly
   - Identify potential edge cases, limitations, or hidden assumptions
   - Perform a critical self-review of your thinking:
     * Question your reasoning process and initial assumptions
     * Look for logical gaps, biases, or oversimplifications
     * Consider counterarguments or alternative perspectives
   - Evaluate your final solution against these criteria:
     * Correctness: Does it solve the problem accurately?
     * Depth: Have you considered the problem deeply enough?
     * Simplicity: Is this the simplest valid solution?
     * Completeness: Does it address the core question and handle relevant edge cases?

2. THEN: Provide your answer outside the tags - be concise and focused while maintaining clarity

When explaining concepts:
- Break your answer into logical paragraphs
- Use headings only when they improve understanding
- Include concrete examples that illustrate key points
- Focus on the most important aspects rather than attempting to cover everything` : null;

        if (isBackendModel) {
          const supportsStreaming = currentModelObj?.supportsStreaming !== false;
          const finalMessageToSend = messageToSend;
          const systemPromptForApi = thinkingModeSystemPrompt || null;

        if (supportsStreaming) {
          await streamMessageFromBackend(
            currentModel, finalMessageToSend,
            (chunk) => {
              streamedContent += chunk;
              updateMessage(currentChatId, aiMessageId, { content: streamedContent, isLoading: true });
            },
            currentActionChip === 'search', currentActionChip === 'deep-research', currentActionChip === 'create-image',
            imageDataToSend, fileTextToSend, systemPromptForApi, thinkingMode
          );
          const messageUpdates = { content: streamedContent, isLoading: false };
          if (window.__lastSearchSources && Array.isArray(window.__lastSearchSources) && (currentActionChip === 'search' || currentActionChip === 'deep-research')) {
            messageUpdates.sources = window.__lastSearchSources;
            window.__lastSearchSources = null;
          }
          updateMessage(currentChatId, aiMessageId, messageUpdates);
          finalAssistantContent = streamedContent;
        } else {
          const backendResponse = await sendMessageToBackend(
            currentModel, finalMessageToSend,
            currentActionChip === 'search', currentActionChip === 'deep-research', currentActionChip === 'create-image',
            imageDataToSend, fileTextToSend, systemPromptForApi, thinkingMode
          );
          finalAssistantContent = backendResponse.response || 'No response from backend';
          updateMessage(currentChatId, aiMessageId, {
            content: finalAssistantContent,
            isLoading: false,
            sources: backendResponse.sources || null
          });
        }
      } else {
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
        updateMessage(currentChatId, aiMessageId, { content: streamedContent, isLoading: false });
      }
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
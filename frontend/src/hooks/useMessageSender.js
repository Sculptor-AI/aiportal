import { useState } from 'react';
import { sendMessage, sendMessageToBackend, streamMessageFromBackend, generateChatTitle } from '../services/aiService';
import { generateImageApi, generateVideoApi } from '../services/imageService';
import { performDeepResearch } from '../services/deepResearchService';
import { getFlowchartSystemPrompt } from '../utils/flowchartTools';
import { useToast } from '../contexts/ToastContext'; // If addAlert is used directly or via prop
import { SCULPTOR_AI_SYSTEM_PROMPT } from '../prompts/sculptorAI-system-prompt';
import { hasIncompleteCodeBlock, validateCodeBlockSyntax } from '../utils/codeBlockProcessor';
import { DEEP_RESEARCH_MODEL_ID } from '../config/modelConfig';

// Helper function (can be outside or passed in if it uses external context like toast)
const generateId = () => {
  return Date.now().toString() + Math.floor(Math.random() * 1000).toString();
};

const resolveProviderHint = (model, models = []) => {
  if (!model) {
    return null;
  }

  if (model.isCustomModel && model.baseModel) {
    const baseModel = models.find((candidate) => candidate.id === model.baseModel);
    return baseModel?.provider || null;
  }

  return model.provider || null;
};

const useMessageSender = ({
  chat,
  selectedModel,
  settings,
  availableModels,
  projects, // (optional) array of project objects for injecting project instructions
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
      const imageModel = messagePayload.imageModel;
      
      if (!prompt || !chat?.id) return;
      
      setIsLoading(true);
      
      // Collect conversation history for multi-turn image generation
      const imageHistory = [];
      if (chat.messages && chat.messages.length > 0) {
        for (const msg of chat.messages) {
          if (msg.role === 'user' && msg.content) {
            // Extract the prompt from "Generate image: "prompt"" format (handles multi-line)
            const match = msg.content.match(/^Generate image: "([\s\S]+)"$/);
            imageHistory.push({
              role: 'user',
              text: match ? match[1] : msg.content
            });
          } else if (msg.type === 'generated-image' && msg.status === 'completed' && msg.imageUrl) {
            imageHistory.push({
              role: 'assistant',
              imageUrl: msg.imageUrl
            });
          }
        }
      }
      
      console.log(`[useMessageSender] Image generation with ${imageHistory.length} history items`);
      
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
        modelId: imageModel || 'image-generator',
      };
      addMessage(chat.id, imagePlaceholderMessage);
      
      if (scrollToBottom) setTimeout(scrollToBottom, 100);
      
      try {
        // Pass conversation history for multi-turn generation
        const response = await generateImageApi(prompt, imageModel, imageHistory);
        const imageUrl = response.images?.[0]?.imageData || response.imageData || response.imageUrl;
        
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

    // Check if this is a video generation request
    if (messagePayload.type === 'generate-video') {
      const prompt = messagePayload.prompt;
      
      if (!prompt || !chat?.id) return;
      
      setIsLoading(true);
      
      // Add user message indicating the prompt
      const userPromptMessage = {
        id: generateId(),
        role: 'user',
        content: `Generate video: "${prompt}"`,
        timestamp: new Date().toISOString(),
      };
      addMessage(chat.id, userPromptMessage);
      
      // Add placeholder message for the generated video
      const videoPlaceholderId = generateId();
      const videoPlaceholderMessage = {
        id: videoPlaceholderId,
        role: 'assistant',
        type: 'generated-video',
        prompt: prompt,
        status: 'loading',
        videoUrl: null,
        videoId: null,
        content: '',
        timestamp: new Date().toISOString(),
        modelId: 'sora-2',
      };
      addMessage(chat.id, videoPlaceholderMessage);
      
      if (scrollToBottom) setTimeout(scrollToBottom, 100);
      
      try {
        const response = await generateVideoApi(prompt);
        const videoUrl = response.videoData || response.videoUrl;
        const videoId = response.videoId || null;
        
        if (!videoUrl) {
          throw new Error('No video URL returned from API');
        }
        
        updateMessage(chat.id, videoPlaceholderId, { 
          status: 'completed', 
          videoUrl: videoUrl,
          videoId,
          isLoading: false 
        });
        
        // Generate title for new chat if this is the first message
        if (chat.messages.length === 0) {
          const title = `Video: ${prompt.substring(0, 30)}${prompt.length > 30 ? '...' : ''}`;
          if (updateChatTitle) updateChatTitle(chat.id, title);
        }
      } catch (error) {
        console.error('[useMessageSender] Error generating video:', error);
        updateMessage(chat.id, videoPlaceholderId, { 
          status: 'error', 
          content: error.message || 'Failed to generate video', 
          isLoading: false, 
          isError: true 
        });
        addAlert({
          message: `Video generation failed: ${error.message || 'Unknown error'}`,
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
        // Get flowchart system prompt and combine with SculptorAI base prompt
        const flowchartSystemPrompt = getFlowchartSystemPrompt();
        const combinedSystemPrompt = `${SCULPTOR_AI_SYSTEM_PROMPT}\n\n${flowchartSystemPrompt}`;
        
        // Send message to AI with flowchart instructions
        const formattedHistory = chat.messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        const flowchartModelObj = (availableModels || []).find(model => model.id === selectedModel);
        const flowchartProviderHint = resolveProviderHint(flowchartModelObj, availableModels || []);
        const flowchartRequestOptions = flowchartProviderHint
          ? { provider: flowchartProviderHint }
          : {};
        
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
          combinedSystemPrompt, // combined system prompt
          flowchartRequestOptions
        );
        
        for await (const chunk of messageGenerator) {
          // Skip source objects for flowchart generation
          if (typeof chunk === 'object' && chunk.type === 'sources') {
            continue;
          }
          
          // Otherwise it's a content chunk
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
    // Note: 'analysis-tool' (code execution) is handled through normal message flow
    const messageText = messagePayload.text;
    const attachedFile = messagePayload.file;
    const actionChip = messagePayload.actionChip;
    const thinkingMode = messagePayload.mode;
    const createType = messagePayload.createType;
    const reasoningEffort = messagePayload.reasoningEffort;
    
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
    const currentModelObj = (availableModels || []).find(model => model.id === currentModel);
    const reasoningEffortLevels = Array.isArray(currentModelObj?.capabilities?.reasoning_effort_levels)
      ? currentModelObj.capabilities.reasoning_effort_levels.filter((level) => typeof level === 'string' && level.trim().length > 0)
      : [];
    const supportsReasoningEffort =
      currentModelObj?.capabilities?.reasoning_effort === true &&
      reasoningEffortLevels.length > 1;
    const supportsCodeExecution = currentModelObj?.capabilities?.code_execution === true;
    const normalizedActionChip =
      actionChip === 'analysis-tool' && !supportsCodeExecution
        ? null
        : actionChip;
    const thinkingEnabled = thinkingMode === 'thinking' && supportsReasoningEffort;
    const useNativeThinking = thinkingEnabled && supportsReasoningEffort;
    const selectedReasoningEffort =
      useNativeThinking
        ? reasoningEffort ||
          currentModelObj?.capabilities?.reasoning_effort_default ||
          reasoningEffortLevels[0] ||
          'medium'
        : null;

    // For custom models, use the base model ID for the API call
    const modelIdForApi = currentModelObj?.isCustomModel && currentModelObj?.baseModel 
      ? currentModelObj.baseModel 
      : currentModel;
    const providerHint = resolveProviderHint(currentModelObj, availableModels || []);
    const requestOptions = {
      ...(providerHint ? { provider: providerHint } : {}),
      ...(selectedReasoningEffort ? { reasoningEffort: selectedReasoningEffort } : {})
    };

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

    const shouldRunDeepResearch =
      currentActionChip === 'deep-research' || currentModel === DEEP_RESEARCH_MODEL_ID;

    // Dedicated deep research flow (SSE progress + structured completion payload)
    if (shouldRunDeepResearch) {
      const deepResearchModelId =
        currentActionChip === 'deep-research' || currentModel === DEEP_RESEARCH_MODEL_ID
          ? DEEP_RESEARCH_MODEL_ID
          : currentModel;
      const deepResearchMessageId = generateId();
      const deepResearchMessage = {
        id: deepResearchMessageId,
        role: 'assistant',
        type: 'deep-research',
        status: 'loading',
        query: messageToSend,
        content: messageToSend,
        progress: 0,
        statusMessage: 'Initializing deep research...',
        timestamp: new Date().toISOString(),
        modelId: deepResearchModelId
      };
      addMessage(currentChatId, deepResearchMessage);

      if (currentHistory.length === 0 && messageToSend) {
        if (updateChatTitle) updateChatTitle(currentChatId, messageToSend);
      }

      if (scrollToBottom) setTimeout(scrollToBottom, 100);

        try {
          const maxAgents = Math.max(
            2,
            Math.min(12, Number.parseInt(settings?.deepResearchMaxAgents, 10) || 8)
          );
          const deepResearchOptions = {};
          if (typeof settings?.deepResearchReportLength === 'string') {
            deepResearchOptions.reportLength = settings.deepResearchReportLength;
          }
          if (typeof settings?.deepResearchReportDepth === 'string') {
            deepResearchOptions.reportDepth = settings.deepResearchReportDepth;
          }

          const researchModel =
            currentActionChip === 'deep-research' || currentModel === DEEP_RESEARCH_MODEL_ID
              ? DEEP_RESEARCH_MODEL_ID
              : modelIdForApi;

          await performDeepResearch(
            messageToSend,
            researchModel,
            maxAgents,
            (progress, statusMessage) => {
            updateMessage(currentChatId, deepResearchMessageId, {
              status: 'loading',
              progress,
              statusMessage: statusMessage || 'Researching...'
            });
          },
          (result) => {
            updateMessage(currentChatId, deepResearchMessageId, {
              status: 'completed',
              progress: 100,
              statusMessage: 'Deep research complete',
              query: messageToSend,
              content: result.content || result.report || '',
              subQuestions: result.subQuestions || [],
              agentResults: result.agentResults || [],
              sources: result.sources || [],
              metadata: result.metadata || null,
              qualityIssues: result.qualityIssues || [],
              isLoading: false
            });
          },
          (errorMessage) => {
            updateMessage(currentChatId, deepResearchMessageId, {
              status: 'error',
              query: messageToSend,
              content: messageToSend,
              errorMessage: errorMessage || 'Deep research failed',
              isError: true,
              isLoading: false
            });
          },
            deepResearchOptions
        );
      } catch (error) {
        console.error('[useMessageSender] Deep research failed:', error);
        updateMessage(currentChatId, deepResearchMessageId, {
          status: 'error',
          query: messageToSend,
          content: messageToSend,
          errorMessage: error.message || 'Deep research failed',
          isError: true,
          isLoading: false
        });
        addAlert({
          message: `Deep research failed: ${error.message || 'Unknown error'}`,
          type: 'error',
          autoHide: true
        });
      } finally {
        setIsLoading(false);
      }

      return;
    }

    const formattedHistory = currentHistory
      .filter(msg => msg.role !== 'system') // Filter out system messages
      .map(msg => ({
        role: msg.role,
        content: msg.content,
        ...(msg.image && { image: msg.image })
      }));

    // Convert history to API format (exclude images for backend API calls)
    const apiHistory = currentHistory
      .filter(msg => msg.role !== 'system') // Filter out system messages
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));

    const aiMessageId = generateId();
    const aiMessage = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      reasoningTrace: '',
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
    let streamSucceeded = false;

    try {
        // Build the complete system prompt starting with SculptorAI base prompt
        let systemPromptToUse = SCULPTOR_AI_SYSTEM_PROMPT;

        // Add custom model system prompt if applicable
        if (currentModelObj?.isCustomModel && currentModelObj?.systemPrompt) {
          systemPromptToUse = `${systemPromptToUse}\n\n${currentModelObj.systemPrompt}`;
        }

        // Add project instructions if this chat belongs to a project
        if (chat?.projectId && Array.isArray(projects) && projects.length > 0) {
          const project = projects.find(p => p.id === chat.projectId);
          if (project?.projectInstructions?.trim()) {
            systemPromptToUse = `${systemPromptToUse}\n\n<project_instructions>\n${project.projectInstructions.trim()}\n</project_instructions>`;
          }
          if (project?.knowledge?.length > 0) {
            const knowledgeContext = project.knowledge
              .filter(k => k.content)
              .map(k => `<file name="${k.name}">\n${k.content}\n</file>`)
              .join('\n');
            if (knowledgeContext) {
              systemPromptToUse = `${systemPromptToUse}\n\n<project_knowledge>\n${knowledgeContext}\n</project_knowledge>`;
            }
          }
        }

        // UNIFIED LOGIC: All models are sent through the sendMessage generator,
        // which handles routing to the backend. The isBackendModel check is removed.
        // Action chips: 'search' = web_search, 'analysis-tool' = code_execution
        const messageGenerator = sendMessage(
          messageToSend, modelIdForApi, formattedHistory, imageDataToSend, fileTextToSend,
          normalizedActionChip === 'search', normalizedActionChip === 'analysis-tool', normalizedActionChip === 'create-image',
          systemPromptToUse,
          requestOptions
        );
        
        let messageSources = [];
        let toolCalls = [];
        let reasoningTrace = '';
        
        for await (const chunk of messageGenerator) {
          // Check if chunk is an object with type 'sources'
          if (typeof chunk === 'object' && chunk.type === 'sources') {
            messageSources = chunk.sources;
            // Don't add sources to content - they'll be handled separately
            continue;
          }

          // Handle provider-native reasoning deltas
          if (typeof chunk === 'object' && chunk.type === 'reasoning') {
            reasoningTrace += chunk.content || '';
            updateMessage(currentChatId, aiMessageId, {
              content: streamedContent,
              reasoningTrace,
              isLoading: true,
              toolCalls: toolCalls.length > 0 ? [...toolCalls] : undefined
            });
            continue;
          }
          
          // Handle tool events
          if (typeof chunk === 'object' && chunk.type === 'tool_event') {
            const toolData = chunk.tool_data;
            
            // Update tool calls array
            const existingIndex = toolCalls.findIndex(tc => tc.tool_id === toolData.tool_id);
            if (existingIndex >= 0) {
              // Update existing tool call
              toolCalls[existingIndex] = { ...toolCalls[existingIndex], ...toolData };
            } else {
              // Add new tool call
              toolCalls.push(toolData);
            }
            
            // Update message with tool calls
            updateMessage(currentChatId, aiMessageId, { 
              content: streamedContent, 
              isLoading: true,
              toolCalls: [...toolCalls] // Create new array to trigger re-render
            });
            continue;
          }
          
          // Handle tools available event
          if (typeof chunk === 'object' && chunk.type === 'tools_available') {
            updateMessage(currentChatId, aiMessageId, { 
              content: streamedContent, 
              isLoading: true,
              availableTools: chunk.tools
            });
            continue;
          }
          
          // Handle code execution events (from Gemini)
          if (typeof chunk === 'object' && chunk.type === 'code_execution') {
            // Store code execution for display
            const codeExecution = {
              language: chunk.language || 'python',
              code: chunk.code
            };
            updateMessage(currentChatId, aiMessageId, { 
              content: streamedContent, 
              isLoading: true,
              codeExecution: codeExecution
            });
            continue;
          }
          
          if (typeof chunk === 'object' && chunk.type === 'code_execution_result') {
            // Store code execution result for display
            const codeExecutionResult = {
              outcome: chunk.outcome,
              output: chunk.output
            };
            updateMessage(currentChatId, aiMessageId, { 
              content: streamedContent, 
              isLoading: true,
              codeExecutionResult: codeExecutionResult
            });
            continue;
          }
          
          // Handle tool system errors
          if (typeof chunk === 'object' && chunk.type === 'tool_system_error') {
            console.error('Tool system error:', chunk.error);
            // Could show this as a toast notification
            addAlert({
              message: `Tool system error: ${chunk.error}`,
              type: 'warning',
              autoHide: true
            });
            continue;
          }
          
          // Handle tool calls summary
          if (typeof chunk === 'object' && chunk.type === 'tool_calls_summary') {
            // Update final tool calls summary
            updateMessage(currentChatId, aiMessageId, { 
              content: streamedContent, 
              isLoading: true,
              toolCallsSummary: chunk.summary
            });
            continue;
          }
          
          // Otherwise it's a content chunk
          streamedContent += chunk;
          
          // Validate code block syntax during streaming
          if (streamedContent.includes('```')) {
            const issues = validateCodeBlockSyntax(streamedContent);
            if (issues.length > 0) {
              console.warn('Code block syntax issues detected during streaming:', issues);
            }
          }
          
          updateMessage(currentChatId, aiMessageId, { 
            content: streamedContent, 
            isLoading: true,
            toolCalls: toolCalls.length > 0 ? [...toolCalls] : undefined
          });
        }
        finalAssistantContent = streamedContent;
        streamSucceeded = true;
        
        const messageUpdates = { content: streamedContent, isLoading: false };

        if (reasoningTrace) {
          messageUpdates.reasoningTrace = reasoningTrace;
        }
        
        // Add tool calls if we have them
        if (toolCalls.length > 0) {
          messageUpdates.toolCalls = toolCalls;
        }
        
        // Add sources if we received them
        if (messageSources.length > 0) {
          messageUpdates.sources = messageSources;
        } else if (window.__lastSearchSources && Array.isArray(window.__lastSearchSources) && currentActionChip === 'search') {
          // Fallback to old method if needed
          messageUpdates.sources = window.__lastSearchSources;
          window.__lastSearchSources = null;
        }
        
        updateMessage(currentChatId, aiMessageId, messageUpdates);

    } catch (error) {
      console.error('[useMessageSender] Error generating response:', error);

      const isAuthError =
        error.message.includes('Invalid or expired session') ||
        error.message.includes('Authentication required') ||
        error.message.includes('session has expired');
      
      if (isAuthError) {
        const authErrorMessage = 'Your session has expired. Please log in again to continue.';
        updateMessage(currentChatId, aiMessageId, {
          content: authErrorMessage,
          isLoading: false, isError: true
        });
        addAlert({
          message: authErrorMessage,
          type: 'error',
          autoHide: false,
          actionText: 'Log In',
          onAction: () => { window.location.href = '/login'; }
        });
      } else {
        const errorMessage = currentModelObj?.isCustomModel 
          ? `Error with custom model "${currentModelObj.name}": ${error.message || 'Failed to generate response'}. Make sure the base model (${currentModelObj.baseModel}) is properly configured.`
          : `Error with ${currentModel}: ${error.message || 'Failed to generate response'}`;
        
        updateMessage(currentChatId, aiMessageId, {
          content: errorMessage,
          isLoading: false, isError: true
        });
        addAlert({
          message: errorMessage,
          type: 'error', autoHide: true
        });
      }
    } finally {
      setIsLoading(false);
      if (streamSucceeded && currentHistory.length === 0 && messageToSend && finalAssistantContent) {
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

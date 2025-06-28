# AI Provider Integration Documentation

This backend supports multiple AI providers for maximum flexibility and optimal performance.

## Supported Providers

### 1. **Anthropic (Claude Models)**
- **Models**: Claude 4 Sonnet, Claude 4 Opus
- **Capabilities**: Text generation, vision (image understanding)
- **Best for**: Complex reasoning, code generation, creative writing

### 2. **OpenAI (GPT Models)**
- **Models**: GPT-4o, ChatGPT o3
- **Capabilities**: Text generation, vision (GPT-4o only)
- **Best for**: General purpose, wide knowledge, multimodal tasks

### 3. **Google (Gemini Models)**
- **Models**: Gemini 2.5 Flash, Gemini 2.5 Pro
- **Capabilities**: Text generation, vision, audio
- **Best for**: Fast responses, large context windows, multimodal

### 4. **OpenRouter (Fallback)**
- **Models**: Various third-party models
- **Capabilities**: Depends on model
- **Best for**: Access to diverse models, fallback option

## Architecture

The system uses a hierarchical approach to route requests:

1. **Direct Provider Check**: First checks if the model belongs to Anthropic, OpenAI, or Gemini
2. **Direct API Call**: If matched, uses the provider's official SDK for optimal performance
3. **OpenRouter Fallback**: If no direct match, routes through OpenRouter

```
Request → Model Detection → Provider Service → Response
                         ↓
                    OpenRouter (if no match)
```

## Configuration

Add the following to your `.env` file:

```bash
# Direct Provider APIs (optional but recommended)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...

# Fallback Provider (required)
OPENROUTER_API_KEY=sk-or-...
```

## Benefits

1. **Performance**: Direct API calls are faster than routing through OpenRouter
2. **Cost**: Direct provider pricing is often cheaper
3. **Features**: Access to latest features immediately
4. **Reliability**: Multiple providers reduce single point of failure
5. **Flexibility**: Easy to add new providers

## Adding New Providers

To add a new provider:

1. Create a service file in `/services/[provider]Service.js`
2. Implement check, process, and stream functions
3. Update `chatController.js` to include the new checks
4. Update `modelController.js` to list available models

## Testing

Run the test script to verify all providers are working:

```bash
cd backend
node test-providers.js
```

This will test each provider and report success or configuration issues. 
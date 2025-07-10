# SculptorAI System Prompt Setup

## Overview

The SculptorAI system prompt has been integrated into the chat system to ensure consistent AI behavior and identity across all conversations. This system prompt is automatically prepended to every message sent to AI models.

## Implementation Details

### Files Created/Modified

1. **`src/prompts/sculptorAI-system-prompt.js`** - Contains the main SculptorAI system prompt
2. **`src/hooks/useMessageSender.js`** - Modified to include system prompt in all messages

### How It Works

The system prompt is integrated at the message level in `useMessageSender.js`:

1. **Base System Prompt**: Every message starts with the SculptorAI system prompt
2. **Custom Model Prompts**: If using a custom model with its own system prompt, it's appended
3. **Thinking Mode**: If in thinking mode, the thinking mode instructions are appended
4. **Specialized Features**: For flowcharts, the flowchart instructions are appended

### System Prompt Content

The SculptorAI system prompt includes:

- **Core Capabilities**: Detailed explanations, problem-solving, creative solutions
- **Thinking Process**: Multi-perspective analysis, reasoning, clarifying questions
- **Specialized Areas**: Programming, technical problems, creative writing, research
- **Communication Style**: Clear language, structured responses, examples
- **Tools & Features**: Code generation, file analysis, research, image generation

### Priority Order

System prompts are combined in this order:
1. **SculptorAI Base Prompt** (always first)
2. **Custom Model Prompt** (if applicable)
3. **Mode-Specific Prompts** (thinking mode, flowchart mode, etc.)

## Usage

The system prompt is automatically applied to all messages. No additional configuration is needed. The prompt ensures:

- Consistent AI personality as "SculptorAI"
- Proper capabilities communication
- Structured and helpful responses
- Context-aware interactions

## Testing

To verify the system prompt is working:

1. Start a new chat
2. Ask a simple question
3. The AI should respond with SculptorAI's personality and capabilities
4. Check that responses are well-structured and follow the system prompt guidelines

## Customization

To modify the system prompt:

1. Edit `src/prompts/sculptorAI-system-prompt.js`
2. Update the `SCULPTOR_AI_SYSTEM_PROMPT` constant
3. The changes will automatically apply to all new messages

## Integration Points

The system prompt is integrated at these key points:

- **Regular Messages**: `useMessageSender.js` line ~445
- **Flowchart Generation**: `useMessageSender.js` line ~149
- **All Model Types**: Backend models, custom models, thinking mode

This ensures comprehensive coverage across all chat functionality. 
# AI Flowchart Generation Feature

## Overview
This feature enables AI models to create interactive flowcharts through natural language descriptions. Users can request flowcharts and the AI will generate structured data that gets rendered in the flowchart builder.

## How to Use

1. **Start Creating**: Click the "Create" chip in the chat input area
2. **Select Flowchart**: Choose "Flowchart" from the dropdown menu
3. **Describe Your Flowchart**: Type a description like "Create a flowchart for user login process"
4. **AI Generation**: The AI will respond with structured flowchart instructions
5. **Open Builder**: Click "Open Flowchart Builder" button in the AI response
6. **Edit & Export**: The flowchart opens in the builder where you can edit, export, or save

## Example AI Prompts

- "Create a flowchart for the software development lifecycle"
- "Make a flowchart showing how to process a customer order"
- "Design a decision tree for troubleshooting network issues"
- "Create a workflow for hiring new employees"

## Technical Implementation

### Files Modified/Created:

1. **`src/utils/flowchartTools.js`** (NEW)
   - Core flowchart generation utilities
   - AI response parsing functions
   - Node creation and connection logic
   - System prompt for AI models

2. **`src/components/ChatInputArea.jsx`** (MODIFIED)
   - Added flowchart prompt mode
   - Updated create type handling
   - Added flowchart selection logic

3. **`src/hooks/useMessageSender.js`** (MODIFIED)
   - Added `create-flowchart` message type handling
   - Integrated flowchart system prompt
   - Streaming AI response processing

4. **`src/components/ChatMessage.jsx`** (MODIFIED)
   - Added `generated-flowchart` message type display
   - "Open Flowchart Builder" button
   - Flowchart preview UI components

5. **`src/components/FlowchartModal.jsx`** (MODIFIED)
   - Added AI flowchart data processing
   - Automatic node/edge generation from AI instructions
   - Enhanced props for AI integration

6. **`src/App.jsx`** (MODIFIED)
   - Custom event handling for flowchart modal
   - State management for AI-generated flowchart data
   - Modal integration updates

### AI Response Format

The AI models are instructed to respond with JSON in this format:

```json
[
  {
    "action": "create_node",
    "name": "start",
    "type": "start",
    "label": "Begin Process"
  },
  {
    "action": "create_node", 
    "name": "check_input",
    "type": "decision",
    "label": "Is input valid?"
  },
  {
    "action": "connect_nodes",
    "from": "start",
    "to": "check_input"
  }
]
```

### Node Types Supported:
- **start**: Beginning of process (oval shape)
- **process**: Regular process step (rectangle) 
- **decision**: Decision point (diamond shape)
- **end**: End of process (oval shape)

## User Experience Flow

1. User types flowchart request → AI generates structured instructions
2. Instructions displayed in chat with preview → User clicks "Open Flowchart Builder"
3. FlowchartModal opens with AI-generated flowchart → User can edit, export, or send to chat
4. Full integration with existing flowchart editing capabilities

## Benefits

- **Natural Language Input**: No need to learn flowchart syntax
- **AI-Powered**: Leverages AI understanding to create logical flow structures
- **Fully Editable**: Generated flowcharts can be modified in the visual builder
- **Export Ready**: Can be exported as images or sent back to chat
- **Integrated Experience**: Seamlessly works with existing chat and creation tools

The feature is now fully implemented and ready for use!
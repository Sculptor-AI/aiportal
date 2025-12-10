# AI Chat

The AI Chat is the central and most interactive feature of the AI Portal application. It provides a dynamic and responsive interface for users to communicate with various artificial intelligence models.

## 1. Implementation Details

The core of the AI Chat interface is managed by the `ChatWindow` component. This component is located at `src/components/ChatWindow.jsx` within the frontend application.

### `ChatWindow.jsx` Responsibilities:

*   **Conversation Flow Management:** Orchestrates the display of messages, both from the user and the AI.
*   **Message Sending:** Handles the submission of user input to the backend API.
*   **AI Response Display:** Renders the AI's responses in a clear and readable format.
*   **Real-time Updates:** Manages the real-time flow of conversation, including streaming responses.

## 2. Core Functionality

### 2.1. Multi-model Support

The AI Chat is designed to be model-agnostic, allowing seamless integration with various AI models. This means users can switch between different large language models (LLMs) to leverage their unique strengths and capabilities.

### 2.2. Streaming Responses

To provide a more natural and responsive user experience, the chat interface supports streaming responses from the AI models. This means that AI-generated text is displayed character by character or word by word as it is generated, rather than waiting for the entire response to be completed.

### 2.3. File Attachments

Users can attach files to their chat messages. This functionality allows for:

*   **Contextual Information:** Providing documents, images, or other media as context for the AI's understanding.
*   **Data Analysis:** Enabling the AI to process and respond based on the content of attached files.

### 2.4. Markdown Rendering

The chat interface fully supports Markdown syntax for both user input and AI responses. This enhances readability and allows for rich text formatting, including:

*   **Code Blocks:** Displaying code snippets with proper syntax highlighting.
*   **Formatted Text:** Using bold, italics, lists, and other Markdown elements for clear communication.
*   **Tables:** Presenting structured data in an organized manner.

## 3. User Interaction

Users interact with the AI Chat through a text input field. Messages are sent to the AI, and responses are displayed chronologically in the chat window. The interface is designed to be intuitive, allowing users to easily start new conversations, review past interactions, and utilize the various features available.
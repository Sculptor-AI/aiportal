# AI Portal

AI Portal is a web application that allows you to chat with various AI models through a unified interface. It supports multiple models including Gemini, Claude, and ChatGPT.

## Features

- Chat with multiple AI models through a unified interface
- Conversation history with the ability to switch between conversations
- Delete unwanted conversations
- Model selector to choose between different AI models
- Dark mode and font size customization
- Responsive design for use on various devices

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/aiportal.git
   cd aiportal
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up your API keys:
   - Copy `.env.example` to `.env`
   - Fill in your API keys for the services you want to use:
     ```
     VITE_GEMINI_API_KEY=your_gemini_api_key_here
     VITE_CLAUDE_API_KEY=your_claude_api_key_here
     VITE_OPENAI_API_KEY=your_openai_api_key_here
     ```

4. Start the development server:
   ```
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Usage

1. Create a new chat by clicking the "New Chat" button in the sidebar
2. Select an AI model from the dropdown at the bottom of the sidebar
3. Type your message in the input field and press Enter or click the send button
4. View the AI's response in the chat window
5. Switch between different chats using the sidebar
6. Delete unwanted chats by clicking the trash icon next to the chat name
7. Customize settings like dark mode and font size by clicking the Settings button

## Supported Models

- **Gemini 2 Flash**: Google's Gemini 2.0 Flash AI model
- **Claude 3.7 Sonnet**: Anthropic's Claude 3.7 Sonnet AI model
- **ChatGPT 4o**: OpenAI's GPT-4o model

## Settings

The app includes a settings panel where you can customize:

- **Theme**: Choose between light and dark mode
- **Font Size**: Adjust text size for better readability
- **Message Sending**: Toggle whether Enter key sends messages

## Security

This project uses environment variables to securely store API keys. These environment variables are accessed on the client-side but are not exposed directly in the source code. For production deployment, consider implementing a backend service that proxies requests to the AI providers to keep your API keys completely secure.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Thanks to the creators of React, Vite, and Styled Components
- Inspired by ChatGPT, Claude, and other AI chat interfaces
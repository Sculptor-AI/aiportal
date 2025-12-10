# Key Features

This document describes the key features of the AI Portal application and how they are implemented.

## AI Chat

The core feature of the application is the AI-powered chat interface.

-   **Implementation**: The main chat interface is handled by the `ChatWindow` component (`src/components/ChatWindow.jsx`). It manages the conversation flow, sends user messages to the backend, and displays the AI's responses.
-   **Functionality**:
    -   Supports multiple AI models.
    -   Handles streaming responses for real-time interaction.
    -   Allows for file attachments.
    -   Supports Markdown rendering for code blocks and formatted text.

## Image Generation

The application can generate images from text prompts.

-   **Implementation**: This feature is integrated into the application, with the backend logic defined in `aiportal/backend/controllers/imageGenerationController.js`. The UI for this feature is part of the `ImageGenerator.jsx` component.
-   **Functionality**:
    -   Uses the Google Generative AI API to create images.
    -   Users can input a text prompt to describe the desired image.
    -   The generated image is displayed to the user.

## Project Management

Users can organize their work into projects, which can contain multiple chats and knowledge files.

-   **Implementation**: Project-related functionality is managed in the `ProjectsPage.jsx` and `ProjectDetailPage.jsx` components. State for projects is managed in `App.jsx` and persisted to `localStorage`.
-   **Functionality**:
    -   Create and delete projects.
    -   Associate chats with specific projects.
    -   Upload knowledge files (e.g., PDFs, text files) to a project.

## Tool-based Features

The application includes several specialized tools that can be accessed from the chat interface.

-   **Whiteboard**: A digital drawing canvas for sketching ideas.
    -   **Component**: `WhiteboardModal.jsx`
-   **Equation Editor**: A LaTeX-based editor for mathematical expressions.
    -   **Component**: `EquationEditorModal.jsx`
-   **Graphing Calculator**: A tool for plotting mathematical functions.
    -   **Component**: `GraphingModal.jsx`
-   **Flowchart Builder**: An interactive tool for creating flowcharts and diagrams.
    -   **Component**: `FlowchartModal.jsx`
-   **3D Sandbox**: A 3D visualization and modeling environment.
    -   **Component**: `Sandbox3DModal.jsx`

Each of these tools is presented in a modal window and can be used to generate content that can be included in the chat.

## News & Media Hub

The application includes a built-in RSS reader to aggregate news from various sources.

-   **Implementation**: The `NewsPage.jsx` component displays the news feed. The backend for this feature is the active Cloudflare Worker (`worker.js`), which fetches and parses RSS feeds.
-   **Functionality**:
    -   Displays articles from different categories (e.g., technology, sports).
    -   Allows users to read article summaries.

## Customization

Users can customize the appearance and behavior of the application.

-   **Implementation**: Customization options are managed in the `NewSettingsPanel.jsx` component. Settings are saved to the user's account if they are logged in, or to `localStorage` otherwise.
-   **Functionality**:
    -   **Themes**: Choose from over 15 different color themes.
    -   **Font Settings**: Adjust the font size and family.
    -   **Behavioral Settings**: Configure options like "send with enter" and message alignment. 
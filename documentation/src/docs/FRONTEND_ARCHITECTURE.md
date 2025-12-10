# Frontend Architecture

This document provides an overview of the frontend architecture of the AI Portal application. The frontend is a modern React application built with Vite, designed to be modular, scalable, and maintainable.

## Core Technologies

-   **React**: The core library for building the user interface.
-   **Vite**: A fast build tool and development server.
-   **React Router**: For client-side routing and navigation.
-   **Styled-components**: For styling components with tagged template literals.
-   **Zustand & React Context**: For state management.

## Project Structure (`src/`)

The `src` directory is organized as follows:

### `main.jsx`

This is the entry point of the application. It renders the root `App` component into the DOM.

### `App.jsx`

This is the main application component. It is responsible for:

-   **Setting up the ThemeProvider**: Wraps the application in a `ThemeProvider` from `styled-components` to provide theme context to all components.
-   **Routing**: Uses `react-router-dom` to define the application's routes and render the appropriate page components.
-   **Global State Management**: Initializes and provides global contexts, such as `AuthContext` and `ToastContext`.
-   **Layout Management**: Defines the main layout of the application, including the sidebar and main content area.
-   **Modal Management**: Controls the visibility of various modals used throughout the application.

### `components/`

This directory contains reusable UI components that are used across multiple pages. Some of the key components include:

-   `ChatWindow.jsx`: The main interface for chat interactions.
-   `Sidebar.jsx`: The navigation sidebar for accessing chats, projects, and settings.
-   `ChatMessage.jsx`: Renders a single message in the chat.
-   `ModelSelector.jsx`: A dropdown for selecting the AI model.
-   Various modal components like `SettingsModal.jsx`, `WhiteboardModal.jsx`, etc.

The `components/mobile/` subdirectory contains components specifically designed for the mobile version of the application.

### `pages/`

This directory contains components that represent entire pages of the application. Each page component is typically associated with a route defined in `App.jsx`. Examples include:

-   `WorkspacePage.jsx`: The main workspace view.
-   `ProjectsPage.jsx`: A page for managing user projects.
-   `AdminPage.jsx`: The admin dashboard.
-   `NewsPage.jsx`: A page for displaying news feeds.

### `services/`

This directory contains modules responsible for communicating with the backend API and other external services. This separation of concerns helps to keep data fetching logic out of the components. Key services include:

-   `aiService.js`: For fetching AI model responses.
-e   `authService.js`: For handling user authentication.
-   `imageService.js`: For interacting with the image generation API.
-   `rssService.js`: For fetching and parsing RSS feeds.

### `contexts/`

This directory holds React Context providers for managing global state. This allows state to be shared across the component tree without prop drilling.

-   `AuthContext.jsx`: Manages user authentication state, including the current user and admin status.
-   `ToastContext.jsx`: Provides a function to display toast notifications.

### `hooks/`

This directory contains custom React hooks that encapsulate reusable logic. For example:

-   `useMessageSender.js`: A hook for sending messages to the AI.
-   `useMessageMender.js`: A hook for editing or "mending" messages.

### `styles/`

This directory contains global styling resources.

-   `themes.js`: Defines the different color themes available in the application.
-   `GlobalStyles.js`: Contains global CSS styles that are applied to the entire application.
-   `GlobalStylesProvider.jsx`: A component that provides the global styles and theme to the application.

### `utils/`

This directory contains utility functions that can be used throughout the application. 
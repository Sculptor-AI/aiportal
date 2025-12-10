# Project Overview

AI Portal is a web-based application designed to provide a comprehensive suite of tools for interacting with various AI models. It offers a rich user interface for chat-based interactions, image generation, and other advanced features. The platform is built with a modern tech stack, featuring a React frontend and a Node.js backend.

## Key Features

*   **Multi-modal AI Interaction:** The portal supports various AI models and functionalities, including chat completions and image generation.
*   **Rich User Interface:** The application provides a feature-rich and intuitive user interface with components for real-time chat, 3D sandboxing, flowcharts, and more.
*   **User Authentication:** Secure user authentication is implemented to manage user access and data.
*   **Project-based Organization:** Users can organize their work into projects, allowing for better management of AI-generated content and research.
*   **Customizable Themes:** The application supports multiple themes, allowing users to personalize their experience.

## Technical Stack

The project is a monorepo containing both the frontend and backend.

### Frontend

The frontend is a single-page application built with **React**. It uses modern frontend technologies including:

*   **Vite:** For a fast and optimized development experience.
*   **React Router:** For handling client-side routing.
*   **Styled-components & CSS:** For styling the application.
*   **Zustand & React Context:** For state management.

### Backend

The backend is built with **Node.js** and **Express.js**. It serves as an API for the frontend to interact with AI models and manage data.

## Project Structure

The repository is organized as follows:

-   `aiportal/`: The root directory of the backend server.
    -   `backend/`: Contains the source code for the backend application.
        -   `controllers/`: Logic for handling API requests.
        -   `routes/`: API endpoint definitions.
-   `src/`: Contains the source code for the frontend React application.
    -   `components/`: Reusable UI components.
    -   `pages/`: Top-level page components.
    -   `services/`: Frontend services for API communication.
    -   `contexts/`: State management using React Context.
    -   `hooks/`: Custom React hooks.
-   `public/`: Static assets such as images and fonts.
-   `documentation/`: Project documentation. 
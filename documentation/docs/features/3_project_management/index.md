# Project Management

The AI Portal provides robust project management capabilities, allowing users to organize their AI interactions, generated content, and associated knowledge files into distinct projects. This feature is crucial for maintaining clarity and efficiency, especially when dealing with multiple research topics or client engagements.

## 1. Implementation Details

The project management functionality is primarily handled by several key React components on the frontend. The persistence of project data is managed locally.

### Frontend Components:

*   **`ProjectsPage.jsx`**: This component serves as the main entry point for project management. It displays a list of all existing projects and provides options to create new ones or navigate to individual project details.
*   **`ProjectDetailPage.jsx`**: Once a user selects a project, this component renders the specific details of that project, including associated chats, generated images, and uploaded knowledge files.

### Data Persistence:

Project state is managed within the `App.jsx` component and is persisted using `localStorage`. This means that project data is saved directly in the user's browser, allowing them to retain their work even after closing and reopening the application. For multi-device access or more robust data management, a backend database integration would be required (currently not implemented for project data).

## 2. Core Functionality

### 2.1. Create and Delete Projects

Users have full control over their projects:

*   **Creation:** A simple interface allows users to create new projects, typically by providing a project name and an optional description.
*   **Deletion:** Projects can be deleted when no longer needed, which also removes all associated content (chats, images, knowledge files) from `localStorage`.

### 2.2. Associate Chats with Specific Projects

Each chat conversation initiated within the AI Portal can be linked to a specific project. This ensures that all interactions related to a particular topic or task are grouped together, making it easy to review past discussions and AI-generated responses within the context of that project.

### 2.3. Upload Knowledge Files

Users can upload various types of knowledge files (e.g., PDFs, text files, code snippets) to a project. These files serve as a knowledge base for the AI, allowing users to:

*   **Provide Context:** Supply the AI with specific documents or data for analysis and discussion.
*   **Reference Material:** Keep relevant research papers, reports, or code within the project for easy access.

While the files can be uploaded and associated with a project, the current implementation primarily stores them locally. Advanced features like AI-powered summarization or querying of these knowledge files would require further backend integration and processing.
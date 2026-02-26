# Setup Guide

This guide will walk you through the process of setting up and running the AI Portal application on your local machine for development.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

*   **Node.js**: Version 16 or higher.
*   **Yarn** or **npm**: A JavaScript package manager. This guide will use `yarn`.

## Installation

1.  **Clone the Repository**

    First, clone the project repository to your local machine:

    ```bash
    git clone https://github.com/your-username/aiportal.git
    cd aiportal
    ```

2.  **Install Dependencies**

    Install the necessary dependencies for both the frontend and the backend. Run the following command from the root of the project:

    ```bash
    yarn install
    ```

## Environment Configuration

The application uses environment variables to manage API keys and other configuration settings. You will need to create a `.env` file in the root of the project.

```bash
touch .env
```

Open the `.env` file and add the following variables. Replace the placeholder values with your actual API keys and settings.

```
# Frontend Environment Variables
VITE_BACKEND_API_URL=http://localhost:8787 # Default for `wrangler dev`

# Backend/Wrangler Environment Variables
# These are also used by `wrangler dev` from the same .env file
PORT=8787
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key
DATABASE_PATH=./database/aiportal.db
OPENROUTER_API_KEY=sk-or-v1-your-key
GEMINI_API_KEY=your-gemini-key
ANTHROPIC_API_KEY=sk-ant-your-key
OPENAI_API_KEY=sk-your-openai-key
```
**Security Note:** Never place provider keys in `VITE_*` frontend variables. `VITE_*` values are embedded into browser bundles.

## Running the Application

The application consists of two main parts: the React frontend and the Cloudflare Worker backend. You will need to run both concurrently for the application to work correctly.

### 1. Run the Backend (Cloudflare Worker)

The backend is a Cloudflare Worker. To start the local development server for the worker, run the following command from the project root:

```bash
yarn wrangler:dev
```

This will start the worker, and by default, it will be available at `http://localhost:8787`. The `VITE_BACKEND_API_URL` in your `.env` file should point to this address.

### 2. Run the Frontend (React App)

In a new terminal, start the React development server:

```bash
yarn dev
```

The frontend will be running on `http://localhost:3009`. You can now open this URL in your browser to use the application.

## Deployment

The application is designed to be deployed on **Cloudflare Pages**. The `wrangler.toml` file is pre-configured for this. For a production deployment, you will need to:

1.  Push your code to a GitHub repository.
2.  Create a new project on Cloudflare Pages and connect it to your repository.
3.  Configure the build settings in Cloudflare:
    *   **Build command**: `npm run build`
    *   **Build output directory**: `dist`
4.  Add your environment variables to the Cloudflare Pages project settings.

For more details, refer to the Cloudflare Pages documentation. 

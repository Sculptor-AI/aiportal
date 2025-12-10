# Running the Frontend

The AI Portal's frontend is a React application built with Vite. It provides the user interface for interacting with the application. This section explains how to run the frontend in a local development environment.

## 1. Open a New Terminal

It is important that you keep the backend server running in its own terminal window. You will need to open a **new terminal** to run the frontend application concurrently.

Navigate to the root of the project directory in your new terminal window.

```bash
cd path/to/your/aiportal
```

## 2. Start the Development Server

The project includes a script in the `package.json` file to start the Vite development server for the React application.

From the root of the project directory, run the following command:

```bash
yarn dev
```

This command will:

*   Start the Vite development server.
*   Open a new tab in your default web browser with the application running.
*   Enable Hot Module Replacement (HMR), which automatically updates the application in the browser as you make changes to the code.

## 3. Access the Application

Once the command has been executed, the frontend will be running on:

**http://localhost:3009**

You can now access this URL in your web browser to use the AI Portal application. The frontend will connect to the backend server running on `http://localhost:8787` (as configured in your `.env` file).

By following these steps, you will have both the backend and frontend of the AI Portal application running locally on your machine, ready for development.
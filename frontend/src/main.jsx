import React from 'react';
import ReactDOM from 'react-dom/client';
import AppWithAuth from './App';
import './index.css';
import { testSystemPrompt } from './prompts/test-system-prompt'; // Import test for console access
import './_globalStyles.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Make test available in console
window.testSculptorAI = testSystemPrompt;

// Define the router configuration using the modern createBrowserRouter
const router = createBrowserRouter(
  [
    {
      path: "/*",
      element: <AppWithAuth />,
    },
  ],
  {
    future: {
      // Opt-in to React Router v7 data APIs
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
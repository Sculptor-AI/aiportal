# Troubleshooting Guide

This guide helps you resolve common issues you might encounter while developing and running the AI Portal application.

## Frontend Issues

### "Vite command not found" or "Wrangler command not found"

If you see an error like `bash: vite: command not found`, it usually means the project's dependencies have not been installed.

-   **Solution**: Run `yarn install` (or `npm install`) in the root directory of the project to install all necessary packages, including Vite and Wrangler.

### Application Not Loading at `localhost:3009`

If the frontend is not accessible in your browser:

1.  **Check if the dev server is running**: Make sure you have the Vite development server running in a terminal. If not, start it with `yarn dev`.
2.  **Check for port conflicts**: Another application might be using port `3009`. The terminal where you ran `yarn dev` will show an error if the port is already in use. You can either stop the other application or change the port in `vite.config.js`.

### API Calls are Failing (e.g., News feed not loading)

If the frontend is running but it can't fetch data from the backend:

1.  **Verify the backend is running**: The Cloudflare Worker backend must be running concurrently. Start it in a separate terminal with `yarn wrangler:dev`.
2.  **Check the Backend URL**: Ensure the `VITE_BACKEND_API_URL` variable in your `.env` file is set correctly. For local development, it should point to the Wrangler dev server, which defaults to `http://localhost:8787`.
3.  **Check the Browser Console**: Open your browser's developer tools (F12) and check the "Console" tab for any errors. Look for CORS errors, which can indicate a problem with the backend URL or configuration.

## Backend Issues (Cloudflare Worker)

### Worker Fails to Start

If `yarn wrangler:dev` fails with an error:

1.  **Read the Error Message**: The terminal output from Wrangler is usually descriptive and will point you to the problem.
2.  **Check Environment Variables**: The worker may rely on environment variables defined in your `.env` file. Make sure all required variables are present and have valid values. Refer to the [Setup Guide](./SETUP_GUIDE.md) for a list of required variables.

### RSS Feeds Are Not Loading

If the API calls to the RSS feed endpoints are failing:

1.  **Check the Worker's Terminal**: Look for any error messages printed in the terminal where the worker is running. This can provide clues about why the feed parsing is failing.
2.  **Verify External Feeds**: The RSS feeds are fetched from external websites. It's possible that one of the feed URLs is temporarily down or has changed. You can check the URLs defined in `worker.js` to ensure they are accessible.
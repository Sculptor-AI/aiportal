# Running the Backend

The AI Portal's backend is a Cloudflare Worker that handles API requests, authentication, and communication with various AI services. This section explains how to run the backend in a local development environment.

## 1. Start the Development Server

The project is configured to use `wrangler`, the command-line tool for building Cloudflare Workers. To start the local development server, you will use a script defined in the `package.json` file.

From the root of the project directory, run the following command in your terminal:

```bash
yarn wrangler:dev
```

This command will:

*   Bundle the backend source code.
*   Start a local server that simulates the Cloudflare environment.
*   Watch for file changes and automatically reload the worker when you make edits.

## 2. Verify the Backend is Running

Once the command has been executed successfully, you should see output in your terminal indicating that the worker is running. By default, the backend will be available at:

**http://localhost:8787**

You can open this URL in your browser or use a tool like `curl` to verify that the server is responding. You should see a message like `"AI Portal Backend is running"`.

```bash
curl http://localhost:8787
```

**Important:** The backend server must be running for the frontend application to function correctly. Make sure you have completed this step before proceeding to run the frontend.
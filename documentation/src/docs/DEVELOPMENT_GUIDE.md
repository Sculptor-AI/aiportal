# Development Guide

This guide provides instructions and best practices for developing the AI Portal application.

## Getting Started

Before you start, please follow the [Setup Guide](./SETUP_GUIDE.md) to get the project running on your local machine.

## Frontend Development

The frontend is a React application located in the `src` directory.

### Project Structure

The frontend follows a standard React project structure. For a detailed overview, please refer to the [Frontend Architecture](./FRONTEND_ARCHITECTURE.md) documentation.

### Creating New Components

-   Reusable components should be placed in `src/components/`.
-   Page-level components should be placed in `src/pages/`.
-   When creating a new component, it's recommended to create a new file for it (e.g., `MyComponent.jsx`).

### Adding a New Route

To add a new page to the application:

1.  Create your page component in `src/pages/`.
2.  Open `src/App.jsx` and add a new `<Route>` component within the `<Routes>` section.

    ```jsx
    import MyNewPage from './pages/MyNewPage';

    // ... inside the Routes component
    <Route path="/my-new-page" element={<MyNewPage />} />
    ```

### State Management

-   For component-level state, use React hooks like `useState` and `useReducer`.
-   For global state that needs to be shared across the application, use React Context. The project already uses `AuthContext` and `ToastContext`, which you can use as a reference.

## Backend Development (Cloudflare Worker)

The backend is a Cloudflare Worker defined in `worker.js`.

### Adding a New API Endpoint

To add a new API endpoint:

1.  Open `worker.js`.
2.  Inside the `fetch` handler, add a new `if` condition to check for your new API path.

    ```javascript
    // ... inside the fetch handler
    if (url.pathname === '/api/my-new-endpoint') {
      // Your logic here
      return new Response(JSON.stringify({ message: 'Success' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    ```

3.  Remember to handle CORS headers as shown in the existing endpoints.

### The `aiportal/backend` Directory

As noted in the architecture documents, the `aiportal/backend` directory contains a separate, unused Express.js application. For current development, you should focus on the Cloudflare Worker (`worker.js`). Do not add new features to the Express.js application unless a decision is made to switch to it.

## Code Style and Conventions

While the project does not have a strict, enforced code style, it is recommended to follow these general guidelines:

-   **Formatting**: Use a code formatter like [Prettier](https://prettier.io/) to maintain a consistent style.
-   **Naming Conventions**:
    -   Use `PascalCase` for component names (e.g., `MyComponent`).
    -   Use `camelCase` for variables and functions (e.g., `myVariable`).
-   **Modularity**: Keep components small and focused on a single responsibility.

## Contributing

We welcome contributions to the project. To contribute, please follow these steps:

1.  Create a new branch for your feature or bug fix: `git checkout -b feature/my-new-feature`
2.  Make your changes and commit them with a clear and descriptive message.
3.  Push your branch to the repository: `git push origin feature/my-new-feature`
4.  Open a pull request and provide a detailed description of your changes.
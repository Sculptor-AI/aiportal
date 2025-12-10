# Model Configuration Guide

This document explains how AI models are configured and managed in the AI Portal application.

## Overview

The application uses a hybrid approach for model management, combining a list of standard models fetched from a backend service with user-defined custom models stored locally.

## Backend Models

The primary list of available AI models is fetched from a backend service when the application loads.

-   **Implementation**: The `fetchModelsFromBackend` function in `src/services/aiService.js` is responsible for retrieving the list of standard models.
-   **Configuration**: The configuration for these models is managed on the backend. To add, remove, or modify these models, changes must be made to the backend service that provides them.

## Custom Models

In addition to the backend models, users can create and manage their own custom models. These models are stored in the browser's `localStorage`.

### Custom Model Structure

A custom model is a JSON object with the following structure:

```json
{
  "id": "a-unique-id",
  "name": "My Custom Assistant",
  "description": "A custom model for a specific task.",
  "systemPrompt": "You are a helpful assistant that always responds in rhymes.",
  "avatar": "base64-encoded-image-or-url",
  "baseModel": "gpt-3.5-turbo",
  "enabled": true
}
```

-   `id` (string): A unique identifier for the custom model.
-   `name` (string): The display name of the model.
-   `description` (string): A brief description of the model's purpose.
-   `systemPrompt` (string): A custom system prompt that will be used to instruct the AI.
-   `avatar` (string, optional): A URL or a base64-encoded data URI for a custom avatar image.
-   `baseModel` (string): The underlying base model to use for the custom model (e.g., `gpt-3.5-turbo`).
-   `enabled` (boolean): Whether the model is currently enabled and should appear in the model selector.

### How to Add a New Custom Model

While the application UI for managing custom models is not detailed in the codebase I have access to, you can manually add a new custom model by following these steps:

1.  **Open your browser's developer tools** (usually by pressing F12).
2.  **Go to the "Application" tab** (in Chrome) or "Storage" tab (in Firefox).
3.  **Select "Local Storage"** from the sidebar and find the entry for this application.
4.  **Find the key `customModels`**. It will contain a JSON array of custom model objects.
5.  **Edit the value** of `customModels` to add your new model object to the array. Make sure to follow the structure described above.
6.  **Save your changes and refresh the page**. Your new custom model should now appear in the model selector.

**Note:** Be careful when editing `localStorage` directly, as incorrect formatting can cause issues with the application.
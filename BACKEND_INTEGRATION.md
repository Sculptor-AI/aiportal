# Backend Integration for AI Portal

This document explains how to set up and use the backend integration for AI Portal.

## Overview

The AI Portal application now includes a backend server that provides:
1. Secure API access to multiple AI models
2. Unified model selection list in the frontend
3. Request/response packet encryption using AES-128
4. Model validation to prevent abuse

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```
   PORT=3000
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   PUBLIC_KEY=your_public_key_here
   PRIVATE_KEY=your_private_key_here
   ALLOWED_MODELS=openai/gpt-4o,anthropic/claude-3-haiku,anthropic/claude-3-opus,anthropic/claude-3-sonnet,meta-llama/llama-2-70b-chat,google/gemini-pro
   ```

4. Start the backend server:
   ```
   npm start
   ```

### Frontend Setup

1. In the root directory, create a `.env` file with the following variables:
   ```
   VITE_GOOGLE_API_KEY=your_google_api_key_here
   VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here
   VITE_OPENAI_API_KEY=your_openai_api_key_here
   VITE_NVIDIA_API_KEY=your_nvidia_api_key_here
   VITE_BACKEND_API_URL=https://aiportal-backend.vercel.app/api
   ```

2. Install dependencies:
   ```
### **Phase 1: Project Restructuring & Configuration**

The first step is to restructure the project to allow the main `aiportal/backend` to run and manage the `deep-research-api` and `news-api`. This avoids running three separate servers and simplifies configuration and communication.

1.  **File System Consolidation:**
    *   Move the contents of `apis/deep-research-api/src` and `apis/news-api/src` into the main `aiportal/backend` under new directories, for example: `aiportal/backend/services/deep-research/` and `aiportal/backend/services/news/`.
    *   Refactor the imports within the moved files to use relative paths appropriate for the new structure.

2.  **Dependency Merging:**
    *   Merge the `dependencies` and `devDependencies` from `apis/deep-research-api/package.json` and `apis/news-api/package.json` into the main `aiportal/backend/package.json`.
    *   Run `npm install` in the `aiportal/backend` directory to install the new dependencies.

3.  **Unified Configuration:**
    *   Create a single, comprehensive `.env` file in the `aiportal/backend` directory. This file will consolidate all settings from the individual APIs.
    *   **Proposed `.env` Structure:**
        ```env
        # Server Configuration
        PORT=3000
        NODE_ENV=development

        # --- AI & External API Keys ---
        # Used by main backend, deep research, and news APIs
        GEMINI_API_KEY=your_google_gemini_api_key_here
        OPENROUTER_API_KEY=your_openrouter_api_key_here # For existing chat features
        BRAVE_API_KEY=your_brave_api_key_here           # For existing search features

        # --- Deep Research API Settings ---
        RESEARCH_MAX_CONCURRENT_TASKS=5
        RESEARCH_TASK_RETENTION_HOURS=24

        # --- News API Settings ---
        NEWS_GENERATION_SCHEDULE="0 */4 * * *" # Every 4 hours
        NEWS_TARGET_ARTICLE_COUNT=25
        NEWS_ARTICLE_LIFETIME_HOURS=72
        NEWS_RESEARCH_AGENTS_PER_ARTICLE=3
        NEWS_MAX_CONCURRENT_ARTICLE_GENERATION=2

        # --- General App Settings ---
        ALLOWED_ORIGINS=http://localhost:5173,https://your-frontend-domain.com
        ```
    *   Modify the config loading logic in the now-integrated services (`configService.ts`, `geminiService.ts`, `taskManager.ts`) to read from `process.env` populated by this single `.env` file.

### **Phase 2: Backend Integration & API Proxy**

The main backend will expose secure endpoints to the frontend and manage the lifecycle of the research and news services.

1.  **Initialize Services in Main Backend:**
    *   In `aiportal/backend/server.js`, initialize and start the necessary services from the integrated APIs (e.g., `NewsGenerationService`, `SchedulerService`, `TaskManager`). This ensures the news generation cron job runs as part of the main backend process.

2.  **Create a Secure Deep Research Proxy:**
    *   **File:** `aiportal/backend/routes/api.js`
    *   **Endpoint:** `POST /api/research/start`
    *   **Logic:**
        *   This endpoint will accept a JSON body containing only `{ "researchTopic": "user's topic" }`.
        *   It will perform strict validation and sanitization on the `researchTopic` input.
        *   It will then call the `TaskManager`'s `createTask` function internally, passing the user's topic along with a locked-down, secure configuration (e.g., `responseType: 'Report'`, `autoAgents: true`, etc.). This prevents users from manipulating other API parameters.
        *   The endpoint will immediately return a `taskId`.

3.  **Create a Streaming Progress Endpoint:**
    *   **File:** `aiportal/backend/routes/api.js`
    *   **Endpoint:** `GET /api/research/stream/:taskId`
    *   **Logic:**
        *   This endpoint will use Server-Sent Events (SSE).
        *   It will subscribe to progress updates from the `TaskManager` for the given `taskId`.
        *   It will stream simplified progress updates to the client (e.g., `{ "status": "researching", "progress": 25 }`). It will **not** expose individual agent data.
        *   When the task is complete, it will stream the final report payload and close the connection.

4.  **Create a News Feed Endpoint:**
    *   **File:** `aiportal/backend/routes/api.js`
    *   **Endpoint:** `GET /api/news/feed`
    *   **Logic:**
        *   This endpoint is purely read-only.
        *   It will call the `NewsStorageService` (`storageService.ts`) to fetch the latest articles.
        *   It will return the list of articles to the frontend.

5.  **Create a Backend News Generation Trigger:**
    *   **File:** `aiportal/backend/scripts/force-news-generation.js`
    *   **Logic:**
        *   This script will be executable via the command line (e.g., `node scripts/force-news-generation.js`).
        *   It will directly invoke the `NewsGenerationService.generateNewsCycle(true)` method.
        *   This provides a secure way to force generation without exposing an API endpoint to the public.

### **Phase 3: Frontend Implementation**

This phase involves connecting the UI components to the new backend endpoints.

1.  **Create Research Page & Components:**
    *   Create a new page component at `src/pages/ResearchPage.jsx`.
    *   Add a route for `/research` in `src/App.jsx`.
    *   The `ResearchPage` will contain:
        *   An input field for the research topic.
        *   A "Start Research" button that calls the `POST /api/research/start` backend endpoint.
        *   A display area for the research progress (using the streaming endpoint).
        *   A component to view and manage saved research reports from `localStorage`.

2.  **Implement Research Workflow & Storage:**
    *   When the user starts a research task, the frontend receives a `taskId`.
    *   It then establishes an `EventSource` connection to `/api/research/stream/:taskId`.
    *   The UI updates based on progress events.
    *   When the final report is received, the frontend saves it to `localStorage` using a structure similar to the existing chat storage:
        ```javascript
        // localStorage key: 'deepResearchReports'
        [
          {
            id: 'task-id-123',
            topic: 'The Impact of AI on Healthcare',
            report: '# Research Report...',
            sources: [...],
            timestamp: '2023-10-27T10:00:00Z'
          }
        ]
        ```
    *   The `ResearchPage` will read from this `localStorage` key to display a list of past reports.

3.  **Update News Page:**
    *   **File:** `src/pages/NewsPage.jsx`
    *   Modify the component to fetch data from the new `GET /api/news/feed` endpoint instead of using placeholder data.
    *   Map the fetched article data to the existing `ArticleCard` components.
    *   The page will remain read-only for the user, with no buttons to trigger generation.

### **Phase 4: Documentation**

Create comprehensive documentation for the integrated system.

1.  **Create `AIPORTAL_INTEGRATION.md`:** A new markdown file in the root directory.
2.  **Contents:**
    *   **System Architecture:** A high-level overview of how the main backend, integrated APIs, and frontend interact.
    *   **Configuration:** Detail the unified `.env` file, explaining each variable for all three services.
    *   **Backend API Reference:** Document the new proxy endpoints (`/api/research/start`, `/api/research/stream/:taskId`, `/api/news/feed`), including request/response formats and SSE events.
    *   **News Generation:** Explain how to run the `force-news-generation.js` script from the command line, including any necessary environment setup.
    *   **Security Notes:** Outline the security measures taken, such as input sanitization and the proxy architecture that prevents direct client access to the microservices.
    *   **Frontend Data Flow:** Describe how the Research and News pages fetch data and how deep research reports are stored on the client-side. 
# Deployment Instructions for Your GGUF Model API

Follow these steps to deploy your GGUF model as an API and integrate it with the Sculptor AI portal.

## 1. Set Up the GGUF API Server

### Prerequisites
- Python 3.8 or higher
- Docker (optional, but recommended)
- Your GGUF model file

### Option A: Docker Deployment

1. **Create a project directory:**
   ```bash
   mkdir gguf-api-server && cd gguf-api-server
   ```

2. **Create the application files:**
   - Copy the `app.py` code into a file named `app.py`
   - Copy the `requirements.txt` content into a file named `requirements.txt`
   - Copy the `Dockerfile` content into a file named `Dockerfile`

3. **Create a models directory and copy your GGUF file:**
   ```bash
   mkdir -p models
   cp /path/to/your/model.gguf models/
   ```

4. **Update the Dockerfile:**
   Edit `Dockerfile` and change `ENV MODEL_PATH=/app/models/your-model.gguf` to match your actual model filename.

5. **Build and run the Docker container:**
   ```bash
   docker build -t gguf-api-server .
   docker run -p 8000:8000 -d --name gguf-api gguf-api-server
   ```

### Option B: Direct Installation

1. **Create a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set environment variables:**
   ```bash
   # Linux/MacOS
   export MODEL_PATH=/absolute/path/to/your/model.gguf
   export N_CTX=4096
   export N_THREADS=4

   # Windows
   set MODEL_PATH=C:\path\to\your\model.gguf
   set N_CTX=4096
   set N_THREADS=4
   ```

4. **Run the server:**
   ```bash
   python app.py
   ```

## 2. Test Your API

Once your server is running, you can test it with curl:

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello, how are you?"}
    ],
    "max_tokens": 100,
    "temperature": 0.7
  }'
```

Or use tools like Postman or Insomnia to test the API.

## 3. Integrate with Sculptor AI

Now that your API is running, you need to modify the Sculptor AI codebase:

1. **Update the AI Service:**
   - Modify `src/services/aiService.js` based on the provided code snippets
   - Add your model to the `MODEL_CONFIGS` object
   - Update the `getApiKeys` function
   - Modify the `sendMessage` function to handle your custom model

2. **Add Model Icon and UI Elements:**
   - Update `src/styles/themes.js` to add your custom model theme
   - Modify `src/components/ModelIcon.jsx` to add an icon for your model
   - Update `src/App.jsx` to add your model to the available models list

3. **Update Settings Modal:**
   - Modify `src/components/SettingsModal.jsx` to add an input for your custom API URL
   - Add the URL environment variable to `.env.example` and create a `.env` file if needed

4. **Build the Application:**
   ```bash
   npm run build
   ```

5. **Deploy the Updated Frontend:**
   If you're using a static hosting service, upload the contents of the `dist` directory after building.

## 4. Networking Considerations

### Local Development
If you're running both the API server and the web app on the same machine:
- Set the API URL to `http://localhost:8000` (or whatever port you configured)
- Enable CORS in your API server (already configured in the provided code)

### Production Deployment
If deploying to separate servers:
- Make sure your API server is accessible from the web app's location
- Set the API URL to the public address of your API server
- Consider using HTTPS for security
- Update CORS settings in your API server to allow requests from your frontend domain

### Security Considerations
- The provided API server has no authentication - consider adding API keys for production
- For public deployment, implement rate limiting and monitoring
- Consider using a reverse proxy like Nginx in front of your API server
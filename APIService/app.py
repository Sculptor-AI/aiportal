from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import os
import sys
import traceback

app = FastAPI(title="Custom GGUF Model API")

# Add CORS middleware to allow requests from your web app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model configuration
MODEL_PATH = os.environ.get("MODEL_PATH", "/app/models/ursa_minor-q8_0.gguf")
N_CTX = int(os.environ.get("N_CTX", "4096"))  # Context window size
N_THREADS = int(os.environ.get("N_THREADS", "4"))  # Number of CPU threads to use
N_BATCH = int(os.environ.get("N_BATCH", "512"))  # Batch size for prompt processing

# Initialize model (lazy loading - will load on first request)
llm = None

def get_model():
    global llm
    if llm is None:
        try:
            print(f"Python version: {sys.version}")
            print(f"Current directory: {os.getcwd()}")
            
            # Additional debug info
            print(f"Loading model from {MODEL_PATH}...")
            if not os.path.exists(MODEL_PATH):
                print(f"ERROR: File does not exist: {MODEL_PATH}")
                raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")
                
            file_size_mb = os.path.getsize(MODEL_PATH) / (1024 * 1024)
            print(f"File exists, size: {file_size_mb:.2f} MB")
            print(f"n_ctx: {N_CTX}, n_threads: {N_THREADS}, n_batch: {N_BATCH}")
            
            # Import the Llama class - make sure to use the appropriate llama_cpp version
            try:
                from llama_cpp import Llama
                print("Successfully imported Llama class")
                
                # Create an instance of Llama with updated model_kwargs for Qwen2 support
                try:
                    # Try loading with explicit architecture specification
                    llm = Llama(
                        model_path=MODEL_PATH,
                        n_ctx=N_CTX,
                        n_threads=N_THREADS,
                        n_batch=N_BATCH,
                        verbose=True,
                        # Add these options to force load Qwen model
                        model_kwargs={
                            "rope_scaling_type": 1,  # Default RoPE scaling for Qwen
                        }
                    )
                    print("Model loaded successfully")
                except Exception as e:
                    print(f"Error with first loading method: {e}")
                    print("Trying alternative loading method...")
                    # Try a different way to load the model
                    import ctypes
                    from llama_cpp import llama_cpp
                    
                    # Force architecture override if needed
                    if hasattr(llama_cpp, 'llama_model_arch'):
                        print("Setting model architecture directly")
                        QWEN_ARCH = 2  # This might need adjustment based on llama.cpp code
                        llama_cpp.llama_model_arch = ctypes.c_int(QWEN_ARCH)
                    
                    llm = Llama(
                        model_path=MODEL_PATH,
                        n_ctx=N_CTX,
                        n_threads=N_THREADS,
                        n_batch=N_BATCH,
                        verbose=True
                    )
                    print("Model loaded with architecture override")
            except Exception as e:
                print(f"Error importing Llama: {e}")
                print(traceback.format_exc())
                raise
                
        except Exception as e:
            error_msg = f"Failed to load model: {str(e)}"
            print(error_msg)
            print(traceback.format_exc())
            raise RuntimeError(error_msg)
    return llm

# Request and response models
class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    max_tokens: Optional[int] = 1024
    temperature: Optional[float] = 0.7
    top_p: Optional[float] = 0.95
    stop: Optional[List[str]] = None

class ChatResponse(BaseModel):
    content: str

@app.get("/")
def read_root():
    return {"status": "online", "model": os.path.basename(MODEL_PATH)}

@app.post("/chat", response_model=ChatResponse)
async def chat_completion(request: ChatRequest):
    try:
        model = get_model()
        
        # Prepare the prompt according to a simple chat template
        prompt = ""
        for message in request.messages:
            role = message.role
            content = message.content
            
            if role == "system":
                prompt += f"<|im_start|>system\n{content}<|im_end|>\n"
            elif role == "user":
                prompt += f"<|im_start|>user\n{content}<|im_end|>\n"
            elif role == "assistant":
                prompt += f"<|im_start|>assistant\n{content}<|im_end|>\n"
        
        # Add the final assistant prompt
        prompt += "<|im_start|>assistant\n"
        
        print(f"Processing prompt: {prompt[:100]}...")
        
        # Generate response
        response = model.create_completion(
            prompt=prompt,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
            top_p=request.top_p,
            stop=request.stop or ["<|im_end|>", "<|im_start|>"],
            echo=False
        )
        
        # Extract the generated text
        generated_text = response["choices"][0]["text"].strip()
        print(f"Generated response: {generated_text[:100]}...")
        
        return ChatResponse(content=generated_text)
    
    except Exception as e:
        error_msg = f"Model inference failed: {str(e)}"
        print(error_msg)
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=error_msg)

@app.get("/health")
def health_check():
    """Health check endpoint"""
    try:
        # Only check if model file exists for quicker health checks
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")
        return {"status": "healthy", "model_path": MODEL_PATH}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting server on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
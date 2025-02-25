// This is the worker script for AI Portal, handling both static assets and API routes
// It includes server-side authentication, user data storage, and secure API token storage

/**
 * Generate JWT for authentication
 * @param {Object} payload - The data to encode in the JWT
 * @param {string} secret - Secret key for signing the JWT
 * @returns {string} - The generated JWT
 */
async function generateJWT(payload, secret) {
  // Create JWT header
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  // Set token expiration to 24 hours from now
  const now = Math.floor(Date.now() / 1000);
  payload.exp = now + (24 * 60 * 60); // 24 hours
  payload.iat = now;
  
  // Encode header and payload
  const base64Header = btoa(JSON.stringify(header));
  const base64Payload = btoa(JSON.stringify(payload));
  
  // Create signature
  const textEncoder = new TextEncoder();
  const data = textEncoder.encode(`${base64Header}.${base64Payload}`);
  const secretData = textEncoder.encode(secret);
  
  const key = await crypto.subtle.importKey(
    'raw',
    secretData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, data);
  const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)));
  
  // Return complete JWT
  return `${base64Header}.${base64Payload}.${base64Signature}`;
}

/**
 * Verify and decode JWT
 * @param {string} token - The JWT to verify
 * @param {string} secret - Secret key for verifying the JWT
 * @returns {Object|null} - The decoded payload if valid, null otherwise
 */
async function verifyJWT(token, secret) {
  try {
    const [headerBase64, payloadBase64, signatureBase64] = token.split('.');
    
    if (!headerBase64 || !payloadBase64 || !signatureBase64) {
      return null;
    }
    
    // Decode payload
    const payload = JSON.parse(atob(payloadBase64));
    
    // Check if token has expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }
    
    // Verify signature
    const textEncoder = new TextEncoder();
    const data = textEncoder.encode(`${headerBase64}.${payloadBase64}`);
    const secretData = textEncoder.encode(secret);
    
    const key = await crypto.subtle.importKey(
      'raw',
      secretData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const receivedSignature = new Uint8Array(
      atob(signatureBase64).split('').map(c => c.charCodeAt(0))
    );
    
    const signatureValid = await crypto.subtle.verify(
      'HMAC',
      key,
      receivedSignature,
      data
    );
    
    return signatureValid ? payload : null;
  } catch (err) {
    console.error('Error verifying JWT:', err);
    return null;
  }
}

/**
 * Hash a password for storage
 * @param {string} password - The plain text password
 * @returns {Promise<string>} - The hashed password
 */
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  
  // Convert to hex string
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Encrypt sensitive data like API keys
 * @param {string} data - The data to encrypt
 * @param {string} key - The encryption key
 * @returns {Promise<string>} - The encrypted data
 */
async function encryptData(data, key) {
  try {
    // Generate random initialization vector
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Import the key
    const importedKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(key),
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );
    
    // Encrypt the data
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      importedKey,
      new TextEncoder().encode(data)
    );
    
    // Combine IV and encrypted data and encode as base64
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedData), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  } catch (err) {
    console.error('Error encrypting data:', err);
    throw err;
  }
}

/**
 * Decrypt sensitive data like API keys
 * @param {string} encryptedData - The encrypted data
 * @param {string} key - The encryption key
 * @returns {Promise<string>} - The decrypted data
 */
async function decryptData(encryptedData, key) {
  try {
    // Decode base64
    const combined = new Uint8Array(
      atob(encryptedData).split('').map(c => c.charCodeAt(0))
    );
    
    // Extract IV (first 12 bytes) and encrypted data
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    
    // Import the key
    const importedKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(key),
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    
    // Decrypt the data
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      importedKey,
      data
    );
    
    // Convert to string
    return new TextDecoder().decode(decrypted);
  } catch (err) {
    console.error('Error decrypting data:', err);
    throw err;
  }
}

// Main worker handler
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // API endpoints
    if (url.pathname.startsWith('/api/')) {
      return handleApiRequest(request, env);
    }
    
    // Static assets
    if (url.pathname.startsWith('/assets/') || 
        url.pathname.startsWith('/images/') ||
        url.pathname.includes('.')) {
      return env.ASSETS.fetch(request);
    }
    
    // For all other requests, serve index.html to handle client-side routing
    return env.ASSETS.fetch(`${url.origin}/index.html`);
  }
};

/**
 * Handle all API requests
 * @param {Request} request - The original request
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} - The API response
 */
async function handleApiRequest(request, env) {
  const url = new URL(request.url);
  
  // CORS headers for all API responses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  // Authentication routes
  if (url.pathname === '/api/auth/register') {
    return handleRegistration(request, env, corsHeaders);
  }
  
  if (url.pathname === '/api/auth/login') {
    return handleLogin(request, env, corsHeaders);
  }
  
  if (url.pathname === '/api/auth/verify') {
    return handleTokenVerification(request, env, corsHeaders);
  }
  
  // Protected routes - require authentication
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.split('Bearer ')[1];
  
  if (!token) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  // Verify JWT token
  const user = await verifyJWT(token, env.JWT_SECRET);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  // User settings routes
  if (url.pathname === '/api/user/settings') {
    if (request.method === 'GET') {
      return getUserSettings(user.username, env, corsHeaders);
    } else if (request.method === 'PUT') {
      return updateUserSettings(user.username, request, env, corsHeaders);
    }
  }
  
  // Chat history routes
  if (url.pathname === '/api/chats') {
    if (request.method === 'GET') {
      return getUserChats(user.username, env, corsHeaders);
    } else if (request.method === 'POST') {
      return saveUserChats(user.username, request, env, corsHeaders);
    }
  }
  
  // AI API proxy route - to keep API keys server-side
  if (url.pathname === '/api/ai/message' && request.method === 'POST') {
    return handleAiMessageProxy(user.username, request, env, corsHeaders);
  }
  
  // If no route matches
  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * Handle user registration
 * @param {Request} request - The original request
 * @param {Object} env - Environment variables and bindings
 * @param {Object} corsHeaders - CORS headers to include
 * @returns {Response} - The API response
 */
async function handleRegistration(request, env, corsHeaders) {
  try {
    // Parse request body
    const { username, password } = await request.json();
    
    // Validate inputs
    if (!username || !password) {
      return new Response(JSON.stringify({ error: 'Username and password are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (username.length < 3) {
      return new Response(JSON.stringify({ error: 'Username must be at least 3 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (password.length < 6) {
      return new Response(JSON.stringify({ error: 'Password must be at least 6 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Check if user already exists
    const existingUser = await env.USERS.get(username);
    if (existingUser) {
      return new Response(JSON.stringify({ error: 'Username already exists' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create user object with default settings
    const user = {
      username,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      settings: {
        theme: 'light',
        fontSize: 'medium',
        sendWithEnter: true,
        showTimestamps: true,
        showModelIcons: true, 
        messageAlignment: 'left',
        codeHighlighting: true,
        openaiApiKey: '',
        anthropicApiKey: '',
        googleApiKey: ''
      }
    };
    
    // Save to KV storage
    await env.USERS.put(username, JSON.stringify(user));
    
    // Create a JWT token
    const payload = { 
      username,
      type: 'user'
    };
    
    const token = await generateJWT(payload, env.JWT_SECRET);
    
    // Return user data (without password) and token
    const responseUser = { 
      username: user.username,
      settings: user.settings,
      createdAt: user.createdAt
    };
    
    return new Response(JSON.stringify({ user: responseUser, token }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    return new Response(JSON.stringify({ error: 'Server error during registration' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Handle user login
 * @param {Request} request - The original request
 * @param {Object} env - Environment variables and bindings
 * @param {Object} corsHeaders - CORS headers to include
 * @returns {Response} - The API response
 */
async function handleLogin(request, env, corsHeaders) {
  try {
    // Parse request body
    const { username, password } = await request.json();
    
    // Validate inputs
    if (!username || !password) {
      return new Response(JSON.stringify({ error: 'Username and password are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Get user from KV storage
    const userJson = await env.USERS.get(username);
    if (!userJson) {
      return new Response(JSON.stringify({ error: 'Invalid username or password' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const user = JSON.parse(userJson);
    
    // Check password
    const hashedPassword = await hashPassword(password);
    if (user.password !== hashedPassword) {
      return new Response(JSON.stringify({ error: 'Invalid username or password' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Create JWT token
    const payload = { 
      username,
      type: 'user'
    };
    
    const token = await generateJWT(payload, env.JWT_SECRET);
    
    // Return user data (without password) and token
    const responseUser = { 
      username: user.username,
      settings: user.settings,
      createdAt: user.createdAt
    };
    
    // Decrypt API keys for client if they exist
    if (responseUser.settings.openaiApiKey) {
      responseUser.settings.openaiApiKey = '••••••••';  // Security: don't send actual key to client
    }
    
    if (responseUser.settings.anthropicApiKey) {
      responseUser.settings.anthropicApiKey = '••••••••'; // Security: don't send actual key to client
    }
    
    if (responseUser.settings.googleApiKey) {
      responseUser.settings.googleApiKey = '••••••••'; // Security: don't send actual key to client
    }
    
    return new Response(JSON.stringify({ user: responseUser, token }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Login error:', error);
    
    return new Response(JSON.stringify({ error: 'Server error during login' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Verify token validity
 * @param {Request} request - The original request
 * @param {Object} env - Environment variables and bindings
 * @param {Object} corsHeaders - CORS headers to include
 * @returns {Response} - The API response
 */
async function handleTokenVerification(request, env, corsHeaders) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split('Bearer ')[1];
    
    if (!token) {
      return new Response(JSON.stringify({ valid: false }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Verify token
    const payload = await verifyJWT(token, env.JWT_SECRET);
    
    if (!payload) {
      return new Response(JSON.stringify({ valid: false }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Get user data
    const userJson = await env.USERS.get(payload.username);
    if (!userJson) {
      return new Response(JSON.stringify({ valid: false }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const user = JSON.parse(userJson);
    
    // Return user data (without password)
    const responseUser = { 
      username: user.username,
      settings: user.settings,
      createdAt: user.createdAt
    };
    
    // Hide API keys - only send placeholders to client
    if (responseUser.settings.openaiApiKey) {
      responseUser.settings.openaiApiKey = '••••••••';
    }
    
    if (responseUser.settings.anthropicApiKey) {
      responseUser.settings.anthropicApiKey = '••••••••';
    }
    
    if (responseUser.settings.googleApiKey) {
      responseUser.settings.googleApiKey = '••••••••';
    }
    
    return new Response(JSON.stringify({ valid: true, user: responseUser }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    
    return new Response(JSON.stringify({ valid: false, error: 'Server error during token verification' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Get user settings
 * @param {string} username - The user's username
 * @param {Object} env - Environment variables and bindings
 * @param {Object} corsHeaders - CORS headers to include
 * @returns {Response} - The API response
 */
async function getUserSettings(username, env, corsHeaders) {
  try {
    // Get user from KV storage
    const userJson = await env.USERS.get(username);
    if (!userJson) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const user = JSON.parse(userJson);
    
    // Hide API keys - only send placeholders to client
    const settings = { ...user.settings };
    if (settings.openaiApiKey) {
      settings.openaiApiKey = '••••••••';
    }
    
    if (settings.anthropicApiKey) {
      settings.anthropicApiKey = '••••••••';
    }
    
    if (settings.googleApiKey) {
      settings.googleApiKey = '••••••••';
    }
    
    return new Response(JSON.stringify(settings), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Get settings error:', error);
    
    return new Response(JSON.stringify({ error: 'Server error while fetching settings' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Update user settings
 * @param {string} username - The user's username
 * @param {Request} request - The original request
 * @param {Object} env - Environment variables and bindings
 * @param {Object} corsHeaders - CORS headers to include
 * @returns {Response} - The API response
 */
async function updateUserSettings(username, request, env, corsHeaders) {
  try {
    // Get user from KV storage
    const userJson = await env.USERS.get(username);
    if (!userJson) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const user = JSON.parse(userJson);
    
    // Parse new settings from request
    const newSettings = await request.json();
    
    // Get current settings for comparison
    const currentSettings = user.settings;
    
    // Encrypt API keys if they've changed
    // For OpenAI API key
    if (newSettings.openaiApiKey && newSettings.openaiApiKey !== '••••••••') {
      newSettings.openaiApiKey = await encryptData(newSettings.openaiApiKey, env.ENCRYPTION_KEY);
    } else if (newSettings.openaiApiKey === '••••••••' && currentSettings.openaiApiKey) {
      // Keep the existing encrypted key
      newSettings.openaiApiKey = currentSettings.openaiApiKey;
    }
    
    // For Anthropic API key
    if (newSettings.anthropicApiKey && newSettings.anthropicApiKey !== '••••••••') {
      newSettings.anthropicApiKey = await encryptData(newSettings.anthropicApiKey, env.ENCRYPTION_KEY);
    } else if (newSettings.anthropicApiKey === '••••••••' && currentSettings.anthropicApiKey) {
      // Keep the existing encrypted key
      newSettings.anthropicApiKey = currentSettings.anthropicApiKey;
    }
    
    // For Google API key
    if (newSettings.googleApiKey && newSettings.googleApiKey !== '••••••••') {
      newSettings.googleApiKey = await encryptData(newSettings.googleApiKey, env.ENCRYPTION_KEY);
    } else if (newSettings.googleApiKey === '••••••••' && currentSettings.googleApiKey) {
      // Keep the existing encrypted key
      newSettings.googleApiKey = currentSettings.googleApiKey;
    }
    
    // Update user settings
    user.settings = { ...currentSettings, ...newSettings };
    
    // Save user back to KV storage
    await env.USERS.put(username, JSON.stringify(user));
    
    // Return settings to client (with masked API keys)
    const responseSettings = { ...user.settings };
    if (responseSettings.openaiApiKey) {
      responseSettings.openaiApiKey = '••••••••';
    }
    
    if (responseSettings.anthropicApiKey) {
      responseSettings.anthropicApiKey = '••••••••';
    }
    
    if (responseSettings.googleApiKey) {
      responseSettings.googleApiKey = '••••••••';
    }
    
    return new Response(JSON.stringify(responseSettings), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Update settings error:', error);
    
    return new Response(JSON.stringify({ error: 'Server error while updating settings' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Get user chat history
 * @param {string} username - The user's username
 * @param {Object} env - Environment variables and bindings
 * @param {Object} corsHeaders - CORS headers to include
 * @returns {Response} - The API response
 */
async function getUserChats(username, env, corsHeaders) {
  try {
    // Get chats from KV storage
    const chatsJson = await env.USER_CHATS.get(`chats:${username}`);
    
    if (!chatsJson) {
      // No chats found - return empty array
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(chatsJson, {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Get chats error:', error);
    
    return new Response(JSON.stringify({ error: 'Server error while fetching chats' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Save user chats
 * @param {string} username - The user's username
 * @param {Request} request - The original request
 * @param {Object} env - Environment variables and bindings
 * @param {Object} corsHeaders - CORS headers to include
 * @returns {Response} - The API response
 */
async function saveUserChats(username, request, env, corsHeaders) {
  try {
    // Parse chats from request
    const chats = await request.json();
    
    // Validate input
    if (!Array.isArray(chats)) {
      return new Response(JSON.stringify({ error: 'Invalid chat data format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Save chats to KV storage
    await env.USER_CHATS.put(`chats:${username}`, JSON.stringify(chats));
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Save chats error:', error);
    
    return new Response(JSON.stringify({ error: 'Server error while saving chats' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Handle AI message proxy (keeps API keys on server-side)
 * @param {string} username - The user's username
 * @param {Request} request - The original request
 * @param {Object} env - Environment variables and bindings
 * @param {Object} corsHeaders - CORS headers to include
 * @returns {Response} - The API response
 */
async function handleAiMessageProxy(username, request, env, corsHeaders) {
  try {
    // Parse request data
    const { message, modelId, history } = await request.json();
    
    // Validate input
    if (!message || !modelId) {
      return new Response(JSON.stringify({ error: 'Message and model ID are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Get user from KV storage to retrieve API keys
    const userJson = await env.USERS.get(username);
    if (!userJson) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const user = JSON.parse(userJson);
    
    // Get and decrypt the appropriate API key
    let apiKey = null;
    
    // For OpenAI models
    if (modelId === 'chatgpt-4o') {
      if (!user.settings.openaiApiKey) {
        return new Response(JSON.stringify({ 
          error: 'No OpenAI API key found for this user',
          message: `I need a valid API key to connect to the OpenAI service. Please add your API key in Settings → API Tokens.`
        }), {
          status: 200, // Return 200 to display the message to the user
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      apiKey = await decryptData(user.settings.openaiApiKey, env.ENCRYPTION_KEY);
      return await callOpenAiApi(message, history, apiKey, corsHeaders);
    }
    
    // For Anthropic models
    else if (modelId === 'claude-3.7-sonnet') {
      if (!user.settings.anthropicApiKey) {
        return new Response(JSON.stringify({ 
          error: 'No Anthropic API key found for this user',
          message: `I need a valid API key to connect to the Claude service. Please add your API key in Settings → API Tokens.`
        }), {
          status: 200, // Return 200 to display the message to the user
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      apiKey = await decryptData(user.settings.anthropicApiKey, env.ENCRYPTION_KEY);
      return await callAnthropicApi(message, history, apiKey, corsHeaders);
    }
    
    // For Google models
    else if (modelId === 'gemini-2-flash') {
      if (!user.settings.googleApiKey) {
        return new Response(JSON.stringify({ 
          error: 'No Google API key found for this user',
          message: `I need a valid API key to connect to the Gemini service. Please add your API key in Settings → API Tokens.`
        }), {
          status: 200, // Return 200 to display the message to the user
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      apiKey = await decryptData(user.settings.googleApiKey, env.ENCRYPTION_KEY);
      return await callGeminiApi(message, history, apiKey, corsHeaders);
    }
    
    // Unsupported model
    else {
      return new Response(JSON.stringify({ 
        error: 'Unsupported model ID',
        message: `The model ${modelId} is not supported.`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('AI proxy error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Server error while processing AI request',
      message: `There was an error processing your request: ${error.message}`
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Call OpenAI API
 * @param {string} message - The user message
 * @param {Array} history - Message history
 * @param {string} apiKey - OpenAI API key
 * @param {Object} corsHeaders - CORS headers
 * @returns {Response} - API response
 */
async function callOpenAiApi(message, history, apiKey, corsHeaders) {
  try {
    const requestData = {
      model: 'gpt-4o',
      messages: [
        ...history.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: message }
      ]
    };
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return new Response(JSON.stringify({ 
        error: `Error from OpenAI API: ${response.status}`,
        message: `Error from the OpenAI API: ${response.status} ${response.statusText}\n\nDetails: ${JSON.stringify(errorData)}\n\nPlease check your API key and try again.`
      }), {
        status: 200, // Return 200 so the error message is displayed to the user
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const data = await response.json();
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Unexpected response format from OpenAI API');
    }
    
    return new Response(JSON.stringify({ 
      message: data.choices[0].message.content
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('OpenAI API call error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Error calling OpenAI API',
      message: `Error calling the OpenAI API: ${error.message}\n\nPlease try again later.`
    }), {
      status: 200, // Return 200 so the error message is displayed to the user
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Call Anthropic API
 * @param {string} message - The user message
 * @param {Array} history - Message history
 * @param {string} apiKey - Anthropic API key
 * @param {Object} corsHeaders - CORS headers
 * @returns {Response} - API response
 */
async function callAnthropicApi(message, history, apiKey, corsHeaders) {
  try {
    const requestData = {
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4000,
      messages: [
        ...history.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: message }
      ]
    };
    
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    };
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return new Response(JSON.stringify({ 
        error: `Error from Anthropic API: ${response.status}`,
        message: `Error from the Claude API: ${response.status} ${response.statusText}\n\nDetails: ${JSON.stringify(errorData)}\n\nPlease check your API key and try again.`
      }), {
        status: 200, // Return 200 so the error message is displayed to the user
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const data = await response.json();
    if (!data.content || !data.content[0] || !data.content[0].text) {
      throw new Error('Unexpected response format from Claude API');
    }
    
    return new Response(JSON.stringify({ 
      message: data.content[0].text
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Anthropic API call error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Error calling Anthropic API',
      message: `Error calling the Claude API: ${error.message}\n\nPlease try again later.`
    }), {
      status: 200, // Return 200 so the error message is displayed to the user
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Call Gemini API
 * @param {string} message - The user message
 * @param {Array} history - Message history
 * @param {string} apiKey - Google API key
 * @param {Object} corsHeaders - CORS headers
 * @returns {Response} - API response
 */
async function callGeminiApi(message, history, apiKey, corsHeaders) {
  try {
    // Format messages for Gemini API
    const formattedHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));
    
    const requestData = {
      contents: [
        ...formattedHistory,
        {
          role: 'user',
          parts: [{ text: message }]
        }
      ]
    };
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return new Response(JSON.stringify({ 
        error: `Error from Google API: ${response.status}`,
        message: `Error from the Gemini API: ${response.status} ${response.statusText}\n\nDetails: ${JSON.stringify(errorData)}\n\nPlease check your API key and try again.`
      }), {
        status: 200, // Return 200 so the error message is displayed to the user
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const data = await response.json();
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
      throw new Error('Unexpected response format from Gemini API');
    }
    
    return new Response(JSON.stringify({ 
      message: data.candidates[0].content.parts[0].text
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Gemini API call error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Error calling Gemini API',
      message: `Error calling the Gemini API: ${error.message}\n\nPlease try again later.`
    }), {
      status: 200, // Return 200 so the error message is displayed to the user
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
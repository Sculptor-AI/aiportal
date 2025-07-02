import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Helper: write SSE headers once per connection
function setSSEHeaders(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
}

// POST /api/v1/chat/completions (streaming)
export const chatCompletions = async (req, res) => {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OPENROUTER_API_KEY is not configured on the server' });
    }

    const upstreamUrl = 'https://openrouter.ai/api/v1/chat/completions';

    // Ensure stream true
    const payload = { ...req.body, stream: true };

    // Forward request to OpenRouter with streaming enabled
    const upstreamResponse = await axios.post(upstreamUrl, payload, {
      responseType: 'stream',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    // Set SSE headers to client
    setSSEHeaders(res);

    // Pipe data chunks directly
    upstreamResponse.data.on('data', chunk => {
      res.write(chunk);
    });

    upstreamResponse.data.on('end', () => {
      res.end();
    });

    upstreamResponse.data.on('error', err => {
      console.error('Upstream stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Upstream streaming error' });
      } else {
        res.end();
      }
    });
  } catch (error) {
    console.error('chatCompletions controller error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}; 
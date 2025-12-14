/**
 * Image Generation Routes (Imagen 4)
 */

import { Hono } from 'hono';

const image = new Hono();

/**
 * Generate image with Imagen
 */
image.post('/generate', async (c) => {
  const env = c.env;
  const apiKey = env.GEMINI_API_KEY;

  if (!apiKey) {
    const placeholder = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/6XBrZkAAAAASUVORK5CYII=';
    return c.json({
      imageData: placeholder,
      note: 'GEMINI_API_KEY is not configured. Returning placeholder image.'
    });
  }

  try {
    const { prompt, model, aspectRatio, imageSize } = await c.req.json();

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return c.json({ error: 'Prompt is required and must be a non-empty string' }, 400);
    }

    console.log(`Image generation request for: "${prompt}"`);

    // Model priority: user-specified > Imagen 4 Fast > Imagen 3
    const IMAGEN_MODELS = [
      model || 'imagen-4.0-fast-generate-001',
      'imagen-4.0-generate-001',
      'imagen-3.0-generate-001'
    ];

    const requestBody = {
      instances: [{
        prompt: prompt
      }],
      parameters: {
        sampleCount: 1,
        aspectRatio: aspectRatio || '1:1',
        // For fast model, disable enhanced prompts for complex prompts
        ...(model === 'imagen-4.0-fast-generate-001' && { enhancePrompt: false })
      }
    };

    // Add imageSize if specified (1K or 2K)
    if (imageSize) {
      requestBody.parameters.imageSize = imageSize;
    }

    let response = null;
    let lastError = null;

    // Try each model in order until one succeeds
    for (const modelName of IMAGEN_MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:predict?key=${apiKey}`;

      console.log(`Trying Imagen model: ${modelName}`);

      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        console.log(`Success with model: ${modelName}`);
        break;
      } else {
        lastError = await response.text();
        console.log(`Model ${modelName} failed: ${lastError}`);
        response = null;
      }
    }

    if (!response || !response.ok) {
      console.error('All Imagen models failed. Last error:', lastError);
      return c.json({
        error: 'Image generation failed with all available models',
        details: lastError
      }, 500);
    }

    const result = await response.json();

    // Handle Imagen 3/4 response format
    if (result.predictions && result.predictions[0]) {
      const prediction = result.predictions[0];

      if (prediction.bytesBase64Encoded) {
        const mimeType = prediction.mimeType || 'image/png';
        return c.json({
          imageData: `data:${mimeType};base64,${prediction.bytesBase64Encoded}`
        });
      }
    }

    return c.json({
      error: 'Unexpected API response structure',
      details: result
    }, 500);

  } catch (error) {
    console.error('Image generation error:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

export default image;


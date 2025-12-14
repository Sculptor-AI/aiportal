/**
 * Video Generation Routes (Veo 2)
 */

import { Hono } from 'hono';

const video = new Hono();

/**
 * Poll for Veo operation completion
 */
async function pollVeoOperation(operationName, apiKey, maxAttempts = 60) {
  const pollUrl = `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${apiKey}`;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    console.log(`Polling Veo operation (attempt ${attempt + 1}/${maxAttempts}): ${operationName}`);

    const response = await fetch(pollUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to poll operation: ${response.status} - ${errorText}`);
    }

    const operation = await response.json();

    if (operation.done) {
      console.log('Veo operation completed');
      return operation;
    }

    // Wait 5 seconds before polling again
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  throw new Error('Video generation timed out after maximum polling attempts');
}

/**
 * Generate video with Veo 2
 */
video.post('/generate', async (c) => {
  const env = c.env;
  const apiKey = env.GEMINI_API_KEY;

  if (!apiKey) {
    return c.json({ error: 'GEMINI_API_KEY is not configured.' }, 500);
  }

  try {
    const { prompt, aspectRatio, duration } = await c.req.json();

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return c.json({ error: 'Prompt is required and must be a non-empty string' }, 400);
    }

    console.log(`Video generation request for: "${prompt}"`);

    const MODEL_NAME = 'veo-2.0-generate-001';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:predictLongRunning?key=${apiKey}`;

    const requestBody = {
      instances: [{
        prompt: prompt
      }],
      parameters: {
        aspectRatio: aspectRatio || '16:9',
        ...(duration && { durationSeconds: Math.min(Math.max(duration, 5), 8) })
      }
    };

    console.log('Starting Veo 2 video generation...');

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Veo API error:', errorText);
      return c.json({ error: `Veo API error: ${response.status}`, details: errorText }, 500);
    }

    const operationResult = await response.json();

    if (!operationResult.name) {
      console.error('No operation name in Veo response:', operationResult);
      return c.json({
        error: 'Unexpected API response - no operation name',
        details: operationResult
      }, 500);
    }

    console.log(`Veo operation started: ${operationResult.name}`);

    // Poll for completion
    const completedOperation = await pollVeoOperation(operationResult.name, apiKey);

    if (completedOperation.error) {
      console.error('Veo operation error:', completedOperation.error);
      return c.json({
        error: 'Video generation failed',
        details: completedOperation.error
      }, 500);
    }

    // Extract video from the response
    const generatedVideos = completedOperation.response?.generatedVideos ||
                           completedOperation.result?.generatedVideos ||
                           completedOperation.response?.predictions;

    if (generatedVideos && generatedVideos.length > 0) {
      const videoResult = generatedVideos[0];

      // Check for video URI (GCS or HTTP URL)
      if (videoResult.video?.uri || videoResult.videoUri) {
        return c.json({
          videoUrl: videoResult.video?.uri || videoResult.videoUri
        });
      }

      // Check for base64 encoded video data
      if (videoResult.bytesBase64Encoded || videoResult.video?.bytesBase64Encoded) {
        const videoData = videoResult.bytesBase64Encoded || videoResult.video?.bytesBase64Encoded;
        const mimeType = videoResult.mimeType || videoResult.video?.mimeType || 'video/mp4';
        return c.json({
          videoData: `data:${mimeType};base64,${videoData}`
        });
      }
    }

    return c.json({
      error: 'No video data found in response',
      details: completedOperation
    }, 500);

  } catch (error) {
    console.error('Video generation error:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

export default video;


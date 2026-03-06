/**
 * Video Generation Routes
 *
 * Supports OpenAI Sora video generation.
 */

import { Hono } from 'hono';
import { generateVideoWithSora, getSoraVideoStatus } from '../services/openai.js';
import { requireAuthAndApproved } from '../middleware/auth.js';
import { videoGenerationRateLimit } from '../middleware/rateLimit.js';
import { validateOutboundUrl } from '../utils/urlValidation.js';

const video = new Hono();
const VIDEO_DOWNLOAD_HOST_ALLOWLIST = [
  'storage.googleapis.com',
  '*.storage.googleapis.com',
  '*.googleusercontent.com',
  '*.googleapis.com',
  '*.gvt1.com',
  '*.ggpht.com'
];

const isRedirectStatus = (status) => status >= 300 && status < 400;

// Apply auth middleware to all video routes
video.use('/*', requireAuthAndApproved);

/**
 * Generate video
 * 
 * POST /api/video/generate
 * Body:
 * - prompt: string (required)
 * - aspectRatio: '16:9' | '9:16' (optional, default '16:9')
 */
video.post('/generate', videoGenerationRateLimit, async (c) => {
  const env = c.env;
  const apiKey = env.OPENAI_API_KEY;

  if (!apiKey) {
    return c.json({ error: 'OPENAI_API_KEY is not configured for Sora video generation.' }, 500);
  }

  try {
    const body = await c.req.json();
    const { prompt, aspectRatio } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return c.json({ error: 'Prompt is required and must be a non-empty string' }, 400);
    }

    if (aspectRatio && !['16:9', '9:16'].includes(aspectRatio)) {
      return c.json({ error: 'Unsupported aspect ratio. Sora currently supports 16:9 and 9:16.' }, 400);
    }

    console.log('Sora video generation request received');

    const result = await generateVideoWithSora(prompt, apiKey, { aspectRatio });

    if (!result.success) {
      console.error('Video generation provider failure:', result.error);
      return c.json({ error: result.error || 'Video generation failed' }, 500);
    }

    return c.json({
      success: true,
      videoId: result.videoId,
      status: result.status,
      model: result.model
    });

  } catch (error) {
    console.error('Video generation error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * Check operation status
 * 
 * GET /api/video/status?id=video_xxx
 */
video.get('/status', async (c) => {
  const env = c.env;
  const apiKey = env.OPENAI_API_KEY;
  const videoId = c.req.query('id');

  if (!apiKey) {
    return c.json({ error: 'OPENAI_API_KEY is not configured.' }, 500);
  }

  if (!videoId) {
    return c.json({ error: 'Video ID is required (pass as ?id=...)' }, 400);
  }

  try {
    const result = await getSoraVideoStatus(videoId, apiKey);

    if (!result.success) {
      console.error('Video status provider failure:', result.error);
      return c.json({ error: result.error || 'Unable to retrieve video status' }, 500);
    }

    return c.json(result);

  } catch (error) {
    console.error('Video status error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * Proxy video download
 * 
 * GET /api/video/download?id=video_xxx
 * GET /api/video/download?url=https://...
 * Proxies authenticated Sora downloads and preserves legacy Google URL downloads.
 */
video.get('/download', async (c) => {
  const env = c.env;
  const apiKey = env.OPENAI_API_KEY;
  const videoId = c.req.query('id');
  const videoUrl = c.req.query('url');

  if (videoId) {
    if (!apiKey) {
      return c.json({ error: 'OPENAI_API_KEY is not configured.' }, 500);
    }

    try {
      const response = await fetch(`https://api.openai.com/v1/videos/${encodeURIComponent(videoId)}/content`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      });

      if (!response.ok) {
        return c.json({ error: 'Failed to fetch video' }, response.status);
      }

      return c.newResponse(response.body, 200, {
        'Content-Type': response.headers.get('content-type') || 'video/mp4',
        'Content-Disposition': `attachment; filename="${videoId}.mp4"`
      });
    } catch (error) {
      console.error('Sora download proxy error:', error);
      return c.json({ error: 'Unable to download video' }, 500);
    }
  }

  if (!videoUrl) {
    return c.json({ error: 'Video ID or URL is required' }, 400);
  }

  const validation = validateOutboundUrl(videoUrl, VIDEO_DOWNLOAD_HOST_ALLOWLIST);
  if (!validation.valid) {
    return c.json({ error: 'Invalid download URL' }, 400);
  }

  try {
    let response = await fetch(validation.url.toString(), { redirect: 'manual' });

    if (isRedirectStatus(response.status)) {
      const location = response.headers.get('location');
      if (!location) {
        return c.json({ error: 'Invalid download redirect' }, 400);
      }

      const redirectedUrl = new URL(location, validation.url).toString();
      const redirectValidation = validateOutboundUrl(redirectedUrl, VIDEO_DOWNLOAD_HOST_ALLOWLIST);
      if (!redirectValidation.valid) {
        return c.json({ error: 'Invalid download redirect target' }, 400);
      }

      response = await fetch(redirectValidation.url.toString(), { redirect: 'manual' });
      if (isRedirectStatus(response.status)) {
        return c.json({ error: 'Too many redirects' }, 400);
      }
    }
    
    if (!response.ok) {
      return c.json({ error: 'Failed to fetch video' }, response.status);
    }

    const contentType = response.headers.get('content-type');
    const isAllowedContentType =
      !contentType ||
      contentType.startsWith('video/') ||
      contentType.startsWith('application/octet-stream');

    if (!isAllowedContentType) {
      return c.json({ error: 'Unexpected content type' }, 400);
    }

    const body = response.body;

    return c.newResponse(body, 200, {
      'Content-Type': contentType || 'video/mp4',
      'Content-Disposition': 'attachment; filename="generated-video.mp4"'
    });

  } catch (error) {
    console.error('Download proxy error:', error);
    return c.json({ error: 'Unable to download video' }, 500);
  }
});

export default video;

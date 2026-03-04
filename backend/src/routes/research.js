/**
 * Deep research routes (SSE).
 */

import { Hono } from 'hono';
import { requireAuthAndApproved } from '../middleware/auth.js';
import { deepResearchRateLimit } from '../middleware/rateLimit.js';
import { performDeepResearch } from '../services/deepResearch.js';

const research = new Hono();
const encoder = new TextEncoder();

const emitEvent = (controller, payload) => {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
};

const emitDone = (controller) => {
  controller.enqueue(encoder.encode('data: [DONE]\n\n'));
};

const toSafeErrorMessage = (error) => {
  const message = String(error?.message || 'Deep research failed');
  // Avoid leaking upstream raw payloads.
  if (message.length > 500) return `${message.slice(0, 500)}...`;
  return message;
};

const handleDeepResearchRequest = async (c) => {
  let body = {};
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const query = typeof body.query === 'string' ? body.query : '';
  const maxAgents = body.maxAgents;
  const model = typeof body.model === 'string' ? body.model : null;

  if (!query || query.trim() === '') {
    return c.json({ error: 'query is required' }, 400);
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        emitEvent(controller, {
          type: 'progress',
          progress: 1,
          stage: 'init',
          message: 'Initializing deep research pipeline'
        });

        const result = await performDeepResearch({
          env: c.env,
          query,
          maxAgents,
          modelOverride: model,
          onProgress: (update) => {
            emitEvent(controller, {
              type: 'progress',
              progress: update.progress ?? 0,
              stage: update.stage,
              message: update.message,
              ...(update.subQuestions && { subQuestions: update.subQuestions }),
              ...(update.agentIndex !== undefined && { agentIndex: update.agentIndex }),
              ...(update.result && { agentResult: update.result }),
              ...(update.qualityIssues && { qualityIssues: update.qualityIssues })
            });
          }
        });

        emitEvent(controller, {
          type: 'completion',
          ...result
        });
      } catch (error) {
        console.error('Deep research route error:', error);
        emitEvent(controller, {
          type: 'error',
          message: toSafeErrorMessage(error)
        });
      } finally {
        emitDone(controller);
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
};

research.use('/*', requireAuthAndApproved);
research.post('/deep-research', deepResearchRateLimit, handleDeepResearchRequest);
research.post('/v1/research/deep', deepResearchRateLimit, handleDeepResearchRequest);

export default research;

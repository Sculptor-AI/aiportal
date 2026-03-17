/**
 * Deep research routes (SSE).
 */

import { Hono } from 'hono';
import { requireAuthAndApproved } from '../middleware/auth.js';
import { deepResearchRateLimit } from '../middleware/rateLimit.js';
import { performDeepResearch } from '../services/deepResearch.js';

const research = new Hono();
const encoder = new TextEncoder();
const HEARTBEAT_INTERVAL_MS = 15000;

const emitEvent = (controller, payload) => {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
};

const emitDone = (controller) => {
  controller.enqueue(encoder.encode('data: [DONE]\n\n'));
};

const toSafeErrorMessage = (error) => {
  const message = String(error?.message || 'Deep research failed');
  if (/operation was aborted|timed out/i.test(message)) {
    return 'Deep research timed out while waiting for an upstream model. Please retry.';
  }
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

  let streamCancelled = false;
  const stream = new ReadableStream({
    async start(controller) {
      let streamClosed = false;
      const safeEmitEvent = (payload) => {
        if (streamCancelled || streamClosed) return false;
        try {
          emitEvent(controller, payload);
          return true;
        } catch (error) {
          streamClosed = true;
          streamCancelled = true;
          console.warn('Deep research stream closed while emitting event:', error?.message || error);
          return false;
        }
      };

      const safeEmitDone = () => {
        if (streamCancelled || streamClosed) return;
        try {
          emitDone(controller);
        } catch (error) {
          streamClosed = true;
          streamCancelled = true;
          console.warn('Deep research stream closed while emitting done event:', error?.message || error);
        }
      };

      const safeClose = () => {
        if (streamClosed) return;
        streamClosed = true;
        try {
          controller.close();
        } catch (error) {
          console.warn('Deep research stream already closed:', error?.message || error);
        }
      };

      const heartbeat = setInterval(() => {
        safeEmitEvent({
          type: 'heartbeat',
          stage: 'heartbeat',
          message: 'Deep research is still running',
          ts: new Date().toISOString()
        });
      }, HEARTBEAT_INTERVAL_MS);

      try {
        safeEmitEvent({
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
            const emitted = safeEmitEvent({
              type: 'progress',
              progress: update.progress ?? 0,
              stage: update.stage,
              message: update.message,
              ...(update.subQuestions && { subQuestions: update.subQuestions }),
              ...(update.agentIndex !== undefined && { agentIndex: update.agentIndex }),
              ...(update.result && { agentResult: update.result }),
              ...(update.qualityIssues && { qualityIssues: update.qualityIssues })
            });
            if (!emitted) {
              throw new Error('Client disconnected during deep research stream.');
            }
          }
        });

        safeEmitEvent({
          type: 'completion',
          ...result
        });
      } catch (error) {
        if (streamCancelled) {
          console.log('Deep research stream cancelled by client.');
          return;
        }
        console.error('Deep research route error:', error);
        safeEmitEvent({
          type: 'error',
          message: toSafeErrorMessage(error)
        });
      } finally {
        clearInterval(heartbeat);
        safeEmitDone();
        safeClose();
      }
    },
    cancel() {
      streamCancelled = true;
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
};

research.use('/*', requireAuthAndApproved);
research.post('/deep-research', deepResearchRateLimit, handleDeepResearchRequest);
research.post('/v1/research/deep', deepResearchRateLimit, handleDeepResearchRequest);

export default research;

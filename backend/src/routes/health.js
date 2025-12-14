/**
 * Health Check & Models Routes
 */

import { Hono } from 'hono';
import { nowIso } from '../state.js';

const health = new Hono();

/**
 * Health check endpoint
 */
health.get('/health', (c) => c.json({ ok: true, time: nowIso() }));

/**
 * List available AI models
 */
health.get('/models', (c) => {
  const models = [
    // === OpenAI Models (via OpenRouter) ===
    {
      id: 'openai/gpt-5.1',
      name: 'GPT-5.1',
      provider: 'openai',
      description: 'OpenAI\'s most advanced model',
      source: 'openrouter',
      capabilities: ['chat', 'vision'],
      context_length: 128000
    },
    {
      id: 'openai/gpt-5',
      name: 'GPT-5',
      provider: 'openai',
      description: 'OpenAI\'s flagship model',
      source: 'openrouter',
      capabilities: ['chat', 'vision'],
      context_length: 128000
    },
    {
      id: 'openai/gpt-5-mini',
      name: 'GPT-5 Mini',
      provider: 'openai',
      description: 'Fast and efficient GPT-5 variant',
      source: 'openrouter',
      capabilities: ['chat', 'vision'],
      context_length: 128000
    },
    {
      id: 'openai/o4-mini',
      name: 'o4 Mini',
      provider: 'openai',
      description: 'OpenAI reasoning model - fast',
      source: 'openrouter',
      capabilities: ['chat', 'reasoning'],
      context_length: 128000
    },
    {
      id: 'openai/o3',
      name: 'o3',
      provider: 'openai',
      description: 'OpenAI advanced reasoning model',
      source: 'openrouter',
      capabilities: ['chat', 'reasoning'],
      context_length: 200000
    },
    {
      id: 'openai/o3-mini',
      name: 'o3 Mini',
      provider: 'openai',
      description: 'Fast reasoning model',
      source: 'openrouter',
      capabilities: ['chat', 'reasoning'],
      context_length: 200000
    },
    // === Anthropic Models (via OpenRouter) ===
    {
      id: 'anthropic/claude-opus-4.5',
      name: 'Claude Opus 4.5',
      provider: 'anthropic',
      description: 'Anthropic\'s most intelligent model',
      source: 'openrouter',
      capabilities: ['chat', 'vision', 'reasoning'],
      context_length: 200000
    },
    {
      id: 'anthropic/claude-sonnet-4.5',
      name: 'Claude Sonnet 4.5',
      provider: 'anthropic',
      description: 'Best balance of intelligence and speed',
      source: 'openrouter',
      capabilities: ['chat', 'vision'],
      context_length: 200000
    },
    {
      id: 'anthropic/claude-sonnet-4',
      name: 'Claude Sonnet 4',
      provider: 'anthropic',
      description: 'Fast and capable Claude model',
      source: 'openrouter',
      capabilities: ['chat', 'vision'],
      context_length: 200000
    },
    {
      id: 'anthropic/claude-3.7-sonnet',
      name: 'Claude 3.7 Sonnet',
      provider: 'anthropic',
      description: 'Previous gen high-performance model',
      source: 'openrouter',
      capabilities: ['chat', 'vision'],
      context_length: 200000
    },
    // === Google Gemini Models (Direct API) ===
    {
      id: 'gemini-3-pro-preview',
      name: 'Gemini 3 Pro',
      provider: 'google',
      description: 'Google\'s most intelligent model',
      source: 'gemini',
      capabilities: ['chat', 'vision', 'search', 'reasoning'],
      context_length: 1000000
    },
    {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      provider: 'google',
      description: 'Best price-performance ratio',
      source: 'gemini',
      capabilities: ['chat', 'vision', 'search'],
      context_length: 1000000
    },
    {
      id: 'gemini-2.5-pro',
      name: 'Gemini 2.5 Pro',
      provider: 'google',
      description: 'Advanced reasoning and coding',
      source: 'gemini',
      capabilities: ['chat', 'vision', 'search', 'reasoning'],
      context_length: 1000000
    },
    {
      id: 'gemini-2.5-flash-lite',
      name: 'Gemini 2.5 Flash Lite',
      provider: 'google',
      description: 'Ultra-fast lightweight model',
      source: 'gemini',
      capabilities: ['chat', 'vision'],
      context_length: 1000000
    },
    {
      id: 'gemini-2.0-flash',
      name: 'Gemini 2.0 Flash',
      provider: 'google',
      description: 'Fast multimodal model',
      source: 'gemini',
      capabilities: ['chat', 'vision', 'search'],
      context_length: 1000000
    }
  ];
  return c.json({ models });
});

export default health;


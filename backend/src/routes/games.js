/**
 * Game routes
 * Stores per-account game stats and exposes leaderboards.
 */

import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';

const games = new Hono();
const DEFAULT_LEADERBOARD_LIMIT = 10;
const MAX_LEADERBOARD_LIMIT = 25;

const nowIso = () => new Date().toISOString();

const normalizeNonNegativeInteger = (value, fallback = 0) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return Math.floor(parsed);
};

const getTetrisStats = (user) => {
  const stats = user?.gameStats?.tetris || {};

  return {
    highScore: normalizeNonNegativeInteger(stats.highScore, 0),
    bestLines: normalizeNonNegativeInteger(stats.bestLines, 0),
    bestLevel: normalizeNonNegativeInteger(stats.bestLevel, 1),
    lastScore: normalizeNonNegativeInteger(stats.lastScore, 0),
    lastLines: normalizeNonNegativeInteger(stats.lastLines, 0),
    lastLevel: normalizeNonNegativeInteger(stats.lastLevel, 1),
    updatedAt: typeof stats.updatedAt === 'string' ? stats.updatedAt : null,
    lastPlayedAt: typeof stats.lastPlayedAt === 'string' ? stats.lastPlayedAt : null
  };
};

const isLeaderboardEligible = (user) => {
  if (!user?.id || !user?.username) {
    return false;
  }

  return user.status !== 'pending' && user.status !== 'suspended' && user.status !== 'banned';
};

const createLeaderboardEntry = (user) => {
  if (!isLeaderboardEligible(user)) {
    return null;
  }

  const stats = getTetrisStats(user);
  if (stats.highScore <= 0) {
    return null;
  }

  return {
    userId: user.id,
    username: user.username,
    score: stats.highScore,
    bestLines: stats.bestLines,
    bestLevel: stats.bestLevel,
    updatedAt: stats.updatedAt || stats.lastPlayedAt || null
  };
};

const sortLeaderboard = (entries) => {
  return entries.sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    const leftUpdatedAt = left.updatedAt || '';
    const rightUpdatedAt = right.updatedAt || '';

    if (leftUpdatedAt !== rightUpdatedAt) {
      return leftUpdatedAt.localeCompare(rightUpdatedAt);
    }

    return left.username.localeCompare(right.username, undefined, { sensitivity: 'base' });
  });
};

const listLeaderboardEntries = async (kv) => {
  const entries = [];
  let cursor = undefined;
  let listComplete = false;

  while (!listComplete) {
    const page = await kv.list({ prefix: 'user:', cursor });

    for (const key of page.keys) {
      const user = await kv.get(key.name, 'json');
      const entry = createLeaderboardEntry(user);

      if (entry) {
        entries.push(entry);
      }
    }

    cursor = page.cursor;
    listComplete = page.list_complete;
  }

  return sortLeaderboard(entries);
};

games.get('/tetris/leaderboard', async (c) => {
  const kv = c.env.KV;
  if (!kv) {
    return c.json({ error: 'Storage not configured' }, 500);
  }

  const requestedLimit = normalizeNonNegativeInteger(c.req.query('limit'), DEFAULT_LEADERBOARD_LIMIT);
  const limit = Math.min(Math.max(requestedLimit || DEFAULT_LEADERBOARD_LIMIT, 1), MAX_LEADERBOARD_LIMIT);
  const leaderboard = await listLeaderboardEntries(kv);

  return c.json({
    success: true,
    data: {
      leaderboard: leaderboard.slice(0, limit)
    }
  });
});

games.get('/tetris/me', requireAuth, async (c) => {
  const user = c.get('user');
  const stats = getTetrisStats(user);

  return c.json({
    success: true,
    data: {
      username: user.username,
      highScore: stats.highScore,
      bestLines: stats.bestLines,
      bestLevel: stats.bestLevel,
      lastScore: stats.lastScore,
      lastLines: stats.lastLines,
      lastLevel: stats.lastLevel,
      updatedAt: stats.updatedAt,
      lastPlayedAt: stats.lastPlayedAt
    }
  });
});

games.post('/tetris/score', requireAuth, async (c) => {
  const kv = c.env.KV;
  const user = c.get('user');

  if (!kv) {
    return c.json({ error: 'Storage not configured' }, 500);
  }

  const body = await c.req.json().catch(() => ({}));
  const submittedScore = normalizeNonNegativeInteger(body.score, -1);
  const submittedLines = normalizeNonNegativeInteger(body.lines, 0);
  const submittedLevel = normalizeNonNegativeInteger(body.level, 1);

  if (submittedScore < 0) {
    return c.json({ error: 'Score must be a non-negative integer' }, 400);
  }

  const storedUser = await kv.get(`user:${user.id}`, 'json');
  if (!storedUser) {
    return c.json({ error: 'User not found' }, 404);
  }

  const existingStats = getTetrisStats(storedUser);
  const timestamp = nowIso();
  const isNewHighScore = submittedScore > existingStats.highScore;

  storedUser.gameStats = {
    ...(storedUser.gameStats || {}),
    tetris: {
      highScore: isNewHighScore ? submittedScore : existingStats.highScore,
      bestLines: isNewHighScore ? submittedLines : existingStats.bestLines,
      bestLevel: isNewHighScore ? submittedLevel : existingStats.bestLevel,
      lastScore: submittedScore,
      lastLines: submittedLines,
      lastLevel: submittedLevel,
      updatedAt: isNewHighScore ? timestamp : existingStats.updatedAt,
      lastPlayedAt: timestamp
    }
  };

  await kv.put(`user:${storedUser.id}`, JSON.stringify(storedUser));

  return c.json({
    success: true,
    data: {
      updated: isNewHighScore,
      username: storedUser.username,
      highScore: storedUser.gameStats.tetris.highScore,
      bestLines: storedUser.gameStats.tetris.bestLines,
      bestLevel: storedUser.gameStats.tetris.bestLevel,
      lastScore: storedUser.gameStats.tetris.lastScore,
      lastLines: storedUser.gameStats.tetris.lastLines,
      lastLevel: storedUser.gameStats.tetris.lastLevel,
      updatedAt: storedUser.gameStats.tetris.updatedAt,
      lastPlayedAt: storedUser.gameStats.tetris.lastPlayedAt
    }
  });
});

export default games;

const TOKEN_OVERRIDES = {
  ai: 'AI',
  api: 'API',
  chatgpt: 'ChatGPT',
  dall: 'DALL',
  gpt: 'GPT',
  nvidia: 'NVIDIA',
  tts: 'TTS'
};

const titleCaseToken = (token) => {
  const lowerToken = token.toLowerCase();
  if (TOKEN_OVERRIDES[lowerToken]) {
    return TOKEN_OVERRIDES[lowerToken];
  }

  if (/^[a-z]+\d+$/i.test(token)) {
    return `${token.charAt(0).toUpperCase()}${token.slice(1)}`;
  }

  return lowerToken.charAt(0).toUpperCase() + lowerToken.slice(1);
};

const mergeNumericVersionTokens = (tokens) => {
  const mergedTokens = [];

  for (const token of tokens) {
    const previousToken = mergedTokens[mergedTokens.length - 1];
    if (/^\d+$/.test(token) && /^\d+(?:\.\d+)*$/.test(previousToken || '')) {
      mergedTokens[mergedTokens.length - 1] = `${previousToken}.${token}`;
    } else {
      mergedTokens.push(token);
    }
  }

  return mergedTokens;
};

/**
 * Convert a dash-delimited model slug into a human-readable display name.
 * Examples: claude-opus-4.7 -> Claude Opus 4.7, gpt-5-4-mini -> GPT 5.4 Mini.
 */
export function formatModelSlugName(slug) {
  if (!slug) return '';

  return mergeNumericVersionTokens(String(slug).split('-').filter(Boolean))
    .map(titleCaseToken)
    .join(' ');
}

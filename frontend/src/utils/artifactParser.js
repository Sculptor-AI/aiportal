const ARTIFACT_TAG_REGEX = /<sculptor[-_]artifact\b([^>]*)>([\s\S]*?)<\/sculptor[-_]artifact>/gi;

const ATTRIBUTE_REGEX = /([a-zA-Z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;

const SIDE_ARTIFACT_LANGUAGES = new Set([
  'html',
  'htm',
  'artifact',
  'sculptor-artifact',
  'sculptor-side-artifact',
  'side-artifact',
  'interactive-html'
]);

const INLINE_ARTIFACT_LANGUAGES = new Set([
  'sculptor-inline-artifact',
  'inline-artifact',
  'inline-html',
  'inline-artifact-html'
]);

const normalizeLanguage = (language) => String(language || '')
  .trim()
  .toLowerCase();

export const parseArtifactAttributes = (rawAttributes = '') => {
  const attributes = {};
  let match;

  ATTRIBUTE_REGEX.lastIndex = 0;
  while ((match = ATTRIBUTE_REGEX.exec(rawAttributes)) !== null) {
    const key = match[1]?.toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? '';
    if (key) {
      attributes[key] = value.trim();
    }
  }

  return attributes;
};

export const stripArtifactFences = (source = '') => {
  const trimmed = String(source || '').trim();
  const fenceMatch = trimmed.match(/^```([^\n]*)\n([\s\S]*?)\n?```\s*$/);
  return fenceMatch ? fenceMatch[2].trim() : trimmed;
};

export const getArtifactTitleFromHtml = (html = '') => {
  const titleMatch = String(html || '').match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch?.[1]
    ?.replace(/\s+/g, ' ')
    .trim();

  return title || '';
};

export const getArtifactPlacement = (attributes = {}, fallback = 'side') => {
  const candidates = [
    attributes.placement,
    attributes.display,
    attributes.mode,
    attributes.kind,
    attributes.type
  ].map(value => String(value || '').trim().toLowerCase());

  if (candidates.includes('inline')) return 'inline';
  if (candidates.includes('side')) return 'side';
  return fallback;
};

export const getArtifactLanguage = (attributes = {}) => {
  const type = String(attributes.type || '').trim();
  const typeIsPlacement = ['inline', 'side'].includes(type.toLowerCase());

  return normalizeLanguage(
    attributes.language ||
    attributes.lang ||
    attributes.format ||
    (!typeIsPlacement ? type : '') ||
    'html'
  );
};

export const isSideArtifactLanguage = (language) => SIDE_ARTIFACT_LANGUAGES.has(normalizeLanguage(language));

export const isInlineArtifactLanguage = (language) => INLINE_ARTIFACT_LANGUAGES.has(normalizeLanguage(language));

export const createArtifact = ({
  rawContent,
  attributes = {},
  fallbackPlacement = 'side',
  fallbackTitle = 'Artifact'
}) => {
  const code = stripArtifactFences(rawContent);
  const language = getArtifactLanguage(attributes);
  const placement = getArtifactPlacement(attributes, fallbackPlacement);
  const htmlTitle = getArtifactTitleFromHtml(code);
  const title = String(attributes.title || attributes.name || htmlTitle || fallbackTitle)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100) || fallbackTitle;

  return {
    type: 'artifact',
    placement,
    language,
    title,
    code
  };
};

export const extractArtifactSegments = (text = '') => {
  const source = String(text || '');
  const segments = [];
  let lastIndex = 0;
  let match;
  let artifactIndex = 0;

  ARTIFACT_TAG_REGEX.lastIndex = 0;
  while ((match = ARTIFACT_TAG_REGEX.exec(source)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: source.slice(lastIndex, match.index)
      });
    }

    const attributes = parseArtifactAttributes(match[1] || '');
    segments.push({
      ...createArtifact({
        rawContent: match[2] || '',
        attributes,
        fallbackPlacement: 'side',
        fallbackTitle: `Artifact ${artifactIndex + 1}`
      }),
      key: `artifact-${artifactIndex++}`
    });

    lastIndex = ARTIFACT_TAG_REGEX.lastIndex;
  }

  if (lastIndex < source.length) {
    segments.push({
      type: 'text',
      content: source.slice(lastIndex)
    });
  }

  return segments.length > 0 ? segments : [{ type: 'text', content: source }];
};

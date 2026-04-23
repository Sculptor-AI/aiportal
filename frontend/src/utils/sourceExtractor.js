import { sanitizeExternalUrl } from './urlSecurity';

const normalizeSourceText = (line) => String(line || '').trim();

const extractDomain = (url) => {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    return domain;
  } catch (e) {
    console.error('Error extracting domain:', e);
    return url;
  }
};

const parseSourceLine = (line) => {
  const normalizedLine = normalizeSourceText(line);
  if (!normalizedLine) return null;

  const markdownSourcePattern = /^\s*(S\d+)\s*\[(.*?)\]\((.*?)\)\s*$/;
  const plainSourcePattern = /^\s*(?:[-*]\s*)?(S\d+)\s+(.+?)\s+-\s+(https?:\/\/[^\s<>"')]+)\s*$/;
  const fallbackPattern = /^\s*(?:[-*]\s*)?(S\d+)[\]:\-\)]\s+(https?:\/\/[^\s<>"')]+)\s*$/;
  const plainTextSourcePattern = /^\s*(?:[-*]\s*)?(S\d+)[\s:.\-]\s*(.+?)\s+(-|\|)\s+(https?:\/\/[^\s<>"')]+)\s*$/;

  const markdownMatch = normalizedLine.match(markdownSourcePattern);
  if (markdownMatch) {
    const title = normalizeSourceText(markdownMatch[2]) || markdownMatch[1];
    const rawUrl = markdownMatch[3];
    const url = sanitizeExternalUrl(rawUrl);
    if (!url) return null;
    return { title, url, domain: extractDomain(url) };
  }

  const plainMatch = normalizedLine.match(plainSourcePattern);
  if (plainMatch) {
    const title = normalizeSourceText(plainMatch[2]) || plainMatch[1];
    const url = sanitizeExternalUrl(plainMatch[3]);
    if (!url) return null;
    return { title, url, domain: extractDomain(url) };
  }

  const fallbackMatch = normalizedLine.match(fallbackPattern);
  if (fallbackMatch) {
    const url = sanitizeExternalUrl(fallbackMatch[2]);
    if (!url) return null;
    return { title: fallbackMatch[1], url, domain: extractDomain(url) };
  }

  const plainTextMatch = normalizedLine.match(plainTextSourcePattern);
  if (plainTextMatch) {
    const title = normalizeSourceText(plainTextMatch[2]) || plainTextMatch[1];
    const url = sanitizeExternalUrl(plainTextMatch[3]);
    if (!url) return null;
    return { title, url, domain: extractDomain(url) };
  }

  return null;
};

const dedupeSources = (sources) => {
  const seen = new Set();
  const unique = [];
  for (const source of sources || []) {
    if (!source?.url) continue;
    if (seen.has(source.url)) continue;
    seen.add(source.url);
    unique.push(source);
  }
  return unique;
};

const findSourcesHeaderIndex = (lines) => {
  for (let i = 0; i < lines.length; i++) {
    const normalizedLine = normalizeSourceText(lines[i]).toLowerCase();
    if (
      normalizedLine === '**sources:**' ||
      normalizedLine === 'sources:' ||
      normalizedLine.startsWith('sources:') ||
      normalizedLine.startsWith('**sources:**')
    ) {
      return i;
    }
  }
  return -1;
};

const extractSourcesFromSection = (lines, startIndex) => {
  const sources = [];
  for (let index = startIndex + 1; index < lines.length; index++) {
    const parsed = parseSourceLine(lines[index]);
    if (parsed) {
      sources.push(parsed);
      continue;
    }

    const normalized = normalizeSourceText(lines[index]).toLowerCase();
    if (!normalized || normalized === '---') {
      continue;
    }

    if (!/^[sS]\d+\b/.test(normalizeSourceText(lines[index])) && !normalized.startsWith('```')) {
      break;
    }
  }
  return dedupeSources(sources);
};

const parseLegacySources = (content) => {
  const sourcePattern = /\d+\.\s*\[(.*?)\]\((.*?)\)/g;
  const sources = [];
  let sourceMatch;

  while ((sourceMatch = sourcePattern.exec(content)) !== null) {
    const title = sourceMatch[1];
    const url = sanitizeExternalUrl(sourceMatch[2]);
    if (!url) continue;
    sources.push({
      title,
      url,
      domain: extractDomain(url)
    });
  }

  return dedupeSources(sources);
};

// Function to extract and parse web search sources from Claude's response
export const extractSourcesFromResponse = (content) => {
  if (!content || typeof content !== 'string') {
    return { cleanedContent: content, sources: [] };
  }

  // First check for new <links> format
  const linkMatch = content.match(/<links>\s*(.*?)\s*<\/links>/);
  if (linkMatch) {
    const linksString = linkMatch[1];
    const links = linksString.split(' ; ').map(url => url.trim()).filter(url => url);
    const cleanContent = content.replace(/<links>.*?<\/links>/, '').trim();

    const sources = dedupeSources(
      links
        .map((url) => sanitizeExternalUrl(url))
        .filter(Boolean)
        .map((url, index) => ({
          title: `Source ${index + 1}`,
          url,
          domain: extractDomain(url)
        }))
    );

    return { cleanedContent: cleanContent, sources };
  }

  const lines = content.split('\n');
  const sourceHeaderIndex = findSourcesHeaderIndex(lines);
  const parsedSources = sourceHeaderIndex >= 0
    ? extractSourcesFromSection(lines, sourceHeaderIndex)
    : parseLegacySources(content);

  if (sourceHeaderIndex === -1) {
    if (parsedSources.length === 0) {
      return { cleanedContent: content, sources: [] };
    }
    return { cleanedContent: content, sources: parsedSources };
  }

  const cleanedContent = lines.slice(0, sourceHeaderIndex).join('\n').trim();
  return {
    cleanedContent,
    sources: parsedSources
  };
};

// Function to get favicon URL for a domain
export const getFaviconUrl = (url) => {
  try {
    const domain = new URL(url).origin;
    return `${domain}/favicon.ico`;
  } catch (e) {
    return 'https://www.google.com/s2/favicons?domain=' + url;
  }
};

// Function to parse links from the new <links> format
export const parseLinksFromResponse = (content) => {
  if (!content || typeof content !== 'string') {
    return { content: content, sources: [] };
  }
  
  const linkMatch = content.match(/<links>\s*(.*?)\s*<\/links>/);
  if (linkMatch) {
    const linksString = linkMatch[1];
    const links = linksString.split(' ; ').map(url => url.trim()).filter(url => url);
    const cleanContent = content.replace(/<links>.*?<\/links>/, '').trim();
    
    // Convert URLs to source objects for consistency with existing UI
    const sources = links
      .map((url) => sanitizeExternalUrl(url))
      .filter(Boolean)
      .map((url, index) => ({
        title: `Source ${index + 1}`,
        url,
        domain: extractDomain(url)
      }));
    
    return { content: cleanContent, sources: sources };
  }
  
  return { content: content, sources: [] };
};

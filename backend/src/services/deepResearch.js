/**
 * Deep research orchestration service.
 *
 * Pipeline:
 * 1) Planner (Gemini 3.1 Pro by default)
 * 2) Parallel researcher agents (Gemini 3 Flash by default)
 * 3) Final synthesis writer (Claude Sonnet by default)
 */

import getDeepResearchConfig from '../config/deepResearch.js';
import {
  PLANNER_SYSTEM_PROMPT,
  AGENT_SYSTEM_PROMPT,
  WRITER_SYSTEM_PROMPT,
  BANNED_WORDS,
  BANNED_PHRASE_REGEXES
} from '../prompts/deepResearchPrompts.js';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const ANTHROPIC_BASE_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

const MAX_QUERY_LENGTH = 4000;
const REPORT_LENGTH_SETTINGS = {
  short: { writerMaxTokens: 4096, sourceSectionMaxChars: 1400 },
  standard: { writerMaxTokens: 8192, sourceSectionMaxChars: 2600 },
  long: { writerMaxTokens: 13000, sourceSectionMaxChars: 3400 }
};
const REPORT_DEPTH_SETTINGS = {
  surface: {
    plannerSubQuestionGuidance: 'focus on high-level facts and direct answers',
    writerInstruction: 'prioritize key conclusions, keep coverage broad, and avoid deep historical context.'
  },
  standard: {
    plannerSubQuestionGuidance: 'balance breadth and depth with concrete evidence needs',
    writerInstruction: 'build structured conclusions and explicitly call out uncertainty where needed.'
  },
  deep: {
    plannerSubQuestionGuidance: 'prioritize contradiction checks, primary-source verification, and edge-case assumptions',
    writerInstruction: 'include nuanced caveats, competing viewpoints, and confidence notes tied to evidence.'
  }
};
const RELIABILITY_ORDER = {
  high: 3,
  medium: 2,
  low: 1
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const clampInteger = (value, min, max) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return clamp(min, min, max);
  return clamp(parsed, min, max);
};

const normalizeWhitespace = (value) =>
  String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .trim();

const tryParseJson = (raw) => {
  if (!raw || typeof raw !== 'string') return null;

  const trimmed = raw.trim();
  if (!trimmed) return null;

  const candidates = [
    trimmed,
    trimmed.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim()
  ];

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // keep trying
    }
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const slice = trimmed.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(slice);
    } catch {
      return null;
    }
  }

  return null;
};

const sanitizeSourceUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== 'https:') return null;
    if (parsed.username || parsed.password) return null;
    return parsed.toString();
  } catch {
    return null;
  }
};

const safeStringList = (value, maxItems = 10, maxChars = 500) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => normalizeWhitespace(item).slice(0, maxChars))
    .filter(Boolean)
    .slice(0, maxItems);
};

const confidenceLabel = (value) => {
  const normalized = String(value || '').toLowerCase().trim();
  if (normalized === 'high' || normalized === 'medium' || normalized === 'low') {
    return normalized;
  }
  return 'medium';
};

const extractGeminiText = (payload) => {
  const parts = payload?.candidates?.[0]?.content?.parts || [];
  return parts
    .filter((part) => typeof part.text === 'string')
    .map((part) => part.text)
    .join('')
    .trim();
};

const extractGeminiSources = (payload) => {
  const chunks = payload?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources = [];
  const seen = new Set();

  for (const chunk of chunks) {
    const uri = sanitizeSourceUrl(chunk?.web?.uri);
    if (!uri || seen.has(uri)) continue;
    seen.add(uri);
    sources.push({
      title: normalizeWhitespace(chunk?.web?.title || uri).slice(0, 200),
      url: uri
    });
  }

  return sources;
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isAbortLikeError = (error) => {
  if (!error) return false;
  if (error.name === 'AbortError') return true;
  const message = String(error.message || '').toLowerCase();
  return message.includes('aborted');
};

const isRetryableUpstreamError = (error) => {
  const message = normalizeWhitespace(error?.message || '').toLowerCase();
  return (
    isAbortLikeError(error) ||
    message.includes('timed out') ||
    message.includes('fetch failed') ||
    message.includes('network error') ||
    message.includes('econnreset') ||
    message.includes('etimedout')
  );
};

const withRetry = async (operation, { attempts = 2, baseDelayMs = 750 } = {}) => {
  let lastError = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt >= attempts || !isRetryableUpstreamError(error)) {
        throw error;
      }
      await delay(baseDelayMs * attempt);
    }
  }

  throw lastError;
};

const fetchWithTimeout = async (url, options, timeoutMs) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } catch (error) {
    if (isAbortLikeError(error)) {
      throw new Error(`Upstream model request timed out after ${Math.ceil(timeoutMs / 1000)}s.`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

const callGemini = async ({
  apiKey,
  model,
  systemPrompt,
  userPrompt,
  maxTokens,
  temperature,
  useSearch,
  timeoutMs
}) => {
  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }]
      }
    ],
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
      responseMimeType: 'application/json'
    }
  };

  if (systemPrompt) {
    requestBody.systemInstruction = {
      parts: [{ text: systemPrompt }]
    };
  }

  if (useSearch) {
    requestBody.tools = [{ googleSearch: {} }];
  }

  const response = await fetchWithTimeout(
    `${GEMINI_BASE_URL}/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    },
    timeoutMs
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini request failed (${response.status}): ${errorText.slice(0, 400)}`);
  }

  const payload = await response.json();
  const text = extractGeminiText(payload);
  return {
    text,
    json: tryParseJson(text),
    sources: extractGeminiSources(payload)
  };
};

const callAnthropic = async ({
  apiKey,
  model,
  systemPrompt,
  userPrompt,
  maxTokens,
  temperature,
  timeoutMs
}) => {
  const response = await fetchWithTimeout(
    ANTHROPIC_BASE_URL,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION
      },
      body: JSON.stringify({
        model,
        system: systemPrompt,
        max_tokens: maxTokens,
        temperature,
        messages: [
          {
            role: 'user',
            content: [{ type: 'text', text: userPrompt }]
          }
        ]
      })
    },
    timeoutMs
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic request failed (${response.status}): ${errorText.slice(0, 400)}`);
  }

  const payload = await response.json();
  const text = (payload.content || [])
    .filter((entry) => entry.type === 'text' && typeof entry.text === 'string')
    .map((entry) => entry.text)
    .join('')
    .trim();

  return { text, raw: payload };
};

const fallbackSubQuestions = (query, maxAgents) => {
  const fallback = [
    `What are the core factual claims in this question: ${query}?`,
    `Which primary sources directly confirm or contradict those claims?`,
    `What has changed recently that could alter the correct answer?`,
    `Where is the current evidence weak, incomplete, or conflicting?`
  ];
  return fallback.slice(0, clamp(maxAgents, 2, 12));
};

const normalizePlan = (rawPlan, query, maxAgents) => {
  const parsed = rawPlan && typeof rawPlan === 'object' ? rawPlan : {};
  const candidateQuestions = safeStringList(parsed.subQuestions, 16, 400);
  const deduped = [];
  const seen = new Set();

  for (const question of candidateQuestions) {
    const key = question.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(question);
  }

  const subQuestions = (deduped.length > 0 ? deduped : fallbackSubQuestions(query, maxAgents))
    .slice(0, maxAgents);

  return {
    researchObjective: normalizeWhitespace(parsed.researchObjective || query).slice(0, 1000),
    subQuestions,
    recommendedAgents: clamp(
      Number.parseInt(parsed.recommendedAgents, 10) || subQuestions.length,
      2,
      maxAgents
    ),
    verificationChecklist: safeStringList(parsed.verificationChecklist, 12, 240)
  };
};

const normalizeAgentResult = ({ subQuestion, rawJson, rawText, sources }) => {
  const parsed = rawJson && typeof rawJson === 'object' ? rawJson : {};

  const evidenceItems = Array.isArray(parsed.evidence) ? parsed.evidence : [];
  const normalizedEvidence = evidenceItems
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const sourceUrl = sanitizeSourceUrl(entry.source_url || entry.url);
      return {
        claim: normalizeWhitespace(entry.claim).slice(0, 500),
        source_title: normalizeWhitespace(entry.source_title || entry.title || sourceUrl || '').slice(0, 240),
        source_url: sourceUrl,
        quote: normalizeWhitespace(entry.quote).slice(0, 600),
        reliability: confidenceLabel(entry.reliability),
        published_date: normalizeWhitespace(entry.published_date || '').slice(0, 40) || null
      };
    })
    .filter((item) => item && item.claim);

  const normalizedSources = [];
  const sourceSet = new Set();
  for (const source of sources || []) {
    const sourceUrl = sanitizeSourceUrl(source.url);
    if (!sourceUrl || sourceSet.has(sourceUrl)) continue;
    sourceSet.add(sourceUrl);
    normalizedSources.push({
      title: normalizeWhitespace(source.title || sourceUrl).slice(0, 240),
      url: sourceUrl
    });
  }

  return {
    subQuestion,
    answer: normalizeWhitespace(parsed.answer || rawText || '').slice(0, 4000),
    keyFindings: safeStringList(parsed.keyFindings, 10, 320),
    evidence: normalizedEvidence,
    gaps: safeStringList(parsed.gaps, 8, 260),
    confidence: confidenceLabel(parsed.confidence),
    sources: normalizedSources
  };
};

const extractDomainFromUrl = (url) => {
  try {
    return new URL(url).hostname.replace('www.', '').toLowerCase();
  } catch {
    return '';
  }
};

const addSourceEvidence = (sourceMap, title, rawUrl, reliability = 'medium') => {
  const url = sanitizeSourceUrl(rawUrl);
  if (!url) return;

  const existing = sourceMap.get(url);
  if (!existing) {
    sourceMap.set(url, {
      url,
      title: normalizeWhitespace(title || url).slice(0, 240),
      domain: extractDomainFromUrl(url),
      mentions: 1,
      reliability: confidenceLabel(reliability)
    });
    return;
  }

  existing.mentions = (existing.mentions || 0) + 1;
  if (reliabilityLabelValue(reliability) > reliabilityLabelValue(existing.reliability)) {
    existing.reliability = confidenceLabel(reliability);
  }
};

const reliabilityLabelValue = (value) => RELIABILITY_ORDER[confidenceLabel(value)] || 0;

const buildSourceCatalog = (agentResults) => {
  const sourceMap = new Map();

  for (const result of agentResults) {
    for (const source of result.sources || []) {
      addSourceEvidence(sourceMap, source.title, source.url, 'medium');
    }
    for (const evidence of result.evidence || []) {
      addSourceEvidence(sourceMap, evidence.source_title, evidence.source_url, evidence.reliability);
    }
  }

  const catalog = Array.from(sourceMap.values())
    .sort((left, right) => {
      if (right.mentions !== left.mentions) {
        return right.mentions - left.mentions;
      }
      const rightReliability = reliabilityLabelValue(right.reliability);
      const leftReliability = reliabilityLabelValue(left.reliability);
      if (rightReliability !== leftReliability) {
        return rightReliability - leftReliability;
      }
      return left.title.localeCompare(right.title);
    })
    .map((source, index) => ({
      ...source,
      tag: `S${index + 1}`
    }));

  const sortedSourceMap = new Map();
  for (const source of catalog) {
    sortedSourceMap.set(source.url, source);
  }

  return { catalog, sourceMap: sortedSourceMap };
};

const buildPlannerPrompt = (query, maxAgents, reportDepth) => {
  const todayIso = new Date().toISOString();
  const depthAdvice = REPORT_DEPTH_SETTINGS[reportDepth]?.plannerSubQuestionGuidance
    || REPORT_DEPTH_SETTINGS.standard.plannerSubQuestionGuidance;
  return `Research question:
${query}

Current timestamp:
${todayIso}

Research depth:
${reportDepth}

Depth guidance:
${depthAdvice}

Create a research plan as JSON with this exact shape:
{
  "researchObjective": "string",
  "subQuestions": ["string"],
  "recommendedAgents": 6,
  "verificationChecklist": ["string"]
}

Requirements:
- 2 to ${maxAgents} subQuestions
- each subQuestion must be specific and independently researchable
- include at least one subQuestion for contradiction checks
- include at least one subQuestion for recency checks when the topic may change over time`;
};

const buildAgentPrompt = (query, subQuestion, index, total, reportDepth) => {
  const depthAdvice = REPORT_DEPTH_SETTINGS[reportDepth]?.plannerSubQuestionGuidance
    || REPORT_DEPTH_SETTINGS.standard.plannerSubQuestionGuidance;
  return `Main question:
${query}

Assigned sub-question (${index + 1}/${total}):
${subQuestion}

Research depth:
${reportDepth}

Depth guidance:
${depthAdvice}

Return JSON with this exact shape:
{
  "answer": "string",
  "keyFindings": ["string"],
  "evidence": [
    {
      "claim": "string",
      "source_title": "string",
      "source_url": "https://...",
      "quote": "string",
      "reliability": "high|medium|low",
      "published_date": "YYYY-MM-DD or null"
    }
  ],
  "gaps": ["string"],
  "confidence": "high|medium|low"
}

Rules:
- keep claims factual and traceable
- if evidence conflicts, state the conflict in keyFindings or gaps
- if no reliable support is found, say so directly`;
};

const mapEvidenceToSourceTags = (agentResults, sourceMap) =>
  agentResults.map((result) => ({
    subQuestion: result.subQuestion,
    answer: result.answer,
    keyFindings: result.keyFindings,
    gaps: result.gaps,
    confidence: result.confidence,
    evidence: (result.evidence || []).map((item) => {
      const source = item.source_url ? sourceMap.get(sanitizeSourceUrl(item.source_url)) : null;
      return {
        claim: item.claim,
        quote: item.quote,
        sourceTag: source?.tag || null,
        source_title: item.source_title || source?.title || null,
        source_url: item.source_url || source?.url || null,
        reliability: item.reliability,
        published_date: item.published_date
      };
    })
  }));

const buildWriterPrompt = ({
  query,
  plan,
  agentResults,
  sourceCatalog,
  sourceMap,
  reportLength,
  reportDepth
}) => {
  const evidencePackage = {
    question: query,
    plan: {
      objective: plan.researchObjective,
      subQuestions: plan.subQuestions,
      verificationChecklist: plan.verificationChecklist
    },
    findings: mapEvidenceToSourceTags(agentResults, sourceMap),
    sources: sourceCatalog
  };

  const lengthSettings = REPORT_LENGTH_SETTINGS[reportLength] || REPORT_LENGTH_SETTINGS.standard;
  const depthInstruction = REPORT_DEPTH_SETTINGS[reportDepth]?.writerInstruction || REPORT_DEPTH_SETTINGS.standard.writerInstruction;
  const sourceSectionChars = lengthSettings.sourceSectionMaxChars;
  const sourceCatalogText = sourceCatalog
    .map((source) => `${source.tag} ${source.title} (${source.url})`)
    .slice(0, 20)
    .join('\n')
    .slice(0, sourceSectionChars);

  return `Write the final report for this research request.

Output requirements:
- plain prose only
- no bullet list unless needed to prevent ambiguity
- no markdown symbols
- no recap section
- include inline source tags like [S1] when stating facts
- if evidence is weak or conflicting, say that directly
- do not cite a source tag that does not exist
- length target: ${reportLength}
- depth instruction: ${depthInstruction}
- keep the total report concise and source-grounded for factual accuracy
- include a short source list at the end in the format "Sources: S1, S2, ..."
- end with a source list section like:
  Sources:
  S1 Title - URL
  S2 Title - URL

Evidence package (JSON):
${JSON.stringify(evidencePackage, null, 2)}

Source catalog preview:
${sourceCatalogText}
`;
};

const extractSourceTags = (text) => {
  const matches = text.match(/\[(S\d+)\]/g);
  if (!matches) return [];
  return [...new Set(matches)];
};

const assessWriterOutput = (text, sourceCatalog = []) => {
  const issues = [];
  const normalized = text || '';
  const lowered = normalized.toLowerCase();
  const sourceCount = sourceCatalog.length;
  const sourceTags = extractSourceTags(normalized);
  const sourceTagSet = new Set(sourceCatalog.map((source) => source.tag));

  for (const word of BANNED_WORDS) {
    const pattern = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (pattern.test(lowered)) {
      issues.push(`contains banned word: "${word}"`);
      break;
    }
  }

  for (const regex of BANNED_PHRASE_REGEXES) {
    if (regex.test(lowered)) {
      issues.push(`contains banned phrase matching ${regex}`);
      break;
    }
  }

  if (/[\u2014]/.test(normalized)) {
    issues.push('contains em dash characters');
  }

  if (/^\s*[-*]\s+/m.test(normalized)) {
    issues.push('contains markdown-style bullet lines');
  }

  if (sourceCount > 0 && !/\[S\d+\]/.test(normalized)) {
    issues.push('missing inline source tags like [S1]');
  }

  if (sourceCount > 0) {
    const outOfRangeTags = sourceTags.filter((tag) => !sourceTagSet.has(tag));
    if (outOfRangeTags.length > 0) {
      issues.push(`references unsupported source tags: ${[...new Set(outOfRangeTags)].join(', ')}`);
    }
  }

  if (sourceCount > 0 && sourceTags.length === 0) {
    issues.push('no inline source tags were included for grounded claims');
  }

  if (sourceCount > 0 && !/\bSources:\b/i.test(normalized)) {
    issues.push('missing explicit "Sources:" section for source listing');
  }

  if (/\b(let me know if you need anything else|hope this helps)\b/i.test(lowered)) {
    issues.push('contains forbidden conversational closer');
  }

  return issues;
};

const reviseWriterOutput = async ({
  apiKey,
  model,
  timeoutMs,
  maxTokens,
  temperature,
  draft,
  issues,
  evidencePrompt
}) => {
  const revisionPrompt = `Revise the draft to fix all listed issues while preserving factual accuracy.
Do not add new unsupported claims.
Keep inline source tags [Sx] aligned with the provided source catalog.

Issues:
${issues.map((issue, index) => `${index + 1}. ${issue}`).join('\n')}

Draft:
${draft}

Use this evidence package:
${evidencePrompt}`;

  const revised = await callAnthropic({
    apiKey,
    model,
    systemPrompt: WRITER_SYSTEM_PROMPT,
    userPrompt: revisionPrompt,
    maxTokens,
    temperature,
    timeoutMs
  });

  return revised.text;
};

const runWithConcurrency = async (items, concurrency, worker) => {
  const results = new Array(items.length);
  let cursor = 0;

  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const current = cursor;
      cursor += 1;
      if (current >= items.length) return;

      try {
        results[current] = await worker(items[current], current);
      } catch (error) {
        results[current] = {
          error: normalizeWhitespace(error?.message || 'Unknown error')
        };
      }
    }
  });

  await Promise.all(runners);
  return results;
};

const applyReportProfile = (config) => {
  const lengthProfile = REPORT_LENGTH_SETTINGS[config.reportLength] || REPORT_LENGTH_SETTINGS.standard;
  return {
    ...config,
    writerMaxTokens: clampInteger(lengthProfile.writerMaxTokens, 512, 16384)
  };
};

export const performDeepResearch = async ({
  env,
  query,
  maxAgents,
  modelOverride,
  reportLength,
  reportDepth,
  storedConfig,
  onProgress
}) => {
  const config = applyReportProfile(
    getDeepResearchConfig(
      env,
      {
        model: modelOverride,
        reportLength,
        reportDepth
      },
      storedConfig || {}
    )
  );
  if (!config.enabled) {
    throw new Error('Deep research is disabled.');
  }

  if (!env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  if (!env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured.');
  }

  const normalizedQuery = normalizeWhitespace(query);
  if (!normalizedQuery) {
    throw new Error('Query is required.');
  }
  if (normalizedQuery.length > MAX_QUERY_LENGTH) {
    throw new Error(`Query exceeds ${MAX_QUERY_LENGTH} characters.`);
  }

  const boundedAgents = clamp(
    Number.parseInt(maxAgents, 10) || config.defaultMaxAgents,
    config.minAgents,
    config.maxAgents
  );

  if (onProgress) {
    onProgress({
      stage: 'planning',
      progress: 5,
      message: 'Building research plan'
    });
  }

  const planner = await withRetry(
    () =>
      callGemini({
        apiKey: env.GEMINI_API_KEY,
        model: config.plannerApiModel,
        systemPrompt: PLANNER_SYSTEM_PROMPT,
        userPrompt: buildPlannerPrompt(normalizedQuery, boundedAgents, config.reportDepth),
        maxTokens: config.plannerMaxTokens,
        temperature: config.plannerTemperature,
        useSearch: false,
        timeoutMs: config.requestTimeoutMs
      }),
    { attempts: 2, baseDelayMs: 800 }
  );

  const plan = normalizePlan(planner.json, normalizedQuery, boundedAgents);
  const subQuestions = plan.subQuestions.slice(0, boundedAgents);

  if (onProgress) {
    onProgress({
      stage: 'planning_complete',
      progress: 18,
      message: `Plan ready with ${subQuestions.length} sub-questions`,
      subQuestions
    });
  }

  let completedAgents = 0;
  const agentResults = await runWithConcurrency(
    subQuestions,
    config.maxParallelAgents,
    async (subQuestion, index) => {
      if (onProgress) {
        onProgress({
          stage: 'agent_started',
          progress: 20,
          message: `Researching sub-question ${index + 1}/${subQuestions.length}`,
          agentIndex: index,
          subQuestion
        });
      }

      try {
        const agent = await callGemini({
          apiKey: env.GEMINI_API_KEY,
          model: config.researcherApiModel,
          systemPrompt: AGENT_SYSTEM_PROMPT,
          userPrompt: buildAgentPrompt(
            normalizedQuery,
            subQuestion,
            index,
            subQuestions.length,
            config.reportDepth
          ),
          maxTokens: config.agentMaxTokens,
          temperature: config.agentTemperature,
          useSearch: true,
          timeoutMs: config.requestTimeoutMs
        });

        const normalized = normalizeAgentResult({
          subQuestion,
          rawJson: agent.json,
          rawText: agent.text,
          sources: agent.sources
        });

        completedAgents += 1;
        if (onProgress) {
          const progress = Math.round(20 + (completedAgents / subQuestions.length) * 50);
          onProgress({
            stage: 'agent_complete',
            progress,
            message: `Completed sub-question ${completedAgents}/${subQuestions.length}`,
            agentIndex: index,
            result: normalized
          });
        }

        return normalized;
      } catch (error) {
        completedAgents += 1;
        const fallback = {
          subQuestion,
          answer: 'Unable to gather reliable evidence for this sub-question.',
          keyFindings: [],
          evidence: [],
          gaps: [normalizeWhitespace(error?.message || 'Research agent failed.')],
          confidence: 'low',
          sources: []
        };

        if (onProgress) {
          const progress = Math.round(20 + (completedAgents / subQuestions.length) * 50);
          onProgress({
            stage: 'agent_error',
            progress,
            message: `Agent failed for sub-question ${index + 1}`,
            agentIndex: index,
            result: fallback
          });
        }

        return fallback;
      }
    }
  );

  if (onProgress) {
    onProgress({
      stage: 'writing',
      progress: 75,
      message: 'Drafting final report'
    });
  }

  const { catalog: sourceCatalog, sourceMap } = buildSourceCatalog(agentResults);
  const writerPrompt = buildWriterPrompt({
    query: normalizedQuery,
    plan,
    agentResults,
    sourceCatalog,
    sourceMap,
    reportLength: config.reportLength,
    reportDepth: config.reportDepth
  });

  const writer = await withRetry(
    () =>
      callAnthropic({
        apiKey: env.ANTHROPIC_API_KEY,
        model: config.writerApiModel,
        systemPrompt: WRITER_SYSTEM_PROMPT,
        userPrompt: writerPrompt,
        maxTokens: config.writerMaxTokens,
        temperature: config.writerTemperature,
        timeoutMs: config.requestTimeoutMs
      }),
    { attempts: 2, baseDelayMs: 1000 }
  );

  let finalReport = normalizeWhitespace(writer.text);
  let qualityIssues = assessWriterOutput(finalReport, sourceCatalog);

  if (qualityIssues.length > 0) {
    if (onProgress) {
      onProgress({
        stage: 'revision',
        progress: 88,
        message: 'Revising report for quality constraints',
        qualityIssues
      });
    }

    const revisedText = await withRetry(
      () =>
        reviseWriterOutput({
          apiKey: env.ANTHROPIC_API_KEY,
          model: config.writerApiModel,
          timeoutMs: config.requestTimeoutMs,
          maxTokens: config.writerMaxTokens,
          temperature: config.writerTemperature,
          draft: finalReport,
          issues: qualityIssues,
          evidencePrompt: writerPrompt
        }),
      { attempts: 2, baseDelayMs: 1000 }
    );

    finalReport = normalizeWhitespace(revisedText);
    qualityIssues = assessWriterOutput(finalReport, sourceCatalog);
  }

  if (onProgress) {
    onProgress({
      stage: 'complete',
      progress: 100,
      message: 'Deep research complete'
    });
  }

  return {
    query: normalizedQuery,
    content: finalReport,
    report: finalReport,
    subQuestions,
    agentResults,
    sources: sourceCatalog,
    qualityIssues,
    metadata: {
      generatedAt: new Date().toISOString(),
      models: {
        planner: config.plannerModel,
        researcher: config.researcherModel,
        writer: config.writerModel
      },
      agentCount: subQuestions.length,
      reportLength: config.reportLength,
      reportDepth: config.reportDepth
    }
  };
};

export default performDeepResearch;

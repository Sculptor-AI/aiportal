import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const MAX_BYTES = 30 * 1024 * 1024;

const TEXT_EXTENSIONS = new Set([
  'txt', 'md', 'markdown', 'csv', 'tsv', 'json', 'yaml', 'yml', 'xml', 'html', 'htm',
  'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs',
  'py', 'rb', 'go', 'rs', 'java', 'kt', 'swift',
  'c', 'cc', 'cpp', 'h', 'hpp', 'cs',
  'sh', 'bash', 'zsh', 'fish', 'ps1',
  'sql', 'toml', 'ini', 'conf', 'env', 'log',
  'vue', 'svelte', 'php', 'lua', 'r', 'dart', 'scala', 'pl',
]);

const IMAGE_MIME_PREFIX = 'image/';

export function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

function getExtension(name = '') {
  const idx = name.lastIndexOf('.');
  return idx === -1 ? '' : name.slice(idx + 1).toLowerCase();
}

function isTextFile(file) {
  if (file.type?.startsWith('text/')) return true;
  if (file.type === 'application/json') return true;
  if (file.type === 'application/xml') return true;
  return TEXT_EXTENSIONS.has(getExtension(file.name));
}

function readAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

function readAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

async function parsePDF(file) {
  const buf = await readAsArrayBuffer(file);
  const loadingTask = pdfjsLib.getDocument({ data: buf });
  const pdf = await loadingTask.promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(it => it.str).join(' ');
    pages.push(pageText);
  }
  return pages.join('\n\n');
}

async function parseDOCX(file) {
  const buf = await readAsArrayBuffer(file);
  const mammoth = await import('mammoth/mammoth.browser.js');
  const result = await mammoth.extractRawText({ arrayBuffer: buf });
  return result.value || '';
}

export async function parseFile(file) {
  if (!file) throw new Error('No file provided');
  if (file.size > MAX_BYTES) {
    throw new Error(`File exceeds ${Math.round(MAX_BYTES / 1024 / 1024)}MB limit`);
  }

  const ext = getExtension(file.name);
  const mime = file.type || '';

  if (mime.startsWith(IMAGE_MIME_PREFIX)) {
    const dataUrl = await readAsDataURL(file);
    return {
      kind: 'image',
      name: file.name,
      type: mime,
      size: file.size,
      content: null,
      dataUrl,
      tokens: 0,
    };
  }

  if (ext === 'pdf' || mime === 'application/pdf') {
    const text = await parsePDF(file);
    return {
      kind: 'pdf',
      name: file.name,
      type: mime || 'application/pdf',
      size: file.size,
      content: text,
      tokens: estimateTokens(text),
    };
  }

  if (ext === 'docx' || mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const text = await parseDOCX(file);
    return {
      kind: 'docx',
      name: file.name,
      type: mime || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: file.size,
      content: text,
      tokens: estimateTokens(text),
    };
  }

  if (isTextFile(file)) {
    const text = await readAsText(file);
    return {
      kind: 'text',
      name: file.name,
      type: mime || 'text/plain',
      size: file.size,
      content: text,
      tokens: estimateTokens(text),
    };
  }

  throw new Error(`Unsupported file type: ${mime || ext || 'unknown'}`);
}

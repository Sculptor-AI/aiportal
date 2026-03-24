import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { createVideoObjectUrl, downloadGeneratedVideo, generateVideo, waitForVideoCompletion } from '../services/videoService';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import VideoEditorModal from '../components/VideoEditorModal';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const scaleIn = keyframes`
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

/* ------------------------------------------------------------------ */
/*  Page shell                                                        */
/* ------------------------------------------------------------------ */

const PageContainer = styled.div`
  flex: 1;
  min-height: 100vh;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  color: ${p => p.theme.text};
  overflow-y: auto;
  overflow-x: hidden;
  transition: padding-left 0.42s cubic-bezier(0.22, 1, 0.36, 1);
  padding-left: ${p => p.$collapsed ? '0' : '280px'};
  padding-bottom: 100px;
`;

const ContentWrapper = styled.div`
  max-width: calc(100vw - ${props => props.$collapsed ? '0' : '280px'});
  margin: 0 auto;
  padding: 48px 40px 0px;

  @media (max-width: 768px) {
    padding: 32px 20px 60px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 40px;
  gap: 24px;
  animation: ${fadeIn} 0.5s ease-out;

  @media (max-width: 640px) {
    flex-direction: column;
    gap: 20px;
  }
`;

const TitleSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const PageTitle = styled.h1`
  font-size: 2.25rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin: 0;

  @media (max-width: 640px) {
    font-size: 1.875rem;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

const SmallBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: transparent;
  color: ${p => p.theme.textSecondary || `${p.theme.text}80`};
  border: 1px solid ${p => p.theme.border};
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    color: ${p => p.theme.text};
    background: ${p => p.theme.hover || 'rgba(128,128,128,0.08)'};
  }

  svg { width: 14px; height: 14px; }
`;

/* ------------------------------------------------------------------ */
/*  Masonry grid                                                      */
/* ------------------------------------------------------------------ */

const MasonryGrid = styled.div`
  column-count: 4;
  column-gap: 12px;
  padding: 0 40px;
  max-width: 1400px;
  margin: 0 auto;
  animation: ${fadeIn} 0.4s ease-out;

  @media (max-width: 1400px) { column-count: 3; }
  @media (max-width: 1000px) { column-count: 2; }
  @media (max-width: 768px) {
    padding: 0 20px;
  }
  @media (max-width: 600px) {
    column-count: 2;
    column-gap: 8px;
    padding: 0 12px;
  }
`;

const CardShell = styled.div`
  break-inside: avoid;
  margin-bottom: 12px;
  border-radius: 14px;
  overflow: hidden;
  position: relative;
  background: #000;
  cursor: ${p => p.$interactive ? 'pointer' : 'default'};
  animation: ${scaleIn} 0.35s ease-out;
  transition: transform 0.25s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.25s ease;

  &:hover {
    transform: ${p => p.$interactive ? 'translateY(-3px) scale(1.01)' : 'none'};
    box-shadow: ${p => p.$interactive ? '0 14px 44px rgba(0,0,0,0.28)' : 'none'};
  }

  @media (max-width: 600px) {
    border-radius: 10px;
    margin-bottom: 8px;
  }
`;

const CardMedia = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: ${p => p.$ratio === '9:16' ? '9/16' : '16/9'};
  background: #111;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CardVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const CardOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 14px;
  background: linear-gradient(0deg, rgba(0,0,0,0.65) 0%, transparent 50%);
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;

  ${CardShell}:hover & {
    opacity: 1;
    pointer-events: auto;
  }
`;

const OverlayPrompt = styled.p`
  margin: 0;
  color: #fff;
  font-size: 0.8rem;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  opacity: 0.92;
`;

const OverlayRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
`;

const OverlayMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

const OverlayBadge = styled.span`
  font-size: 0.7rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);

  ${p => p.$status === 'completed' && css`
    color: #4ade80;
    background: rgba(34, 197, 94, 0.2);
  `}
  ${p => p.$status === 'failed' && css`
    color: #f87171;
    background: rgba(239, 68, 68, 0.2);
  `}
  ${p => p.$status === 'generating' && css`
    color: #facc15;
    background: rgba(250, 204, 21, 0.2);
  `}
`;

const OverlayActions = styled.div`
  display: flex;
  gap: 4px;
`;

const OverlayBtn = styled.button`
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: none;
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease;

  &:hover { background: rgba(255,255,255,0.3); }
  svg { width: 14px; height: 14px; }
`;

const OverlayEditBtn = styled.button`
  min-width: 72px;
  height: 30px;
  border-radius: 8px;
  border: none;
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #fff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 10px;
  font-size: 0.72rem;
  font-weight: 600;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(255,255,255,0.3);
  }

  svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }
`;

const EditedBadge = styled.span`
  font-size: 0.7rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
  color: #bfdbfe;
  background: rgba(59, 130, 246, 0.22);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
`;

const StatusCenter = styled.div`
  color: #fff;
  font-size: 0.8rem;
  opacity: 0.7;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const Spinner = styled.div`
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255,255,255,0.25);
  border-top-color: #fff;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

/* ------------------------------------------------------------------ */
/*  Empty state                                                       */
/* ------------------------------------------------------------------ */

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 120px 40px 80px;
  animation: ${fadeIn} 0.5s ease-out;

  @media (max-width: 640px) {
    padding: 80px 24px 60px;
  }
`;

const EmptyIcon = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: ${p => p.theme.sidebar};
  border: 1px solid ${p => p.theme.border};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  color: ${p => p.theme.textSecondary || `${p.theme.text}60`};

  svg { width: 32px; height: 32px; }
`;

const EmptyTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 8px;
  letter-spacing: -0.02em;
`;

const EmptyDesc = styled.p`
  font-size: 0.9rem;
  color: ${p => p.theme.textSecondary || `${p.theme.text}80`};
  margin: 0 0 28px;
  max-width: 340px;
  line-height: 1.6;
`;

const TemplateChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  max-width: 640px;
`;

const TemplateChip = styled.button`
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid ${p => p.theme.border};
  background: ${p => p.theme.sidebar};
  color: ${p => p.theme.text};
  font-size: 0.8rem;
  line-height: 1.3;
  text-align: left;
  cursor: pointer;
  max-width: 380px;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${p => p.theme.accentColor || p.theme.primary};
    background: ${p => p.theme.hover || p.theme.inputBackground || p.theme.background};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/* ------------------------------------------------------------------ */
/*  Floating bottom prompt bar                                        */
/* ------------------------------------------------------------------ */

const BottomBarWrap = styled.div`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 200;
  width: 100%;
  max-width: 680px;
  padding: 0 16px;
  box-sizing: border-box;
  pointer-events: none;
  margin-left: ${p => p.$collapsed ? '0' : '150px'};
  transition: margin-left 0.42s cubic-bezier(0.22, 1, 0.36, 1);
  animation: ${slideUp} 0.4s ease-out;

  @media (max-width: 1024px) {
    margin-left: 0;
  }

  @media (max-width: 640px) {
    bottom: 12px;
    max-width: 100%;
    padding: 0 8px;
  }
`;

const BottomBar = styled.div`
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 0;
  background: ${p => p.theme.sidebar};
  border: 1px solid ${p => p.theme.border};
  border-radius: 18px;
  padding: 6px 6px 6px 8px;
  box-shadow: 0 8px 40px ${p => p.theme.shadow || 'rgba(0,0,0,0.22)'}, 0 0 0 1px ${p => p.theme.border};
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus-within {
    border-color: ${p => p.theme.accentColor || p.theme.primary};
    box-shadow: 0 8px 40px ${p => p.theme.shadow || 'rgba(0,0,0,0.22)'}, 0 0 0 2px ${p => p.theme.accentSurface || 'rgba(94, 114, 228, 0.25)'};
  }
`;

const BarInput = styled.input`
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  color: ${p => p.theme.text};
  font-size: 0.92rem;
  padding: 10px 12px;
  font-family: inherit;
  letter-spacing: -0.01em;

  &:focus { outline: none; }

  &::placeholder {
    color: ${p => p.theme.textSecondary || `${p.theme.text}50`};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const BarDivider = styled.span`
  width: 1px;
  height: 22px;
  background: ${p => p.theme.border};
  flex-shrink: 0;
`;

const BarChip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 12px;
  border-radius: 12px;
  border: none;
  background: transparent;
  color: ${p => p.theme.textSecondary || `${p.theme.text}80`};
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    background: ${p => p.theme.hover || 'rgba(128,128,128,0.1)'};
    color: ${p => p.theme.text};
  }

  svg { width: 15px; height: 15px; flex-shrink: 0; }
`;

const BarSendBtn = styled.button`
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 14px;
  border: none;
  background: ${p => p.disabled
    ? (p.theme.border)
    : (p.theme.accentBackground || p.theme.primary)};
  color: ${p => p.disabled ? (p.theme.textSecondary || `${p.theme.text}40`) : '#fff'};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${p => p.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    filter: brightness(1.1);
    transform: scale(1.06);
  }

  &:active:not(:disabled) {
    transform: scale(0.96);
  }

  svg { width: 18px; height: 18px; }
`;

/* ------------------------------------------------------------------ */
/*  Settings popover (aspect ratio, duration)                         */
/* ------------------------------------------------------------------ */

const PopoverAnchor = styled.div`
  position: relative;
`;

const Popover = styled.div`
  position: absolute;
  bottom: calc(100% + 10px);
  right: 0;
  min-width: 200px;
  background: ${p => p.theme.sidebar};
  border: 1px solid ${p => p.theme.border};
  border-radius: 14px;
  padding: 12px;
  box-shadow: 0 12px 48px ${p => p.theme.shadow || 'rgba(0,0,0,0.2)'};
  display: flex;
  flex-direction: column;
  gap: 14px;
  animation: ${scaleIn} 0.15s ease-out;
  z-index: 300;
`;

const PopLabel = styled.span`
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: ${p => p.theme.textSecondary || `${p.theme.text}80`};
`;

const PopRow = styled.div`
  display: flex;
  gap: 6px;
`;

const PopBtn = styled.button`
  flex: 1;
  padding: 8px 0;
  border-radius: 10px;
  border: 1px solid ${p => p.$active ? 'transparent' : p.theme.border};
  background: ${p => p.$active ? (p.theme.accentBackground || p.theme.primary) : 'transparent'};
  color: ${p => p.$active ? '#fff' : (p.theme.textSecondary || `${p.theme.text}80`)};
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    border-color: ${p => p.theme.accentColor || p.theme.primary};
  }

  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const PopStatic = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 0.82rem;
  color: ${p => p.theme.textSecondary || `${p.theme.text}80`};

  strong {
    color: ${p => p.theme.text};
    font-weight: 600;
  }
`;

/* ------------------------------------------------------------------ */
/*  Prompt templates                                                  */
/* ------------------------------------------------------------------ */

const PROMPT_TEMPLATES = [
  'A cinematic close-up of a rainy neon metropolis at night, ultra-realistic, dramatic lighting',
  'A minimalist product demo with clean white studio setup, soft shadows, product in motion',
  'Vintage sci-fi spaceship launch sequence, sweeping camera movement, editorial motion',
];

const LEGACY_MEDIA_STORAGE_KEY = 'generated_videos';
const USER_MEDIA_STORAGE_PREFIX = 'generated_videos:';
const VALID_VIDEO_STATUSES = new Set(['generating', 'completed', 'failed']);

const buildMediaStorageKey = (userId) => (userId ? `${USER_MEDIA_STORAGE_PREFIX}${userId}` : null);

const removeLegacyMediaStorage = () => {
  if (typeof localStorage === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(LEGACY_MEDIA_STORAGE_KEY);
  } catch (error) {
    console.warn('[MediaPage] Failed to remove legacy media cache:', error);
  }
};

const sanitizeStoredVideo = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const now = new Date().toISOString();
  const id = typeof value.id === 'string' && value.id.trim() ? value.id : null;
  if (!id) {
    return null;
  }

  return {
    id,
    prompt: typeof value.prompt === 'string' ? value.prompt : '',
    aspectRatio: value.aspectRatio === '9:16' ? '9:16' : '16:9',
    status: VALID_VIDEO_STATUSES.has(value.status) ? value.status : 'failed',
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : now,
    videoId: typeof value.videoId === 'string' && value.videoId.trim() ? value.videoId : null,
    url: typeof value.url === 'string' && value.url.trim() ? value.url : null,
    model: typeof value.model === 'string' && value.model.trim() ? value.model : 'sora-2',
    editProject: value.editProject && typeof value.editProject === 'object' && !Array.isArray(value.editProject)
      ? value.editProject
      : null
  };
};

const readStoredVideos = (storageKey) => {
  if (!storageKey || typeof localStorage === 'undefined') {
    return [];
  }

  try {
    const rawValue = localStorage.getItem(storageKey);
    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map(sanitizeStoredVideo).filter(Boolean);
  } catch (error) {
    console.warn('[MediaPage] Failed to read scoped media cache:', error);
    return [];
  }
};

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

const MediaPage = ({ collapsed }) => {
  const toast = useToast();
  const { user } = useAuth();
  const mediaStorageKey = buildMediaStorageKey(user?.id || null);

  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editorVideoId, setEditorVideoId] = useState(null);
  const [videos, setVideos] = useState([]);
  const [previewUrls, setPreviewUrls] = useState({});
  const [loadedStorageKey, setLoadedStorageKey] = useState(null);
  const previewUrlsRef = useRef({});
  const activeJobsRef = useRef(new Set());
  const inputRef = useRef(null);
  const settingsRef = useRef(null);
  const effectiveVideos = loadedStorageKey === mediaStorageKey ? videos : [];

  const clearPreviewUrls = useCallback(() => {
    Object.values(previewUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
    previewUrlsRef.current = {};
    setPreviewUrls({});
  }, []);

  useEffect(() => {
    removeLegacyMediaStorage();
  }, []);

  useEffect(() => {
    clearPreviewUrls();
    activeJobsRef.current.clear();
    setEditorVideoId(null);
    setLoadedStorageKey(null);
    setVideos(readStoredVideos(mediaStorageKey));
    setLoadedStorageKey(mediaStorageKey);
    removeLegacyMediaStorage();
  }, [clearPreviewUrls, mediaStorageKey]);

  useEffect(() => {
    if (!mediaStorageKey || loadedStorageKey !== mediaStorageKey || typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(mediaStorageKey, JSON.stringify(videos));
    } catch (error) {
      console.warn('[MediaPage] Failed to persist scoped media cache:', error);
    }
  }, [loadedStorageKey, mediaStorageKey, videos]);

  useEffect(() => {
    return () => {
      clearPreviewUrls();
    };
  }, [clearPreviewUrls]);

  useEffect(() => {
    if (!showSettings) return;
    const handleClick = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showSettings]);

  const updateVideo = useCallback((localId, updates) => {
    setVideos(prev => prev.map(v =>
      v.id === localId ? { ...v, ...updates, updatedAt: new Date().toISOString() } : v
    ));
  }, []);

  const setPreviewUrl = useCallback((localId, objectUrl) => {
    const next = { ...previewUrlsRef.current };
    const prev = next[localId];
    if (prev && prev !== objectUrl) URL.revokeObjectURL(prev);
    if (objectUrl) { next[localId] = objectUrl; } else { delete next[localId]; }
    previewUrlsRef.current = next;
    setPreviewUrls(next);
  }, []);

  const hydrateVideoPreview = useCallback(async (localId, videoRef) => {
    if (!videoRef) return null;
    if (previewUrlsRef.current[localId]) return previewUrlsRef.current[localId];

    try {
      const objectUrl = await createVideoObjectUrl(videoRef);
      setPreviewUrl(localId, objectUrl);
      return objectUrl;
    } catch (error) {
      console.error('Error creating video preview:', error);
      return null;
    }
  }, [setPreviewUrl]);

  const ensureVideoSource = useCallback(async (video) => {
    if (!video) return null;

    if (previewUrlsRef.current[video.id]) {
      return previewUrlsRef.current[video.id];
    }

    if (video.videoId) {
      return hydrateVideoPreview(video.id, video.videoId);
    }

    return video.url || null;
  }, [hydrateVideoPreview]);

  const monitorVideoJob = useCallback(async (localId, videoId, options = {}) => {
    if (!videoId || activeJobsRef.current.has(localId)) return;
    activeJobsRef.current.add(localId);

    try {
      const status = await waitForVideoCompletion(videoId);
      const failedStatuses = new Set(['failed', 'cancelled', 'canceled']);

      if (status?.error || failedStatuses.has(status?.status)) {
        updateVideo(localId, { status: 'failed', videoId });
        if (options.notify !== false) {
          toast.showErrorToast('Generation Failed', status?.error || 'Video generation failed.');
        }
        return;
      }

      updateVideo(localId, { status: 'completed', videoId });

      try {
        const objectUrl = await createVideoObjectUrl(videoId);
        setPreviewUrl(localId, objectUrl);
      } catch (error) {
        console.error('Preview fetch error:', error);
      }

      if (options.notify !== false) {
        toast.showSuccessToast('Video Ready', 'Your Sora video has been generated successfully!');
      }
    } catch (error) {
      console.error('Video monitoring error:', error);
      updateVideo(localId, { status: 'failed', videoId });
      if (options.notify !== false) {
        toast.showErrorToast('Generation Failed', error.message || 'Unable to finish video generation.');
      }
    } finally {
      activeJobsRef.current.delete(localId);
    }
  }, [setPreviewUrl, toast, updateVideo]);

  useEffect(() => {
    effectiveVideos.forEach(video => {
      if (video.status === 'completed' && video.videoId) {
        hydrateVideoPreview(video.id, video.videoId);
      }
      if (video.status === 'generating' && video.videoId) {
        monitorVideoJob(video.id, video.videoId, { notify: false });
      }
    });
  }, [effectiveVideos, hydrateVideoPreview, monitorVideoJob]);

  useEffect(() => {
    if (editorVideoId && !effectiveVideos.some(video => video.id === editorVideoId && video.status === 'completed')) {
      setEditorVideoId(null);
    }
  }, [editorVideoId, effectiveVideos]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    const localId = Date.now().toString();

    setVideos(prev => [{
      id: localId,
      prompt,
      aspectRatio,
      status: 'generating',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      videoId: null,
      url: null,
      model: 'sora-2',
      editProject: null
    }, ...prev]);

    try {
      const result = await generateVideo(prompt, { aspectRatio });
      if (result.success && result.videoId) {
        updateVideo(localId, { status: 'generating', videoId: result.videoId });
        toast.showInfoToast('Generation Started', 'Sora is creating your video. This may take a few minutes.');
        await monitorVideoJob(localId, result.videoId);
      } else {
        throw new Error(result.error || 'Failed to start generation');
      }
    } catch (error) {
      console.error('Error generating video:', error);
      updateVideo(localId, { status: 'failed' });
      toast.showErrorToast('Error', error?.message || 'Failed to generate video. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = (id) => {
    setPreviewUrl(id, null);
    if (editorVideoId === id) {
      setEditorVideoId(null);
    }
    setVideos(prev => prev.filter(v => v.id !== id));
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to delete all videos?')) {
      Object.keys(previewUrlsRef.current).forEach(id => setPreviewUrl(id, null));
      setEditorVideoId(null);
      setVideos([]);
    }
  };

  const handleDownload = async (video) => {
    if (video.videoId || video.url) {
      try {
        await downloadGeneratedVideo(video.videoId || video.url);
      } catch (error) {
        toast.showErrorToast('Download Failed', error.message || 'Unable to download video');
      }
    }
  };

  const handleUseTemplate = (template) => {
    if (isGenerating) return;
    setPrompt(template);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleOpenEditor = useCallback(async (video) => {
    if (!video || video.status !== 'completed') {
      return;
    }

    const sourceUrl = await ensureVideoSource(video);
    if (!sourceUrl) {
      toast.showErrorToast('Editor Unavailable', 'The video preview could not be prepared for editing.');
      return;
    }

    setEditorVideoId(video.id);
  }, [ensureVideoSource, toast]);

  const handleSaveEditProject = useCallback((localId, editProject) => {
    setVideos(prev => prev.map(video => (
      video.id === localId
        ? { ...video, editProject, updatedAt: new Date().toISOString() }
        : video
    )));
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (prompt.trim() && !isGenerating) handleGenerate();
    }
  };

  const completedVideos = effectiveVideos.filter(video => (
    video.status === 'completed' && (video.videoId || video.url)
  ));
  const editorVideo = completedVideos.find(video => video.id === editorVideoId) || null;

  return (
    <PageContainer $collapsed={collapsed}>
      <ContentWrapper $collapsed={collapsed}>
        <Header>
          <TitleSection>
            <PageTitle>Media Studio</PageTitle>
          </TitleSection>
          {effectiveVideos.length > 0 && (
            <HeaderActions>
              <SmallBtn onClick={handleClearAll}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Clear all
              </SmallBtn>
            </HeaderActions>
          )}
        </Header>
      </ContentWrapper>

      {/* ---- Feed ---- */}
      {effectiveVideos.length > 0 ? (
        <MasonryGrid>
          {effectiveVideos.map(video => {
            const previewUrl = previewUrls[video.id] || video.url || null;
            const canEdit = video.status === 'completed' && Boolean(previewUrl || video.videoId || video.url);
            return (
              <CardShell
                key={video.id}
                $interactive={canEdit}
                onClick={canEdit ? () => handleOpenEditor(video) : undefined}
                onKeyDown={canEdit ? (event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleOpenEditor(video);
                  }
                } : undefined}
                role={canEdit ? 'button' : undefined}
                tabIndex={canEdit ? 0 : undefined}
                aria-label={canEdit ? `Open editor for ${video.prompt || 'generated video'}` : undefined}
              >
                <CardMedia $ratio={video.aspectRatio}>
                  {video.status === 'completed' && previewUrl ? (
                    <CardVideo src={previewUrl} autoPlay muted loop playsInline />
                  ) : (
                    <StatusCenter>
                      {video.status === 'failed' ? (
                        'Generation failed'
                      ) : video.status === 'completed' ? (
                        'Preview unavailable'
                      ) : (
                        <>
                          <Spinner />
                          Rendering...
                        </>
                      )}
                    </StatusCenter>
                  )}
                </CardMedia>

                <CardOverlay>
                  <OverlayPrompt title={video.prompt}>{video.prompt}</OverlayPrompt>
                  <OverlayRow>
                    <OverlayMeta>
                      <OverlayBadge $status={video.status}>
                        {video.status === 'generating' ? 'Processing' : video.status}
                      </OverlayBadge>
                      {video.editProject?.clips?.length ? (
                        <EditedBadge>Edited</EditedBadge>
                      ) : null}
                    </OverlayMeta>
                    <OverlayActions>
                      {canEdit && (
                        <OverlayEditBtn onClick={(e) => { e.stopPropagation(); handleOpenEditor(video); }} title="Open editor">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                          </svg>
                          Edit
                        </OverlayEditBtn>
                      )}
                      {video.status === 'completed' && (video.videoId || video.url) && (
                        <OverlayBtn onClick={(e) => { e.stopPropagation(); handleDownload(video); }} title="Download">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        </OverlayBtn>
                      )}
                      <OverlayBtn onClick={(e) => { e.stopPropagation(); handleDelete(video.id); }} title="Delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </OverlayBtn>
                    </OverlayActions>
                  </OverlayRow>
                </CardOverlay>
              </CardShell>
            );
          })}
        </MasonryGrid>
      ) : (
        <EmptyState>
          <EmptyIcon>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </EmptyIcon>
          <EmptyTitle>Describe your video</EmptyTitle>
          <EmptyDesc>
            Use the prompt bar below to generate your first video with Sora, or try a quick start.
          </EmptyDesc>
          <TemplateChips>
            {PROMPT_TEMPLATES.map((t, i) => (
              <TemplateChip key={i} onClick={() => handleUseTemplate(t)} disabled={isGenerating}>{t}</TemplateChip>
            ))}
          </TemplateChips>
        </EmptyState>
      )}

      {/* ---- Floating prompt bar ---- */}
      <BottomBarWrap $collapsed={collapsed}>
        <BottomBar>
          <BarInput
            ref={inputRef}
            type="text"
            placeholder="Describe your video..."
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isGenerating}
          />

          <BarDivider />

          <BarChip type="button" onClick={() => setAspectRatio(aspectRatio === '16:9' ? '9:16' : '16:9')} disabled={isGenerating} title="Toggle aspect ratio">
            {/* ratio icon */}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            {aspectRatio}
          </BarChip>

          <PopoverAnchor ref={settingsRef}>
            <BarChip type="button" onClick={() => setShowSettings(s => !s)} title="Settings">
              {/* sliders icon */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="21" x2="4" y2="14" />
                <line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" />
                <line x1="20" y1="12" x2="20" y2="3" />
                <line x1="1" y1="14" x2="7" y2="14" />
                <line x1="9" y1="8" x2="15" y2="8" />
                <line x1="17" y1="16" x2="23" y2="16" />
              </svg>
            </BarChip>

            {showSettings && (
              <Popover>
                <div>
                  <PopLabel>Aspect ratio</PopLabel>
                  <PopRow style={{ marginTop: 6 }}>
                    <PopBtn $active={aspectRatio === '16:9'} onClick={() => setAspectRatio('16:9')} disabled={isGenerating}>16:9</PopBtn>
                    <PopBtn $active={aspectRatio === '9:16'} onClick={() => setAspectRatio('9:16')} disabled={isGenerating}>9:16</PopBtn>
                  </PopRow>
                </div>
                <div>
                  <PopLabel>Duration</PopLabel>
                  <PopStatic><span>Fixed</span><strong>8 seconds</strong></PopStatic>
                </div>
                <div>
                  <PopLabel>Model</PopLabel>
                  <PopStatic><span>Active</span><strong>Sora 2</strong></PopStatic>
                </div>
              </Popover>
            )}
          </PopoverAnchor>

          <BarSendBtn
            type="button"
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            title={isGenerating ? 'Generating...' : 'Generate video'}
          >
            {isGenerating ? (
              <Spinner />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            )}
          </BarSendBtn>
        </BottomBar>
      </BottomBarWrap>

      <VideoEditorModal
        isOpen={Boolean(editorVideo)}
        video={editorVideo}
        project={editorVideo?.editProject || null}
        availableVideos={completedVideos}
        previewUrls={previewUrls}
        ensureVideoSource={ensureVideoSource}
        onClose={() => setEditorVideoId(null)}
        onSave={(editProject) => {
          if (editorVideo) {
            handleSaveEditProject(editorVideo.id, editProject);
          }
        }}
      />
    </PageContainer>
  );
};

export default MediaPage;

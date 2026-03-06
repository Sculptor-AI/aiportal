import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { useToast } from '../contexts/ToastContext';

const MIN_CLIP_DURATION = 0.1;
const DEFAULT_CLIP_DURATION = 8;
const EXPORT_FRAME_RATE = 30;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const formatSeconds = (seconds = 0) => {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds - (minutes * 60);
  return `${minutes}:${remainingSeconds.toFixed(1).padStart(4, '0')}`;
};

const cloneProject = (project) => JSON.parse(JSON.stringify(project));

const createClipId = () => `clip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const createClipFromVideo = (video) => ({
  id: createClipId(),
  sourceVideoId: video.id,
  trimStart: 0,
  trimEnd: null,
  label: video.prompt ? video.prompt.slice(0, 48) : 'Clip'
});

const createDefaultProject = (video) => ({
  id: `edit-project-${video.id}`,
  rootVideoId: video.id,
  name: video.prompt ? `${video.prompt.slice(0, 40)}${video.prompt.length > 40 ? '...' : ''}` : 'Untitled sequence',
  updatedAt: new Date().toISOString(),
  clips: [createClipFromVideo(video)]
});

const drawVideoCover = (context, video, width, height) => {
  if (!context || !video?.videoWidth || !video?.videoHeight) {
    return;
  }

  const sourceAspectRatio = video.videoWidth / video.videoHeight;
  const targetAspectRatio = width / height;

  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = video.videoWidth;
  let sourceHeight = video.videoHeight;

  if (sourceAspectRatio > targetAspectRatio) {
    sourceWidth = video.videoHeight * targetAspectRatio;
    sourceX = (video.videoWidth - sourceWidth) / 2;
  } else {
    sourceHeight = video.videoWidth / targetAspectRatio;
    sourceY = (video.videoHeight - sourceHeight) / 2;
  }

  context.clearRect(0, 0, width, height);
  context.drawImage(
    video,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    width,
    height
  );
};

const waitForVideoMetadata = (videoElement, src) => new Promise((resolve, reject) => {
  if (!videoElement) {
    reject(new Error('Missing video element'));
    return;
  }

  const cleanup = () => {
    videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.removeEventListener('error', handleError);
  };

  const handleLoadedMetadata = () => {
    cleanup();
    resolve();
  };

  const handleError = () => {
    cleanup();
    reject(new Error('Unable to load video metadata'));
  };

  if (videoElement.src === src && videoElement.readyState >= 1) {
    resolve();
    return;
  }

  videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
  videoElement.addEventListener('error', handleError);
  videoElement.src = src;
  videoElement.load();
});

const waitForVideoSeek = (videoElement, time) => new Promise((resolve, reject) => {
  if (!videoElement) {
    reject(new Error('Missing video element'));
    return;
  }

  const targetTime = Math.max(0, time);

  const cleanup = () => {
    videoElement.removeEventListener('seeked', handleSeeked);
    videoElement.removeEventListener('error', handleError);
  };

  const handleSeeked = () => {
    cleanup();
    resolve();
  };

  const handleError = () => {
    cleanup();
    reject(new Error('Unable to seek video'));
  };

  if (Math.abs(videoElement.currentTime - targetTime) < 0.02) {
    resolve();
    return;
  }

  videoElement.addEventListener('seeked', handleSeeked);
  videoElement.addEventListener('error', handleError);
  videoElement.currentTime = targetTime;
});

const waitForClipPlayback = (videoElement, endTime) => new Promise((resolve) => {
  const finish = () => {
    videoElement.removeEventListener('ended', handleEnded);
    cancelAnimationFrame(frameId);
    resolve();
  };

  const handleEnded = () => {
    finish();
  };

  const tick = () => {
    if (videoElement.currentTime >= endTime - 0.04 || videoElement.ended) {
      finish();
      return;
    }

    frameId = requestAnimationFrame(tick);
  };

  let frameId = requestAnimationFrame(tick);
  videoElement.addEventListener('ended', handleEnded);
});

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(5, 8, 18, 0.72);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px;

  @media (max-width: 768px) {
    padding: 12px;
  }
`;

const ModalShell = styled.div`
  width: min(1440px, 100%);
  max-height: min(92vh, 980px);
  background:
    radial-gradient(circle at top left, rgba(255,255,255,0.05), transparent 28%),
    linear-gradient(180deg, rgba(255,255,255,0.02), transparent 30%),
    ${props => props.theme.sidebar};
  border: 1px solid ${props => props.theme.border};
  border-radius: 24px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.38);
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 22px 24px 18px;
  border-bottom: 1px solid ${props => props.theme.border};

  @media (max-width: 768px) {
    padding: 18px 18px 14px;
    flex-direction: column;
    gap: 16px;
  }
`;

const HeaderCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: -0.03em;
`;

const ModalSubtitle = styled.p`
  margin: 0;
  color: ${props => props.theme.textSecondary || `${props.theme.text}88`};
  font-size: 0.9rem;
  line-height: 1.5;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const SecondaryButton = styled.button`
  border: 1px solid ${props => props.theme.border};
  background: transparent;
  color: ${props => props.theme.text};
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: ${props => props.theme.hover || 'rgba(255,255,255,0.05)'};
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const PrimaryButton = styled(SecondaryButton)`
  border: none;
  background: ${props => props.theme.accentBackground || props.theme.primary};
  color: #fff;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 10px 24px ${props => props.theme.accentColor || props.theme.primary}35;
  }
`;

const CloseButton = styled(SecondaryButton)`
  width: 42px;
  height: 42px;
  padding: 0;
  font-size: 1.25rem;
  line-height: 1;
`;

const ModalBody = styled.div`
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) minmax(340px, 0.95fr);
  gap: 0;

  @media (max-width: 1120px) {
    grid-template-columns: minmax(0, 1fr);
    overflow-y: auto;
  }
`;

const EditorColumn = styled.div`
  min-width: 0;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  border-right: 1px solid ${props => props.theme.border};

  @media (max-width: 1120px) {
    border-right: none;
    border-bottom: 1px solid ${props => props.theme.border};
    padding: 18px;
  }
`;

const SidebarColumn = styled.div`
  min-width: 0;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  overflow-y: auto;

  @media (max-width: 1120px) {
    padding: 18px;
  }
`;

const Panel = styled.section`
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: ${props => props.theme.inputBackground || `${props.theme.background}AA`};
  border: 1px solid ${props => props.theme.border};
  border-radius: 18px;
  padding: 16px;
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const PanelTitle = styled.h3`
  margin: 0;
  font-size: 0.98rem;
  font-weight: 700;
  letter-spacing: -0.02em;
`;

const PanelHint = styled.p`
  margin: 0;
  color: ${props => props.theme.textSecondary || `${props.theme.text}88`};
  font-size: 0.8rem;
  line-height: 1.4;
`;

const PreviewStage = styled.div`
  position: relative;
  border-radius: 18px;
  overflow: hidden;
  background:
    radial-gradient(circle at top, rgba(255,255,255,0.08), transparent 35%),
    #050505;
  border: 1px solid rgba(255,255,255,0.06);
  aspect-ratio: 16 / 9;
`;

const PreviewVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  background: #000;
`;

const PreviewFallback = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: rgba(255,255,255,0.8);
  font-size: 0.95rem;
  text-align: center;
  padding: 20px;
`;

const PreviewToolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const TimelineSlider = styled.input`
  width: 100%;
`;

const TimelineTrack = styled.div`
  position: relative;
  display: flex;
  align-items: stretch;
  gap: 8px;
  padding: 12px;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.18);
  overflow-x: auto;
  min-height: 88px;
`;

const TimelinePlayhead = styled.div`
  position: absolute;
  top: 8px;
  bottom: 8px;
  left: ${props => props.$left}%;
  width: 2px;
  border-radius: 999px;
  background: ${props => props.theme.accentColor || props.theme.primary};
  box-shadow: 0 0 0 4px ${props => props.theme.accentSurface || `${props.theme.primary}15`};
  pointer-events: none;
`;

const TimelineClip = styled.button`
  min-width: ${props => props.$minWidth}px;
  flex: ${props => props.$flex};
  border: 1px solid ${props => props.$selected ? (props.theme.accentColor || props.theme.primary) : props.theme.border};
  background:
    linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01)),
    ${props => props.$selected ? (props.theme.accentSurface || `${props.theme.primary}14`) : 'rgba(255,255,255,0.02)'};
  border-radius: 14px;
  color: ${props => props.theme.text};
  padding: 10px;
  cursor: pointer;
  text-align: left;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: ${props => props.theme.accentColor || props.theme.primary};
  }
`;

const TimelineClipLabel = styled.div`
  font-size: 0.82rem;
  font-weight: 700;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const TimelineClipMeta = styled.div`
  font-size: 0.74rem;
  color: ${props => props.theme.textSecondary || `${props.theme.text}88`};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const StatsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const StatPill = styled.span`
  font-size: 0.76rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid ${props => props.theme.border};
  background: rgba(255,255,255,0.02);
`;

const FieldGroup = styled.label`
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.82rem;
  font-weight: 600;
`;

const TextInput = styled.input`
  width: 100%;
  padding: 11px 13px;
  border-radius: 10px;
  border: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.background};
  color: ${props => props.theme.text};
  font-size: 0.88rem;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.accentColor || props.theme.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.accentSurface || `${props.theme.primary}15`};
  }
`;

const SelectInput = styled.select`
  width: 100%;
  padding: 11px 13px;
  border-radius: 10px;
  border: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.background};
  color: ${props => props.theme.text};
  font-size: 0.88rem;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.accentColor || props.theme.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.accentSurface || `${props.theme.primary}15`};
  }

  option {
    background: ${props => props.theme.sidebar};
    color: ${props => props.theme.text};
  }
`;

const RangeRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const RangeMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.78rem;
  color: ${props => props.theme.textSecondary || `${props.theme.text}88`};
`;

const RangeInput = styled.input`
  width: 100%;
`;

const ButtonCluster = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const LibraryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
`;

const LibraryCard = styled.button`
  border: 1px solid ${props => props.theme.border};
  background: rgba(255,255,255,0.02);
  color: ${props => props.theme.text};
  border-radius: 14px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: ${props => props.theme.accentColor || props.theme.primary};
  }
`;

const LibraryThumb = styled.div`
  border-radius: 10px;
  overflow: hidden;
  aspect-ratio: 16 / 9;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;

  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  span {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.72);
    padding: 10px;
    text-align: center;
  }
`;

const LibraryLabel = styled.div`
  font-size: 0.8rem;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const StatusStrip = styled.div`
  min-height: 18px;
  font-size: 0.78rem;
  color: ${props => props.theme.textSecondary || `${props.theme.text}88`};
`;

const EmptyInspector = styled.div`
  border: 1px dashed ${props => props.theme.border};
  border-radius: 14px;
  padding: 18px;
  color: ${props => props.theme.textSecondary || `${props.theme.text}88`};
  font-size: 0.88rem;
  line-height: 1.5;
`;

const VideoEditorModal = ({
  isOpen,
  video,
  project,
  availableVideos,
  previewUrls,
  ensureVideoSource,
  onClose,
  onSave
}) => {
  const toast = useToast();
  const previewVideoRef = useRef(null);
  const metadataRequestsRef = useRef({});
  const activeClipIdRef = useRef(null);
  const playingSequenceRef = useRef(false);

  const [draftProject, setDraftProject] = useState(null);
  const [selectedClipId, setSelectedClipId] = useState(null);
  const [activeClipId, setActiveClipId] = useState(null);
  const [pendingSeek, setPendingSeek] = useState(null);
  const [playhead, setPlayhead] = useState(0);
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);
  const [sourceMetadata, setSourceMetadata] = useState({});
  const [statusMessage, setStatusMessage] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const videosById = useMemo(() => new Map(availableVideos.map((entry) => [entry.id, entry])), [availableVideos]);

  useEffect(() => {
    activeClipIdRef.current = activeClipId;
  }, [activeClipId]);

  useEffect(() => {
    playingSequenceRef.current = isPlayingSequence;
  }, [isPlayingSequence]);

  useEffect(() => {
    if (!isOpen || !video) {
      setDraftProject(null);
      setSelectedClipId(null);
      setActiveClipId(null);
      setPendingSeek(null);
      setPlayhead(0);
      setIsPlayingSequence(false);
      setStatusMessage('');
      return;
    }

    const nextProject = project ? cloneProject(project) : createDefaultProject(video);
    setDraftProject(nextProject);
    setSelectedClipId(nextProject.clips[0]?.id || null);
    setActiveClipId(nextProject.clips[0]?.id || null);
    setPendingSeek(nextProject.clips[0] ? { clipId: nextProject.clips[0].id, time: nextProject.clips[0].trimStart || 0, autoplay: false } : null);
    setPlayhead(0);
    setIsPlayingSequence(false);
    setStatusMessage('');
  }, [isOpen, project, video]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const timelineItems = useMemo(() => {
    if (!draftProject?.clips?.length) {
      return [];
    }

    let runningOffset = 0;

    return draftProject.clips.map((clip, index) => {
      const sourceVideo = videosById.get(clip.sourceVideoId);
      const metadata = sourceMetadata[clip.sourceVideoId];
      const maxDuration = metadata?.duration || DEFAULT_CLIP_DURATION;
      const trimStart = clamp(Number(clip.trimStart) || 0, 0, Math.max(0, maxDuration - MIN_CLIP_DURATION));
      const trimEnd = clamp(
        clip.trimEnd ?? metadata?.duration ?? DEFAULT_CLIP_DURATION,
        trimStart + MIN_CLIP_DURATION,
        maxDuration
      );
      const effectiveDuration = Math.max(MIN_CLIP_DURATION, trimEnd - trimStart);
      const item = {
        ...clip,
        index,
        sourceVideo,
        sourceUrl: previewUrls[clip.sourceVideoId] || sourceVideo?.url || null,
        metadata,
        trimStart,
        trimEnd,
        effectiveDuration,
        startOffset: runningOffset,
        endOffset: runningOffset + effectiveDuration
      };

      runningOffset += effectiveDuration;
      return item;
    });
  }, [draftProject, previewUrls, sourceMetadata, videosById]);

  const totalDuration = useMemo(() => timelineItems.reduce((sum, clip) => sum + clip.effectiveDuration, 0), [timelineItems]);
  const selectedClip = timelineItems.find((clip) => clip.id === selectedClipId) || null;
  const activeClip = timelineItems.find((clip) => clip.id === activeClipId) || selectedClip || timelineItems[0] || null;

  const stopPlayback = useCallback(() => {
    setIsPlayingSequence(false);
    const previewElement = previewVideoRef.current;
    if (previewElement) {
      previewElement.pause();
    }
  }, []);

  const commitProjectUpdate = useCallback((updater) => {
    setDraftProject((previousProject) => {
      if (!previousProject) {
        return previousProject;
      }

      const nextProject = typeof updater === 'function' ? updater(previousProject) : updater;
      return {
        ...nextProject,
        updatedAt: new Date().toISOString()
      };
    });
  }, []);

  const ensureMetadataForVideo = useCallback(async (sourceVideoId) => {
    if (!isOpen || sourceMetadata[sourceVideoId] || metadataRequestsRef.current[sourceVideoId]) {
      return;
    }

    const sourceVideo = videosById.get(sourceVideoId);
    if (!sourceVideo) {
      return;
    }

    metadataRequestsRef.current[sourceVideoId] = true;

    try {
      const sourceUrl = previewUrls[sourceVideoId] || sourceVideo.url || await ensureVideoSource(sourceVideo);
      if (!sourceUrl) {
        return;
      }

      const probe = document.createElement('video');
      probe.preload = 'metadata';
      probe.muted = true;
      probe.playsInline = true;

      await waitForVideoMetadata(probe, sourceUrl);

      setSourceMetadata((previousMetadata) => ({
        ...previousMetadata,
        [sourceVideoId]: {
          duration: Number.isFinite(probe.duration) ? probe.duration : DEFAULT_CLIP_DURATION,
          width: probe.videoWidth || 1280,
          height: probe.videoHeight || 720
        }
      }));
    } catch (error) {
      console.error('Failed to load editor metadata:', error);
    } finally {
      delete metadataRequestsRef.current[sourceVideoId];
    }
  }, [ensureVideoSource, isOpen, previewUrls, sourceMetadata, videosById]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    timelineItems.forEach((clip) => {
      if (clip.sourceVideo) {
        ensureVideoSource(clip.sourceVideo).catch((error) => {
          console.error('Failed to prepare video source for editor:', error);
        });
        ensureMetadataForVideo(clip.sourceVideoId);
      }
    });
  }, [ensureMetadataForVideo, ensureVideoSource, isOpen, timelineItems]);

  useEffect(() => {
    if (!draftProject?.clips?.length) {
      return;
    }

    setDraftProject((previousProject) => {
      if (!previousProject) {
        return previousProject;
      }

      let changed = false;
      const nextClips = previousProject.clips.map((clip) => {
        const metadata = sourceMetadata[clip.sourceVideoId];
        if (!metadata?.duration) {
          return clip;
        }

        const nextTrimStart = clamp(Number(clip.trimStart) || 0, 0, Math.max(0, metadata.duration - MIN_CLIP_DURATION));
        const nextTrimEnd = clamp(
          clip.trimEnd ?? metadata.duration,
          nextTrimStart + MIN_CLIP_DURATION,
          metadata.duration
        );

        if (nextTrimStart !== clip.trimStart || nextTrimEnd !== clip.trimEnd) {
          changed = true;
          return {
            ...clip,
            trimStart: nextTrimStart,
            trimEnd: nextTrimEnd
          };
        }

        return clip;
      });

      return changed
        ? { ...previousProject, clips: nextClips }
        : previousProject;
    });
  }, [draftProject?.clips?.length, sourceMetadata]);

  const selectClip = useCallback((clipId, globalTime = null) => {
    const clip = timelineItems.find((entry) => entry.id === clipId);
    if (!clip) {
      return;
    }

    const localTime = clamp(globalTime ?? 0, 0, Math.max(0, clip.effectiveDuration - 0.02));
    setSelectedClipId(clipId);
    setActiveClipId(clipId);
    setPlayhead(clip.startOffset + localTime);
    setPendingSeek({
      clipId,
      time: clip.trimStart + localTime,
      autoplay: false
    });
  }, [timelineItems]);

  const addClipFromVideo = useCallback((sourceVideo) => {
    stopPlayback();
    ensureVideoSource(sourceVideo).catch((error) => {
      console.error('Failed to prepare added clip source:', error);
    });
    ensureMetadataForVideo(sourceVideo.id);

    const nextClip = createClipFromVideo(sourceVideo);
    commitProjectUpdate((previousProject) => ({
      ...previousProject,
      clips: [...previousProject.clips, nextClip]
    }));

    setSelectedClipId(nextClip.id);
    setActiveClipId(nextClip.id);
    setPendingSeek({ clipId: nextClip.id, time: 0, autoplay: false });
  }, [commitProjectUpdate, ensureMetadataForVideo, ensureVideoSource, stopPlayback]);

  const updateClip = useCallback((clipId, updates) => {
    commitProjectUpdate((previousProject) => ({
      ...previousProject,
      clips: previousProject.clips.map((clip) => (
        clip.id === clipId ? { ...clip, ...updates } : clip
      ))
    }));
  }, [commitProjectUpdate]);

  const moveClip = useCallback((clipId, direction) => {
    commitProjectUpdate((previousProject) => {
      const currentIndex = previousProject.clips.findIndex((clip) => clip.id === clipId);
      const targetIndex = currentIndex + direction;

      if (currentIndex < 0 || targetIndex < 0 || targetIndex >= previousProject.clips.length) {
        return previousProject;
      }

      const nextClips = [...previousProject.clips];
      const [movedClip] = nextClips.splice(currentIndex, 1);
      nextClips.splice(targetIndex, 0, movedClip);

      return {
        ...previousProject,
        clips: nextClips
      };
    });
  }, [commitProjectUpdate]);

  const duplicateClip = useCallback((clipId) => {
    commitProjectUpdate((previousProject) => {
      const currentIndex = previousProject.clips.findIndex((clip) => clip.id === clipId);
      if (currentIndex < 0) {
        return previousProject;
      }

      const originalClip = previousProject.clips[currentIndex];
      const duplicate = {
        ...originalClip,
        id: createClipId(),
        label: `${originalClip.label || 'Clip'} copy`
      };

      const nextClips = [...previousProject.clips];
      nextClips.splice(currentIndex + 1, 0, duplicate);

      return {
        ...previousProject,
        clips: nextClips
      };
    });
  }, [commitProjectUpdate]);

  const removeClip = useCallback((clipId) => {
    commitProjectUpdate((previousProject) => {
      if (previousProject.clips.length <= 1) {
        return previousProject;
      }

      return {
        ...previousProject,
        clips: previousProject.clips.filter((clip) => clip.id !== clipId)
      };
    });

    setSelectedClipId((previousSelectedClipId) => (
      previousSelectedClipId === clipId ? null : previousSelectedClipId
    ));
    setActiveClipId((previousActiveClipId) => (
      previousActiveClipId === clipId ? null : previousActiveClipId
    ));
  }, [commitProjectUpdate]);

  useEffect(() => {
    if (!timelineItems.length) {
      setSelectedClipId(null);
      setActiveClipId(null);
      setPlayhead(0);
      return;
    }

    if (!timelineItems.some((clip) => clip.id === selectedClipId)) {
      setSelectedClipId(timelineItems[0].id);
    }

    if (!timelineItems.some((clip) => clip.id === activeClipId)) {
      setActiveClipId(timelineItems[0].id);
      setPendingSeek({
        clipId: timelineItems[0].id,
        time: timelineItems[0].trimStart,
        autoplay: false
      });
    }
  }, [activeClipId, selectedClipId, timelineItems]);

  const applyPendingSeek = useCallback(() => {
    const previewElement = previewVideoRef.current;

    if (!previewElement || !activeClip) {
      return;
    }

    const nextPendingSeek = pendingSeek?.clipId === activeClip.id
      ? pendingSeek
      : { clipId: activeClip.id, time: activeClip.trimStart, autoplay: false };

    const targetTime = clamp(nextPendingSeek.time, activeClip.trimStart, activeClip.trimEnd);
    const shouldAutoplay = nextPendingSeek.autoplay || playingSequenceRef.current;

    if (Math.abs(previewElement.currentTime - targetTime) > 0.05) {
      previewElement.currentTime = targetTime;
      return;
    }

    setPendingSeek(null);

    if (shouldAutoplay) {
      previewElement.play().catch((error) => {
        console.error('Unable to start preview playback:', error);
        setIsPlayingSequence(false);
      });
    }
  }, [activeClip, pendingSeek]);

  useEffect(() => {
    const previewElement = previewVideoRef.current;

    if (!pendingSeek || !activeClip || !previewElement || previewElement.readyState < 1) {
      return;
    }

    applyPendingSeek();
  }, [activeClip, applyPendingSeek, pendingSeek]);

  const advanceToNextClip = useCallback(() => {
    if (!playingSequenceRef.current || !activeClipIdRef.current) {
      return;
    }

    const currentIndex = timelineItems.findIndex((clip) => clip.id === activeClipIdRef.current);
    const nextClip = timelineItems[currentIndex + 1];

    if (!nextClip) {
      stopPlayback();
      setPlayhead(totalDuration);
      return;
    }

    setActiveClipId(nextClip.id);
    setSelectedClipId(nextClip.id);
    setPendingSeek({
      clipId: nextClip.id,
      time: nextClip.trimStart,
      autoplay: true
    });
  }, [stopPlayback, timelineItems, totalDuration]);

  const handleLoadedMetadata = useCallback(() => {
    applyPendingSeek();
  }, [applyPendingSeek]);

  const handleSeeked = useCallback(() => {
    applyPendingSeek();
  }, [applyPendingSeek]);

  const handleTimeUpdate = useCallback(() => {
    const previewElement = previewVideoRef.current;

    if (!previewElement || !activeClip) {
      return;
    }

    const localTime = clamp(
      previewElement.currentTime - activeClip.trimStart,
      0,
      activeClip.effectiveDuration
    );

    setPlayhead(activeClip.startOffset + localTime);

    if (playingSequenceRef.current && previewElement.currentTime >= activeClip.trimEnd - 0.04) {
      advanceToNextClip();
    }
  }, [activeClip, advanceToNextClip]);

  const handleTimelineScrub = useCallback((event) => {
    const nextPlayhead = Number(event.target.value);
    stopPlayback();
    setPlayhead(nextPlayhead);

    const targetClip = timelineItems.find((clip) => nextPlayhead <= clip.endOffset + 0.001) || timelineItems[timelineItems.length - 1];
    if (!targetClip) {
      return;
    }

    const localTime = clamp(
      nextPlayhead - targetClip.startOffset,
      0,
      Math.max(0, targetClip.effectiveDuration - 0.02)
    );

    setSelectedClipId(targetClip.id);
    setActiveClipId(targetClip.id);
    setPendingSeek({
      clipId: targetClip.id,
      time: targetClip.trimStart + localTime,
      autoplay: false
    });
  }, [stopPlayback, timelineItems]);

  const togglePlayback = useCallback(() => {
    if (!timelineItems.length) {
      return;
    }

    if (playingSequenceRef.current) {
      stopPlayback();
      return;
    }

    const startingClip = timelineItems.find(
      (clip) => playhead >= clip.startOffset && playhead < clip.endOffset
    ) || activeClip || timelineItems[0];

    if (!startingClip) {
      return;
    }

    const localTime = clamp(
      playhead - startingClip.startOffset,
      0,
      Math.max(0, startingClip.effectiveDuration - 0.02)
    );

    setIsPlayingSequence(true);
    setSelectedClipId(startingClip.id);
    setActiveClipId(startingClip.id);
    setPendingSeek({
      clipId: startingClip.id,
      time: startingClip.trimStart + localTime,
      autoplay: true
    });
  }, [activeClip, playhead, stopPlayback, timelineItems]);

  const handleSave = useCallback(() => {
    if (!draftProject) {
      return;
    }

    const sanitizedProject = {
      ...draftProject,
      updatedAt: new Date().toISOString(),
      clips: timelineItems.map((clip) => ({
        id: clip.id,
        sourceVideoId: clip.sourceVideoId,
        trimStart: clip.trimStart,
        trimEnd: clip.trimEnd,
        label: clip.label
      }))
    };

    onSave(sanitizedProject);
    setStatusMessage('Timeline project saved.');
    toast.showSuccessToast('Editor Saved', 'Your timeline edits have been saved.');
  }, [draftProject, onSave, timelineItems, toast]);

  const handleExport = useCallback(async () => {
    if (!timelineItems.length) {
      return;
    }

    if (!window.MediaRecorder) {
      toast.showErrorToast('Export Unsupported', 'This browser does not support in-browser video export.');
      return;
    }

    stopPlayback();
    setIsExporting(true);
    setStatusMessage('Preparing rough cut export...');

    try {
      const sourceUrlByVideoId = {};

      for (const clip of timelineItems) {
        const sourceVideo = videosById.get(clip.sourceVideoId);
        if (!sourceVideo) {
          throw new Error('One of the sequence clips no longer exists.');
        }

        const sourceUrl = previewUrls[clip.sourceVideoId] || sourceVideo.url || await ensureVideoSource(sourceVideo);
        if (!sourceUrl) {
          throw new Error('Could not load one of the clips for export.');
        }

        sourceUrlByVideoId[clip.sourceVideoId] = sourceUrl;
        await ensureMetadataForVideo(clip.sourceVideoId);
      }

      const firstClip = timelineItems[0];
      const firstMetadata = sourceMetadata[firstClip.sourceVideoId];
      const exportWidth = firstMetadata?.width || 1280;
      const exportHeight = firstMetadata?.height || 720;

      const canvas = document.createElement('canvas');
      canvas.width = exportWidth;
      canvas.height = exportHeight;

      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Could not initialize export canvas.');
      }

      if (!canvas.captureStream) {
        throw new Error('Canvas stream capture is not supported in this browser.');
      }

      const stream = canvas.captureStream(EXPORT_FRAME_RATE);
      const recorderMimeType =
        (MediaRecorder.isTypeSupported('video/webm;codecs=vp9') && 'video/webm;codecs=vp9') ||
        (MediaRecorder.isTypeSupported('video/webm;codecs=vp8') && 'video/webm;codecs=vp8') ||
        (MediaRecorder.isTypeSupported('video/webm') && 'video/webm') ||
        '';
      const recorder = recorderMimeType
        ? new MediaRecorder(stream, { mimeType: recorderMimeType })
        : new MediaRecorder(stream);

      const outputChunks = [];
      recorder.ondataavailable = (event) => {
        if (event.data?.size) {
          outputChunks.push(event.data);
        }
      };

      const recorderStopPromise = new Promise((resolve) => {
        recorder.onstop = resolve;
      });

      const exportVideo = document.createElement('video');
      exportVideo.muted = true;
      exportVideo.playsInline = true;
      exportVideo.preload = 'auto';

      let shouldDraw = true;
      let animationFrameId = null;

      const drawFrame = () => {
        if (!shouldDraw) {
          return;
        }

        if (exportVideo.readyState >= 2) {
          drawVideoCover(context, exportVideo, exportWidth, exportHeight);
        }

        animationFrameId = requestAnimationFrame(drawFrame);
      };

      recorder.start();
      drawFrame();

      let exportError = null;

      try {
        for (let index = 0; index < timelineItems.length; index += 1) {
          const clip = timelineItems[index];
          const sourceUrl = sourceUrlByVideoId[clip.sourceVideoId];

          setStatusMessage(`Rendering clip ${index + 1} of ${timelineItems.length}...`);

          await waitForVideoMetadata(exportVideo, sourceUrl);
          await waitForVideoSeek(exportVideo, clip.trimStart);
          await exportVideo.play();
          await waitForClipPlayback(exportVideo, clip.trimEnd);
          exportVideo.pause();
        }
      } catch (error) {
        exportError = error;
      }

      shouldDraw = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      if (recorder.state !== 'inactive') {
        recorder.stop();
      }

      await recorderStopPromise;

      if (exportError) {
        throw exportError;
      }

      const outputBlob = new Blob(outputChunks, { type: recorderMimeType || 'video/webm' });
      const outputUrl = URL.createObjectURL(outputBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = outputUrl;
      downloadLink.download = `${(draftProject?.name || 'edited-video').replace(/[^a-z0-9-_]+/gi, '-').toLowerCase()}.webm`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      URL.revokeObjectURL(outputUrl);

      setStatusMessage('Rough cut exported as WebM.');
      toast.showSuccessToast('Export Complete', 'Downloaded a rough-cut WebM from your current timeline.');
    } catch (error) {
      console.error('Video editor export failed:', error);
      const message = error?.message || 'Unable to export this sequence.';
      setStatusMessage(message);
      toast.showErrorToast('Export Failed', message);
    } finally {
      setIsExporting(false);
    }
  }, [
    draftProject?.name,
    ensureMetadataForVideo,
    ensureVideoSource,
    previewUrls,
    sourceMetadata,
    stopPlayback,
    timelineItems,
    toast,
    videosById
  ]);

  if (!isOpen || !video || !draftProject) {
    return null;
  }

  const clipDuration = selectedClip?.metadata?.duration || DEFAULT_CLIP_DURATION;
  const timelinePlayheadPercent = totalDuration > 0 ? (playhead / totalDuration) * 100 : 0;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalShell onClick={(event) => event.stopPropagation()}>
        <ModalHeader>
          <HeaderCopy>
            <ModalTitle>Video editor</ModalTitle>
            <ModalSubtitle>
              Build a rough cut with a timeline, trim clip in and out points, stack multiple generated
              videos, and export a silent WebM directly in the browser.
            </ModalSubtitle>
          </HeaderCopy>

          <HeaderActions>
            <SecondaryButton onClick={handleExport} disabled={isExporting || !timelineItems.length}>
              {isExporting ? 'Exporting...' : 'Export rough cut'}
            </SecondaryButton>
            <PrimaryButton onClick={handleSave} disabled={!timelineItems.length}>
              Save timeline
            </PrimaryButton>
            <CloseButton onClick={onClose} aria-label="Close video editor">
              ×
            </CloseButton>
          </HeaderActions>
        </ModalHeader>

        <ModalBody>
          <EditorColumn>
            <Panel>
              <PanelHeader>
                <div>
                  <PanelTitle>Program monitor</PanelTitle>
                  <PanelHint>
                    Preview your sequence, scrub the playhead, and jump between clips.
                  </PanelHint>
                </div>
                <StatsRow>
                  <StatPill>{timelineItems.length} clip{timelineItems.length === 1 ? '' : 's'}</StatPill>
                  <StatPill>{formatSeconds(totalDuration)}</StatPill>
                  {project?.clips?.length ? <StatPill>Saved project</StatPill> : null}
                </StatsRow>
              </PanelHeader>

              <PreviewStage>
                {activeClip?.sourceUrl ? (
                  <PreviewVideo
                    ref={previewVideoRef}
                    src={activeClip.sourceUrl}
                    muted
                    playsInline
                    onLoadedMetadata={handleLoadedMetadata}
                    onSeeked={handleSeeked}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={advanceToNextClip}
                  />
                ) : (
                  <PreviewFallback>
                    <strong>Loading preview...</strong>
                    <span>Preparing this clip for editing.</span>
                  </PreviewFallback>
                )}
              </PreviewStage>

              <PreviewToolbar>
                <PrimaryButton onClick={togglePlayback} disabled={!timelineItems.length}>
                  {isPlayingSequence ? 'Pause sequence' : 'Play sequence'}
                </PrimaryButton>
                <SecondaryButton
                  onClick={() => selectClip(activeClip?.id || timelineItems[0]?.id, 0)}
                  disabled={!activeClip}
                >
                  Jump to clip start
                </SecondaryButton>
                {selectedClip ? (
                  <StatPill>
                    {selectedClip.label || 'Selected clip'} · {formatSeconds(selectedClip.effectiveDuration)}
                  </StatPill>
                ) : null}
              </PreviewToolbar>

              <TimelineSlider
                type="range"
                min="0"
                max={Math.max(totalDuration, MIN_CLIP_DURATION)}
                step="0.01"
                value={Math.min(playhead, Math.max(totalDuration, MIN_CLIP_DURATION))}
                onChange={handleTimelineScrub}
              />

              <RangeMeta>
                <span>Playhead {formatSeconds(playhead)}</span>
                <span>Sequence length {formatSeconds(totalDuration)}</span>
              </RangeMeta>
            </Panel>

            <Panel>
              <PanelHeader>
                <div>
                  <PanelTitle>Timeline</PanelTitle>
                  <PanelHint>
                    Click a clip to inspect it. The timeline uses trimmed duration, not original source length.
                  </PanelHint>
                </div>
              </PanelHeader>

              <TimelineTrack>
                {timelineItems.map((clip) => (
                  <TimelineClip
                    key={clip.id}
                    type="button"
                    $selected={clip.id === selectedClipId}
                    $flex={clip.effectiveDuration}
                    $minWidth={Math.max(112, clip.effectiveDuration * 48)}
                    onClick={() => selectClip(clip.id, 0)}
                  >
                    <TimelineClipLabel>{clip.label || clip.sourceVideo?.prompt || 'Clip'}</TimelineClipLabel>
                    <TimelineClipMeta>
                      <span>{formatSeconds(clip.effectiveDuration)}</span>
                      <span>{clip.index + 1}</span>
                    </TimelineClipMeta>
                  </TimelineClip>
                ))}

                {totalDuration > 0 ? (
                  <TimelinePlayhead $left={clamp(timelinePlayheadPercent, 0, 100)} />
                ) : null}
              </TimelineTrack>
            </Panel>

            <StatusStrip>{statusMessage}</StatusStrip>
          </EditorColumn>

          <SidebarColumn>
            <Panel>
              <PanelHeader>
                <div>
                  <PanelTitle>Sequence settings</PanelTitle>
                  <PanelHint>
                    Rename the edit project and keep it attached to this generated video.
                  </PanelHint>
                </div>
              </PanelHeader>

              <FieldGroup>
                Sequence name
                <TextInput
                  value={draftProject.name || ''}
                  onChange={(event) => commitProjectUpdate((previousProject) => ({
                    ...previousProject,
                    name: event.target.value
                  }))}
                  placeholder="Untitled sequence"
                />
              </FieldGroup>
            </Panel>

            <Panel>
              <PanelHeader>
                <div>
                  <PanelTitle>Clip inspector</PanelTitle>
                  <PanelHint>
                    Adjust the selected clip, swap its source, and control its trim points.
                  </PanelHint>
                </div>
              </PanelHeader>

              {selectedClip ? (
                <>
                  <FieldGroup>
                    Clip label
                    <TextInput
                      value={selectedClip.label || ''}
                      onChange={(event) => updateClip(selectedClip.id, { label: event.target.value })}
                      placeholder="Clip title"
                    />
                  </FieldGroup>

                  <FieldGroup>
                    Source clip
                    <SelectInput
                      value={selectedClip.sourceVideoId}
                      onChange={(event) => {
                        const nextSourceVideoId = event.target.value;
                        const nextSourceVideo = videosById.get(nextSourceVideoId);
                        if (nextSourceVideo) {
                          ensureVideoSource(nextSourceVideo).catch((error) => {
                            console.error('Failed to prepare source change preview:', error);
                          });
                          ensureMetadataForVideo(nextSourceVideoId);
                        }
                        updateClip(selectedClip.id, {
                          sourceVideoId: nextSourceVideoId,
                          trimStart: 0,
                          trimEnd: null
                        });
                        setPendingSeek({ clipId: selectedClip.id, time: 0, autoplay: false });
                      }}
                    >
                      {availableVideos.map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {entry.prompt ? entry.prompt.slice(0, 72) : `Video ${entry.id}`}
                        </option>
                      ))}
                    </SelectInput>
                  </FieldGroup>

                  <RangeRow>
                    <RangeMeta>
                      <span>Trim in</span>
                      <span>{formatSeconds(selectedClip.trimStart)}</span>
                    </RangeMeta>
                    <RangeInput
                      type="range"
                      min="0"
                      max={Math.max(clipDuration - MIN_CLIP_DURATION, MIN_CLIP_DURATION)}
                      step="0.01"
                      value={selectedClip.trimStart}
                      onChange={(event) => {
                        const nextTrimStart = Number(event.target.value);
                        updateClip(selectedClip.id, {
                          trimStart: nextTrimStart,
                          trimEnd: Math.max(selectedClip.trimEnd, nextTrimStart + MIN_CLIP_DURATION)
                        });
                        setPendingSeek({
                          clipId: selectedClip.id,
                          time: nextTrimStart,
                          autoplay: false
                        });
                      }}
                    />
                  </RangeRow>

                  <RangeRow>
                    <RangeMeta>
                      <span>Trim out</span>
                      <span>{formatSeconds(selectedClip.trimEnd)}</span>
                    </RangeMeta>
                    <RangeInput
                      type="range"
                      min={selectedClip.trimStart + MIN_CLIP_DURATION}
                      max={clipDuration}
                      step="0.01"
                      value={selectedClip.trimEnd}
                      onChange={(event) => updateClip(selectedClip.id, {
                        trimEnd: Number(event.target.value)
                      })}
                    />
                  </RangeRow>

                  <StatsRow>
                    <StatPill>Source {formatSeconds(clipDuration)}</StatPill>
                    <StatPill>Used {formatSeconds(selectedClip.effectiveDuration)}</StatPill>
                  </StatsRow>

                  <ButtonCluster>
                    <SecondaryButton
                      onClick={() => moveClip(selectedClip.id, -1)}
                      disabled={selectedClip.index === 0}
                    >
                      Move left
                    </SecondaryButton>
                    <SecondaryButton
                      onClick={() => moveClip(selectedClip.id, 1)}
                      disabled={selectedClip.index === timelineItems.length - 1}
                    >
                      Move right
                    </SecondaryButton>
                    <SecondaryButton onClick={() => duplicateClip(selectedClip.id)}>
                      Duplicate
                    </SecondaryButton>
                    <SecondaryButton
                      onClick={() => removeClip(selectedClip.id)}
                      disabled={timelineItems.length <= 1}
                    >
                      Remove
                    </SecondaryButton>
                  </ButtonCluster>
                </>
              ) : (
                <EmptyInspector>
                  Select a timeline clip to edit it.
                </EmptyInspector>
              )}
            </Panel>

            <Panel>
              <PanelHeader>
                <div>
                  <PanelTitle>Video library</PanelTitle>
                  <PanelHint>
                    Add more generated videos to the timeline to build a longer sequence.
                  </PanelHint>
                </div>
              </PanelHeader>

              <LibraryGrid>
                {availableVideos.map((entry) => (
                  <LibraryCard key={entry.id} type="button" onClick={() => addClipFromVideo(entry)}>
                    <LibraryThumb>
                      {previewUrls[entry.id] || entry.url ? (
                        <video src={previewUrls[entry.id] || entry.url} muted playsInline />
                      ) : (
                        <span>Preparing preview</span>
                      )}
                    </LibraryThumb>
                    <LibraryLabel>{entry.prompt || 'Untitled clip'}</LibraryLabel>
                  </LibraryCard>
                ))}
              </LibraryGrid>
            </Panel>
          </SidebarColumn>
        </ModalBody>
      </ModalShell>
    </ModalOverlay>
  );
};

export default VideoEditorModal;

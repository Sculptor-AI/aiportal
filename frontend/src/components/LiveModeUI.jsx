import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled, { css, keyframes } from 'styled-components';
import ModelIcon from './ModelIcon';
import AudioVisualizer from './AudioVisualizer';
import useGeminiLive from '../hooks/useGeminiLive';
import { useTranslation } from '../contexts/TranslationContext';
import { GEMINI_LIVE_NATIVE_AUDIO_MODEL_ID } from '../config/modelConfig';
import kokoroTTSService, { DEFAULT_KOKORO_VOICE } from '../services/kokoroTTSService';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(16px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulseGlow = keyframes`
  0% {
    opacity: 0.28;
    transform: scale(0.92);
  }

  50% {
    opacity: 0.68;
    transform: scale(1.04);
  }

  100% {
    opacity: 0.28;
    transform: scale(0.92);
  }
`;

const shimmer = keyframes`
  0% {
    transform: translateX(-100%);
  }

  100% {
    transform: translateX(100%);
  }
`;

const Container = styled.div`
  position: absolute;
  inset: 0;
  z-index: 220;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding:
    max(24px, env(safe-area-inset-top))
    max(24px, env(safe-area-inset-right))
    max(24px, env(safe-area-inset-bottom))
    max(24px, env(safe-area-inset-left));
  color: ${props => props.theme.text};
  background:
    radial-gradient(circle at top left, ${props => `${props.theme.text}0f`} 0%, transparent 42%),
    radial-gradient(circle at bottom right, ${props => `${props.theme.border}66`} 0%, transparent 34%),
    linear-gradient(180deg, ${props => props.theme.background} 0%, ${props => props.theme.inputBackground} 100%);
  overflow: hidden;
  animation: ${fadeIn} 0.32s ease-out;
  font-family: ${props => props.theme.fontFamily || 'var(--font-family)'};

  @media (max-width: 980px) {
    gap: 18px;
    padding:
      max(18px, env(safe-area-inset-top))
      max(18px, env(safe-area-inset-right))
      max(18px, env(safe-area-inset-bottom))
      max(18px, env(safe-area-inset-left));
  }
`;

const TopBar = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
`;

const TopBarGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
`;

const Chip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  padding: 10px 16px;
  border-radius: 999px;
  border: 1px solid ${props => props.theme.border};
  background: ${props => `${props.theme.inputBackground}dd`};
  color: ${props => props.theme.text};
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  font-size: 0.86rem;
  letter-spacing: 0.01em;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);

  ${props => props.$tone === 'recording' && css`
    border-color: rgba(234, 67, 53, 0.36);

    &::before {
      background: #ea4335;
      box-shadow: 0 0 0 6px rgba(234, 67, 53, 0.14);
    }
  `}

  ${props => props.$tone === 'processing' && css`
    border-color: rgba(251, 188, 4, 0.38);

    &::before {
      background: #fbbc04;
      box-shadow: 0 0 0 6px rgba(251, 188, 4, 0.12);
    }
  `}

  ${props => props.$tone === 'connected' && css`
    border-color: rgba(52, 168, 83, 0.3);

    &::before {
      background: #34a853;
      box-shadow: 0 0 0 6px rgba(52, 168, 83, 0.12);
    }
  `}

  ${props => props.$withDot && css`
    &::before {
      content: '';
      width: 9px;
      height: 9px;
      border-radius: 999px;
      flex: 0 0 auto;
    }
  `}
`;

const CloseButton = styled.button`
  width: 44px;
  height: 44px;
  border-radius: 999px;
  border: 1px solid ${props => props.theme.border};
  background: ${props => `${props.theme.inputBackground}dd`};
  color: ${props => props.theme.text};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);

  &:hover {
    transform: translateY(-1px);
    background: ${props => props.theme.inputBackground};
    border-color: ${props => `${props.theme.text}33`};
  }

  &:active {
    transform: translateY(0);
  }
`;

const ContentGrid = styled.div`
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.95fr);
  gap: 24px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(320px, 0.95fr) minmax(0, 1fr);
    gap: 18px;
  }
`;

const Panel = styled.section`
  position: relative;
  min-height: 0;
  border-radius: 32px;
  border: 1px solid ${props => `${props.theme.border}cc`};
  background: linear-gradient(180deg, ${props => `${props.theme.inputBackground}f7`} 0%, ${props => `${props.theme.background}f5`} 100%);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12);
  overflow: hidden;
`;

const StagePanel = styled(Panel)`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 28px;
  gap: 24px;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 18% 12%, ${props => `${props.theme.text}10`} 0%, transparent 32%),
      radial-gradient(circle at 85% 78%, ${props => `${props.theme.border}4d`} 0%, transparent 24%);
    pointer-events: none;
  }

  @media (max-width: 980px) {
    padding: 22px;
    gap: 18px;
  }
`;

const StageMeta = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const StageTitle = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Eyebrow = styled.span`
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${props => `${props.theme.text}88`};
`;

const StageHeading = styled.h2`
  margin: 0;
  font-size: clamp(1.7rem, 2.8vw, 2.6rem);
  line-height: 1.05;
  letter-spacing: -0.03em;
`;

const StageSubcopy = styled.p`
  margin: 0;
  font-size: 0.96rem;
  color: ${props => `${props.theme.text}a0`};
  max-width: 42rem;
`;

const ModeChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const StageBody = styled.div`
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MediaFrame = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 360px;
  border-radius: 28px;
  overflow: hidden;
  border: 1px solid ${props => `${props.theme.border}cc`};
  background: rgba(15, 23, 42, 0.88);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);

  @media (max-width: 980px) {
    min-height: 300px;
  }
`;

const VideoSurface = styled.video`
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #020617;
`;

const OrbStage = styled.div`
  position: relative;
  width: min(100%, 520px);
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const OrbGlow = styled.div`
  position: absolute;
  inset: 8%;
  border-radius: 999px;
  background:
    radial-gradient(circle, ${props => `${props.theme.text}18`} 0%, ${props => `${props.theme.border}10`} 48%, transparent 74%);
  filter: blur(24px);
  animation: ${pulseGlow} 4.4s ease-in-out infinite;
`;

const OrbShell = styled.div`
  position: relative;
  width: min(100%, 310px);
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${props => `${props.theme.border}cc`};
  background:
    linear-gradient(145deg, ${props => `${props.theme.inputBackground}ff`} 0%, ${props => `${props.theme.background}fb`} 100%);
  box-shadow:
    0 24px 50px rgba(15, 23, 42, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
`;

const OrbLabel = styled.div`
  position: absolute;
  bottom: 24px;
  left: 24px;
  right: 24px;
  display: flex;
  justify-content: center;
  text-align: center;
  color: ${props => `${props.theme.text}92`};
  font-size: 0.94rem;
`;

const StageFooter = styled.div`
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const DetailCard = styled.div`
  padding: 16px 18px;
  border-radius: 22px;
  border: 1px solid ${props => `${props.theme.border}b3`};
  background: ${props => `${props.theme.background}b8`};
`;

const DetailLabel = styled.div`
  font-size: 0.76rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${props => `${props.theme.text}75`};
  margin-bottom: 8px;
`;

const DetailValue = styled.div`
  font-size: 0.95rem;
  color: ${props => `${props.theme.text}d8`};
`;

const TranscriptPanel = styled(Panel)`
  display: flex;
  flex-direction: column;
  min-height: 0;
`;

const TranscriptHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 24px 24px 18px;
  border-bottom: 1px solid ${props => `${props.theme.border}a6`};
`;

const TranscriptHeading = styled.h3`
  margin: 0;
  font-size: 1.1rem;
`;

const TranscriptSubcopy = styled.p`
  margin: 6px 0 0;
  color: ${props => `${props.theme.text}8f`};
  font-size: 0.92rem;
`;

const TranscriptBody = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px 24px 24px;
  overflow-y: auto;
`;

const TranscriptCard = styled.article`
  padding: 16px 18px;
  border-radius: 22px;
  border: 1px solid ${props => props.$role === 'user' ? `${props.theme.border}dd` : `${props.theme.text}22`};
  background: ${props => props.$role === 'user' ? `${props.theme.background}c4` : `${props.theme.text}0a`};
  color: ${props => props.theme.text};
  animation: ${fadeIn} 0.22s ease-out;
`;

const TranscriptLabel = styled.div`
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${props => `${props.theme.text}72`};
  margin-bottom: 10px;
`;

const TranscriptText = styled.p`
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.55;
  font-size: 0.98rem;
`;

const PlaceholderState = styled.div`
  flex: 1;
  min-height: 220px;
  display: grid;
  place-items: center;
  text-align: center;
  color: ${props => `${props.theme.text}72`};
  padding: 28px;
`;

const ControlsBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 18px 22px;
  margin: 0 auto;
  width: fit-content;
  max-width: 100%;
  border-radius: 999px;
  border: 1px solid ${props => `${props.theme.border}cc`};
  background: ${props => `${props.theme.inputBackground}e6`};
  box-shadow: 0 24px 50px rgba(15, 23, 42, 0.16);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);

  @media (max-width: 640px) {
    width: 100%;
    justify-content: space-between;
    padding: 14px 16px;
  }
`;

const ControlButton = styled.button`
  width: 58px;
  height: 58px;
  border-radius: 999px;
  border: 1px solid ${props => props.$isActive ? 'transparent' : `${props.theme.border}cc`};
  background: ${props => {
    if (props.$variant === 'danger' && props.$isActive) {
      return '#ea4335';
    }

    if (props.$isActive) {
      return props.theme.text;
    }

    return props.theme.background;
  }};
  color: ${props => {
    if (props.$variant === 'danger' && props.$isActive) {
      return '#ffffff';
    }

    return props.$isActive ? props.theme.background : props.theme.text;
  }};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.18s ease, opacity 0.18s ease, border-color 0.18s ease, background-color 0.18s ease;
  box-shadow: ${props => props.$isActive ? '0 12px 30px rgba(15, 23, 42, 0.18)' : 'none'};

  &:hover {
    transform: translateY(-1px);
    opacity: 0.96;
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    width: 24px;
    height: 24px;
  }
`;

const ErrorBanner = styled.div`
  padding: 12px 16px;
  border-radius: 18px;
  border: 1px solid rgba(234, 67, 53, 0.22);
  background: rgba(234, 67, 53, 0.12);
  color: #ea4335;
  font-size: 0.92rem;
`;

const ProgressTrack = styled.div`
  position: relative;
  width: 180px;
  height: 8px;
  border-radius: 999px;
  overflow: hidden;
  background: ${props => `${props.theme.text}12`};
`;

const ProgressFill = styled.div`
  position: absolute;
  inset: 0;
  width: ${props => `${Math.max(6, Math.round(props.$value * 100))}%`};
  border-radius: inherit;
  background: linear-gradient(90deg, #34a853 0%, #4285f4 100%);
  transition: width 0.2s ease;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%);
    animation: ${shimmer} 1.8s linear infinite;
  }
`;

const MAX_TRANSCRIPT_TURNS = 10;

const createTurnId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `turn-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const normalizeText = (value = '') => value.replace(/\s+/g, ' ').trim();

const appendTurn = (turns, role, text) => {
  const normalizedText = normalizeText(text);

  if (!normalizedText) {
    return turns;
  }

  return [
    ...turns,
    {
      id: createTurnId(),
      role,
      text: normalizedText,
    },
  ].slice(-MAX_TRANSCRIPT_TURNS);
};

const getProgressValue = (payload) => {
  if (typeof payload?.progress === 'number') {
    return payload.progress > 1 ? payload.progress / 100 : payload.progress;
  }

  if (typeof payload?.loaded === 'number' && typeof payload?.total === 'number' && payload.total > 0) {
    return payload.loaded / payload.total;
  }

  return null;
};

const getProgressLabel = (payload) => {
  if (typeof payload?.file === 'string') {
    return payload.file.split('/').pop();
  }

  if (typeof payload?.status === 'string') {
    return payload.status.replace(/_/g, ' ');
  }

  return 'Preparing Kokoro voice engine';
};

const LiveModeUI = ({ selectedModel, onClose }) => {
  const { t } = useTranslation();
  const [cameraActive, setCameraActive] = useState(false);
  const [screenShareActive, setScreenShareActive] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [screenError, setScreenError] = useState('');
  const [ttsStatus, setTtsStatus] = useState('loading');
  const [ttsProgress, setTtsProgress] = useState(0);
  const [ttsProgressLabel, setTtsProgressLabel] = useState('Preparing Kokoro voice engine');
  const [ttsError, setTtsError] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcriptTurns, setTranscriptTurns] = useState([]);

  const cameraVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const transcriptBodyRef = useRef(null);
  const previousStatusRef = useRef('disconnected');
  const assistantTurnCommittedRef = useRef(false);
  const latestAssistantResponseRef = useRef('');
  const pendingSpeechTextRef = useRef('');

  const {
    isConnected,
    isRecording,
    sessionActive,
    response,
    error: geminiError,
    status,
    inputTranscription,
    inputModeLabel,
    connect,
    disconnect,
    startSession,
    startRecording,
    stopRecording,
  } = useGeminiLive({
    model: selectedModel?.includes('gemini') ? selectedModel : GEMINI_LIVE_NATIVE_AUDIO_MODEL_ID,
    responseModality: 'text',
    voiceName: 'Aoede',
    systemInstruction: 'You are a helpful AI assistant having a live spoken conversation. Respond naturally, speak in short paragraphs, and leave small pauses where helpful.',
    inputTranscriptionEnabled: true,
    outputTranscriptionEnabled: true,
    autoConnect: false,
    outputAudioMode: 'none',
  });

  const stopCameraStream = useCallback(() => {
    setCameraStream((currentStream) => {
      currentStream?.getTracks().forEach((track) => track.stop());
      return null;
    });
    setCameraActive(false);
  }, []);

  const stopScreenStream = useCallback(() => {
    setScreenStream((currentStream) => {
      currentStream?.getTracks().forEach((track) => track.stop());
      return null;
    });
    setScreenShareActive(false);
  }, []);

  const speakAssistantText = useCallback(async (text) => {
    const nextText = normalizeText(text);

    if (!nextText || ttsStatus !== 'ready') {
      return;
    }

    pendingSpeechTextRef.current = '';
    setIsSpeaking(true);

    try {
      await kokoroTTSService.speak(nextText, {
        voice: DEFAULT_KOKORO_VOICE,
      });
      setTtsError('');
    } catch (error) {
      console.error('Kokoro playback failed:', error);
      setTtsStatus('error');
      setTtsError('Kokoro playback failed. Responses will stay on screen, but voice playback is unavailable for now.');
    } finally {
      setIsSpeaking(false);
    }
  }, [ttsStatus]);

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      try {
        setTtsStatus('loading');
        await kokoroTTSService.preload({
          progressCallback: (payload) => {
            if (cancelled) {
              return;
            }

            const nextProgress = getProgressValue(payload);
            if (typeof nextProgress === 'number') {
              setTtsProgress(Math.max(0, Math.min(1, nextProgress)));
            }

            setTtsProgressLabel(getProgressLabel(payload));
          },
        });

        if (!cancelled) {
          setTtsStatus('ready');
          setTtsProgress(1);
          setTtsProgressLabel('Kokoro voice engine ready');
        }
      } catch (error) {
        console.error('Failed to preload Kokoro:', error);

        if (!cancelled) {
          setTtsStatus('error');
          setTtsError('Kokoro voice engine could not load. Live mode will continue with text responses only.');
        }
      }
    };

    initialize();

    return () => {
      cancelled = true;
      kokoroTTSService.stop();
    };
  }, []);

  useEffect(() => {
    if (!isConnected) {
      connect();
    }
  }, [connect, isConnected]);

  useEffect(() => {
    return () => {
      stopCameraStream();
      stopScreenStream();
      disconnect();
    };
  }, [disconnect, stopCameraStream, stopScreenStream]);

  useEffect(() => {
    if (!isConnected || sessionActive || status !== 'connected') {
      return;
    }

    startSession({
      responseModality: 'text',
      outputAudioMode: 'none',
      inputTranscription: true,
      outputTranscription: true,
    });
  }, [isConnected, sessionActive, startSession, status]);

  useEffect(() => {
    if (cameraVideoRef.current && cameraStream) {
      cameraVideoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  useEffect(() => {
    latestAssistantResponseRef.current = normalizeText(response);
  }, [response]);

  useEffect(() => {
    if (status === 'processing' && previousStatusRef.current !== 'processing') {
      const transcriptText = normalizeText(inputTranscription);

      if (transcriptText) {
        assistantTurnCommittedRef.current = false;
        setTranscriptTurns((currentTurns) => appendTurn(currentTurns, 'user', transcriptText));
      }
    }

    previousStatusRef.current = status;
  }, [inputTranscription, status]);

  useEffect(() => {
    if (status !== 'turn_complete' || assistantTurnCommittedRef.current) {
      return;
    }

    const finalAssistantText = latestAssistantResponseRef.current;

    if (!finalAssistantText) {
      return;
    }

    assistantTurnCommittedRef.current = true;
    setTranscriptTurns((currentTurns) => appendTurn(currentTurns, 'assistant', finalAssistantText));

    if (ttsStatus === 'ready') {
      speakAssistantText(finalAssistantText);
    } else if (ttsStatus === 'loading') {
      pendingSpeechTextRef.current = finalAssistantText;
    }
  }, [speakAssistantText, status, ttsStatus]);

  useEffect(() => {
    if (ttsStatus !== 'ready' || !pendingSpeechTextRef.current || isSpeaking) {
      return;
    }

    speakAssistantText(pendingSpeechTextRef.current);
  }, [isSpeaking, speakAssistantText, ttsStatus]);

  useEffect(() => {
    transcriptBodyRef.current?.scrollTo({
      top: transcriptBodyRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [inputTranscription, response, transcriptTurns]);

  const handleMicrophoneToggle = useCallback(async () => {
    if (isSpeaking) {
      kokoroTTSService.stop();
      setIsSpeaking(false);
    }

    if (isRecording) {
      stopRecording();
      return;
    }

    if (!isConnected) {
      await connect();
    }

    if (!sessionActive) {
      await startSession({
        responseModality: 'text',
        outputAudioMode: 'none',
        inputTranscription: true,
        outputTranscription: true,
      });
    }

    await startRecording();
  }, [connect, isConnected, isRecording, isSpeaking, sessionActive, startRecording, startSession, stopRecording]);

  const handleCameraToggle = useCallback(async () => {
    if (cameraActive) {
      stopCameraStream();
      return;
    }

    if (screenShareActive) {
      stopScreenStream();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      });

      setCameraStream(stream);
      setCameraActive(true);
      setCameraError('');
    } catch (error) {
      console.error(error);
      setCameraError(t('liveMode.errors.cameraDenied', 'Camera access denied'));
    }
  }, [cameraActive, screenShareActive, stopCameraStream, stopScreenStream, t]);

  const handleScreenShareToggle = useCallback(async () => {
    if (screenShareActive) {
      stopScreenStream();
      return;
    }

    if (cameraActive) {
      stopCameraStream();
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false,
      });

      stream.getVideoTracks()[0]?.addEventListener('ended', () => {
        stopScreenStream();
      });

      setScreenStream(stream);
      setScreenShareActive(true);
      setScreenError('');
    } catch (error) {
      console.error(error);
      setScreenError(t('liveMode.errors.screenDenied', 'Screen share denied'));
    }
  }, [cameraActive, screenShareActive, stopCameraStream, stopScreenStream, t]);

  const activeError = cameraError || screenError || ttsError || (typeof geminiError === 'string' ? geminiError : '');
  const hasVideo = cameraActive || screenShareActive;
  const liveDraft = normalizeText(inputTranscription);
  const liveResponse = normalizeText(response);

  const stageCopy = useMemo(() => {
    if (isRecording) {
      return t('liveMode.status.listening', 'Listening');
    }

    if (isSpeaking) {
      return 'Speaking';
    }

    if (status === 'processing' || status === 'responding') {
      return t('liveMode.status.thinking', 'Thinking');
    }

    if (ttsStatus === 'loading') {
      return 'Preparing voice';
    }

    return t('liveMode.status.ready', 'Ready');
  }, [isRecording, isSpeaking, status, t, ttsStatus]);

  const topStatusTone = useMemo(() => {
    if (!isConnected || !sessionActive) {
      return 'processing';
    }

    if (isRecording) {
      return 'recording';
    }

    if (isSpeaking || status === 'processing' || status === 'responding' || ttsStatus === 'loading') {
      return 'processing';
    }

    return 'connected';
  }, [isConnected, isRecording, isSpeaking, sessionActive, status, ttsStatus]);

  const topStatusText = useMemo(() => {
    if (!isConnected) {
      return t('liveMode.status.connecting', 'Connecting...');
    }

    if (!sessionActive) {
      return t('liveMode.status.starting', 'Starting...');
    }

    return stageCopy;
  }, [isConnected, sessionActive, stageCopy, t]);

  const transcriptItems = useMemo(() => {
    const items = [...transcriptTurns];

    if (isRecording && liveDraft) {
      items.push({
        id: 'draft-user',
        role: 'user',
        text: liveDraft,
        isDraft: true,
      });
    }

    if (status === 'responding' && liveResponse) {
      items.push({
        id: 'draft-assistant',
        role: 'assistant',
        text: liveResponse,
        isDraft: true,
      });
    }

    return items;
  }, [isRecording, liveDraft, liveResponse, status, transcriptTurns]);

  return (
    <Container>
      <TopBar>
        <TopBarGroup>
          <Chip $tone={topStatusTone} $withDot>
            {topStatusText}
          </Chip>
          <Chip>{inputModeLabel}</Chip>
          <Chip>
            {ttsStatus === 'ready' ? 'Kokoro voice' : ttsStatus === 'loading' ? 'Loading Kokoro' : 'Text only'}
          </Chip>
        </TopBarGroup>

        <CloseButton onClick={onClose} aria-label={t('liveMode.controls.close', 'Close Live Mode')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </CloseButton>
      </TopBar>

      {activeError && (
        <ErrorBanner>
          {activeError}
        </ErrorBanner>
      )}

      <ContentGrid>
        <StagePanel>
          <StageMeta>
            <StageTitle>
              <Eyebrow>Live conversation</Eyebrow>
              <StageHeading>{stageCopy}</StageHeading>
              <StageSubcopy>
                Voice replies come from Kokoro in the browser. Speech input prefers native browser speech recognition when the platform exposes it.
              </StageSubcopy>
            </StageTitle>

            <ModeChips>
              <Chip>{cameraActive ? 'Camera on' : screenShareActive ? 'Screen sharing' : 'Audio focus'}</Chip>
              <Chip>{selectedModel || GEMINI_LIVE_NATIVE_AUDIO_MODEL_ID}</Chip>
            </ModeChips>
          </StageMeta>

          <StageBody>
            {hasVideo ? (
              <MediaFrame>
                <VideoSurface
                  ref={cameraActive ? cameraVideoRef : screenVideoRef}
                  autoPlay
                  muted
                  playsInline
                />
              </MediaFrame>
            ) : (
              <OrbStage>
                <OrbGlow />
                <OrbShell>
                  <AudioVisualizer isActive={isRecording || isSpeaking || status === 'processing' || status === 'responding'} />
                  <ModelIcon modelId={selectedModel} size="large" />
                  <OrbLabel>
                    {isRecording ? 'Speak naturally, then pause.' : isSpeaking ? 'Kokoro is reading the reply.' : 'Tap the mic to start the next turn.'}
                  </OrbLabel>
                </OrbShell>
              </OrbStage>
            )}
          </StageBody>

          <StageFooter>
            <DetailCard>
              <DetailLabel>Speech input</DetailLabel>
              <DetailValue>{inputModeLabel}</DetailValue>
            </DetailCard>
            <DetailCard>
              <DetailLabel>Speech output</DetailLabel>
              <DetailValue>{ttsStatus === 'ready' ? 'Kokoro local browser TTS' : ttsStatus === 'loading' ? ttsProgressLabel : 'Text responses only'}</DetailValue>
            </DetailCard>
            <DetailCard>
              <DetailLabel>Current model</DetailLabel>
              <DetailValue>{selectedModel?.includes('gemini') ? selectedModel : GEMINI_LIVE_NATIVE_AUDIO_MODEL_ID}</DetailValue>
            </DetailCard>
          </StageFooter>
        </StagePanel>

        <TranscriptPanel>
          <TranscriptHeader>
            <div>
              <TranscriptHeading>Conversation</TranscriptHeading>
              <TranscriptSubcopy>
                The right panel keeps the last turns readable instead of layering them over the stage.
              </TranscriptSubcopy>
            </div>

            {ttsStatus === 'loading' && (
              <div>
                <TranscriptLabel>{ttsProgressLabel}</TranscriptLabel>
                <ProgressTrack>
                  <ProgressFill $value={ttsProgress} />
                </ProgressTrack>
              </div>
            )}
          </TranscriptHeader>

          <TranscriptBody ref={transcriptBodyRef}>
            {transcriptItems.length === 0 ? (
              <PlaceholderState>
                Tap the microphone to start the first turn. Transcripts and model replies will stack here as a readable live feed.
              </PlaceholderState>
            ) : (
              transcriptItems.map((item) => (
                <TranscriptCard key={item.id} $role={item.role}>
                  <TranscriptLabel>
                    {item.role === 'user' ? 'You' : 'Assistant'}
                    {item.isDraft ? ' • live' : ''}
                  </TranscriptLabel>
                  <TranscriptText>{item.text}</TranscriptText>
                </TranscriptCard>
              ))
            )}
          </TranscriptBody>
        </TranscriptPanel>
      </ContentGrid>

      <ControlsBar>
        <ControlButton
          $isActive={isRecording}
          $variant="danger"
          onClick={handleMicrophoneToggle}
          title={isRecording ? t('liveMode.controls.mic.mute', 'Mute Microphone') : t('liveMode.controls.mic.unmute', 'Unmute Microphone')}
        >
          {isRecording ? (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="2" />
            </svg>
          )}
        </ControlButton>

        <ControlButton
          $isActive={cameraActive}
          onClick={handleCameraToggle}
          title={cameraActive ? t('liveMode.controls.camera.off', 'Turn Off Camera') : t('liveMode.controls.camera.on', 'Turn On Camera')}
        >
          {cameraActive ? (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82l-1-1H16c.55 0 1 .45 1 1v3.5l4-4v11l-1.43-1.43L21 6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.55-.18L19.73 21 21 19.73 3.27 2z" />
            </svg>
          )}
        </ControlButton>

        <ControlButton
          $isActive={screenShareActive}
          onClick={handleScreenShareToggle}
          title={screenShareActive ? t('liveMode.controls.screen.stop', 'Stop Sharing') : t('liveMode.controls.screen.start', 'Share Screen')}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z" />
          </svg>
        </ControlButton>
      </ControlsBar>
    </Container>
  );
};

export default LiveModeUI;

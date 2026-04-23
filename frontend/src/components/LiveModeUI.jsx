import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled, { css, keyframes } from 'styled-components';
import useGeminiLive from '../hooks/useGeminiLive';
import { useTranslation } from '../contexts/TranslationContext';
import { GEMINI_LIVE_NATIVE_AUDIO_MODEL_ID } from '../config/modelConfig';
import kokoroTTSService, { DEFAULT_KOKORO_VOICE } from '../services/kokoroTTSService';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const orbBreathe = keyframes`
  0%   { transform: scale(1);     filter: blur(0px) saturate(1);   }
  50%  { transform: scale(1.045); filter: blur(0.4px) saturate(1.08); }
  100% { transform: scale(1);     filter: blur(0px) saturate(1);   }
`;

const orbSpin = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

const orbSpinReverse = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(-360deg); }
`;

const ringPulse = keyframes`
  0%   { transform: scale(0.96); opacity: 0.0; }
  30%  { opacity: 0.22; }
  100% { transform: scale(1.45); opacity: 0; }
`;

const dotFlash = keyframes`
  0%, 80%, 100% { opacity: 0.25; transform: translateY(0); }
  40%           { opacity: 1;    transform: translateY(-2px); }
`;

const shimmer = keyframes`
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

const Container = styled.div`
  position: absolute;
  inset: 0;
  z-index: 220;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding:
    max(20px, env(safe-area-inset-top))
    max(20px, env(safe-area-inset-right))
    max(28px, env(safe-area-inset-bottom))
    max(20px, env(safe-area-inset-left));
  color: ${props => props.theme.text};
  background: ${props => props.theme.chat || props.theme.background};
  overflow: hidden;
  animation: ${fadeIn} 0.32s ease-out;
  font-family: ${props => props.theme.fontFamily || 'var(--font-family)'};
`;

const TopBar = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  z-index: 2;
`;

const StatusPill = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px 8px 14px;
  border-radius: 999px;
  background: ${props => props.theme.inputBackground};
  border: 1px solid ${props => props.theme.border};
  color: ${props => props.theme.textSecondary || props.theme.text};
  font-size: 0.82rem;
  letter-spacing: 0.01em;
  backdrop-filter: blur(${props => props.theme.glassBlur || '10px'});
  -webkit-backdrop-filter: blur(${props => props.theme.glassBlur || '10px'});

  &::before {
    content: '';
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: ${props => props.theme.accentColor || props.theme.primary};
    opacity: ${props => props.$tone === 'connected' ? 1 : 0.65};
    box-shadow: 0 0 0 4px ${props => props.theme.accentSurface || 'rgba(0,0,0,0.06)'};
  }
`;

const IconButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.inputBackground};
  color: ${props => props.theme.text};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.18s ease, background-color 0.18s ease, border-color 0.18s ease;
  backdrop-filter: blur(${props => props.theme.glassBlur || '10px'});
  -webkit-backdrop-filter: blur(${props => props.theme.glassBlur || '10px'});

  &:hover {
    background: ${props => props.theme.hover || props.theme.inputBackground};
  }

  &:active { transform: scale(0.96); }

  svg { width: 18px; height: 18px; }
`;

const Stage = styled.div`
  flex: 1;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 40px;
  position: relative;
`;

const OrbWrap = styled.div`
  position: relative;
  width: min(68vw, 340px);
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const OrbRing = styled.div`
  position: absolute;
  inset: -8%;
  border-radius: 999px;
  border: 1px solid ${props => props.theme.border};
  opacity: 0;
  animation: ${ringPulse} 2.8s ease-out infinite;
  ${props => props.$delay && css`animation-delay: ${props.$delay};`}
  ${props => !props.$active && css`animation-play-state: paused; opacity: 0;`}
`;

const OrbHalo = styled.div`
  position: absolute;
  inset: -14%;
  border-radius: 999px;
  background: ${props => {
    const accent = props.theme.accentSurface || 'rgba(127,127,127,0.12)';
    return `radial-gradient(circle at 50% 50%, ${accent} 0%, transparent 62%)`;
  }};
  filter: blur(28px);
  opacity: ${props => (props.$active ? 0.95 : 0.5)};
  transition: opacity 600ms ease;
`;

const Orb = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 999px;
  overflow: hidden;
  box-shadow:
    0 30px 80px ${props => props.theme.shadow || 'rgba(0,0,0,0.25)'},
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    inset 0 -20px 60px rgba(0, 0, 0, 0.18);
  animation: ${orbBreathe} ${props => (props.$active ? '2.6s' : '5.2s')} ease-in-out infinite;
  background: ${props => {
    const primary = props.theme.primary || '#7a7a7a';
    const accent = props.theme.accentColor || props.theme.primary || '#7a7a7a';
    const surface = props.theme.cardBackground || props.theme.inputBackground || '#2a2a2a';
    return `
      radial-gradient(circle at 32% 28%, ${accent}33 0%, transparent 48%),
      radial-gradient(circle at 70% 75%, ${primary}2e 0%, transparent 52%),
      linear-gradient(145deg, ${surface} 0%, ${surface} 60%, ${primary}1f 100%)
    `;
  }};
`;

const OrbLayerA = styled.div`
  position: absolute;
  inset: -20%;
  border-radius: 999px;
  background: ${props => {
    const accent = props.theme.accentColor || props.theme.primary || '#7a7a7a';
    const primary = props.theme.primary || '#7a7a7a';
    return `
      radial-gradient(circle at 30% 30%, ${accent}40 0%, transparent 36%),
      radial-gradient(circle at 72% 68%, ${primary}3a 0%, transparent 42%)
    `;
  }};
  mix-blend-mode: ${props => (props.theme.isDark ? 'screen' : 'multiply')};
  opacity: ${props => (props.theme.isDark ? 0.85 : 0.45)};
  animation: ${orbSpin} ${props => (props.$active ? '16s' : '40s')} linear infinite;
`;

const OrbLayerB = styled.div`
  position: absolute;
  inset: -10%;
  border-radius: 999px;
  background: ${props => {
    const accent = props.theme.accentColor || props.theme.primary || '#7a7a7a';
    const secondary = props.theme.secondary || props.theme.accentColor || '#7a7a7a';
    return `
      radial-gradient(circle at 25% 70%, ${accent}30 0%, transparent 40%),
      radial-gradient(circle at 80% 80%, ${secondary}33 0%, transparent 42%)
    `;
  }};
  mix-blend-mode: ${props => (props.theme.isDark ? 'screen' : 'multiply')};
  opacity: ${props => (props.theme.isDark ? 0.7 : 0.35)};
  animation: ${orbSpinReverse} ${props => (props.$active ? '22s' : '60s')} linear infinite;
`;

const OrbGloss = styled.div`
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: ${props =>
    props.theme.isDark
      ? 'radial-gradient(ellipse at 35% 18%, rgba(255,255,255,0.14) 0%, transparent 48%)'
      : 'radial-gradient(ellipse at 35% 18%, rgba(255,255,255,0.55) 0%, transparent 48%)'};
  pointer-events: none;
`;

const StatusStack = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  min-height: 64px;
  text-align: center;
  padding: 0 20px;
`;

const StatusText = styled.div`
  font-size: 1.12rem;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: ${props => props.theme.text};
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
`;

const Dots = styled.span`
  display: inline-flex;
  gap: 3px;
  margin-left: 6px;

  span {
    width: 4px;
    height: 4px;
    border-radius: 999px;
    background: currentColor;
    animation: ${dotFlash} 1.2s ease-in-out infinite;
  }

  span:nth-child(2) { animation-delay: 0.15s; }
  span:nth-child(3) { animation-delay: 0.3s; }
`;

const Transcript = styled.div`
  max-width: 560px;
  width: 100%;
  font-size: 0.95rem;
  line-height: 1.5;
  color: ${props => props.theme.textSecondary || props.theme.text};
  text-align: center;
  min-height: 1.5em;
  animation: ${fadeIn} 0.4s ease-out;
`;

const LoadingBar = styled.div`
  position: relative;
  width: 200px;
  height: 3px;
  border-radius: 999px;
  overflow: hidden;
  background: ${props => props.theme.border};
`;

const LoadingFill = styled.div`
  position: absolute;
  inset: 0;
  width: ${props => `${Math.max(6, Math.round(props.$value * 100))}%`};
  border-radius: inherit;
  background: ${props => props.theme.accentColor || props.theme.primary};
  transition: width 0.2s ease;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%);
    animation: ${shimmer} 1.8s linear infinite;
  }
`;

const ControlsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 22px;
  padding: 8px 0;
  z-index: 2;
`;

const ControlButton = styled.button`
  width: 60px;
  height: 60px;
  border-radius: 999px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.16s ease, background-color 0.18s ease, border-color 0.18s ease;
  backdrop-filter: blur(${props => props.theme.glassBlur || '10px'});
  -webkit-backdrop-filter: blur(${props => props.theme.glassBlur || '10px'});

  background: ${props => {
    if (props.$variant === 'end') return props.theme.accentColor || props.theme.primary;
    if (props.$isActive) return props.theme.accentSurface || props.theme.hover;
    return props.theme.inputBackground;
  }};
  color: ${props => {
    if (props.$variant === 'end') return props.theme.accentText || props.theme.primaryForeground || '#ffffff';
    if (props.$isActive) return props.theme.accentColor || props.theme.primary;
    return props.theme.text;
  }};
  border: 1px solid ${props => {
    if (props.$variant === 'end') return 'transparent';
    if (props.$isActive) return props.theme.accentColor || props.theme.primary;
    return props.theme.border;
  }};

  &:hover {
    transform: translateY(-1px);
    background: ${props => {
      if (props.$variant === 'end') return props.theme.accentColor || props.theme.primary;
      return props.theme.hover || props.theme.inputBackground;
    }};
  }

  &:active { transform: scale(0.96); }

  svg { width: 24px; height: 24px; }
`;

const ControlLabel = styled.span`
  display: block;
  margin-top: 8px;
  font-size: 0.72rem;
  letter-spacing: 0.02em;
  color: ${props => props.theme.textSecondary || props.theme.text};
  opacity: 0.7;
  text-align: center;
`;

const ControlGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const VideoSurface = styled.video`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
`;

const VideoFrame = styled.div`
  position: relative;
  width: min(78vw, 420px);
  aspect-ratio: 3 / 4;
  border-radius: 36px;
  overflow: hidden;
  background: ${props => props.theme.inputBackground};
  border: 1px solid ${props => props.theme.border};
  box-shadow: 0 30px 80px ${props => props.theme.shadow || 'rgba(0,0,0,0.2)'};

  @media (max-height: 720px) {
    width: min(70vw, 360px);
  }
`;

const ErrorBanner = styled.div`
  max-width: 560px;
  padding: 10px 14px;
  border-radius: 14px;
  border: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.inputBackground};
  color: ${props => props.theme.textSecondary || props.theme.text};
  font-size: 0.86rem;
  text-align: center;
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
  if (!normalizedText) return turns;
  return [
    ...turns,
    { id: createTurnId(), role, text: normalizedText },
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
  if (typeof payload?.file === 'string') return payload.file.split('/').pop();
  if (typeof payload?.status === 'string') return payload.status.replace(/_/g, ' ');
  return 'Preparing voice';
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
  const [ttsProgressLabel, setTtsProgressLabel] = useState('Preparing voice');
  const [ttsError, setTtsError] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcriptTurns, setTranscriptTurns] = useState([]);
  const [isMuted, setIsMuted] = useState(false);

  const cameraVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
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
    if (!nextText || ttsStatus !== 'ready') return;

    pendingSpeechTextRef.current = '';
    setIsSpeaking(true);

    try {
      await kokoroTTSService.speak(nextText, { voice: DEFAULT_KOKORO_VOICE });
      setTtsError('');
    } catch (error) {
      console.error('Kokoro playback failed:', error);
      setTtsStatus('error');
      setTtsError('Voice playback failed. Responses will stay on screen.');
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
            if (cancelled) return;
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
          setTtsProgressLabel('Voice ready');
        }
      } catch (error) {
        console.error('Failed to preload Kokoro:', error);
        if (!cancelled) {
          setTtsStatus('error');
          setTtsError('Voice engine could not load. Live mode will continue with text responses only.');
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
    if (!isConnected) connect();
  }, [connect, isConnected]);

  useEffect(() => {
    return () => {
      stopCameraStream();
      stopScreenStream();
      disconnect();
    };
  }, [disconnect, stopCameraStream, stopScreenStream]);

  useEffect(() => {
    if (!isConnected || sessionActive || status !== 'connected') return;
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
    if (status !== 'turn_complete' || assistantTurnCommittedRef.current) return;

    const finalAssistantText = latestAssistantResponseRef.current;
    if (!finalAssistantText) return;

    assistantTurnCommittedRef.current = true;
    setTranscriptTurns((currentTurns) => appendTurn(currentTurns, 'assistant', finalAssistantText));

    if (ttsStatus === 'ready') {
      speakAssistantText(finalAssistantText);
    } else if (ttsStatus === 'loading') {
      pendingSpeechTextRef.current = finalAssistantText;
    }
  }, [speakAssistantText, status, ttsStatus]);

  useEffect(() => {
    if (ttsStatus !== 'ready' || !pendingSpeechTextRef.current || isSpeaking) return;
    speakAssistantText(pendingSpeechTextRef.current);
  }, [isSpeaking, speakAssistantText, ttsStatus]);

  const handleMicrophoneToggle = useCallback(async () => {
    if (isSpeaking) {
      kokoroTTSService.stop();
      setIsSpeaking(false);
    }

    if (isRecording) {
      stopRecording();
      setIsMuted(true);
      return;
    }

    setIsMuted(false);

    if (!isConnected) await connect();

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

    if (screenShareActive) stopScreenStream();

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

  const handleEndCall = useCallback(() => {
    if (isSpeaking) {
      kokoroTTSService.stop();
      setIsSpeaking(false);
    }
    if (isRecording) stopRecording();
    stopCameraStream();
    stopScreenStream();
    onClose?.();
  }, [isRecording, isSpeaking, onClose, stopCameraStream, stopRecording, stopScreenStream]);

  const activeError = cameraError || screenError || ttsError || (typeof geminiError === 'string' ? geminiError : '');
  const hasVideo = cameraActive || screenShareActive;
  const liveDraft = normalizeText(inputTranscription);
  const liveResponse = normalizeText(response);

  const orbActive = isRecording || isSpeaking || status === 'processing' || status === 'responding';

  const statusInfo = useMemo(() => {
    if (!isConnected) return { text: t('liveMode.status.connecting', 'Connecting'), showDots: true, tone: 'processing' };
    if (!sessionActive) return { text: t('liveMode.status.starting', 'Starting'), showDots: true, tone: 'processing' };
    if (isSpeaking) return { text: 'Speaking', showDots: false, tone: 'connected' };
    if (status === 'processing' || status === 'responding') {
      return { text: t('liveMode.status.thinking', 'Thinking'), showDots: true, tone: 'processing' };
    }
    if (isRecording) return { text: t('liveMode.status.listening', 'Listening'), showDots: true, tone: 'recording' };
    if (ttsStatus === 'loading') return { text: ttsProgressLabel, showDots: true, tone: 'processing' };
    return { text: isMuted ? 'Muted' : t('liveMode.status.ready', 'Tap the mic to start'), showDots: false, tone: 'connected' };
  }, [isConnected, isMuted, isRecording, isSpeaking, sessionActive, status, t, ttsProgressLabel, ttsStatus]);

  const transcriptText = useMemo(() => {
    if (isRecording && liveDraft) return liveDraft;
    if ((status === 'responding' || isSpeaking) && liveResponse) return liveResponse;
    const lastAssistant = [...transcriptTurns].reverse().find((turn) => turn.role === 'assistant');
    if (lastAssistant) return lastAssistant.text;
    return '';
  }, [isRecording, isSpeaking, liveDraft, liveResponse, status, transcriptTurns]);

  return (
    <Container>
      <TopBar>
        <StatusPill $tone={statusInfo.tone}>
          {selectedModel?.includes('gemini') ? selectedModel : 'Live Voice'}
        </StatusPill>
        <IconButton onClick={onClose} aria-label={t('liveMode.controls.close', 'Close Live Mode')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </IconButton>
      </TopBar>

      <Stage>
        {hasVideo ? (
          <VideoFrame>
            <VideoSurface
              ref={cameraActive ? cameraVideoRef : screenVideoRef}
              autoPlay
              muted
              playsInline
            />
          </VideoFrame>
        ) : (
          <OrbWrap>
            <OrbHalo $active={orbActive} />
            <OrbRing $active={orbActive} />
            <OrbRing $active={orbActive} $delay="0.9s" />
            <OrbRing $active={orbActive} $delay="1.8s" />
            <Orb $active={orbActive}>
              <OrbLayerA $active={orbActive} />
              <OrbLayerB $active={orbActive} />
              <OrbGloss />
            </Orb>
          </OrbWrap>
        )}

        <StatusStack>
          <StatusText>
            {statusInfo.text}
            {statusInfo.showDots && (
              <Dots aria-hidden="true">
                <span />
                <span />
                <span />
              </Dots>
            )}
          </StatusText>

          {ttsStatus === 'loading' && (
            <LoadingBar>
              <LoadingFill $value={ttsProgress} />
            </LoadingBar>
          )}

          {transcriptText && (
            <Transcript>{transcriptText}</Transcript>
          )}

          {activeError && <ErrorBanner>{activeError}</ErrorBanner>}
        </StatusStack>
      </Stage>

      <ControlsRow>
        <ControlGroup>
          <ControlButton
            $isActive={cameraActive}
            onClick={handleCameraToggle}
            title={cameraActive ? t('liveMode.controls.camera.off', 'Turn Off Camera') : t('liveMode.controls.camera.on', 'Turn On Camera')}
            aria-label={cameraActive ? 'Turn off camera' : 'Turn on camera'}
          >
            {cameraActive ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2" />
                <path d="M22 8.5l-6 4.5 6 4.5v-9z" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            )}
          </ControlButton>
          <ControlLabel>Video</ControlLabel>
        </ControlGroup>

        <ControlGroup>
          <ControlButton
            $isActive={!isRecording}
            onClick={handleMicrophoneToggle}
            title={isRecording ? t('liveMode.controls.mic.mute', 'Mute Microphone') : t('liveMode.controls.mic.unmute', 'Unmute Microphone')}
            aria-label={isRecording ? 'Mute microphone' : 'Unmute microphone'}
          >
            {isRecording ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
          </ControlButton>
          <ControlLabel>{isRecording ? 'Mute' : 'Unmute'}</ControlLabel>
        </ControlGroup>

        <ControlGroup>
          <ControlButton
            $variant="end"
            onClick={handleEndCall}
            title="End call"
            aria-label="End call"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" transform="rotate(135 12 12)" />
            </svg>
          </ControlButton>
          <ControlLabel>End</ControlLabel>
        </ControlGroup>
      </ControlsRow>
    </Container>
  );
};

export default LiveModeUI;

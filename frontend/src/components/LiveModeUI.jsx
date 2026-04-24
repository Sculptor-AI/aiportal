import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Mic, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react';
import styled, { css, keyframes, useTheme } from 'styled-components';
import ModelSelector from './ModelSelector';
import { useTranslation } from '../contexts/TranslationContext';
import { DEFAULT_CHAT_MODEL_ID, DEEP_RESEARCH_MODEL_ID } from '../config/modelConfig';
import { SCULPTOR_AI_SYSTEM_PROMPT } from '../prompts/sculptorAI-system-prompt';
import { sendMessage } from '../services/aiService';
import {
  BrowserSpeechRecognitionSession,
  detectSpeechRecognitionSupport,
} from '../services/browserSpeechRecognition';
import kokoroTTSService, { DEFAULT_KOKORO_VOICE } from '../services/kokoroTTSService';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const fluidMorph = keyframes`
  0%, 100% {
    border-radius: 48% 52% 50% 50% / 52% 48% 52% 48%;
    transform: rotate(0deg) scale(1);
  }
  25% {
    border-radius: 56% 44% 48% 52% / 45% 58% 42% 55%;
    transform: rotate(4deg) scale(1.015);
  }
  50% {
    border-radius: 45% 55% 57% 43% / 54% 43% 57% 46%;
    transform: rotate(-3deg) scale(0.985);
  }
  75% {
    border-radius: 52% 48% 43% 57% / 48% 55% 45% 52%;
    transform: rotate(3deg) scale(1.025);
  }
`;

const fluidDrift = keyframes`
  0%   { transform: translate3d(-3%, -2%, 0) rotate(0deg) scale(1.04); }
  50%  { transform: translate3d(3%, 2%, 0) rotate(180deg) scale(1.12); }
  100% { transform: translate3d(-3%, -2%, 0) rotate(360deg) scale(1.04); }
`;

const fluidDriftReverse = keyframes`
  0%   { transform: translate3d(4%, 1%, 0) rotate(360deg) scale(1.08); }
  50%  { transform: translate3d(-2%, -4%, 0) rotate(180deg) scale(0.98); }
  100% { transform: translate3d(4%, 1%, 0) rotate(0deg) scale(1.08); }
`;

const orbBreathe = keyframes`
  0%   { filter: blur(0px) saturate(1);   }
  50%  { filter: blur(0.2px) saturate(1.16); }
  100% { filter: blur(0px) saturate(1);   }
`;

const ringPulse = keyframes`
  0%   { transform: scale(0.88); opacity: 0; }
  35%  { opacity: 0.18; }
  100% { transform: scale(1.28); opacity: 0; }
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
  justify-content: center;
  gap: 12px;
  z-index: 5;
  min-height: 44px;
`;

const ModelSelectorShell = styled.div`
  position: relative;
  z-index: 6;
  max-width: min(82vw, 420px);

  & > div > button {
    min-width: min(76vw, 280px);
    max-width: min(82vw, 420px);
    min-height: 44px;
    padding: 8px 14px;
    border-radius: 999px;
    border: 1px solid ${props => props.theme.isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)'};
    background: ${props => props.theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.78)'};
    box-shadow: 0 10px 30px ${props => props.theme.shadow || 'rgba(0,0,0,0.12)'};
    backdrop-filter: blur(${props => props.theme.glassBlur || '10px'});
    -webkit-backdrop-filter: blur(${props => props.theme.glassBlur || '10px'});
  }

  & > div > button:hover {
    background: ${props => props.theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.9)'};
  }

  & > div > button .model-info {
    min-width: 0;
    overflow: hidden;
  }

  & > div > button .model-info span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  & > div > div {
    min-width: min(86vw, 380px);
    max-width: min(86vw, 420px);
    border: 1px solid ${props => props.theme.isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)'};
    background: ${props => props.theme.inputBackground};
  }
`;

const Stage = styled.div`
  flex: 1;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(26px, 5vh, 42px);
  position: relative;
`;

const OrbWrap = styled.div`
  position: relative;
  width: clamp(210px, 42vmin, 330px);
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  isolation: isolate;
`;

const OrbRing = styled.div`
  position: absolute;
  inset: -5%;
  border-radius: 999px;
  border: 1px solid ${props => props.theme.isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.14)'};
  opacity: 0;
  animation: ${ringPulse} 2.4s ease-out infinite;
  ${props => props.$delay && css`animation-delay: ${props.$delay};`}
  ${props => !props.$active && css`animation-play-state: paused; opacity: 0;`}
`;

const OrbHalo = styled.div`
  position: absolute;
  inset: -18%;
  border-radius: 999px;
  background: ${props => {
    const accent = props.theme.accentColor || props.theme.primary || '#10a37f';
    return `
      radial-gradient(circle at 45% 42%, ${accent}28 0%, transparent 52%),
      radial-gradient(circle at 62% 58%, rgba(99,102,241,0.18) 0%, transparent 54%)
    `;
  }};
  filter: blur(34px);
  opacity: ${props => (props.$active ? 0.95 : 0.58)};
  transition: opacity 600ms ease;
`;

const Orb = styled.div`
  position: relative;
  width: 91%;
  height: 91%;
  border-radius: 48% 52% 50% 50% / 52% 48% 52% 48%;
  overflow: hidden;
  box-shadow:
    0 36px 90px ${props => props.theme.shadow || 'rgba(0,0,0,0.24)'},
    0 0 0 1px ${props => props.theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.07)'},
    inset 0 1px 2px rgba(255, 255, 255, 0.34),
    inset 0 -36px 72px rgba(0, 0, 0, 0.16);
  animation:
    ${fluidMorph} ${props => (props.$active ? '4.8s' : '9s')} ease-in-out infinite,
    ${orbBreathe} ${props => (props.$active ? '2.4s' : '5.6s')} ease-in-out infinite;
  background: ${props => {
    const accent = props.theme.accentColor || props.theme.primary || '#10a37f';
    const surface = props.theme.isDark ? '#151515' : '#f7f8f7';
    const edge = props.theme.isDark ? '#2b2d31' : '#dfe5e2';
    return `
      radial-gradient(circle at 44% 35%, rgba(255,255,255,0.86) 0%, rgba(255,255,255,0.26) 18%, transparent 42%),
      radial-gradient(circle at 35% 72%, ${accent}36 0%, transparent 42%),
      conic-gradient(from 120deg at 48% 52%, ${edge}, ${accent}42, rgba(99,102,241,0.36), rgba(244,114,182,0.26), ${edge}, ${surface})
    `;
  }};
`;

const OrbLayerA = styled.div`
  position: absolute;
  inset: -18%;
  border-radius: 46% 54% 56% 44% / 52% 46% 54% 48%;
  background: ${props => {
    const accent = props.theme.accentColor || props.theme.primary || '#10a37f';
    return `
      radial-gradient(circle at 34% 26%, rgba(255,255,255,0.72) 0%, transparent 24%),
      radial-gradient(circle at 68% 38%, rgba(99,102,241,0.34) 0%, transparent 32%),
      radial-gradient(circle at 44% 72%, ${accent}42 0%, transparent 38%)
    `;
  }};
  mix-blend-mode: ${props => (props.theme.isDark ? 'screen' : 'multiply')};
  opacity: ${props => (props.theme.isDark ? 0.8 : 0.48)};
  filter: blur(3px);
  animation: ${fluidDrift} ${props => (props.$active ? '8s' : '18s')} ease-in-out infinite;
`;

const OrbLayerB = styled.div`
  position: absolute;
  inset: -16%;
  border-radius: 58% 42% 44% 56% / 42% 58% 46% 54%;
  background: ${props => {
    const accent = props.theme.accentColor || props.theme.primary || '#10a37f';
    return `
      radial-gradient(circle at 64% 70%, rgba(244,114,182,0.26) 0%, transparent 34%),
      radial-gradient(circle at 26% 54%, rgba(14,165,233,0.24) 0%, transparent 36%),
      radial-gradient(circle at 70% 30%, ${accent}24 0%, transparent 42%)
    `;
  }};
  mix-blend-mode: ${props => (props.theme.isDark ? 'screen' : 'multiply')};
  opacity: ${props => (props.theme.isDark ? 0.72 : 0.38)};
  filter: blur(5px);
  animation: ${fluidDriftReverse} ${props => (props.$active ? '9s' : '21s')} ease-in-out infinite;
`;

const OrbGloss = styled.div`
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: ${props => props.theme.isDark
    ? 'linear-gradient(140deg, rgba(255,255,255,0.22) 0%, transparent 28%, rgba(255,255,255,0.06) 60%, transparent 100%)'
    : 'linear-gradient(140deg, rgba(255,255,255,0.86) 0%, transparent 30%, rgba(255,255,255,0.32) 62%, transparent 100%)'};
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
  gap: clamp(16px, 4vw, 26px);
  padding: 10px 0 4px;
  z-index: 2;
`;

const ControlButton = styled.button`
  width: ${props => props.$featured ? '72px' : '58px'};
  height: ${props => props.$featured ? '72px' : '58px'};
  border-radius: 999px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.16s ease, background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
  backdrop-filter: blur(${props => props.theme.glassBlur || '10px'});
  -webkit-backdrop-filter: blur(${props => props.theme.glassBlur || '10px'});

  background: ${props => {
    if (props.$variant === 'end') return '#ef4444';
    if (props.$featured && props.$isActive) return props.theme.text;
    if (props.$featured) return props.theme.isDark ? 'rgba(255,255,255,0.92)' : '#111827';
    if (props.$isActive) return props.theme.isDark ? 'rgba(255,255,255,0.16)' : 'rgba(17,24,39,0.08)';
    return props.theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.82)';
  }};
  color: ${props => {
    if (props.$variant === 'end') return '#ffffff';
    if (props.$featured && props.$isActive) return props.theme.background || '#ffffff';
    if (props.$featured) return props.theme.isDark ? '#111827' : '#ffffff';
    if (props.$isActive) return props.theme.accentColor || props.theme.primary;
    return props.theme.text;
  }};
  border: 1px solid ${props => {
    if (props.$variant === 'end') return 'transparent';
    if (props.$featured) return 'transparent';
    if (props.$isActive) return props.theme.accentColor || props.theme.primary;
    return props.theme.isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)';
  }};
  box-shadow: ${props => props.$featured
    ? `0 18px 42px ${props.theme.shadow || 'rgba(0,0,0,0.20)'}`
    : `0 10px 30px ${props.theme.shadow || 'rgba(0,0,0,0.12)'}`};

  &:hover {
    transform: translateY(-1px);
    background: ${props => {
      if (props.$variant === 'end') return '#dc2626';
      if (props.$featured && props.$isActive) return props.theme.text;
      if (props.$featured) return props.theme.isDark ? '#ffffff' : '#030712';
      return props.theme.hover || props.theme.inputBackground;
    }};
  }

  &:active { transform: scale(0.96); }

  svg {
    width: ${props => props.$featured ? '30px' : '24px'};
    height: ${props => props.$featured ? '30px' : '24px'};
    stroke-width: 2;
  }
`;

const ControlLabel = styled.span`
  display: block;
  margin-top: 9px;
  font-size: 0.74rem;
  font-weight: 500;
  letter-spacing: 0;
  color: ${props => props.theme.textSecondary || props.theme.text};
  opacity: 0.76;
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

const LIVE_SYSTEM_PROMPT = `${SCULPTOR_AI_SYSTEM_PROMPT}

You are in a voice conversation. Keep replies natural, concise, and easy to read aloud. Use short paragraphs and avoid markdown unless the person explicitly asks for structured output.`;

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

const LiveModeUI = ({ selectedModel, availableModels = [], onModelChange, onClose }) => {
  const { t } = useTranslation();
  const theme = useTheme();
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
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('ready');
  const [inputTranscription, setInputTranscription] = useState('');
  const [response, setResponse] = useState('');
  const [speechError, setSpeechError] = useState('');
  const [speechSupported, setSpeechSupported] = useState(null);

  const cameraVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const pendingSpeechTextRef = useRef('');
  const speechRecognitionRef = useRef(null);
  const conversationHistoryRef = useRef([]);
  const activeRequestIdRef = useRef(0);
  const mountedRef = useRef(false);

  const modelIdForChat = selectedModel && selectedModel !== DEEP_RESEARCH_MODEL_ID
    ? selectedModel
    : DEFAULT_CHAT_MODEL_ID;

  const liveSelectableModels = useMemo(
    () => (availableModels || []).filter((model) => model?.id && model.id !== DEEP_RESEARCH_MODEL_ID),
    [availableModels]
  );

  const handleLiveModelChange = useCallback((modelId) => {
    onModelChange?.(modelId);
  }, [onModelChange]);

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
    mountedRef.current = true;

    detectSpeechRecognitionSupport('en-US')
      .then((support) => {
        if (mountedRef.current) {
          setSpeechSupported(Boolean(support.supported));
        }
      })
      .catch(() => {
        if (mountedRef.current) {
          setSpeechSupported(false);
        }
      });

    return () => {
      mountedRef.current = false;
      activeRequestIdRef.current += 1;
      speechRecognitionRef.current?.abort();
      speechRecognitionRef.current = null;
      stopCameraStream();
      stopScreenStream();
    };
  }, [stopCameraStream, stopScreenStream]);

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
    if (ttsStatus !== 'ready' || !pendingSpeechTextRef.current || isSpeaking) return;
    speakAssistantText(pendingSpeechTextRef.current);
  }, [isSpeaking, speakAssistantText, ttsStatus]);

  const submitSpokenPrompt = useCallback(async (transcript) => {
    const prompt = normalizeText(transcript);
    if (!prompt) {
      setStatus('ready');
      return;
    }

    const requestId = activeRequestIdRef.current + 1;
    activeRequestIdRef.current = requestId;
    const priorHistory = conversationHistoryRef.current;

    setSpeechError('');
    setResponse('');
    setStatus('processing');
    setTranscriptTurns((currentTurns) => appendTurn(currentTurns, 'user', prompt));
    conversationHistoryRef.current = [
      ...conversationHistoryRef.current,
      { role: 'user', content: prompt },
    ].slice(-12);

    let streamedContent = '';

    try {
      const messageGenerator = sendMessage(
        prompt,
        modelIdForChat,
        priorHistory,
        null,
        null,
        false,
        false,
        false,
        LIVE_SYSTEM_PROMPT
      );

      for await (const chunk of messageGenerator) {
        if (!mountedRef.current || activeRequestIdRef.current !== requestId) {
          return;
        }

        if (typeof chunk !== 'string') {
          continue;
        }

        streamedContent += chunk;
        setStatus('responding');
        setResponse(streamedContent);
      }

      if (!mountedRef.current || activeRequestIdRef.current !== requestId) {
        return;
      }

      const finalAssistantText = normalizeText(streamedContent);
      if (!finalAssistantText) {
        setSpeechError('No response was returned.');
        setStatus('ready');
        return;
      }

      conversationHistoryRef.current = [
        ...conversationHistoryRef.current,
        { role: 'assistant', content: finalAssistantText },
      ].slice(-12);
      setTranscriptTurns((currentTurns) => appendTurn(currentTurns, 'assistant', finalAssistantText));
      setStatus('ready');

      if (ttsStatus === 'ready') {
        speakAssistantText(finalAssistantText);
      } else if (ttsStatus === 'loading') {
        pendingSpeechTextRef.current = finalAssistantText;
      }
    } catch (error) {
      if (!mountedRef.current || activeRequestIdRef.current !== requestId) {
        return;
      }

      console.error('Live voice response failed:', error);
      setSpeechError(error?.message || 'Unable to get a response.');
      setStatus('ready');
    }
  }, [modelIdForChat, speakAssistantText, ttsStatus]);

  const startRecording = useCallback(async () => {
    if (isRecording || status === 'processing' || status === 'responding') {
      return;
    }

    const support = await detectSpeechRecognitionSupport('en-US');
    setSpeechSupported(Boolean(support.supported));

    if (!support.supported) {
      setSpeechError('Speech recognition is not supported in this browser. Try Chrome or Edge for browser speech input.');
      return;
    }

    const recognitionSession = new BrowserSpeechRecognitionSession({
      language: 'en-US',
      onStart: () => {
        setIsRecording(true);
        setStatus('recording');
        setSpeechError('');
        setInputTranscription('');
        setResponse('');
      },
      onTranscription: ({ transcript: nextTranscript }) => {
        setInputTranscription(nextTranscript || '');
      },
      onEnd: ({ transcript: finalTranscript, error: recognitionError }) => {
        speechRecognitionRef.current = null;
        setIsRecording(false);

        if (recognitionError) {
          if (recognitionError.code !== 'no-speech') {
            setSpeechError(recognitionError.message);
          }
          setStatus('ready');
          return;
        }

        const prompt = normalizeText(finalTranscript);
        if (!prompt) {
          setStatus('ready');
          return;
        }

        setInputTranscription(prompt);
        submitSpokenPrompt(prompt);
      },
      onError: (recognitionError) => {
        if (recognitionError?.code !== 'no-speech') {
          setSpeechError(recognitionError.message);
        }
      }
    });

    speechRecognitionRef.current = recognitionSession;
    try {
      await recognitionSession.start();
    } catch (error) {
      speechRecognitionRef.current = null;
      setIsRecording(false);
      setStatus('ready');
      setSpeechError(error?.message || 'Unable to start speech recognition.');
    }
  }, [isRecording, status, submitSpokenPrompt]);

  const stopRecording = useCallback(() => {
    if (!isRecording) return;
    speechRecognitionRef.current?.stop();
  }, [isRecording]);

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

    await startRecording();
  }, [isRecording, isSpeaking, startRecording, stopRecording]);

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

  const activeError = cameraError || screenError || ttsError || speechError;
  const hasVideo = cameraActive || screenShareActive;
  const liveDraft = normalizeText(inputTranscription);
  const liveResponse = normalizeText(response);

  const orbActive = isRecording || isSpeaking || status === 'processing' || status === 'responding';

  const statusInfo = useMemo(() => {
    if (isSpeaking) return { text: 'Speaking', showDots: false };
    if (status === 'processing' || status === 'responding') {
      return { text: t('liveMode.status.thinking', 'Thinking'), showDots: true };
    }
    if (isRecording) return { text: t('liveMode.status.listening', 'Listening'), showDots: true };
    if (ttsStatus === 'loading') return { text: ttsProgressLabel, showDots: true };
    if (speechSupported === false) return { text: 'Speech input unavailable', showDots: false };
    return { text: isMuted ? 'Muted' : t('liveMode.status.ready', 'Tap the mic to start'), showDots: false };
  }, [isMuted, isRecording, isSpeaking, speechSupported, status, t, ttsProgressLabel, ttsStatus]);

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
        <ModelSelectorShell>
          <ModelSelector
            selectedModel={modelIdForChat}
            models={liveSelectableModels}
            onChange={handleLiveModelChange}
            theme={theme}
          />
        </ModelSelectorShell>
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
            {cameraActive ? <Video aria-hidden="true" /> : <VideoOff aria-hidden="true" />}
          </ControlButton>
          <ControlLabel>Video</ControlLabel>
        </ControlGroup>

        <ControlGroup>
          <ControlButton
            $featured
            $isActive={isRecording}
            onClick={handleMicrophoneToggle}
            title={isRecording ? t('liveMode.controls.mic.mute', 'Mute Microphone') : t('liveMode.controls.mic.unmute', 'Unmute Microphone')}
            aria-label={isRecording ? 'Mute microphone' : 'Unmute microphone'}
          >
            {isRecording ? <MicOff aria-hidden="true" /> : <Mic aria-hidden="true" />}
          </ControlButton>
          <ControlLabel>{isRecording ? 'Mute' : 'Mic'}</ControlLabel>
        </ControlGroup>

        <ControlGroup>
          <ControlButton
            $variant="end"
            onClick={handleEndCall}
            title="End call"
            aria-label="End call"
          >
            <PhoneOff aria-hidden="true" />
          </ControlButton>
          <ControlLabel>End</ControlLabel>
        </ControlGroup>
      </ControlsRow>
    </Container>
  );
};

export default LiveModeUI;

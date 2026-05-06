const ON_DEVICE_READY = 'available';
const ON_DEVICE_DOWNLOADABLE = 'downloadable';
const ON_DEVICE_DOWNLOADING = 'downloading';

const WHISPER_MODEL_ID = 'Xenova/whisper-tiny.en';

const normalizeTranscript = (value = '') => value.replace(/\s+/g, ' ').trim();

export const getSpeechRecognitionConstructor = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

export const getSpeechInputLabel = (mode) => {
  switch (mode) {
    case 'on-device':
      return 'On-device speech';
    case 'browser':
      return 'Browser speech';
    case 'whisper':
      return 'On-device Whisper';
    default:
      return 'Speech input unavailable';
  }
};

const hasMediaRecorderSupport = () =>
  typeof window !== 'undefined' &&
  typeof window.MediaRecorder === 'function' &&
  typeof window.OfflineAudioContext === 'function' &&
  Boolean(window.AudioContext || window.webkitAudioContext) &&
  Boolean(navigator?.mediaDevices?.getUserMedia);

export const detectSpeechRecognitionSupport = async (language = 'en-US') => {
  const SpeechRecognition = getSpeechRecognitionConstructor();

  if (!SpeechRecognition) {
    if (hasMediaRecorderSupport()) {
      return {
        supported: true,
        mode: 'whisper',
        label: getSpeechInputLabel('whisper'),
        onDeviceAvailability: 'unsupported',
        canInstall: false,
        canProcessLocally: true
      };
    }

    return {
      supported: false,
      mode: 'unsupported',
      label: getSpeechInputLabel('unsupported'),
      onDeviceAvailability: 'unsupported',
      canInstall: false,
      canProcessLocally: false
    };
  }

  const support = {
    supported: true,
    mode: 'browser',
    label: getSpeechInputLabel('browser'),
    onDeviceAvailability: 'unsupported',
    canInstall: false,
    canProcessLocally: false
  };

  if (typeof SpeechRecognition.available === 'function') {
    try {
      const availability = await SpeechRecognition.available({
        langs: [language],
        processLocally: true
      });

      support.onDeviceAvailability = availability;
      support.canInstall = availability === ON_DEVICE_DOWNLOADABLE || availability === ON_DEVICE_DOWNLOADING;
      support.canProcessLocally = availability === ON_DEVICE_READY;

      if (support.canProcessLocally) {
        support.mode = 'on-device';
        support.label = getSpeechInputLabel('on-device');
      }
    } catch (error) {
      console.warn('[speech-recognition] Unable to determine on-device availability:', error);
    }
  }

  return support;
};

export class BrowserSpeechRecognitionSession {
  constructor({
    language = 'en-US',
    continuous = false,
    interimResults = true,
    onStart = null,
    onTranscription = null,
    onEnd = null,
    onError = null
  } = {}) {
    this.language = language;
    this.continuous = continuous;
    this.interimResults = interimResults;
    this.onStart = onStart;
    this.onTranscription = onTranscription;
    this.onEnd = onEnd;
    this.onError = onError;

    this.recognition = null;
    this.mode = 'browser';
    this.lastError = null;
    this.finalTranscript = '';
    this.latestTranscript = '';
    this.isActive = false;
  }

  async start() {
    const SpeechRecognition = getSpeechRecognitionConstructor();

    if (!SpeechRecognition) {
      throw new Error('Speech recognition is not supported in this browser.');
    }

    const support = await detectSpeechRecognitionSupport(this.language);
    let processLocally = support.mode === 'on-device';

    if (!processLocally && support.canInstall && typeof SpeechRecognition.install === 'function') {
      try {
        const installed = await SpeechRecognition.install({
          langs: [this.language]
        });

        processLocally = Boolean(installed);
      } catch (error) {
        console.warn('[speech-recognition] Unable to install on-device language pack:', error);
      }
    }

    this.mode = processLocally ? 'on-device' : 'browser';
    this.lastError = null;
    this.finalTranscript = '';
    this.latestTranscript = '';

    const recognition = new SpeechRecognition();
    recognition.lang = this.language;
    recognition.continuous = this.continuous;
    recognition.interimResults = this.interimResults;
    recognition.maxAlternatives = 1;

    if ('processLocally' in recognition) {
      recognition.processLocally = processLocally;
    }

    this.recognition = recognition;

    return new Promise((resolve, reject) => {
      let started = false;

      recognition.onstart = () => {
        started = true;
        this.isActive = true;
        this.onStart?.({
          mode: this.mode,
          label: getSpeechInputLabel(this.mode)
        });
        resolve({
          mode: this.mode,
          label: getSpeechInputLabel(this.mode)
        });
      };

      recognition.onresult = (event) => {
        let nextFinalTranscript = this.finalTranscript;
        let interimTranscript = '';

        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index];
          const segment = normalizeTranscript(result?.[0]?.transcript || '');

          if (!segment) {
            continue;
          }

          if (result.isFinal) {
            nextFinalTranscript = normalizeTranscript(`${nextFinalTranscript} ${segment}`);
          } else {
            interimTranscript = normalizeTranscript(`${interimTranscript} ${segment}`);
          }
        }

        this.finalTranscript = nextFinalTranscript;
        this.latestTranscript = normalizeTranscript(`${this.finalTranscript} ${interimTranscript}`);

        this.onTranscription?.({
          mode: this.mode,
          label: getSpeechInputLabel(this.mode),
          transcript: this.latestTranscript,
          finalTranscript: this.finalTranscript,
          interimTranscript
        });
      };

      recognition.onerror = (event) => {
        const message = event?.error === 'not-allowed'
          ? 'Microphone access denied. Please allow microphone access in your browser settings.'
          : event?.error === 'no-speech'
            ? 'No speech detected.'
            : event?.message || event?.error || 'Speech recognition failed.';

        this.lastError = new Error(message);
        this.lastError.code = event?.error || 'speech-error';
        this.onError?.(this.lastError, {
          mode: this.mode,
          label: getSpeechInputLabel(this.mode)
        });

        if (!started) {
          reject(this.lastError);
        }
      };

      recognition.onend = () => {
        this.isActive = false;
        const transcript = normalizeTranscript(this.finalTranscript || this.latestTranscript);
        this.onEnd?.({
          mode: this.mode,
          label: getSpeechInputLabel(this.mode),
          transcript,
          error: this.lastError
        });
        this.recognition = null;
      };

      try {
        recognition.start();
      } catch (error) {
        reject(error);
      }
    });
  }

  stop() {
    this.recognition?.stop();
  }

  abort() {
    this.recognition?.abort();
    this.recognition = null;
    this.isActive = false;
  }
}

let transcriberPromise = null;

const loadWhisperPipeline = async ({ progressCallback = null } = {}) => {
  if (transcriberPromise) {
    return transcriberPromise;
  }

  transcriberPromise = (async () => {
    const { pipeline } = await import('@huggingface/transformers');
    const device = typeof navigator !== 'undefined' && navigator.gpu ? 'webgpu' : 'wasm';
    const dtype = device === 'webgpu' ? 'fp32' : 'q8';

    return pipeline('automatic-speech-recognition', WHISPER_MODEL_ID, {
      device,
      dtype,
      progress_callback: (event) => {
        progressCallback?.(event);
      }
    });
  })().catch((error) => {
    transcriberPromise = null;
    throw error;
  });

  return transcriberPromise;
};

export const preloadWhisperRecognition = (options) => loadWhisperPipeline(options);

const decodeBlobToMono16k = async (blob) => {
  const ContextClass = window.AudioContext || window.webkitAudioContext;

  if (!ContextClass || typeof window.OfflineAudioContext !== 'function') {
    throw new Error('Audio decoding is not supported in this browser.');
  }

  const arrayBuffer = await blob.arrayBuffer();
  const decodeContext = new ContextClass();

  let decoded;
  try {
    decoded = await decodeContext.decodeAudioData(arrayBuffer.slice(0));
  } finally {
    if (typeof decodeContext.close === 'function') {
      decodeContext.close();
    }
  }

  const targetSampleRate = 16000;
  const frameCount = Math.max(1, Math.ceil(decoded.duration * targetSampleRate));
  const offline = new window.OfflineAudioContext(1, frameCount, targetSampleRate);
  const source = offline.createBufferSource();
  source.buffer = decoded;
  source.connect(offline.destination);
  source.start(0);
  const rendered = await offline.startRendering();

  return rendered.getChannelData(0);
};

const pickRecorderMimeType = () => {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4'
  ];

  for (const candidate of candidates) {
    if (typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported(candidate)) {
      return candidate;
    }
  }

  return '';
};

export class WhisperSpeechRecognitionSession {
  constructor({
    language = 'en-US',
    onStart = null,
    onTranscription = null,
    onEnd = null,
    onError = null,
    onProcessing = null,
    onModelProgress = null
  } = {}) {
    this.language = language;
    this.onStart = onStart;
    this.onTranscription = onTranscription;
    this.onEnd = onEnd;
    this.onError = onError;
    this.onProcessing = onProcessing;
    this.onModelProgress = onModelProgress;

    this.mode = 'whisper';
    this.mediaRecorder = null;
    this.mediaStream = null;
    this.chunks = [];
    this.mimeType = '';
    this.isActive = false;
    this.aborted = false;
    this.lastError = null;
    this.transcript = '';
  }

  async start() {
    if (this.isActive) {
      return { mode: this.mode, label: getSpeechInputLabel(this.mode) };
    }

    if (!hasMediaRecorderSupport()) {
      const error = new Error('Microphone recording is not supported in this browser.');
      error.code = 'no-media-recorder';
      this.lastError = error;
      this.onError?.(error, { mode: this.mode });
      throw error;
    }

    this.aborted = false;
    this.lastError = null;
    this.transcript = '';
    this.chunks = [];

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      const message = error?.name === 'NotAllowedError'
        ? 'Microphone access denied. Please allow microphone access in your browser settings.'
        : error?.message || 'Unable to access microphone.';
      const wrapped = new Error(message);
      wrapped.code = error?.name === 'NotAllowedError' ? 'not-allowed' : 'mic-error';
      this.lastError = wrapped;
      this.onError?.(wrapped, { mode: this.mode });
      throw wrapped;
    }

    this.mediaStream = stream;
    this.mimeType = pickRecorderMimeType();

    let recorder;
    try {
      recorder = this.mimeType
        ? new MediaRecorder(stream, { mimeType: this.mimeType })
        : new MediaRecorder(stream);
    } catch (error) {
      this._releaseStream();
      const wrapped = new Error(error?.message || 'Unable to start audio recorder.');
      wrapped.code = 'recorder-init';
      this.lastError = wrapped;
      this.onError?.(wrapped, { mode: this.mode });
      throw wrapped;
    }

    this.mediaRecorder = recorder;

    return new Promise((resolve, reject) => {
      let started = false;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.chunks.push(event.data);
        }
      };

      recorder.onstart = () => {
        started = true;
        this.isActive = true;
        this.onStart?.({ mode: this.mode, label: getSpeechInputLabel(this.mode) });
        resolve({ mode: this.mode, label: getSpeechInputLabel(this.mode) });
      };

      recorder.onerror = (event) => {
        const wrapped = new Error(event?.error?.message || 'Audio recording failed.');
        wrapped.code = event?.error?.name || 'recorder-error';
        this.lastError = wrapped;
        this.onError?.(wrapped, { mode: this.mode });

        if (!started) {
          reject(wrapped);
        }
      };

      recorder.onstop = () => {
        this._handleStop();
      };

      try {
        recorder.start();
      } catch (error) {
        this._releaseStream();
        this.mediaRecorder = null;
        reject(error);
      }
    });
  }

  stop() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      try {
        this.mediaRecorder.stop();
      } catch (error) {
        console.warn('[whisper] failed to stop recorder:', error);
      }
    }
  }

  abort() {
    this.aborted = true;
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      try {
        this.mediaRecorder.stop();
      } catch (error) {
        console.warn('[whisper] failed to stop recorder:', error);
      }
    } else {
      this._releaseStream();
      this.mediaRecorder = null;
    }
    this.isActive = false;
  }

  async _handleStop() {
    this.isActive = false;
    this._releaseStream();

    if (this.aborted) {
      this.onEnd?.({
        mode: this.mode,
        label: getSpeechInputLabel(this.mode),
        transcript: '',
        error: this.lastError
      });
      this.mediaRecorder = null;
      return;
    }

    if (!this.chunks.length) {
      const error = new Error('No speech detected.');
      error.code = 'no-speech';
      this.lastError = error;
      this.onEnd?.({
        mode: this.mode,
        label: getSpeechInputLabel(this.mode),
        transcript: '',
        error
      });
      this.mediaRecorder = null;
      return;
    }

    this.onProcessing?.({ mode: this.mode, status: 'transcribing' });

    try {
      const blob = new Blob(this.chunks, { type: this.mimeType || 'audio/webm' });
      const audio = await decodeBlobToMono16k(blob);

      if (this.aborted) {
        this.onEnd?.({
          mode: this.mode,
          label: getSpeechInputLabel(this.mode),
          transcript: '',
          error: this.lastError
        });
        this.mediaRecorder = null;
        return;
      }

      const transcriber = await loadWhisperPipeline({
        progressCallback: this.onModelProgress
      });

      if (this.aborted) {
        this.onEnd?.({
          mode: this.mode,
          label: getSpeechInputLabel(this.mode),
          transcript: '',
          error: this.lastError
        });
        this.mediaRecorder = null;
        return;
      }

      const result = await transcriber(audio, {
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: false
      });

      const text = normalizeTranscript(
        Array.isArray(result) ? result.map((entry) => entry?.text || '').join(' ') : result?.text || ''
      );

      this.transcript = text;

      if (text) {
        this.onTranscription?.({
          mode: this.mode,
          label: getSpeechInputLabel(this.mode),
          transcript: text,
          finalTranscript: text,
          interimTranscript: ''
        });
      } else {
        const noSpeech = new Error('No speech detected.');
        noSpeech.code = 'no-speech';
        this.lastError = noSpeech;
      }

      this.onEnd?.({
        mode: this.mode,
        label: getSpeechInputLabel(this.mode),
        transcript: text,
        error: this.lastError
      });
    } catch (error) {
      const wrapped = error instanceof Error
        ? error
        : new Error(typeof error === 'string' ? error : 'Whisper transcription failed.');
      if (!wrapped.code) {
        wrapped.code = 'whisper-error';
      }
      this.lastError = wrapped;
      this.onError?.(wrapped, { mode: this.mode });
      this.onEnd?.({
        mode: this.mode,
        label: getSpeechInputLabel(this.mode),
        transcript: '',
        error: wrapped
      });
    } finally {
      this.mediaRecorder = null;
    }
  }

  _releaseStream() {
    this.mediaStream?.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch (_error) {
        // ignore
      }
    });
    this.mediaStream = null;
  }
}

export const createSpeechRecognitionSession = (mode, options) => {
  if (mode === 'whisper') {
    return new WhisperSpeechRecognitionSession(options);
  }
  return new BrowserSpeechRecognitionSession(options);
};

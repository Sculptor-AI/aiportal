const ON_DEVICE_READY = 'available';
const ON_DEVICE_DOWNLOADABLE = 'downloadable';
const ON_DEVICE_DOWNLOADING = 'downloading';

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
    default:
      return 'Gemini audio';
  }
};

export const detectSpeechRecognitionSupport = async (language = 'en-US') => {
  const SpeechRecognition = getSpeechRecognitionConstructor();

  if (!SpeechRecognition) {
    return {
      supported: false,
      mode: 'gemini',
      label: getSpeechInputLabel('gemini'),
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

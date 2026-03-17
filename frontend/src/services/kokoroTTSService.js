const DEFAULT_MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX';
export const DEFAULT_KOKORO_VOICE = 'af_heart';
const DEFAULT_KOKORO_SPEED = 1;

const normalizeText = (value = '') => value.replace(/\s+/g, ' ').trim();

class KokoroTTSService {
  constructor() {
    this.listeners = new Set();
    this.status = 'idle';
    this.error = null;
    this.progress = 0;
    this.model = null;
    this.modelPromise = null;
    this.currentAudio = null;
    this.currentObjectUrl = null;
    this.playbackToken = 0;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.getSnapshot());

    return () => {
      this.listeners.delete(listener);
    };
  }

  getSnapshot() {
    return {
      status: this.status,
      error: this.error,
      progress: this.progress,
      ready: Boolean(this.model),
      voice: DEFAULT_KOKORO_VOICE
    };
  }

  async preload(options = {}) {
    return this._loadModel(options);
  }

  async speak(text, {
    voice = DEFAULT_KOKORO_VOICE,
    speed = DEFAULT_KOKORO_SPEED,
    modelId = DEFAULT_MODEL_ID
  } = {}) {
    const content = normalizeText(text);

    if (!content) {
      return false;
    }

    const token = ++this.playbackToken;
    const tts = await this._loadModel({ modelId });
    this._cleanupPlayback();

    try {
      this.status = 'speaking';
      this.error = null;
      this._emit();

      const audio = await tts.generate(content, { voice, speed });

      if (token !== this.playbackToken) {
        return false;
      }

      const objectUrl = URL.createObjectURL(audio.toBlob());
      const audioElement = new Audio(objectUrl);
      this.currentAudio = audioElement;
      this.currentObjectUrl = objectUrl;

      await new Promise((resolve, reject) => {
        audioElement.onended = resolve;
        audioElement.onerror = () => reject(new Error('Unable to play Kokoro audio in this browser.'));

        const playPromise = audioElement.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(reject);
        }
      });

      if (token === this.playbackToken) {
        this.status = 'ready';
        this.error = null;
        this._cleanupPlayback();
        this._emit();
      }

      return true;
    } catch (error) {
      if (token === this.playbackToken) {
        this.status = 'error';
        this.error = error instanceof Error ? error.message : 'Kokoro voice synthesis failed.';
        this._cleanupPlayback();
        this._emit();
      }

      throw error;
    }
  }

  cancel() {
    this.playbackToken += 1;
    this._cleanupPlayback();

    if (this.model) {
      this.status = 'ready';
      this.error = null;
    } else {
      this.status = 'idle';
    }

    this._emit();
  }

  stop() {
    this.cancel();
  }

  async _loadModel({ modelId = DEFAULT_MODEL_ID, progressCallback = null } = {}) {
    if (this.model) {
      return this.model;
    }

    if (!this.modelPromise) {
      this.status = 'loading';
      this.error = null;
      this.progress = 0;
      this._emit();

      this.modelPromise = (async () => {
        const { KokoroTTS } = await import('kokoro-js');
        const device = typeof navigator !== 'undefined' && navigator.gpu ? 'webgpu' : 'wasm';
        const dtype = device === 'webgpu' ? 'fp32' : 'q8';

        const model = await KokoroTTS.from_pretrained(modelId, {
          device,
          dtype,
          progress_callback: (event) => {
            const rawProgress = typeof event?.progress === 'number' ? event.progress : null;
            const normalizedProgress = rawProgress !== null
              ? rawProgress > 1 ? Math.max(0, Math.min(1, rawProgress / 100)) : Math.max(0, Math.min(1, rawProgress))
              : typeof event?.loaded === 'number' && typeof event?.total === 'number' && event.total > 0
                ? Math.max(0, Math.min(1, event.loaded / event.total))
                : this.progress;

            this.progress = normalizedProgress;
            this.status = 'loading';
            progressCallback?.(event);
            this._emit();
          }
        });

        this.model = model;
        this.status = 'ready';
        this.progress = 1;
        this.error = null;
        this._emit();

        return model;
      })().catch((error) => {
        this.modelPromise = null;
        this.status = 'error';
        this.error = error instanceof Error ? error.message : 'Unable to load Kokoro voice model.';
        this._emit();
        throw error;
      });
    }

    return this.modelPromise;
  }

  _cleanupPlayback() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.src = '';
      this.currentAudio.onended = null;
      this.currentAudio.onerror = null;
      this.currentAudio = null;
    }

    if (this.currentObjectUrl) {
      URL.revokeObjectURL(this.currentObjectUrl);
      this.currentObjectUrl = null;
    }
  }

  _emit() {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }
}

const kokoroTTSService = new KokoroTTSService();

export default kokoroTTSService;

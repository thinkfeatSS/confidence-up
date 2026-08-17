import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import Voice from '@dev-amirzubair/react-native-voice';
import { localeForLanguageName } from '../data/languageProfiles';
import { AudioSample, UtteranceSegment } from '../types/speechAnalysis.types';
import { normalizeMetering } from '../services/audioAnalysisService';
import {
  acceptPartialHypothesis,
  mergeTranscriptSegments,
} from '../utils/transcriptMerge';

type RecorderStatus = 'idle' | 'recording' | 'stopping' | 'error';

const FINAL_RESULT_WAIT_MS = 5000;
const SPEECH_VOLUME_THRESHOLD = 22;
const MIN_WAVEFORM_HEIGHT = 8;
const RESTART_RECOGNITION_DELAY_MS = 350;

async function requestMicPermission() {
  if (Platform.OS !== 'android') return true;
  const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
    title: 'Microphone permission',
    message: 'ConfidenceUp needs microphone access for speaking practice.',
    buttonPositive: 'Allow',
  });
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

async function isSpeechRecognitionAvailable() {
  const available = await Voice.isAvailable().catch(() => 0);
  if (available) return true;

  if (Platform.OS !== 'android') return false;

  const services = await Voice.getSpeechRecognitionServices().catch(() => [] as string[]);
  return services.length > 0;
}

function volumeFromSpeechEvent(value?: number) {
  if (value === undefined || !Number.isFinite(value)) return 0;
  if (Platform.OS === 'ios' && value >= 0 && value <= 10) {
    return normalizeMetering(value * 10);
  }
  return normalizeMetering(value);
}

function androidVoiceOptions() {
  return {
    RECOGNIZER_ENGINE: 'GOOGLE',
    EXTRA_PARTIAL_RESULTS: true,
    REQUEST_PERMISSIONS_AUTO: false,
    EXTRA_MAX_RESULTS: 1,
    EXTRA_LANGUAGE_MODEL: 'LANGUAGE_MODEL_FREE_FORM',
  };
}

/** Android sends multiple hypotheses; only the first is the best match. */
function bestHypothesis(values?: string[]) {
  return (values?.[0] ?? '').trim();
}

/** Join completed utterances using overlap-aware merge. */
function finalizeUtteranceIntoCommitted(committed: string, utterance: string) {
  return mergeTranscriptSegments(committed, utterance);
}

function joinCommittedWithLive(committed: string, currentUtterance: string) {
  const base = committed.trim();
  const live = currentUtterance.trim();
  if (!live) return base;
  if (!base) return live;
  return `${base} ${live}`;
}

function buildLiveDisplay(committed: string, currentUtterance: string) {
  return joinCommittedWithLive(committed, currentUtterance);
}

export function useSpeechRecorder(preferredLanguages?: string[]) {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [displayTranscript, setDisplayTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [waveform, setWaveform] = useState<number[]>(Array(20).fill(MIN_WAVEFORM_HEIGHT));
  const [isListening, setIsListening] = useState(false);
  const [liveAverageVolume, setLiveAverageVolume] = useState(0);

  const samplesRef = useRef<AudioSample[]>([]);
  const utteranceSegmentsRef = useRef<UtteranceSegment[]>([]);
  const utteranceStartMsRef = useRef(0);
  const committedRef = useRef('');
  const livePartialRef = useRef('');
  const pendingFinalRef = useRef('');
  const utteranceClosedRef = useRef(false);
  const startedAtRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRecordingRef = useRef(false);
  const activeLocaleRef = useRef('en-US');
  const localeCandidatesRef = useRef<string[]>(['en-US']);
  const resultWaiterRef = useRef<{
    resolve: (text: string) => void;
    timer: ReturnType<typeof setTimeout>;
  } | null>(null);

  const preferredLocale = useMemo(
    () => localeForLanguageName(preferredLanguages?.[0]),
    [preferredLanguages],
  );

  const localeCandidates = useMemo(() => {
    const candidates = [preferredLocale, 'en-US', 'en-GB'];
    return candidates.filter((value, index) => candidates.indexOf(value) === index);
  }, [preferredLocale]);

  localeCandidatesRef.current = localeCandidates;

  const currentUtteranceText = useRef(() =>
    (pendingFinalRef.current || livePartialRef.current).trim(),
  );

  currentUtteranceText.current = () =>
    (pendingFinalRef.current || livePartialRef.current).trim();

  const syncDisplay = useRef(() => {
    setDisplayTranscript(
      buildLiveDisplay(committedRef.current, currentUtteranceText.current()),
    );
  });

  syncDisplay.current = () => {
    setDisplayTranscript(
      buildLiveDisplay(committedRef.current, currentUtteranceText.current()),
    );
  };

  const getFullTranscript = useRef(() =>
    buildLiveDisplay(committedRef.current, currentUtteranceText.current()),
  );

  getFullTranscript.current = () =>
    buildLiveDisplay(committedRef.current, currentUtteranceText.current());

  const resetUtteranceBuffers = useRef(() => {
    livePartialRef.current = '';
    pendingFinalRef.current = '';
  });

  resetUtteranceBuffers.current = () => {
    livePartialRef.current = '';
    pendingFinalRef.current = '';
  };

  const finalizeCurrentUtterance = useRef(() => {});

  finalizeCurrentUtterance.current = () => {
    const utterance = (pendingFinalRef.current || livePartialRef.current).trim();
    const endMs = Date.now() - startedAtRef.current;
    if (utterance) {
      utteranceSegmentsRef.current.push({
        text: utterance,
        startMs: utteranceStartMsRef.current,
        endMs,
      });
      committedRef.current = finalizeUtteranceIntoCommitted(committedRef.current, utterance);
    }
    utteranceStartMsRef.current = endMs;
    resetUtteranceBuffers.current();
    syncDisplay.current();
  };

  const cleanupTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  const resolvePendingResultRef = useRef((text?: string) => {
    const waiter = resultWaiterRef.current;
    if (!waiter) return;
    clearTimeout(waiter.timer);
    resultWaiterRef.current = null;
    waiter.resolve((text ?? committedRef.current).trim());
  });

  resolvePendingResultRef.current = (text?: string) => {
    const waiter = resultWaiterRef.current;
    if (!waiter) return;
    clearTimeout(waiter.timer);
    resultWaiterRef.current = null;
    waiter.resolve((text ?? committedRef.current).trim());
  };

  const restartRecognitionRef = useRef(() => {
    if (!isRecordingRef.current || restartTimerRef.current) return;

    restartTimerRef.current = setTimeout(() => {
      restartTimerRef.current = null;
      if (!isRecordingRef.current) return;

      void Voice.start(
        activeLocaleRef.current,
        Platform.OS === 'android' ? androidVoiceOptions() : undefined,
      )
        .then(() => setIsListening(true))
        .catch(() => undefined);
    }, RESTART_RECOGNITION_DELAY_MS);
  });

  restartRecognitionRef.current = () => {
    if (!isRecordingRef.current || restartTimerRef.current) return;

    restartTimerRef.current = setTimeout(() => {
      restartTimerRef.current = null;
      if (!isRecordingRef.current) return;

      void Voice.start(
        activeLocaleRef.current,
        Platform.OS === 'android' ? androidVoiceOptions() : undefined,
      )
        .then(() => setIsListening(true))
        .catch(() => undefined);
    }, RESTART_RECOGNITION_DELAY_MS);
  };

  const closeUtteranceRef = useRef(() => {
    if (utteranceClosedRef.current) return;
    utteranceClosedRef.current = true;

    finalizeCurrentUtterance.current();

    if (isRecordingRef.current) {
      setIsListening(false);
      restartRecognitionRef.current();
    }
  });

  closeUtteranceRef.current = () => {
    if (utteranceClosedRef.current) return;
    utteranceClosedRef.current = true;

    finalizeCurrentUtterance.current();

    if (isRecordingRef.current) {
      setIsListening(false);
      restartRecognitionRef.current();
    }
  };

  useEffect(() => {
    Voice.onSpeechStart = () => {
      utteranceClosedRef.current = false;
      utteranceStartMsRef.current = Date.now() - startedAtRef.current;
      resetUtteranceBuffers.current();
      setIsListening(true);
      setError(null);
    };

    Voice.onSpeechPartialResults = event => {
      const text = bestHypothesis(event.value);
      if (!text) return;
      livePartialRef.current = acceptPartialHypothesis(livePartialRef.current, text);
      syncDisplay.current();
    };

    Voice.onSpeechResults = event => {
      const text = bestHypothesis(event.value);
      if (!text) return;
      pendingFinalRef.current = text;
      livePartialRef.current = '';
      syncDisplay.current();
    };

    Voice.onSpeechError = event => {
      const code = event.error?.code;

      if (code === '7' || code === '9') {
        if (isRecordingRef.current) {
          closeUtteranceRef.current();
          return;
        }
        if (committedRef.current.trim()) {
          resolvePendingResultRef.current();
        }
        return;
      }

      if (!isRecordingRef.current && committedRef.current.trim()) {
        resolvePendingResultRef.current();
        return;
      }

      if (!isRecordingRef.current) {
        setError(event.error?.message ?? 'Speech recognition failed.');
        setStatus('error');
        resolvePendingResultRef.current();
      }
    };

    Voice.onSpeechEnd = () => {
      if (isRecordingRef.current) {
        closeUtteranceRef.current();
        return;
      }
      setIsListening(false);
      setTimeout(() => resolvePendingResultRef.current(), 400);
    };

    Voice.onSpeechVolumeChanged = event => {
      const elapsed = Date.now() - startedAtRef.current;
      const volume = volumeFromSpeechEvent(event.value);

      samplesRef.current.push({ timestampMs: elapsed, volume });

      const volumes = samplesRef.current.map(sample => sample.volume);
      setLiveAverageVolume(Math.round(volumes.reduce((sum, value) => sum + value, 0) / volumes.length));

      const isSpeech = volume >= SPEECH_VOLUME_THRESHOLD;
      const barHeight = isSpeech
        ? Math.max(10, Math.round(volume * 0.42))
        : MIN_WAVEFORM_HEIGHT;

      setWaveform(previous => [...previous.slice(1), barHeight]);
    };

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }
      isRecordingRef.current = false;
      resolvePendingResultRef.current();
      Voice.cancel().catch(() => undefined);
      Voice.destroy().catch(() => undefined);
      Voice.removeAllListeners();
    };
  }, []);

  const waitForFinalTranscript = useCallback(() => {
    const existing = committedRef.current.trim();
    if (existing) return Promise.resolve(existing);

    return new Promise<string>(resolve => {
      const timer = setTimeout(() => {
        resultWaiterRef.current = null;
        resolve(committedRef.current.trim());
      }, FINAL_RESULT_WAIT_MS);

      resultWaiterRef.current = { resolve, timer };
    });
  }, []);

  const beginRecognition = useCallback(async () => {
    await Voice.cancel().catch(() => undefined);
    await new Promise<void>(resolve => setTimeout(resolve, 200));

    for (const locale of localeCandidatesRef.current) {
      try {
        await Voice.start(
          locale,
          Platform.OS === 'android' ? androidVoiceOptions() : undefined,
        );
        activeLocaleRef.current = locale;
        return true;
      } catch {
        // Try the next locale candidate.
      }
    }
    return false;
  }, []);

  const start = useCallback(async (): Promise<boolean> => {
    setError(null);
    setIsListening(false);
    const hasPermission = await requestMicPermission();
    if (!hasPermission) {
      setError('Microphone permission is required to analyze your speech.');
      setStatus('error');
      return false;
    }

    const available = await isSpeechRecognitionAvailable();
    if (!available) {
      setError('Speech recognition is not available on this device.');
      setStatus('error');
      return false;
    }

    committedRef.current = '';
    utteranceSegmentsRef.current = [];
    utteranceStartMsRef.current = 0;
    resetUtteranceBuffers.current();
    utteranceClosedRef.current = false;
    setDisplayTranscript('');
    setDurationSeconds(0);
    setWaveform(Array(20).fill(MIN_WAVEFORM_HEIGHT));
    setLiveAverageVolume(0);
    samplesRef.current = [];
    startedAtRef.current = Date.now();
    isRecordingRef.current = true;

    const started = await beginRecognition();
    if (!started) {
      isRecordingRef.current = false;
      setError('Could not start speech recognition. Please try again.');
      setStatus('error');
      return false;
    }

    setStatus('recording');
    timerRef.current = setInterval(() => {
      setDurationSeconds(Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)));
    }, 500);
    return true;
  }, [beginRecognition]);

  const stop = useCallback(async () => {
    if (!isRecordingRef.current) return null;

    setStatus('stopping');
    cleanupTimer();
    finalizeCurrentUtterance.current();

    const resultPromise = waitForFinalTranscript();
    await Voice.stop().catch(() => undefined);
    isRecordingRef.current = false;
    setIsListening(false);

    let finalTranscript = await resultPromise;
    if (!finalTranscript) {
      await new Promise<void>(resolve => setTimeout(resolve, 600));
      finalTranscript = committedRef.current.trim();
    }

    const duration = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
    setDurationSeconds(duration);
    setStatus('idle');

    return {
      transcript: finalTranscript,
      durationSeconds: duration,
      audioSamples: samplesRef.current,
      utteranceSegments: utteranceSegmentsRef.current,
    };
  }, [cleanupTimer, waitForFinalTranscript]);

  const reset = useCallback(() => {
    committedRef.current = '';
    utteranceSegmentsRef.current = [];
    utteranceStartMsRef.current = 0;
    resetUtteranceBuffers.current();
    utteranceClosedRef.current = false;
    setDisplayTranscript('');
    setDurationSeconds(0);
    setWaveform(Array(20).fill(MIN_WAVEFORM_HEIGHT));
    setLiveAverageVolume(0);
    samplesRef.current = [];
    isRecordingRef.current = false;
    setIsListening(false);
    setStatus('idle');
    setError(null);
    resolvePendingResultRef.current();
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    Voice.cancel().catch(() => undefined);
  }, []);

  return {
    status,
    isRecording: status === 'recording',
    isListening,
    transcript: displayTranscript,
    error,
    durationSeconds,
    waveform,
    liveAverageVolume,
    audioSamples: samplesRef.current,
    utteranceSegments: utteranceSegmentsRef.current,
    start,
    stop,
    reset,
    locale: activeLocaleRef.current || preferredLocale,
  };
};

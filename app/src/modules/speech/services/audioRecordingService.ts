import {
  Platform,
  PermissionsAndroid,
  NativeModules,
  NativeEventEmitter,
} from 'react-native';

export interface AudioRecordResult {
  filePath: string;
  durationSeconds: number;
  fileSizeBytes?: number;
  mimeType: string;
}

export interface AudioMeteringEvent {
  volume: number; // 0 to 100
  normalized: number; // 0.0 to 1.0
}

const { AudioRecorderModule } = NativeModules;
const audioEventEmitter =
  AudioRecorderModule && Platform.OS === 'android'
    ? new NativeEventEmitter(AudioRecorderModule)
    : null;

let isMockRecording = false;
let mockStartTime = 0;
let mockInterval: ReturnType<typeof setInterval> | null = null;

export async function requestAudioRecordingPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Microphone Permission',
        message:
          'ConfidenceUp needs microphone access to record and analyze your speaking practice.',
        buttonPositive: 'Allow',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (e) {
    return false;
  }
}

/**
 * Starts recording 16kHz mono AAC audio (.m4a) to device cache
 */
export async function startAudioRecording(
  sessionId?: string,
): Promise<{ filePath: string }> {
  const hasPermission = await requestAudioRecordingPermissions();
  if (!hasPermission) {
    throw new Error('Microphone permission not granted');
  }

  if (AudioRecorderModule?.startRecording) {
    return AudioRecorderModule.startRecording(sessionId);
  }

  // Graceful fallback for non-native / simulated environments
  isMockRecording = true;
  mockStartTime = Date.now();
  return { filePath: `mock_speech_${sessionId || Date.now()}.m4a` };
}

/**
 * Stops recording and returns the generated .m4a file details
 */
export async function stopAudioRecording(): Promise<AudioRecordResult> {
  if (AudioRecorderModule?.stopRecording) {
    const result = await AudioRecorderModule.stopRecording();
    return {
      filePath: result.filePath,
      durationSeconds: Math.max(1, Math.round(result.durationSeconds || 1)),
      fileSizeBytes: result.fileSizeBytes,
      mimeType: result.mimeType || 'audio/m4a',
    };
  }

  // Mock fallback
  isMockRecording = false;
  if (mockInterval) clearInterval(mockInterval);
  const durationSeconds = Math.max(
    1,
    Math.round((Date.now() - mockStartTime) / 1000),
  );
  return {
    filePath: `mock_speech_${Date.now()}.m4a`,
    durationSeconds,
    fileSizeBytes: durationSeconds * 8000,
    mimeType: 'audio/m4a',
  };
}

/**
 * Cancels current recording and cleans up temporary audio file
 */
export async function cancelAudioRecording(): Promise<void> {
  if (AudioRecorderModule?.cancelRecording) {
    await AudioRecorderModule.cancelRecording();
    return;
  }
  isMockRecording = false;
  if (mockInterval) clearInterval(mockInterval);
}

/**
 * Checks if recording is currently active
 */
export async function isAudioRecording(): Promise<boolean> {
  if (AudioRecorderModule?.isRecording) {
    return AudioRecorderModule.isRecording();
  }
  return isMockRecording;
}

/**
 * Subscribes to 50ms real-time audio amplitude metering events (0..100)
 */
export function subscribeAudioMetering(
  listener: (data: AudioMeteringEvent) => void,
): () => void {
  if (audioEventEmitter) {
    const subscription = audioEventEmitter.addListener(
      'onAudioMetering',
      (event: AudioMeteringEvent) => {
        listener(event);
      },
    );
    return () => {
      subscription.remove();
    };
  }

  // Simulated metering fallback if native emitter not available
  const interval = setInterval(() => {
    if (isMockRecording) {
      const vol = Math.random() * 50 + 20;
      listener({ volume: vol, normalized: vol / 100 });
    }
  }, 100);

  return () => {
    clearInterval(interval);
  };
}

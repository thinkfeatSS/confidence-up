import NetInfo from '@react-native-community/netinfo';
import {
  getOfflineAudioQueue,
  dequeueOfflineAudio,
} from './localSpeechStorage';
import { uploadSpeechAudio } from '../modules/speech/services/audioUploadService';

let isSyncing = false;

/**
 * Processes queued offline audio recordings when internet connectivity is active
 */
export async function syncOfflineAudioSessions(): Promise<void> {
  if (isSyncing) return;

  const net = await NetInfo.fetch();
  if (!net.isConnected || !net.isInternetReachable) return;

  isSyncing = true;
  try {
    const queue = await getOfflineAudioQueue();
    if (queue.length === 0) return;

    for (const job of queue) {
      try {
        const uploadRes = await uploadSpeechAudio({
          audioResult: {
            filePath: job.filePath,
            durationSeconds: job.durationSeconds,
            mimeType: 'audio/m4a',
          },
          topic: job.topic,
          missionId: job.missionId,
          challengeId: job.challengeId,
        });

        if (uploadRes?.session_id) {
          // Dequeue once successfully submitted to server
          await dequeueOfflineAudio(job.id);
        }
      } catch (uploadErr) {
        console.warn(`[SpeechSyncService] Failed to upload offline job ${job.id}:`, uploadErr);
        // Leave in queue for next sync attempt
      }
    }
  } finally {
    isSyncing = false;
  }
}

/**
 * Initializes netinfo listener to auto-sync offline speech sessions
 */
export function initSpeechSyncListener(): () => void {
  const unsubscribe = NetInfo.addEventListener((state) => {
    if (state.isConnected && state.isInternetReachable) {
      syncOfflineAudioSessions().catch(() => {});
    }
  });

  return unsubscribe;
}


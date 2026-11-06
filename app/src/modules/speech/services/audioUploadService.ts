import { Platform } from 'react-native';
import { apiClient } from '../../../services/api';
import { AudioRecordResult } from './audioRecordingService';

export interface UploadSpeechPayload {
  audioResult: AudioRecordResult;
  topic: string;
  missionId?: string;
  challengeId?: string;
}

export interface SessionUploadResponse {
  session_id: string;
  status: string;
  status_stage?: string;
  message?: string;
}

export interface SessionStatusPollResult {
  session_id: string;
  status: 'queued' | 'transcribing' | 'analyzing' | 'coaching' | 'completed' | 'failed';
  status_stage?: string;
  progress_percent: number;
  error_message?: string;
  overall_confidence_score?: number;
  confidence_components?: {
    speech_fluency: number;
    topic_relevance: number;
    vocabulary: number;
    practice_consistency: number;
    structure?: number;
    energy?: number;
  };
  transcript?: string;
  language?: {
    primary_language: string;
    language_label: string;
    is_mixed: boolean;
  };
  metrics?: {
    words_per_minute: number;
    filler_count: number;
    filler_words: string[];
    word_count: number;
    sentence_count: number;
    vocabulary_richness: number;
    repetition_score: number;
    average_volume_db: number;
    natural_pauses_count: number;
    thinking_pauses_count: number;
    lost_pauses_count: number;
  };
  coaching?: {
    strengths: string[];
    weaknesses: string[];
    coaching_feedback: string[];
    personalized_suggestions: string[];
    next_mission: string;
    coach_message: string;
    emotional_tone: string;
  };
  duration_seconds?: number;
  processing_time_ms?: number;
  xp_earned?: number;
  gamification?: {
    xp_earned: number;
    new_level: number;
    leveled_up: boolean;
    new_badges: any[];
  };
}

/**
 * Uploads native recorded audio file (.m4a) to FastAPI asynchronous pipeline
 */
export async function uploadSpeechAudio(
  payload: UploadSpeechPayload,
): Promise<SessionUploadResponse> {
  const { audioResult, topic, missionId, challengeId } = payload;

  const uri =
    Platform.OS === 'android' && !audioResult.filePath.startsWith('file://')
      ? `file://${audioResult.filePath}`
      : audioResult.filePath;

  const fileName = `speech_${Date.now()}.m4a`;

  const formData = new FormData();
  formData.append('audio_file', {
    uri,
    name: fileName,
    type: audioResult.mimeType || 'audio/m4a',
  } as any);

  formData.append('topic', topic);
  if (missionId) formData.append('mission_id', missionId);
  if (challengeId) formData.append('challenge_id', challengeId);

  const response = await apiClient.post<SessionUploadResponse, any>(
    '/speech/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 2 minutes for slow mobile uploads
    },
  );

  return response.data || response;
}

/**
 * Polls the session status endpoint until completion or timeout
 */
export async function pollSessionStatus(
  sessionId: string,
  onProgress?: (status: SessionStatusPollResult) => void,
  maxAttempts = 40,
  intervalMs = 800,
): Promise<SessionStatusPollResult> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const res = await apiClient.get<SessionStatusPollResult, any>(
        `/sessions/${sessionId}`,
      );
      const data: SessionStatusPollResult = res.data || res;

      if (onProgress) {
        onProgress(data);
      }

      if (data.status === 'completed') {
        return data;
      }

      if (data.status === 'failed') {
        throw new Error(data.error_message || 'Speech processing failed on server');
      }
    } catch (err: any) {
      // If server returns temporary 404 while database write completes, keep polling
      if (err?.response?.status !== 404 && attempts > 3) {
        // Only ignore transient network errors for a couple of tries
      }
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error('Speech analysis timed out. Please check your practice history.');
}


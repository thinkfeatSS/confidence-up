import AsyncStorage from '@react-native-async-storage/async-storage';
import { SpeechSession } from '../types';

const LOCAL_SPEECH_SESSIONS_KEY = '@speech_sessions_local';
const MAX_LOCAL_SESSIONS = 50;

/**
 * Retrieve locally saved speech sessions from AsyncStorage
 */
export async function getLocalSpeechSessions(): Promise<SpeechSession[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_SPEECH_SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SpeechSession[]) : [];
  } catch (err) {
    console.warn('[LocalSpeechStorage] Failed to read local speech sessions:', err);
    return [];
  }
}

/**
 * Save a new speech session locally
 */
export async function saveLocalSpeechSession(session: SpeechSession): Promise<SpeechSession[]> {
  try {
    const existing = await getLocalSpeechSessions();
    // Filter out if duplicate ID exists
    const filtered = existing.filter(s => s.id !== session.id);
    const updated = [session, ...filtered].slice(0, MAX_LOCAL_SESSIONS);
    await AsyncStorage.setItem(LOCAL_SPEECH_SESSIONS_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('[LocalSpeechStorage] Failed to save local speech session:', err);
    return [];
  }
}

/**
 * Merge API speech sessions and locally saved sessions, deduplicating by ID or timestamp
 */
export function mergeSpeechSessions(
  apiSessions: SpeechSession[] = [],
  localSessions: SpeechSession[] = [],
): SpeechSession[] {
  const seenIds = new Set<string>();
  const merged: SpeechSession[] = [];

  for (const session of apiSessions) {
    if (session && session.id && !seenIds.has(session.id)) {
      seenIds.add(session.id);
      merged.push(session);
    }
  }

  for (const session of localSessions) {
    if (session && session.id && !seenIds.has(session.id)) {
      // Check if another session with similar timestamp & prompt exists to avoid duplicate
      const hasDuplicate = merged.some(
        m =>
          m.prompt === session.prompt &&
          Math.abs(new Date(m.date).getTime() - new Date(session.date).getTime()) < 60000,
      );
      if (!hasDuplicate) {
        seenIds.add(session.id);
        merged.push(session);
      }
    }
  }

  // Sort newest first
  return merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

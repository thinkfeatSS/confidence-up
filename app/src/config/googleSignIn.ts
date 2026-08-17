import Config from 'react-native-config';
import { GOOGLE_WEB_CLIENT_ID_FROM_FIREBASE } from './googleSignIn.generated';

/** Firebase project number for confidence-up (must match google-services.json). */
export const FIREBASE_PROJECT_NUMBER = '408638792904';

export function projectNumberFromClientId(clientId: string): string | null {
  const match = clientId.match(/^(\d+)-/);
  return match ? match[1] : null;
}

/** Web OAuth client ID — prefers value baked in from google-services.json at build time. */
export function getGoogleWebClientId(): string | undefined {
  const fromFirebase = GOOGLE_WEB_CLIENT_ID_FROM_FIREBASE?.trim();
  const fromEnv = Config.GOOGLE_WEB_CLIENT_ID?.trim();
  return fromFirebase || fromEnv || undefined;
}

export function getGoogleSignInConfigError(): string | null {
  const clientId = getGoogleWebClientId();
  if (!clientId) {
    return (
      'Google Sign-In is not configured.\n\n' +
      'In Firebase Console (project confidence-up):\n' +
      '1. Authentication → Get started\n' +
      '2. Sign-in method → Enable Google → Save\n' +
      '3. Re-download google-services.json → app/android/app/\n' +
      '4. Rebuild the app\n\n' +
      'See app/android/GOOGLE_SIGNIN.md'
    );
  }

  const projectNumber = projectNumberFromClientId(clientId);
  if (projectNumber && projectNumber !== FIREBASE_PROJECT_NUMBER) {
    return (
      `GOOGLE_WEB_CLIENT_ID belongs to Google Cloud project ${projectNumber}, ` +
      `but this app uses Firebase project confidence-up (${FIREBASE_PROJECT_NUMBER}).\n\n` +
      'Use the Web client ID from Firebase → Authentication → Google, ' +
      'or rebuild after updating google-services.json.'
    );
  }

  if (!GOOGLE_WEB_CLIENT_ID_FROM_FIREBASE && fromEnvLooksStale(clientId)) {
    return (
      'google-services.json has no OAuth clients yet.\n\n' +
      'Enable Google in Firebase Authentication, re-download google-services.json, and rebuild.'
    );
  }

  return null;
}

function fromEnvLooksStale(clientId: string): boolean {
  return projectNumberFromClientId(clientId) !== FIREBASE_PROJECT_NUMBER;
}

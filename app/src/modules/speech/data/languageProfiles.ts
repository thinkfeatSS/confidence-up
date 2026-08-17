import { LanguageCode } from '../types/speechAnalysis.types';

export type LanguageProfile = {
  code: Exclude<LanguageCode, 'mixed' | 'unknown'>;
  name: string;
  locale: string;
  script: 'latin' | 'arabic' | 'devanagari';
  rtl?: boolean;
};

export const LANGUAGE_PROFILES: LanguageProfile[] = [
  { code: 'en', name: 'English', locale: 'en-US', script: 'latin' },
  { code: 'ur', name: 'Urdu', locale: 'ur-PK', script: 'arabic', rtl: true },
  { code: 'hi', name: 'Hindi', locale: 'hi-IN', script: 'devanagari' },
  { code: 'sd', name: 'Sindhi', locale: 'sd-PK', script: 'arabic', rtl: true },
];

export const DEFAULT_PREFERRED_LANGUAGES = ['Urdu', 'English'];

export function localeForLanguageName(name?: string) {
  const normalized = String(name ?? '').toLowerCase();
  return LANGUAGE_PROFILES.find(
    profile =>
      profile.name.toLowerCase() === normalized ||
      profile.code.toLowerCase() === normalized,
  )?.locale ?? 'en-US';
}

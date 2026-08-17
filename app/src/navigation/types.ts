import { NavigatorScreenParams } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Mission, Challenge } from '../types';

// ─── Auth Stack ───────────────────────────────────────────────────────────────
export type AuthStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Quiz: undefined;
  Login: { verifiedEmail?: string; showVerifiedBanner?: boolean } | undefined;
  OTPVerification: { email: string; purpose: 'register' | 'forgot-password' };
  ForgotPassword: undefined;
  ResetPassword: { email: string; otp: string };
  LegalDocument: { document: 'privacy' | 'terms' };
};

// ─── Main Tabs ────────────────────────────────────────────────────────────────
export type MainTabParamList = {
  Home: undefined;
  Practice: { prompt?: string; missionId?: string; challengeId?: string } | undefined;
  Missions: undefined;
  Progress: undefined;
  Profile: undefined;
};

// ─── Main Stack (wraps tabs + modal screens) ─────────────────────────────────
export type MainStackParamList = {
  Tabs: NavigatorScreenParams<MainTabParamList>;
  MissionDetail: { mission: Mission };
  ChallengeDetail: { challenge: Challenge };
  ChallengesBrowse: undefined;
  FearTracker: undefined;
  AiCoach: undefined;
  Journal: undefined;
  JournalEntry: { entryId?: string };
  SkillTree: undefined;
  Badges: undefined;
  LegalDocument: { document: 'privacy' | 'terms' };
  About: undefined;
  Feedback: undefined;
};

// ─── Root Stack ───────────────────────────────────────────────────────────────
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
};

// ─── Navigation prop helpers ──────────────────────────────────────────────────
export type AuthNavProp = StackNavigationProp<AuthStackParamList>;
export type MainTabNavProp = BottomTabNavigationProp<MainTabParamList>;
export type MainStackNavProp = StackNavigationProp<MainStackParamList>;

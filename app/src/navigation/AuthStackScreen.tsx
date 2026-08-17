import React, { useMemo } from 'react';
import { AuthNavigator } from './AuthNavigator';
import { useAuth } from '../context/AuthContext';
import { AuthStackParamList } from './types';

const getAuthInitialRoute = (
  isAuthenticated: boolean,
  hasCompletedOnboarding: boolean,
): keyof AuthStackParamList | undefined => {
  if (isAuthenticated && !hasCompletedOnboarding) return 'Quiz';
  if (!isAuthenticated && hasCompletedOnboarding) return 'Login';
  return undefined;
};

/** Stable screen component — avoids remounting auth stack on every AppNavigator render. */
export const AuthStackScreen = () => {
  const { isAuthenticated, hasCompletedOnboarding } = useAuth();
  const initialRouteName = useMemo(
    () => getAuthInitialRoute(isAuthenticated, hasCompletedOnboarding) ?? 'Splash',
    [isAuthenticated, hasCompletedOnboarding],
  );

  return <AuthNavigator initialRouteName={initialRouteName} />;
};

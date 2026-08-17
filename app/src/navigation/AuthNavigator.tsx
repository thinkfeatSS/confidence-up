import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthStackParamList } from './types';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { QuizScreen } from '../screens/auth/QuizScreen';
import { AuthScreen } from '../screens/auth/AuthScreen';
import { OTPVerificationScreen } from '../screens/auth/OTPVerificationScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
import { LegalDocumentScreen } from '../screens/legal/LegalDocumentScreen';

const Stack = createStackNavigator<AuthStackParamList>();

type AuthNavigatorProps = {
  initialRouteName?: keyof AuthStackParamList;
};

export const AuthNavigator = ({ initialRouteName = 'Splash' }: AuthNavigatorProps) => (
  <Stack.Navigator
    initialRouteName={initialRouteName}
    screenOptions={{ headerShown: false, animation: 'default' }}>
    <Stack.Screen name="Splash" component={SplashScreen} />
    <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    <Stack.Screen name="Quiz" component={QuizScreen} />
    <Stack.Screen name="Login" component={AuthScreen} />
    <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    <Stack.Screen name="LegalDocument" component={LegalDocumentScreen} />
  </Stack.Navigator>
);

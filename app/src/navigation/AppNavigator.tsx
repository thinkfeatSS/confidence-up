import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from './types';
import { AuthStackScreen } from './AuthStackScreen';
import { MainNavigator } from './MainNavigator';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';

const Root = createStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  const { isAuthenticated, hasCompletedOnboarding, isLoading } = useAuth();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.bgPrimary }]}>
        <ActivityIndicator size="large" color={colors.accentPurple} />
      </View>
    );
  }

  const showMain = isAuthenticated && hasCompletedOnboarding;

  return (
    <Root.Navigator screenOptions={{ headerShown: false }}>
      {showMain ? (
        <Root.Screen name="Main" component={MainNavigator} />
      ) : (
        <Root.Screen name="Auth" component={AuthStackScreen} />
      )}
    </Root.Navigator>
  );
};

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

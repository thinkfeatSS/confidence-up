import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';
import { AuthProvider } from './src/context/AuthContext';
import { NetworkProvider } from './src/context/NetworkContext';
import { AppProvider } from './src/context/AppContext';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { UserSettingsSync } from './src/components/common/UserSettingsSync';
import { PushNotificationBootstrap } from './src/components/common/PushNotificationBootstrap';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 0, staleTime: 5 * 60 * 1000 },
  },
});

function ThemedApp() {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <AuthProvider>
        <NetworkProvider>
          <UserSettingsSync />
          <PushNotificationBootstrap />
          <AppProvider>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </AppProvider>
        </NetworkProvider>
      </AuthProvider>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <ThemeProvider>
            <ThemedApp />
          </ThemeProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

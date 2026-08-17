import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemeProvider, useTheme } from '../../theme/ThemeContext';
import { BorderRadius, Spacing, Typography } from '../../theme';

type Props = { children: ReactNode };
type State = { hasError: boolean; message: string };

const ErrorFallback = ({ onRetry }: { onRetry: () => void }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Something went wrong</Text>
      <Text style={[styles.body, { color: colors.textSecondary }]}>
        The app ran into an unexpected problem. Tap below to try again.
      </Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.accentPurple }]}
        onPress={onRetry}
        activeOpacity={0.85}>
        <Text style={[styles.buttonText, { color: colors.white }]}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message || 'Something went wrong.',
    };
  }

  componentDidCatch(error: Error) {
    if (__DEV__) {
      console.error('[ErrorBoundary]', error);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <ThemeProvider>
        <ErrorFallback onRetry={this.handleRetry} />
      </ThemeProvider>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  icon: { fontSize: 48 },
  title: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  body: {
    ...(Typography.body as object),
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
  },
  buttonText: { fontWeight: '700', fontSize: 16 },
});

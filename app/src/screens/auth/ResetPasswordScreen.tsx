import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { StackScreenProps } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';
import { Spacing, BorderRadius, Typography } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { GradientBackground } from '../../components/common/GradientBackground';
import { GlassCard } from '../../components/common/GlassCard';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { PasswordField } from '../../components/common/PasswordField';

type Props = StackScreenProps<AuthStackParamList, 'ResetPassword'>;

export const ResetPasswordScreen = ({ route, navigation }: Props) => {
  const { email, otp } = route.params;
  const { resetPassword } = useAuth();
  const { colors } = useTheme();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!password || password.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email, otp, password);
      Alert.alert('Password Reset', 'Your password has been updated. Please sign in.', [
        { text: 'Sign In', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Text style={[styles.backText, { color: colors.accentCyan }]}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <LinearGradient colors={[colors.accentPurple, colors.accentCyan]} style={styles.iconCircle}>
              <Text style={{ fontSize: 32 }}>🔐</Text>
            </LinearGradient>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Set New Password</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Choose a strong password for your account.
            </Text>
          </View>

          <GlassCard style={styles.card}>
            <PasswordField
              label="New Password"
              placeholder="Min 8 characters"
              value={password}
              onChangeText={setPassword}
              textContentType="newPassword"
              autoComplete="password-new"
            />

            <PasswordField
              label="Confirm Password"
              placeholder="Re-enter password"
              value={confirm}
              onChangeText={setConfirm}
              textContentType="newPassword"
              autoComplete="password-new"
              error={confirm !== '' && password !== confirm ? 'Passwords do not match' : undefined}
            />

            <PrimaryButton
              label="Reset Password ✓"
              onPress={handleSubmit}
              loading={loading}
              style={{ marginTop: 8 }}
            />
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: 60,
    paddingBottom: 40,
    gap: Spacing.xl,
  },
  backBtn: { alignSelf: 'flex-start' },
  backText: { ...(Typography.body as object) },
  header: { alignItems: 'center', gap: 12 },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 12,
  },
  title: { fontSize: 24, fontWeight: '900', textAlign: 'center' },
  subtitle: { ...(Typography.body as object), textAlign: 'center' },
  card: { gap: Spacing.base },
});

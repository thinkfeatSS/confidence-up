import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
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

type Props = StackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen = ({ navigation }: Props) => {
  const { forgotPassword } = useAuth();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      navigation.navigate('OTPVerification', { email: email.trim(), purpose: 'forgot-password' });
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to send reset email. Please try again.');
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
            <Text style={[styles.backText, { color: colors.accentCyan }]}>← Back to Login</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <LinearGradient colors={[colors.accentPurple, colors.accentCyan]} style={styles.iconCircle}>
              <Text style={{ fontSize: 32 }}>🔑</Text>
            </LinearGradient>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Forgot Password?</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Enter your email and we'll send you a reset code.
            </Text>
          </View>

          <GlassCard style={styles.card}>
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Email Address</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.bgInput,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder="you@example.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                autoComplete="email"
              />
            </View>

            <PrimaryButton
              label="Send Reset Code"
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
  subtitle: { ...(Typography.body as object), textAlign: 'center', lineHeight: 22 },
  card: { gap: Spacing.base },
  field: { gap: 6 },
  fieldLabel: { ...(Typography.labelBold as object) },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
});

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import { StackScreenProps } from '@react-navigation/stack';
import LinearGradient from 'react-native-linear-gradient';
import { AuthStackParamList } from '../../navigation/types';
import { Spacing, BorderRadius, Typography } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { GradientBackground } from '../../components/common/GradientBackground';
import { GlassCard } from '../../components/common/GlassCard';
import { PrimaryButton } from '../../components/common/PrimaryButton';

type Props = StackScreenProps<AuthStackParamList, 'OTPVerification'>;

const RESEND_COOLDOWN = 60;

const ResendRow = React.memo(({ onResend }: { onResend: () => void }) => {
  const { colors } = useTheme();
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handlePress = () => {
    if (cooldown > 0) return;
    onResend();
    setCooldown(RESEND_COOLDOWN);
  };

  return (
    <View style={styles.resendRow}>
      <Text style={[styles.resendLabel, { color: colors.textMuted }]}>Didn't receive the code? </Text>
      <TouchableOpacity onPress={handlePress} disabled={cooldown > 0} activeOpacity={0.7}>
        <Text
          style={[
            styles.resendBtn,
            { color: cooldown > 0 ? colors.textMuted : colors.accentCyan },
          ]}>
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend'}
        </Text>
      </TouchableOpacity>
    </View>
  );
});

export const OTPVerificationScreen = ({ route, navigation }: Props) => {
  const { email, purpose } = route.params;
  const { verifyEmail, resendOtp } = useAuth();
  const { colors } = useTheme();

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const applyOtp = useCallback((value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '').slice(0, 6);
    const next = cleaned.split('').concat(Array(6).fill('')).slice(0, 6);
    setDigits(next);
    const focusIndex = Math.min(cleaned.length, 5);
    inputRefs.current[focusIndex]?.focus();
  }, []);

  const handleDigitChange = (text: string, index: number) => {
    const numeric = text.replace(/[^0-9]/g, '');
    if (numeric.length > 1) {
      applyOtp(numeric);
      return;
    }
    const cleaned = numeric.slice(-1);
    const next = [...digits];
    next[index] = cleaned;
    setDigits(next);
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = '';
      setDigits(next);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const otp = digits.join('');

  const handleSubmit = async () => {
    if (otp.length < 6) return;
    setLoading(true);
    try {
      if (purpose === 'register') {
        await verifyEmail(email, otp);
        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'Login',
              params: { verifiedEmail: email, showVerifiedBanner: true },
            },
          ],
        });
      } else {
        navigation.replace('ResetPassword', { email, otp });
      }
    } catch (err: any) {
      Alert.alert('Invalid Code', err?.message ?? 'Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendOtp(email);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to resend code.');
    }
  };

  return (
    <GradientBackground style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        <ScrollView
          contentContainerStyle={styles.inner}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Text style={[styles.backText, { color: colors.accentCyan }]}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <LinearGradient colors={[colors.accentPurple, colors.accentCyan]} style={styles.iconCircle}>
              <Text style={{ fontSize: 32 }}>✉️</Text>
            </LinearGradient>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Check your email</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              We sent a 6-digit code to{'\n'}
              <Text style={{ color: colors.accentCyan, fontWeight: '600' }}>{email}</Text>
            </Text>
          </View>

          <GlassCard style={styles.card}>
            <View style={styles.digitRow}>
              {digits.map((d, i) => (
                <TextInput
                  key={i}
                  ref={ref => {
                    inputRefs.current[i] = ref;
                  }}
                  style={[
                    styles.digitInput,
                    {
                      backgroundColor: colors.bgInput,
                      borderColor: d ? colors.accentPurple : colors.border,
                      color: colors.textPrimary,
                    },
                    d ? { backgroundColor: `${colors.accentPurple}20` } : undefined,
                  ]}
                  value={d}
                  onChangeText={text => handleDigitChange(text, i)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                  keyboardType="number-pad"
                  maxLength={i === 0 ? 6 : 1}
                  selectTextOnFocus
                  autoFocus={i === 0}
                  textContentType="oneTimeCode"
                  autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
                />
              ))}
            </View>

            <PrimaryButton
              label={purpose === 'register' ? 'Verify Email ✓' : 'Continue →'}
              onPress={handleSubmit}
              loading={loading}
              style={{ marginTop: 8 }}
            />
          </GlassCard>

          <ResendRow onResend={handleResend} />
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
  digitRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  digitInput: {
    flex: 1,
    height: 56,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendLabel: { ...(Typography.bodySmall as object) },
  resendBtn: { ...(Typography.bodySmall as object), fontWeight: '700' },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { StackScreenProps } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';
import { Spacing, BorderRadius, Typography } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { GradientBackground } from '../../components/common/GradientBackground';
import { GlassCard } from '../../components/common/GlassCard';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { PasswordField } from '../../components/common/PasswordField';
import { getAuthErrorMessage, parseApiError } from '../../utils/apiError';
import { isNetworkError } from '../../utils/networkAlert';
import { getGoogleSignInConfigError, getGoogleWebClientId } from '../../config/googleSignIn';

type Props = StackScreenProps<AuthStackParamList, 'Login'>;

export const AuthScreen = ({ navigation, route }: Props) => {
  const { colors } = useTheme();
  const { register, login, loginWithGoogle, isAuthenticated, hasCompletedOnboarding } = useAuth();
  const verifiedEmail = route.params?.verifiedEmail;
  const showVerifiedBanner = route.params?.showVerifiedBanner;
  const [mode, setMode] = useState<'login' | 'register'>(verifiedEmail ? 'register' : 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState(verifiedEmail ?? '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [verifiedBannerVisible, setVerifiedBannerVisible] = useState(!!showVerifiedBanner);

  useEffect(() => {
    const webClientId = getGoogleWebClientId();
    if (webClientId) {
      GoogleSignin.configure({
        webClientId,
        offlineAccess: false,
      });
    }
  }, []);

  useEffect(() => {
    if (!showVerifiedBanner) return;
    setVerifiedBannerVisible(true);
    const timer = setTimeout(() => setVerifiedBannerVisible(false), 5000);
    return () => clearTimeout(timer);
  }, [showVerifiedBanner]);

  useEffect(() => {
    if (isAuthenticated && !hasCompletedOnboarding) {
      navigation.reset({ index: 0, routes: [{ name: 'Quiz' }] });
    }
  }, [isAuthenticated, hasCompletedOnboarding, navigation]);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'register') {
        const displayName = name.trim() || trimmedEmail.split('@')[0];
        await register(displayName, trimmedEmail, password);
        navigation.navigate('OTPVerification', { email: trimmedEmail, purpose: 'register' });
      } else {
        await login(trimmedEmail, password);
      }
    } catch (err: unknown) {
      const parsed = parseApiError(err);
      const message = getAuthErrorMessage(err, mode);
      if (mode === 'login' && (parsed.statusCode === 403 || message?.toLowerCase().includes('verif'))) {
        navigation.navigate('OTPVerification', { email: trimmedEmail, purpose: 'register' });
        return;
      }
      if (parsed.isNetworkError || isNetworkError(err)) {
        return;
      }
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (Platform.OS !== 'android') return;
    const configError = getGoogleSignInConfigError();
    if (configError) {
      Alert.alert('Google Sign-In not configured', configError);
      return;
    }

    setGoogleLoading(true);
    try {
      const webClientId = getGoogleWebClientId();
      if (webClientId) {
        GoogleSignin.configure({
          webClientId,
          offlineAccess: false,
        });
      }
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const result = await GoogleSignin.signIn();

      if (result.type === 'cancelled') return;

      let idToken = result.data?.idToken ?? null;
      if (!idToken) {
        const tokens = await GoogleSignin.getTokens();
        idToken = tokens.idToken;
      }
      if (!idToken) {
        throw new Error(
          'No Google ID token received. Add your app SHA-1 fingerprint in Firebase Console and rebuild.',
        );
      }

      await loginWithGoogle(idToken);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'SIGN_IN_CANCELLED' || code === '-5') return;

      const parsed = parseApiError(err);
      if (parsed.isNetworkError || isNetworkError(err)) return;

      const rawMsg = (err as Error)?.message || String(err);
      const nativeMessage = `Error [${code || 'UNKNOWN'}]: ${rawMsg}\n\n${
        code === '10' || code === 'DEVELOPER_ERROR'
          ? 'Check Google Play Services OAuth propagation or account authentication.'
          : ''
      }`;

      Alert.alert('Google Sign-In failed', nativeMessage);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <GradientBackground style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <LinearGradient colors={[colors.accentPurple, colors.accentCyan]} style={styles.logoCircle}>
              <Text style={{ fontSize: 40 }}>⚡</Text>
            </LinearGradient>
            <Text style={[styles.appName, { color: colors.textPrimary }]}>SpeakUpMic</Text>
            <Text style={[styles.tagline, { color: colors.textMuted }]}>Your journey starts here</Text>
          </View>

          {verifiedBannerVisible && (
            <View style={[styles.verifiedBanner, { backgroundColor: `${colors.success}20`, borderColor: colors.success }]}>
              <Text style={[styles.verifiedBannerText, { color: colors.success }]}>
                ✓ Email verified — sign in to continue
              </Text>
            </View>
          )}

          <View style={[styles.tabRow, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.tab, mode === 'register' && { backgroundColor: colors.accentPurple }]}
              onPress={() => setMode('register')}
              activeOpacity={0.8}>
              <Text
                style={[
                  styles.tabText,
                  { color: colors.textMuted },
                  mode === 'register' && { color: colors.white },
                ]}>
                Sign Up
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === 'login' && { backgroundColor: colors.accentPurple }]}
              onPress={() => setMode('login')}
              activeOpacity={0.8}>
              <Text
                style={[
                  styles.tabText,
                  { color: colors.textMuted },
                  mode === 'login' && { color: colors.white },
                ]}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>

          <GlassCard style={styles.card}>
            {mode === 'register' && (
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Your Name</Text>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.bgInput }]}
                  placeholder="e.g. Ismail"
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Email</Text>
              <TextInput
                style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.bgInput }]}
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

            <PasswordField
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />

            <PrimaryButton
              label={mode === 'register' ? 'Create Account 🚀' : 'Sign In ⚡'}
              onPress={handleSubmit}
              loading={loading}
              style={{ marginTop: 8 }}
            />

            {Platform.OS === 'android' && (
              <PrimaryButton
                label="Continue with Google"
                onPress={handleGoogleSignIn}
                loading={googleLoading}
                variant="outline"
              />
            )}

            {mode === 'login' && (
              <TouchableOpacity
                style={styles.forgotBtn}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={[styles.forgotText, { color: colors.accentCyan }]}>Forgot password?</Text>
              </TouchableOpacity>
            )}
          </GlassCard>

          <Text style={[styles.terms, { color: colors.textMuted }]}>
            By continuing, you agree to our{' '}
            <Text
              style={[styles.termsLink, { color: colors.accentCyan }]}
              onPress={() => navigation.navigate('LegalDocument', { document: 'terms' })}>
              Terms of Service
            </Text>
            {' '}and{' '}
            <Text
              style={[styles.termsLink, { color: colors.accentCyan }]}
              onPress={() => navigation.navigate('LegalDocument', { document: 'privacy' })}>
              Privacy Policy
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 48,
    gap: Spacing.xl,
  },
  header: { alignItems: 'center', gap: 12 },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 15,
  },
  appName: { fontSize: 26, fontWeight: '900' },
  tagline: { ...(Typography.body as object) },
  tabRow: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    padding: 4,
    borderWidth: 1,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  tabText: { fontWeight: '600', fontSize: 14 },
  verifiedBanner: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: Spacing.base,
  },
  verifiedBannerText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
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
  forgotBtn: { alignItems: 'center', marginTop: 4 },
  forgotText: { ...(Typography.bodySmall as object) },
  terms: { ...(Typography.caption as object), textAlign: 'center', lineHeight: 18 },
  termsLink: { fontWeight: '600' },
});

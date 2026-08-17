import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, TextInputProps } from 'react-native';
import { BorderRadius, Spacing, Typography } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';

type PasswordFieldProps = Omit<TextInputProps, 'secureTextEntry'> & {
  label?: string;
  error?: string;
};

export const PasswordField = ({
  label,
  error,
  style,
  ...inputProps
}: PasswordFieldProps) => {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.field}>
      {label ? (
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      ) : null}
      <View
        style={[
          styles.inputWrap,
          {
            borderColor: error ? colors.danger : colors.border,
            backgroundColor: colors.bgInput,
          },
        ]}>
        <TextInput
          {...inputProps}
          style={[styles.input, { color: colors.textPrimary }, style]}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType={inputProps.textContentType ?? 'password'}
          autoComplete={inputProps.autoComplete ?? 'password'}
        />
        <TouchableOpacity
          onPress={() => setVisible(v => !v)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
          style={styles.eyeBtn}>
          <Text style={[styles.eyeIcon, { color: colors.textMuted }]}>{visible ? '🙈' : '👁'}</Text>
        </TouchableOpacity>
      </View>
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { ...(Typography.labelBold as object) },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingRight: Spacing.sm,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  eyeBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  eyeIcon: {
    fontSize: 18,
  },
  error: {
    ...(Typography.caption as object),
  },
});

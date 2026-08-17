import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { ChatMessage } from '../../types';
import { Spacing, BorderRadius } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';

interface MessageBubbleProps {
  message: ChatMessage;
}

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const MessageBubble = React.memo(({ message }: MessageBubbleProps) => {
  const { colors } = useTheme();
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <View style={[styles.row, styles.rowRight]}>
        <LinearGradient
          colors={[colors.accentPurple, colors.accentPurpleLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.bubble, styles.userBubble]}>
          <Text style={[styles.userText, { color: colors.white }]}>{message.content}</Text>
          <Text style={[styles.time, { color: 'rgba(255,255,255,0.55)' }]}>{formatTime(message.timestamp)}</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[styles.row, styles.rowLeft]}>
      <View style={[styles.aiAvatar, { borderColor: colors.borderCyan, backgroundColor: `${colors.accentCyan}20` }]}>
        <Text style={{ fontSize: 16 }}>🤖</Text>
      </View>
      <View
        style={[
          styles.bubble,
          styles.aiBubble,
          { backgroundColor: colors.bgCard, borderColor: colors.border, borderLeftColor: colors.accentCyan },
        ]}>
        <Text style={[styles.aiText, { color: colors.textPrimary }]}>{message.content}</Text>
        <Text style={[styles.time, { color: colors.textMuted }]}>{formatTime(message.timestamp)}</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginVertical: Spacing.xs,
    paddingHorizontal: Spacing.base,
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  rowRight: { justifyContent: 'flex-end' },
  rowLeft: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '75%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: 4,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    borderWidth: 1,
    borderLeftWidth: 2,
    borderBottomLeftRadius: 4,
  },
  userText: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  },
  aiText: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  },
  time: {
    fontSize: 10,
    fontWeight: '500',
    alignSelf: 'flex-end',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

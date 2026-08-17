import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  ListRenderItem,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation/types';
import { useChat } from '../../hooks/useChat';
import { useUser } from '../../hooks/useUser';
import { useProgress } from '../../hooks/useProgress';
import { GradientBackground } from '../../components/common/GradientBackground';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { TypingIndicator } from '../../components/chat/TypingIndicator';
import { SuggestionChips } from '../../components/chat/SuggestionChips';
import { Spacing, BorderRadius } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { ChatMessage } from '../../types';

type Props = StackScreenProps<MainStackParamList, 'AiCoach'>;

export const AiCoachScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const { data: user } = useUser();
  const { data: progress } = useProgress();
  const coachContext = {
    streak: user?.streak,
    confidenceScore: user?.confidenceScore,
    lastSessionScore: progress?.speechSessions?.[0]?.overallScore,
  };
  const { messages, isTyping, sendMessage } = useChat(coachContext);
  const [inputText, setInputText] = useState('');
  const listRef = useRef<FlatList>(null);

  const scrollToBottom = useCallback(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, []);

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    sendMessage(text);
    setTimeout(scrollToBottom, 100);
  }, [inputText, sendMessage, scrollToBottom]);

  const handleSuggestion = useCallback(
    (text: string) => {
      sendMessage(text);
      setTimeout(scrollToBottom, 100);
    },
    [sendMessage, scrollToBottom],
  );

  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);

  const renderMessage: ListRenderItem<ChatMessage> = useCallback(
    ({ item }) => <MessageBubble message={item} />,
    [],
  );

  const keyExtractor = useCallback((m: ChatMessage) => m.id, []);

  const listFooter = isTyping ? <TypingIndicator /> : null;

  return (
    <GradientBackground style={styles.container}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backBtn}>
          <Text style={[styles.backArrow, { color: colors.textPrimary }]}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>🤖 Atlas</Text>
          <Text style={[styles.headerSub, { color: colors.accentCyan }]}>AI Confidence Coach</Text>
        </View>
        <View style={[styles.onlineDot, { backgroundColor: colors.success }]} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={keyExtractor}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          ListFooterComponent={listFooter}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        />

        <SuggestionChips onSelect={handleSuggestion} />

        <View
          style={[
            styles.inputBar,
            { borderTopColor: colors.border, backgroundColor: colors.bgSecondary },
          ]}>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: colors.bgInput,
                borderColor: colors.border,
                color: colors.textPrimary,
              },
            ]}
            placeholder="Message Atlas…"
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: inputText.trim() ? colors.accentPurple : colors.bgCard },
            ]}
            onPress={handleSend}
            disabled={!inputText.trim()}
            activeOpacity={0.8}>
            <Text style={[styles.sendIcon, { color: colors.white }]}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backArrow: { fontSize: 22 },
  headerInfo: { flex: 1, gap: 2 },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  headerSub: { fontSize: 11 },
  onlineDot: { width: 10, height: 10, borderRadius: 5 },
  messagesList: { paddingVertical: Spacing.md, gap: 4, flexGrow: 1 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    maxHeight: 100,
    minHeight: 42,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: { fontSize: 18 },
});

import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Platform } from 'react-native';
import {
  createBottomTabNavigator,
  BottomTabBarButtonProps,
} from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabParamList } from './types';
import { HomeScreen } from '../screens/main/HomeScreen';
import { SpeakingPracticeScreen } from '../screens/main/SpeakingPracticeScreen';
import { DailyChallengeScreen } from '../screens/main/DailyChallengeScreen';
import { ProgressScreen } from '../screens/main/ProgressScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { useTheme } from '../theme/ThemeContext';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TabIcon = ({
  emoji,
  focused,
}: {
  emoji: string;
  focused: boolean;
}) => {
  const { colors } = useTheme();
  return (
    <View style={tabStyles.iconWrapper}>
      <Text style={tabStyles.tabEmoji}>{emoji}</Text>
      <View
        style={[
          tabStyles.activeDot,
          focused && { backgroundColor: colors.accentPurpleLight },
        ]}
      />
    </View>
  );
};

const renderHomeIcon = ({ focused }: { focused: boolean }) => <TabIcon emoji="🏠" focused={focused} />;
const renderPracticeIcon = ({ focused }: { focused: boolean }) => <TabIcon emoji="🎤" focused={focused} />;
const renderMissionsIcon = () => <Text style={tabStyles.centerEmoji}>⚔️</Text>;
const renderProgressIcon = ({ focused }: { focused: boolean }) => <TabIcon emoji="📊" focused={focused} />;
const renderProfileIcon = ({ focused }: { focused: boolean }) => <TabIcon emoji="👤" focused={focused} />;

const MissionsTabButton = ({
  children,
  onPress,
  style,
  accessibilityState,
  accessibilityRole,
  accessibilityLabel,
  testID,
}: BottomTabBarButtonProps) => {
  const { colors } = useTheme();
  return (
    <View style={[tabStyles.centerButtonWrapper, style]} pointerEvents="box-none">
      <TouchableOpacity
        style={[tabStyles.centerButton, { backgroundColor: colors.accentPurple, borderColor: colors.bgPrimary }]}
        onPress={onPress ?? undefined}
        activeOpacity={0.85}
        accessibilityRole={accessibilityRole ?? 'button'}
        accessibilityState={accessibilityState}
        accessibilityLabel={accessibilityLabel ?? 'Daily Missions'}
        testID={testID}>
        {children}
      </TouchableOpacity>
    </View>
  );
};

const renderMissionsButton = (props: BottomTabBarButtonProps) => <MissionsTabButton {...props} />;

const homeOptions = { tabBarIcon: renderHomeIcon };
const practiceOptions = { tabBarIcon: renderPracticeIcon };
const missionsOptions = {
  tabBarIcon: renderMissionsIcon,
  tabBarButton: renderMissionsButton,
};
const progressOptions = { tabBarIcon: renderProgressIcon };
const profileOptions = { tabBarIcon: renderProfileIcon };

export const MainTabNavigator = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 10);
  const barHeight = 56 + bottomInset;

  const screenOptions = useMemo(
    () => ({
      headerShown: false as const,
      tabBarStyle: {
        backgroundColor: colors.bgSecondary,
        borderTopColor: colors.border,
        borderTopWidth: 1,
        height: barHeight,
        paddingBottom: bottomInset,
        paddingTop: 6,
      },
      tabBarItemStyle: {
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
      },
      tabBarShowLabel: false as const,
      tabBarActiveTintColor: colors.accentPurpleLight,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarHideOnKeyboard: true as const,
    }),
    [colors, barHeight, bottomInset],
  );

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen name="Home" component={HomeScreen} options={homeOptions} />
      <Tab.Screen name="Practice" component={SpeakingPracticeScreen} options={practiceOptions} />
      <Tab.Screen name="Missions" component={DailyChallengeScreen} options={missionsOptions} />
      <Tab.Screen name="Progress" component={ProgressScreen} options={progressOptions} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={profileOptions} />
    </Tab.Navigator>
  );
};

const tabStyles = StyleSheet.create({
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 34,
  },
  tabEmoji: {
    fontSize: 22,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 3,
    backgroundColor: 'transparent',
  },
  centerButtonWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButton: {
    position: 'relative',
    top: -16,
    justifyContent: 'center',
    alignItems: 'center',
    width: 58,
    height: 58,
    borderRadius: 29,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
    borderWidth: 3,
  },
  centerEmoji: {
    fontSize: 24,
  },
});

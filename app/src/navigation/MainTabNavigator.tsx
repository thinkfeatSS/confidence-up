import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { HomeScreen } from '../screens/main/HomeScreen';
import { SpeakingPracticeScreen } from '../screens/main/SpeakingPracticeScreen';
import { DailyChallengeScreen } from '../screens/main/DailyChallengeScreen';
import { ProgressScreen } from '../screens/main/ProgressScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { useTheme } from '../theme/ThemeContext';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TabIcon = ({ emoji, focused, dotColor }: { emoji: string; focused: boolean; dotColor: string }) => (
  <View style={tabStyles.iconWrapper}>
    <Text style={tabStyles.tabEmoji}>{emoji}</Text>
    {focused && <View style={[tabStyles.activeDot, { backgroundColor: dotColor }]} />}
  </View>
);

const MissionsTabButton = ({
  children,
  onPress,
  bgColor,
  borderColor,
}: BottomTabBarButtonProps & { bgColor: string; borderColor: string }) => (
  <TouchableOpacity
    style={[tabStyles.centerButton, { backgroundColor: bgColor, borderColor }]}
    onPress={onPress ?? undefined}
    activeOpacity={0.85}>
    {children}
  </TouchableOpacity>
);

export const MainTabNavigator = () => {
  const { colors } = useTheme();

  const screenOptions = useMemo(
    () => ({
      headerShown: false as const,
      tabBarStyle: {
        backgroundColor: colors.bgSecondary,
        borderTopColor: colors.border,
        borderTopWidth: 1,
        height: 60,
        paddingBottom: 6,
        paddingTop: 6,
      },
      tabBarShowLabel: false as const,
      tabBarActiveTintColor: colors.accentPurpleLight,
      tabBarInactiveTintColor: colors.textMuted,
    }),
    [colors],
  );

  const homeOptions = useMemo(
    () => ({
      tabBarIcon: ({ focused }: { focused: boolean }) => (
        <TabIcon emoji="🏠" focused={focused} dotColor={colors.accentPurpleLight} />
      ),
    }),
    [colors.accentPurpleLight],
  );
  const practiceOptions = useMemo(
    () => ({
      tabBarIcon: ({ focused }: { focused: boolean }) => (
        <TabIcon emoji="🎤" focused={focused} dotColor={colors.accentPurpleLight} />
      ),
    }),
    [colors.accentPurpleLight],
  );
  const missionsOptions = useMemo(
    () => ({
      tabBarIcon: () => <Text style={{ fontSize: 24 }}>⚔️</Text>,
      tabBarButton: (props: BottomTabBarButtonProps) => (
        <MissionsTabButton
          {...props}
          bgColor={colors.accentPurple}
          borderColor={colors.bgPrimary}
        />
      ),
    }),
    [colors.accentPurple, colors.bgPrimary],
  );
  const progressOptions = useMemo(
    () => ({
      tabBarIcon: ({ focused }: { focused: boolean }) => (
        <TabIcon emoji="📊" focused={focused} dotColor={colors.accentPurpleLight} />
      ),
    }),
    [colors.accentPurpleLight],
  );
  const profileOptions = useMemo(
    () => ({
      tabBarIcon: ({ focused }: { focused: boolean }) => (
        <TabIcon emoji="👤" focused={focused} dotColor={colors.accentPurpleLight} />
      ),
    }),
    [colors.accentPurpleLight],
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
    gap: 3,
  },
  tabEmoji: {
    fontSize: 22,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  centerButton: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 3,
  },
});

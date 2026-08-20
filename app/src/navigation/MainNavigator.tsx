import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { MainStackParamList } from './types';
import { MainTabNavigator } from './MainTabNavigator';
import { MissionDetailScreen } from '../screens/modals/MissionDetailScreen';
import { ChallengeDetailScreen } from '../screens/modals/ChallengeDetailScreen';
import { FearTrackerScreen } from '../screens/modals/FearTrackerScreen';
import { AiCoachScreen } from '../screens/modals/AiCoachScreen';
import { JournalScreen } from '../screens/modals/JournalScreen';
import { JournalEntryScreen } from '../screens/modals/JournalEntryScreen';
import { SkillTreeScreen } from '../screens/modals/SkillTreeScreen';
import { BadgesScreen } from '../screens/modals/BadgesScreen';
import { LegalDocumentScreen } from '../screens/legal/LegalDocumentScreen';
import { AboutScreen } from '../screens/legal/AboutScreen';
import { FeedbackScreen } from '../screens/modals/FeedbackScreen';
import { NotificationsScreen } from '../screens/modals/NotificationsScreen';
import { ChallengesBrowseScreen } from '../screens/main/ChallengesBrowseScreen';
import { useTheme } from '../theme/ThemeContext';

const Stack = createStackNavigator<MainStackParamList>();

export const MainNavigator = () => {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.bgPrimary },
      }}>
      <Stack.Screen name="Tabs" component={MainTabNavigator} />
      <Stack.Screen
        name="MissionDetail"
        component={MissionDetailScreen}
        options={{ presentation: 'modal', gestureEnabled: true }}
      />
      <Stack.Screen
        name="ChallengeDetail"
        component={ChallengeDetailScreen}
        options={{ presentation: 'card', gestureEnabled: true }}
      />
      <Stack.Screen name="FearTracker" component={FearTrackerScreen} />
      <Stack.Screen name="AiCoach" component={AiCoachScreen} />
      <Stack.Screen name="Journal" component={JournalScreen} />
      <Stack.Screen name="JournalEntry" component={JournalEntryScreen} />
      <Stack.Screen name="SkillTree" component={SkillTreeScreen} />
      <Stack.Screen name="Badges" component={BadgesScreen} />
      <Stack.Screen name="LegalDocument" component={LegalDocumentScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="ChallengesBrowse" component={ChallengesBrowseScreen} />
    </Stack.Navigator>
  );
};

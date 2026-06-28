import React from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useAuth } from '../contexts/AuthContext';
import { OnboardingStackParamList, RootStackParamList, TabParamList } from '../types/navigation';
import { colors } from '../theme';
import { FLOATING_TAB_HEIGHT, FLOATING_TAB_BOTTOM } from './constants';
import { usePendingCount } from '../contexts/NotificationContext';

export { FLOATING_TAB_HEIGHT, FLOATING_TAB_BOTTOM, TAB_SCROLL_PADDING } from './constants';

import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import PhoneEntryScreen from '../screens/onboarding/PhoneEntryScreen';
import OTPScreen from '../screens/onboarding/OTPScreen';
import FamilyCreateScreen from '../screens/onboarding/FamilyCreateScreen';
import FamilyConfirmScreen from '../screens/onboarding/FamilyConfirmScreen';
import FamilyPINScreen from '../screens/onboarding/FamilyPINScreen';
import JoinPendingScreen from '../screens/onboarding/JoinPendingScreen';

import HomeScreen from '../screens/main/HomeScreen';
import DocumentsHomeScreen from '../screens/main/DocumentsHomeScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import InviteMemberScreen from '../screens/main/InviteMemberScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import CategoryScreen from '../screens/main/CategoryScreen';
import DocumentUploadScreen from '../screens/main/DocumentUploadScreen';
import DocumentViewScreen from '../screens/main/DocumentViewScreen';
import MemberManagementScreen from '../screens/main/MemberManagementScreen';
import FamilySettingsScreen from '../screens/main/FamilySettingsScreen';
import SearchScreen from '../screens/main/SearchScreen';

const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, [IoniconName, IoniconName]> = {
  Home: ['home', 'home-outline'],
  Vault: ['folder', 'folder-outline'],
  Profile: ['person-circle', 'person-circle-outline'],
};

function FloatingTabBackground() {
  return (
    <BlurView
      intensity={Platform.OS === 'ios' ? 88 : 60}
      tint={Platform.OS === 'ios' ? 'systemMaterial' : 'light'}
      style={StyleSheet.absoluteFill}
    />
  );
}

function TabNavigator() {
  const { pendingCount } = usePendingCount();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarBackground: FloatingTabBackground,
        tabBarIcon: ({ focused, color, size }) => {
          const [active, inactive] = TAB_ICONS[route.name] ?? ['help-circle', 'help-circle-outline'];
          return <Ionicons name={focused ? active : inactive} size={size} color={color} />;
        },
        tabBarBadge: route.name === 'Profile' && pendingCount > 0 ? pendingCount : undefined,
        tabBarBadgeStyle: { backgroundColor: '#EF4444', fontSize: 10, minWidth: 16, height: 16, lineHeight: 16 },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Vault" component={DocumentsHomeScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function OnboardingNavigator() {
  return (
    <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
      <OnboardingStack.Screen name="Welcome" component={WelcomeScreen} />
      <OnboardingStack.Screen name="PhoneEntry" component={PhoneEntryScreen} />
      <OnboardingStack.Screen name="OTP" component={OTPScreen} />
      <OnboardingStack.Screen name="FamilyCreate" component={FamilyCreateScreen} />
      <OnboardingStack.Screen name="FamilyConfirm" component={FamilyConfirmScreen} />
      <OnboardingStack.Screen name="FamilyPIN" component={FamilyPINScreen} />
      <OnboardingStack.Screen name="JoinPending" component={JoinPendingScreen} />
    </OnboardingStack.Navigator>
  );
}

function AppNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false, gestureEnabled: true, fullScreenGestureEnabled: true }}>
      <RootStack.Screen name="MainTabs" component={TabNavigator} />
      <RootStack.Screen name="Category" component={CategoryScreen} />
      <RootStack.Screen name="DocumentUpload" component={DocumentUploadScreen} />
      <RootStack.Screen name="DocumentView" component={DocumentViewScreen} />
      <RootStack.Screen name="InviteMember" component={InviteMemberScreen} />
      <RootStack.Screen name="Notifications" component={NotificationsScreen} />
      <RootStack.Screen name="Members" component={MemberManagementScreen} />
      <RootStack.Screen name="FamilySettings" component={FamilySettingsScreen} />
      <RootStack.Screen name="Search" component={SearchScreen} />
    </RootStack.Navigator>
  );
}

export default function RootNavigation() {
  const { user, familyId, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user && familyId ? <AppNavigator /> : <OnboardingNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  tabBar: {
    position: 'absolute',
    bottom: FLOATING_TAB_BOTTOM,
    left: 16,
    right: 16,
    height: FLOATING_TAB_HEIGHT,
    borderRadius: 28,
    // Transparent so BlurView shows through; Android fallback tint from BlurView
    backgroundColor: Platform.OS === 'android' ? 'rgba(248,250,249,0.82)' : 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    // Clip BlurView to rounded corners
    overflow: 'hidden',
    // Shadow
    shadowColor: '#0B1F17',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
    paddingBottom: 0,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});

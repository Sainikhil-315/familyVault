import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { OnboardingStackParamList, AppStackParamList } from '../types/navigation';
import { colors } from '../theme';

import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import PhoneEntryScreen from '../screens/onboarding/PhoneEntryScreen';
import OTPScreen from '../screens/onboarding/OTPScreen';
import FamilyCreateScreen from '../screens/onboarding/FamilyCreateScreen';
import FamilyConfirmScreen from '../screens/onboarding/FamilyConfirmScreen';
import FamilyPINScreen from '../screens/onboarding/FamilyPINScreen';
import JoinPendingScreen from '../screens/onboarding/JoinPendingScreen';

import HomeScreen from '../screens/main/HomeScreen';
import InviteMemberScreen from '../screens/main/InviteMemberScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import DocumentsHomeScreen from '../screens/main/DocumentsHomeScreen';
import CategoryScreen from '../screens/main/CategoryScreen';
import DocumentUploadScreen from '../screens/main/DocumentUploadScreen';
import DocumentViewScreen from '../screens/main/DocumentViewScreen';

const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

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
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      <AppStack.Screen name="Home" component={HomeScreen} />
      <AppStack.Screen name="InviteMember" component={InviteMemberScreen} />
      <AppStack.Screen name="Notifications" component={NotificationsScreen} />
      <AppStack.Screen name="DocumentsHome" component={DocumentsHomeScreen} />
      <AppStack.Screen name="Category" component={CategoryScreen} />
      <AppStack.Screen name="DocumentUpload" component={DocumentUploadScreen} />
      <AppStack.Screen name="DocumentView" component={DocumentViewScreen} />
    </AppStack.Navigator>
  );
}

export default function RootNavigation() {
  const { user, familyId, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
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

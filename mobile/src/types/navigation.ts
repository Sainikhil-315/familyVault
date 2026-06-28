import { NavigatorScreenParams } from '@react-navigation/native';
import { DocumentMeta } from '../api/documents.api';

export type OnboardingStackParamList = {
  Welcome: undefined;
  PhoneEntry: undefined;
  OTP: { phone: string };
  FamilyCreate: undefined;
  FamilyConfirm: { phone: string; familyId: string; familyName: string };
  FamilyPIN: { phone: string; familyId: string; familyName: string };
  JoinPending: undefined;
};

export type TabParamList = {
  Home: undefined;
  Vault: undefined;
  Profile: undefined;
};

// Root stack — contains the tab navigator + all full-screen pushed screens
export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList>;
  Category: { category: string; label: string };
  DocumentUpload: { presetCategory?: string } | undefined;
  DocumentView: { doc: DocumentMeta };
  InviteMember: undefined;
  Notifications: undefined;
  Members: undefined;
  FamilySettings: undefined;
};

// Backward-compat alias so existing typed props still compile
export type AppStackParamList = RootStackParamList;

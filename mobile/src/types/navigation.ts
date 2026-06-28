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

export type AppStackParamList = {
  Home: undefined;
  InviteMember: undefined;
  Notifications: undefined;
  DocumentsHome: undefined;
  Category: { category: string; label: string };
  DocumentUpload: { presetCategory?: string } | undefined;
  DocumentView: { doc: DocumentMeta };
  Members: undefined;
  Profile: undefined;
  FamilySettings: undefined;
};

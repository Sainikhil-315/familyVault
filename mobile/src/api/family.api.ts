import { api } from './client';

export async function createFamily(familyName: string, pin: string): Promise<string> {
  const res = await api.post<{ success: boolean; data: { familyId: string } }>(
    '/api/family/create',
    { familyName, pin }
  );
  return res.data.data.familyId;
}

export async function verifyPin(
  familyId: string,
  pin: string,
  phone?: string
): Promise<{ familyId: string; familyName: string; customToken?: string }> {
  const res = await api.post<{
    success: boolean;
    data: { familyId: string; familyName: string; customToken?: string };
  }>('/api/family/verify-pin', { familyId, pin, ...(phone ? { phone } : {}) });
  return res.data.data;
}

export async function inviteMember(familyId: string, phone: string): Promise<void> {
  await api.post('/api/family/invite', { familyId, phone });
}

export async function approveJoin(
  notificationId: string,
  action: 'approve' | 'reject'
): Promise<void> {
  await api.post('/api/family/approve-join', { notificationId, action });
}

export interface InviteCheckResult {
  invited: boolean;
  alreadyMember?: boolean;
  familyId?: string;
  familyName?: string;
}

export async function checkInvite(phone: string): Promise<InviteCheckResult> {
  const res = await api.get<{ success: boolean; data: InviteCheckResult }>(
    '/api/member/check-invite',
    { params: { phone } }
  );
  return res.data.data;
}

export async function submitJoinRequest(familyId: string, name: string): Promise<void> {
  await api.post('/api/member/join-request', { familyId, name });
}

export interface Notification {
  id: string;
  familyId: string;
  type: string;
  fromPhone: string;
  fromName: string;
  fromUserId: string;
  status: string;
  createdAt: number;
}

export async function getNotifications(): Promise<Notification[]> {
  const res = await api.get<{ success: boolean; data: Notification[] }>('/api/member/notifications');
  return res.data.data;
}

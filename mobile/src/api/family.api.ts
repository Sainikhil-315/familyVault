import { api } from './client';

export async function createFamily(familyName: string, pin: string): Promise<string> {
  const res = await api.post<{ success: boolean; data: { familyId: string } }>(
    '/api/family/create',
    { familyName, pin }
  );
  return res.data.data.familyId;
}

export async function verifyPin(familyId: string, pin: string): Promise<{ familyId: string; familyName: string }> {
  const res = await api.post<{ success: boolean; data: { familyId: string; familyName: string } }>(
    '/api/family/verify-pin',
    { familyId, pin }
  );
  return res.data.data;
}

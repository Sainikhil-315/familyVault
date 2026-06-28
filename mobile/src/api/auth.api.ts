import { api } from './client';

export async function sendOtp(phone: string): Promise<void> {
  await api.post('/api/auth/send-otp', { phone });
}

export async function verifyOtp(phone: string, otp: string): Promise<string> {
  const res = await api.post<{ success: boolean; data: { customToken: string } }>(
    '/api/auth/verify-otp',
    { phone, otp }
  );
  return res.data.data.customToken;
}

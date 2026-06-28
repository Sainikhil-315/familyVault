import { db } from '../config/firebase';
import { sendSms } from './twilio.service';
import { OtpDoc } from '../types';

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizePhone(phone: string): string {
  // Firestore doc IDs can't contain '/' or other special chars
  return phone.replace(/[^0-9+]/g, '');
}

export async function sendOtp(phone: string): Promise<void> {
  const code = generateOtp();
  const normalized = normalizePhone(phone);

  await db.collection('otp_codes').doc(normalized).set({
    code,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
  } satisfies OtpDoc);

  await sendSms(phone, `Your FamilyVault OTP is: ${code}. Valid for 10 minutes. Do not share.`);
}

export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  const normalized = normalizePhone(phone);
  const ref = db.collection('otp_codes').doc(normalized);
  const snap = await ref.get();

  if (!snap.exists) return false;

  const data = snap.data() as OtpDoc;

  if (data.attempts >= MAX_ATTEMPTS) {
    await ref.delete();
    return false;
  }

  if (Date.now() > data.expiresAt) {
    await ref.delete();
    return false;
  }

  if (data.code !== code) {
    await ref.update({ attempts: data.attempts + 1 });
    return false;
  }

  // Valid — delete so it can't be reused
  await ref.delete();
  return true;
}

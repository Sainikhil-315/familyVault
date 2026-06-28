export function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9+]/g, '');
}

export function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(phone);
}

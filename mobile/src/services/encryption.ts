import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../config/firebase';

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function getFamilyKey(familyId: string): Promise<CryptoKey> {
  const familySnap = await getDoc(doc(firestore, 'families', familyId));
  const keyBase64 = familySnap.data()?.encryptionKey as string | undefined;
  if (!keyBase64) throw new Error('Encryption key not found for this family');

  const keyBuffer = base64ToArrayBuffer(keyBase64);
  return crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

// Returns ArrayBuffer with IV (12 bytes) prepended to ciphertext
export async function encryptFile(
  fileBuffer: ArrayBuffer,
  familyId: string
): Promise<ArrayBuffer> {
  const key = await getFamilyKey(familyId);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    fileBuffer
  );

  const result = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(ciphertext), iv.byteLength);
  return result.buffer;
}

// Expects ArrayBuffer with IV (12 bytes) prepended to ciphertext
export async function decryptFile(
  encryptedBuffer: ArrayBuffer,
  familyId: string
): Promise<ArrayBuffer> {
  const key = await getFamilyKey(familyId);
  const iv = new Uint8Array(encryptedBuffer.slice(0, 12));
  const ciphertext = encryptedBuffer.slice(12);

  return crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );
}

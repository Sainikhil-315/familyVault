import { gcm } from '@noble/ciphers/aes.js';
import * as ExpoCrypto from 'expo-crypto';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../config/firebase';

function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  // Process in 8 KB chunks — avoids Hermes call-stack and string-size limits
  // that break single-call btoa() on multi-MB camera images.
  const CHUNK = 8192;
  const parts: string[] = [];
  for (let i = 0; i < bytes.byteLength; i += CHUNK) {
    parts.push(String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK))));
  }
  return btoa(parts.join(''));
}

async function getFamilyKeyBytes(familyId: string): Promise<Uint8Array> {
  const familySnap = await getDoc(doc(firestore, 'families', familyId));
  const keyBase64 = familySnap.data()?.encryptionKey as string | undefined;
  if (!keyBase64) throw new Error('Encryption key not found for this family');
  return base64ToBytes(keyBase64);
}

// Returns ArrayBuffer with IV (12 bytes) prepended to ciphertext+tag
export async function encryptFile(
  fileBuffer: ArrayBuffer,
  familyId: string
): Promise<ArrayBuffer> {
  const key = await getFamilyKeyBytes(familyId);
  const nonce = ExpoCrypto.getRandomBytes(12);

  const cipher = gcm(key, nonce);
  const ciphertext = cipher.encrypt(new Uint8Array(fileBuffer));

  const result = new Uint8Array(nonce.length + ciphertext.length);
  result.set(nonce, 0);
  result.set(ciphertext, nonce.length);
  return result.buffer;
}

// Expects ArrayBuffer with IV (12 bytes) prepended to ciphertext+tag
export async function decryptFile(
  encryptedBuffer: ArrayBuffer,
  familyId: string
): Promise<ArrayBuffer> {
  const key = await getFamilyKeyBytes(familyId);
  const encryptedBytes = new Uint8Array(encryptedBuffer);
  const nonce = encryptedBytes.slice(0, 12);
  const ciphertext = encryptedBytes.slice(12);

  const decipher = gcm(key, nonce);
  const plaintext = decipher.decrypt(ciphertext);
  return plaintext.buffer;
}

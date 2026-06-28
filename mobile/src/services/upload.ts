import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { encryptFile } from './encryption';
import { getPresignedUploadUrl, saveDocumentMeta } from '../api/documents.api';

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export interface UploadOptions {
  fileUri: string;
  fileName: string;
  mimeType: string;
  familyId: string;
  category: string;
  belongsTo: string; // userId or 'family'
}

export interface UploadResult {
  docId: string;
  r2Key: string;
}

export async function uploadDocument(opts: UploadOptions): Promise<UploadResult> {
  const { fileUri, fileName, mimeType, familyId, category, belongsTo } = opts;

  // 1. Read file as base64 then convert to ArrayBuffer
  const base64 = await readAsStringAsync(fileUri, {
    encoding: EncodingType.Base64,
  });
  const fileBuffer = base64ToArrayBuffer(base64);

  // 2. Encrypt with family AES-256-GCM key
  const encryptedBuffer = await encryptFile(fileBuffer, familyId);

  // 3. Get presigned PUT URL from backend
  const { uploadUrl, r2Key } = await getPresignedUploadUrl(familyId, fileName, encryptedBuffer.byteLength);

  // 4. Upload encrypted blob directly to R2
  const blob = new Blob([encryptedBuffer], { type: 'application/octet-stream' });
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    body: blob,
    headers: { 'Content-Type': 'application/octet-stream' },
  });

  if (!uploadRes.ok) {
    throw new Error(`R2 upload failed: ${uploadRes.status} ${uploadRes.statusText}`);
  }

  // 5. Save metadata to Firestore via backend
  const docId = await saveDocumentMeta({
    familyId,
    belongsTo,
    category,
    fileName,
    r2Key,
    fileSize: encryptedBuffer.byteLength,
    mimeType,
  });

  return { docId, r2Key };
}

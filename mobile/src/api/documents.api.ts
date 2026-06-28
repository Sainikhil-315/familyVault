import { api } from './client';

export interface DocumentMeta {
  id: string;
  familyId: string;
  uploadedBy: string;
  belongsTo: string;
  category: string;
  fileName: string;
  r2Key: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: number;
}

export async function getPresignedUploadUrl(
  familyId: string,
  fileName: string,
  fileSize: number
): Promise<{ uploadUrl: string; r2Key: string }> {
  const res = await api.post<{ success: boolean; data: { uploadUrl: string; r2Key: string } }>(
    '/api/documents/presigned-upload',
    { familyId, fileName, fileSize }
  );
  return res.data.data;
}

export async function saveDocumentMeta(payload: {
  familyId: string;
  belongsTo: string;
  category: string;
  fileName: string;
  r2Key: string;
  fileSize: number;
  mimeType: string;
}): Promise<string> {
  const res = await api.post<{ success: boolean; data: { docId: string } }>(
    '/api/documents/save',
    payload
  );
  return res.data.data.docId;
}

export async function listDocuments(
  familyId: string,
  category?: string,
  belongsTo?: string
): Promise<DocumentMeta[]> {
  const res = await api.get<{ success: boolean; data: DocumentMeta[] }>('/api/documents/list', {
    params: { familyId, ...(category ? { category } : {}), ...(belongsTo ? { belongsTo } : {}) },
  });
  return res.data.data;
}

export async function getDownloadUrl(r2Key: string, familyId: string): Promise<string> {
  const res = await api.get<{ success: boolean; data: { url: string } }>(
    '/api/documents/download-url',
    { params: { r2Key, familyId } }
  );
  return res.data.data.url;
}

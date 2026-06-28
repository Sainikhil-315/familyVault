import * as FileSystem from 'expo-file-system/legacy';
import { encryptFile, arrayBufferToBase64 } from './encryption';
import { getPresignedUploadUrl, saveDocumentMeta, DocumentPage } from '../api/documents.api';

interface PageInput {
  uri: string;
  fileName: string;
  mimeType: string;
}

async function uploadOnePage(
  page: PageInput,
  familyId: string,
  pageIndex: number
): Promise<DocumentPage> {
  // Read file bytes into an ArrayBuffer.
  // file:// URIs (camera captures) → FileSystem.readAsStringAsync is reliable for large local files.
  // content:// URIs (document picker) → fetch(), which handles content providers.
  let fileBuffer: ArrayBuffer;
  if (page.uri.startsWith('file://')) {
    const base64 = await FileSystem.readAsStringAsync(page.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
    fileBuffer = bytes.buffer;
  } else {
    try {
      const fileRes = await fetch(page.uri);
      fileBuffer = await fileRes.arrayBuffer();
    } catch (err) {
      throw new Error(`Could not read file: ${page.fileName}`);
    }
  }
  if (!fileBuffer || fileBuffer.byteLength === 0) throw new Error(`File is empty: ${page.fileName}`);

  // Encrypt with family AES-256-GCM key
  const encryptedBuffer = await encryptFile(fileBuffer, familyId);

  // Get presigned PUT URL
  const { uploadUrl, r2Key } = await getPresignedUploadUrl(familyId, page.fileName, encryptedBuffer.byteLength);

  // Write encrypted bytes to temp cache file (RN can't Blob from ArrayBuffer)
  const tempPath = `${FileSystem.cacheDirectory}enc_${Date.now()}_${pageIndex}.bin`;
  await FileSystem.writeAsStringAsync(tempPath, arrayBufferToBase64(encryptedBuffer), {
    encoding: FileSystem.EncodingType.Base64,
  });

  try {
    const uploadRes = await FileSystem.uploadAsync(uploadUrl, tempPath, {
      httpMethod: 'PUT',
      headers: { 'Content-Type': 'application/octet-stream' },
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    });
    if (uploadRes.status < 200 || uploadRes.status >= 300) {
      throw new Error(`R2 upload failed: ${uploadRes.status}`);
    }
  } finally {
    FileSystem.deleteAsync(tempPath, { idempotent: true }).catch(() => {});
  }

  return {
    r2Key,
    fileName: page.fileName,
    mimeType: page.mimeType,
    fileSize: encryptedBuffer.byteLength,
    pageIndex,
  };
}

export interface MultiPageUploadOptions {
  pages: PageInput[];
  docName: string;
  familyId: string;
  category: string;
  belongsTo: string;
  onProgress?: (current: number, total: number) => void;
}

export async function uploadMultiPageDocument(opts: MultiPageUploadOptions): Promise<{ docId: string }> {
  const { pages, docName, familyId, category, belongsTo, onProgress } = opts;

  const uploadedPages: DocumentPage[] = [];
  for (let i = 0; i < pages.length; i++) {
    onProgress?.(i + 1, pages.length);
    const page = await uploadOnePage(pages[i], familyId, i);
    uploadedPages.push(page);
  }

  const docId = await saveDocumentMeta({
    familyId,
    belongsTo,
    category,
    name: docName,
    pages: uploadedPages,
  });

  return { docId };
}

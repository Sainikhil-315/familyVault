export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AuthenticatedRequest extends Express.Request {
  uid: string;
  phone: string;
}

export interface FamilyDoc {
  name: string;
  adminId: string;
  pinHash: string;
  encryptionKey: string; // base64 AES-256-GCM key, generated on family create
  createdAt: FirebaseFirestore.Timestamp;
}

export interface MemberDoc {
  name: string;
  phone: string;
  role: 'admin' | 'member';
  canUpload: boolean;
  joinedAt: FirebaseFirestore.Timestamp;
  status: 'invited' | 'active';
}

export interface OtpDoc {
  code: string;
  expiresAt: number; // unix ms
  attempts: number;
}

export type DocumentCategory =
  | 'identity'
  | 'property'
  | 'financial'
  | 'medical'
  | 'education'
  | 'vehicle'
  | 'other';

export interface DocumentPage {
  r2Key: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  pageIndex: number;
}

export interface DocumentDoc {
  familyId: string;
  uploadedBy: string;
  belongsTo: string; // userId or 'family'
  category: DocumentCategory;
  name: string;            // user-provided document name
  pages: DocumentPage[];   // one entry per uploaded file/page
  totalSize: number;       // sum of all page sizes
  uploadedAt: FirebaseFirestore.Timestamp;
}

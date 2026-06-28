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

export interface DocumentDoc {
  familyId: string;
  uploadedBy: string;
  belongsTo: string; // userId or 'family'
  category: DocumentCategory;
  fileName: string;
  r2Key: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: FirebaseFirestore.Timestamp;
}

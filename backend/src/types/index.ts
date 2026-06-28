export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AuthenticatedRequest extends Express.Request {
  uid: string;
  phone: string;
}

// Firestore document shapes
export interface FamilyDoc {
  name: string;
  adminId: string;
  pinHash: string;
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

import { Router, Response, NextFunction } from 'express';
import crypto from 'crypto';
import admin from 'firebase-admin';
import { db } from '../config/firebase';
import { verifyToken, AuthRequest } from '../middleware/verifyToken';
import { getPresignedUploadUrl, getPresignedDownloadUrl } from '../services/r2.service';
import { DocumentDoc, DocumentCategory, MemberDoc } from '../types';
import { env } from '../config/env';

const router = Router();

const VALID_CATEGORIES: DocumentCategory[] = [
  'identity', 'property', 'financial', 'medical', 'education', 'vehicle', 'other',
];

async function assertActiveMember(uid: string, familyId: string): Promise<MemberDoc> {
  const snap = await db
    .collection('families').doc(familyId)
    .collection('members').doc(uid)
    .get();
  if (!snap.exists || snap.data()?.status !== 'active') {
    throw Object.assign(new Error('Not an active member of this family'), { status: 403 });
  }
  return snap.data() as MemberDoc;
}

// POST /api/documents/presigned-upload
// Returns a presigned PUT URL for uploading directly to R2
router.post('/presigned-upload', verifyToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { familyId, fileName, fileSize } = req.body as {
      familyId?: string;
      fileName?: string;
      fileSize?: number;
    };
    const uid = req.uid!;

    if (!familyId || !fileName) {
      res.status(400).json({ success: false, error: 'familyId and fileName are required' });
      return;
    }

    if (fileSize && fileSize > 20 * 1024 * 1024) {
      res.status(400).json({ success: false, error: 'File size must be under 20MB' });
      return;
    }

    const member = await assertActiveMember(uid, familyId);
    if (!member.canUpload && member.role !== 'admin') {
      res.status(403).json({ success: false, error: 'You do not have upload permission' });
      return;
    }

    const r2Key = `families/${familyId}/docs/${crypto.randomUUID()}.enc`;
    const uploadUrl = await getPresignedUploadUrl(r2Key);

    res.json({ success: true, data: { uploadUrl, r2Key } });
  } catch (err: unknown) {
    if (err instanceof Error && 'status' in err) {
      res.status((err as Error & { status: number }).status).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
});

// POST /api/documents/save — save metadata after successful R2 upload
router.post('/save', verifyToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { familyId, belongsTo, category, fileName, r2Key, fileSize, mimeType } = req.body as {
      familyId?: string;
      belongsTo?: string;
      category?: string;
      fileName?: string;
      r2Key?: string;
      fileSize?: number;
      mimeType?: string;
    };
    const uid = req.uid!;

    if (!familyId || !belongsTo || !category || !fileName || !r2Key || !fileSize || !mimeType) {
      res.status(400).json({ success: false, error: 'All fields are required' });
      return;
    }

    if (!VALID_CATEGORIES.includes(category as DocumentCategory)) {
      res.status(400).json({ success: false, error: `Invalid category. Valid: ${VALID_CATEGORIES.join(', ')}` });
      return;
    }

    // Verify r2Key belongs to this family (prevents saving arbitrary keys)
    if (!r2Key.startsWith(`families/${familyId}/`)) {
      res.status(400).json({ success: false, error: 'Invalid r2Key for this family' });
      return;
    }

    await assertActiveMember(uid, familyId);

    const docData: DocumentDoc = {
      familyId,
      uploadedBy: uid,
      belongsTo,
      category: category as DocumentCategory,
      fileName,
      r2Key,
      fileSize,
      mimeType,
      uploadedAt: admin.firestore.Timestamp.now(),
    };

    const docRef = await db.collection('documents').add(docData);

    res.status(201).json({ success: true, data: { docId: docRef.id } });
  } catch (err: unknown) {
    if (err instanceof Error && 'status' in err) {
      res.status((err as Error & { status: number }).status).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
});

// GET /api/documents/list?familyId=&category=
router.get('/list', verifyToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { familyId, category, belongsTo } = req.query as {
      familyId?: string;
      category?: string;
      belongsTo?: string;
    };
    const uid = req.uid!;

    if (!familyId) {
      res.status(400).json({ success: false, error: 'familyId is required' });
      return;
    }

    await assertActiveMember(uid, familyId);

    let query = db.collection('documents')
      .where('familyId', '==', familyId) as FirebaseFirestore.Query;

    if (category && VALID_CATEGORIES.includes(category as DocumentCategory)) {
      query = query.where('category', '==', category);
    }
    if (belongsTo) {
      query = query.where('belongsTo', '==', belongsTo);
    }

    query = query.orderBy('uploadedAt', 'desc').limit(100);

    const snap = await query.get();
    const docs = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      uploadedAt: (d.data().uploadedAt as admin.firestore.Timestamp).toMillis(),
    }));

    res.json({ success: true, data: docs });
  } catch (err: unknown) {
    if (err instanceof Error && 'status' in err) {
      res.status((err as Error & { status: number }).status).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
});

// GET /api/documents/download-url?r2Key=&familyId=
router.get('/download-url', verifyToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { r2Key, familyId } = req.query as { r2Key?: string; familyId?: string };
    const uid = req.uid!;

    if (!r2Key || !familyId) {
      res.status(400).json({ success: false, error: 'r2Key and familyId are required' });
      return;
    }

    if (!r2Key.startsWith(`families/${familyId}/`)) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    await assertActiveMember(uid, familyId);

    const url = await getPresignedDownloadUrl(r2Key);
    res.json({ success: true, data: { url, expiresIn: 900 } });
  } catch (err: unknown) {
    if (err instanceof Error && 'status' in err) {
      res.status((err as Error & { status: number }).status).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
});

export default router;

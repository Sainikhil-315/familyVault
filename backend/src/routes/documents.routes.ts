import { Router, Response, NextFunction } from 'express';
import crypto from 'crypto';
import admin from 'firebase-admin';
import { db } from '../config/firebase';
import { verifyToken, AuthRequest } from '../middleware/verifyToken';
import { getPresignedUploadUrl, getPresignedDownloadUrl, deleteObject } from '../services/r2.service';
import { DocumentDoc, DocumentCategory, DocumentPage, MemberDoc } from '../types';
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

// POST /api/documents/save — save metadata after successful R2 upload (multi-page)
router.post('/save', verifyToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { familyId, belongsTo, category, name, pages } = req.body as {
      familyId?: string;
      belongsTo?: string;
      category?: string;
      name?: string;
      pages?: DocumentPage[];
    };
    const uid = req.uid!;

    if (!familyId || !belongsTo || !category || !name || !Array.isArray(pages) || pages.length === 0) {
      res.status(400).json({ success: false, error: 'familyId, belongsTo, category, name, and pages[] are required' });
      return;
    }

    if (!VALID_CATEGORIES.includes(category as DocumentCategory)) {
      res.status(400).json({ success: false, error: `Invalid category. Valid: ${VALID_CATEGORIES.join(', ')}` });
      return;
    }

    // Verify all r2Keys belong to this family
    for (const page of pages) {
      if (!page.r2Key || !page.r2Key.startsWith(`families/${familyId}/`)) {
        res.status(400).json({ success: false, error: 'Invalid r2Key for this family' });
        return;
      }
    }

    await assertActiveMember(uid, familyId);

    const totalSize = pages.reduce((sum, p) => sum + (p.fileSize ?? 0), 0);

    const docData: DocumentDoc = {
      familyId,
      uploadedBy: uid,
      belongsTo,
      category: category as DocumentCategory,
      name: name.trim(),
      pages,
      totalSize,
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

// DELETE /api/documents/:docId — admin only
router.delete('/:docId', verifyToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { docId } = req.params;
    const { familyId } = req.query as { familyId?: string };
    const uid = req.uid!;

    if (!familyId) {
      res.status(400).json({ success: false, error: 'familyId is required' });
      return;
    }

    const member = await assertActiveMember(uid, familyId);
    if (member.role !== 'admin') {
      res.status(403).json({ success: false, error: 'Only admins can delete documents' });
      return;
    }

    const docSnap = await db.collection('documents').doc(docId).get();
    if (!docSnap.exists || docSnap.data()?.familyId !== familyId) {
      res.status(404).json({ success: false, error: 'Document not found' });
      return;
    }

    const data = docSnap.data()!;

    // Get all r2Keys — new format (pages[]) and legacy (r2Key)
    const r2Keys: string[] = [];
    if (Array.isArray(data.pages)) {
      r2Keys.push(...data.pages.map((p: DocumentPage) => p.r2Key));
    } else if (data.r2Key) {
      r2Keys.push(data.r2Key as string);
    }

    // Delete all R2 objects in parallel, then Firestore doc
    await Promise.all(r2Keys.map((key) => deleteObject(key)));
    await db.collection('documents').doc(docId).delete();

    res.status(204).send();
  } catch (err: unknown) {
    if (err instanceof Error && 'status' in err) {
      res.status((err as Error & { status: number }).status).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
});

export default router;

import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import admin from 'firebase-admin';
import { db } from '../config/firebase';
import { verifyToken, AuthRequest } from '../middleware/verifyToken';
import { MemberDoc } from '../types';
import { normalizePhone, isValidE164 } from '../utils/phone';

const router = Router();

const checkInviteLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: 'Too many requests. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// GET /api/member/check-invite?phone=+91...
// No auth — called before member logs in
router.get('/check-invite', checkInviteLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone } = req.query as { phone?: string };

    if (!phone) {
      res.status(400).json({ success: false, error: 'phone is required' });
      return;
    }

    const normalized = normalizePhone(phone);
    if (!isValidE164(normalized)) {
      res.status(400).json({ success: false, error: 'Invalid phone number. Use E.164 format.' });
      return;
    }

    // Collection group query across all families' invitedNumbers subcollections
    const snapshot = await db.collectionGroup('invitedNumbers')
      .where('phone', '==', normalized)
      .limit(1)
      .get();

    if (snapshot.empty) {
      res.json({ success: true, data: { invited: false } });
      return;
    }

    const inviteDoc = snapshot.docs[0];
    const inviteData = inviteDoc.data();

    if (inviteData.status === 'active') {
      // Already a member
      res.json({ success: true, data: { invited: false, alreadyMember: true } });
      return;
    }

    // Get parent family document
    const familyRef = inviteDoc.ref.parent.parent!;
    const familySnap = await familyRef.get();

    if (!familySnap.exists) {
      res.json({ success: true, data: { invited: false } });
      return;
    }

    const family = familySnap.data() as { name: string };

    res.json({
      success: true,
      data: {
        invited: true,
        familyId: familyRef.id,
        familyName: family.name,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/member/join-request  — authenticated member submits join request
router.post('/join-request', verifyToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { familyId, name } = req.body as { familyId?: string; name?: string };
    const uid = req.uid!;
    const phone = req.phone!;

    if (!familyId || !name || name.trim().length < 2) {
      res.status(400).json({ success: false, error: 'familyId and name (min 2 chars) are required' });
      return;
    }

    const familySnap = await db.collection('families').doc(familyId).get();
    if (!familySnap.exists) {
      res.status(404).json({ success: false, error: 'Family not found' });
      return;
    }

    // Verify this phone is still invited
    const normalized = normalizePhone(phone);
    const inviteSnap = await familySnap.ref.collection('invitedNumbers').doc(normalized).get();
    if (!inviteSnap.exists || inviteSnap.data()?.status !== 'pending') {
      res.status(403).json({ success: false, error: 'Your number is not invited to this family' });
      return;
    }

    // Check no duplicate pending request
    const existing = await db.collection('notifications')
      .where('familyId', '==', familyId)
      .where('fromUserId', '==', uid)
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (!existing.empty) {
      res.status(409).json({ success: false, error: 'A pending request already exists' });
      return;
    }

    const now = admin.firestore.Timestamp.now();
    const memberData: MemberDoc = {
      name: name.trim(),
      phone,
      role: 'member',
      canUpload: false,
      joinedAt: now,
      status: 'invited',
    };

    const batch = db.batch();
    batch.set(familySnap.ref.collection('members').doc(uid), memberData);
    batch.set(db.collection('notifications').doc(), {
      familyId,
      type: 'join_request',
      fromPhone: normalized,
      fromName: name.trim(),
      fromUserId: uid,
      status: 'pending',
      createdAt: now,
    });

    await batch.commit();

    res.status(201).json({ success: true, data: { message: 'Join request sent. Waiting for admin approval.' } });
  } catch (err) {
    next(err);
  }
});

// GET /api/member/notifications  — admin fetches pending join requests
router.get('/notifications', verifyToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const uid = req.uid!;

    const familiesSnap = await db.collection('families')
      .where('adminId', '==', uid)
      .limit(1)
      .get();

    if (familiesSnap.empty) {
      res.json({ success: true, data: [] });
      return;
    }

    const familyId = familiesSnap.docs[0].id;

    const notifSnap = await db.collection('notifications')
      .where('familyId', '==', familyId)
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .get();

    const notifications = notifSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: (d.data().createdAt as admin.firestore.Timestamp).toMillis(),
    }));

    res.json({ success: true, data: notifications });
  } catch (err) {
    next(err);
  }
});

export default router;

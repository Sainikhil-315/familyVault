import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import admin from 'firebase-admin';
import { db, auth } from '../config/firebase';
import { verifyToken, AuthRequest } from '../middleware/verifyToken';
import { FamilyDoc, MemberDoc } from '../types';
import { normalizePhone, isValidE164 } from '../utils/phone';

const router = Router();

const pinRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many PIN attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/family/create  (admin creates the family vault)
router.post('/create', verifyToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { familyName, pin } = req.body as { familyName?: string; pin?: string };

    if (!familyName || familyName.trim().length < 2) {
      res.status(400).json({ success: false, error: 'familyName must be at least 2 characters' });
      return;
    }

    if (!pin || !/^\d{4,6}$/.test(pin)) {
      res.status(400).json({ success: false, error: 'PIN must be 4–6 digits' });
      return;
    }

    const uid = req.uid!;
    const phone = req.phone!;

    const existing = await db
      .collection('families')
      .where('adminId', '==', uid)
      .limit(1)
      .get();

    if (!existing.empty) {
      res.status(409).json({ success: false, error: 'You already have a family vault' });
      return;
    }

    const pinHash = await bcrypt.hash(pin, 12);
    const encryptionKey = crypto.randomBytes(32).toString('base64');
    const familyRef = db.collection('families').doc();
    const now = admin.firestore.Timestamp.now();

    const familyData: FamilyDoc = {
      name: familyName.trim(),
      adminId: uid,
      pinHash,
      encryptionKey,
      createdAt: now,
    };

    const memberData: MemberDoc = {
      name: phone,
      phone,
      role: 'admin',
      canUpload: true,
      joinedAt: now,
      status: 'active',
    };

    const batch = db.batch();
    batch.set(familyRef, familyData);
    batch.set(familyRef.collection('members').doc(uid), memberData);
    batch.set(db.collection('users').doc(uid), {
      phone,
      familyIds: admin.firestore.FieldValue.arrayUnion(familyRef.id),
      createdAt: now,
    }, { merge: true });

    await batch.commit();

    res.status(201).json({ success: true, data: { familyId: familyRef.id } });
  } catch (err) {
    next(err);
  }
});

// POST /api/family/verify-pin  — no auth required; used by members before joining
// Pass phone to receive a customToken for Firebase sign-in
router.post('/verify-pin', pinRateLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { familyId, pin, phone } = req.body as {
      familyId?: string;
      pin?: string;
      phone?: string;
    };

    if (!familyId || !pin) {
      res.status(400).json({ success: false, error: 'familyId and pin are required' });
      return;
    }

    const familySnap = await db.collection('families').doc(familyId).get();
    if (!familySnap.exists) {
      res.status(404).json({ success: false, error: 'Family not found' });
      return;
    }

    const family = familySnap.data() as FamilyDoc;
    const valid = await bcrypt.compare(pin, family.pinHash);

    if (!valid) {
      res.status(401).json({ success: false, error: 'Incorrect PIN' });
      return;
    }

    // Issue Firebase custom token if phone provided (member join flow)
    let customToken: string | undefined;
    if (phone && isValidE164(phone)) {
      let uid: string;
      try {
        const existing = await auth.getUserByPhoneNumber(phone);
        uid = existing.uid;
      } catch {
        const created = await auth.createUser({ phoneNumber: phone });
        uid = created.uid;
      }
      customToken = await auth.createCustomToken(uid, { phone });
    }

    res.json({
      success: true,
      data: {
        familyId,
        familyName: family.name,
        ...(customToken ? { customToken } : {}),
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/family/invite  — admin invites a member by phone number
router.post('/invite', verifyToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { familyId, phone } = req.body as { familyId?: string; phone?: string };
    const uid = req.uid!;

    if (!familyId || !phone) {
      res.status(400).json({ success: false, error: 'familyId and phone are required' });
      return;
    }

    const normalized = normalizePhone(phone);
    if (!isValidE164(normalized)) {
      res.status(400).json({ success: false, error: 'Invalid phone number. Use E.164 format.' });
      return;
    }

    const familySnap = await db.collection('families').doc(familyId).get();
    if (!familySnap.exists) {
      res.status(404).json({ success: false, error: 'Family not found' });
      return;
    }

    const family = familySnap.data() as FamilyDoc;
    if (family.adminId !== uid) {
      res.status(403).json({ success: false, error: 'Only the admin can invite members' });
      return;
    }

    // Use normalized phone as doc ID + field for collection group queries
    await familySnap.ref.collection('invitedNumbers').doc(normalized).set({
      phone: normalized,
      status: 'pending',
      addedBy: uid,
      addedAt: admin.firestore.Timestamp.now(),
    });

    res.json({ success: true, data: { message: 'Invitation sent' } });
  } catch (err) {
    next(err);
  }
});

// POST /api/family/approve-join  — admin approves or rejects a join request
router.post('/approve-join', verifyToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { notificationId, action } = req.body as {
      notificationId?: string;
      action?: 'approve' | 'reject';
    };
    const uid = req.uid!;

    if (!notificationId || !['approve', 'reject'].includes(action ?? '')) {
      res.status(400).json({ success: false, error: 'notificationId and action (approve|reject) are required' });
      return;
    }

    const notifSnap = await db.collection('notifications').doc(notificationId).get();
    if (!notifSnap.exists) {
      res.status(404).json({ success: false, error: 'Notification not found' });
      return;
    }

    const notif = notifSnap.data() as {
      familyId: string;
      fromUserId: string;
      fromPhone: string;
      status: string;
    };

    if (notif.status !== 'pending') {
      res.status(409).json({ success: false, error: 'This request has already been handled' });
      return;
    }

    const familySnap = await db.collection('families').doc(notif.familyId).get();
    const family = familySnap.data() as FamilyDoc;

    if (family.adminId !== uid) {
      res.status(403).json({ success: false, error: 'Only the family admin can approve requests' });
      return;
    }

    const batch = db.batch();
    const memberRef = familySnap.ref.collection('members').doc(notif.fromUserId);

    if (action === 'approve') {
      batch.update(memberRef, {
        status: 'active',
        joinedAt: admin.firestore.Timestamp.now(),
      });
      batch.set(db.collection('users').doc(notif.fromUserId), {
        familyIds: admin.firestore.FieldValue.arrayUnion(notif.familyId),
      }, { merge: true });
      // Mark invite as active
      batch.update(familySnap.ref.collection('invitedNumbers').doc(notif.fromPhone), {
        status: 'active',
      });
    } else {
      batch.delete(memberRef);
    }

    batch.update(notifSnap.ref, {
      status: action === 'approve' ? 'approved' : 'rejected',
    });

    await batch.commit();

    res.json({ success: true, data: { action } });
  } catch (err) {
    next(err);
  }
});

export default router;

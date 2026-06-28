import { Router, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import admin from 'firebase-admin';
import { db } from '../config/firebase';
import { verifyToken, AuthRequest } from '../middleware/verifyToken';
import { FamilyDoc, MemberDoc } from '../types';

const router = Router();

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

    // Check user doesn't already own a family
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
    const familyRef = db.collection('families').doc();
    const now = admin.firestore.Timestamp.now();

    const familyData: FamilyDoc = {
      name: familyName.trim(),
      adminId: uid,
      pinHash,
      createdAt: now,
    };

    const memberData: MemberDoc = {
      name: phone, // updated when user sets profile
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

    res.status(201).json({
      success: true,
      data: { familyId: familyRef.id },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/family/verify-pin  (member verifies PIN before join request)
router.post('/verify-pin', verifyToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { familyId, pin } = req.body as { familyId?: string; pin?: string };

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

    res.json({
      success: true,
      data: {
        familyId,
        familyName: family.name,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;

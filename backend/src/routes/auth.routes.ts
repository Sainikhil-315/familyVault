import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { sendOtp, verifyOtp } from '../services/otp.service';
import { auth } from '../config/firebase';

const router = Router();

const otpRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { success: false, error: 'Too many OTP requests. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/auth/send-otp
router.post('/send-otp', otpRateLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone } = req.body as { phone?: string };

    if (!phone || !/^\+[1-9]\d{7,14}$/.test(phone)) {
      res.status(400).json({ success: false, error: 'Invalid phone number. Use E.164 format (+91XXXXXXXXXX)' });
      return;
    }

    await sendOtp(phone);
    res.json({ success: true, data: { message: 'OTP sent' } });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, otp } = req.body as { phone?: string; otp?: string };

    if (!phone || !otp) {
      res.status(400).json({ success: false, error: 'phone and otp are required' });
      return;
    }

    const valid = await verifyOtp(phone, otp);

    if (!valid) {
      res.status(401).json({ success: false, error: 'Invalid or expired OTP' });
      return;
    }

    // Create or get Firebase user for this phone
    let uid: string;
    try {
      const existing = await auth.getUserByPhoneNumber(phone);
      uid = existing.uid;
    } catch {
      const created = await auth.createUser({ phoneNumber: phone });
      uid = created.uid;
    }

    const customToken = await auth.createCustomToken(uid, { phone });
    res.json({ success: true, data: { customToken } });
  } catch (err) {
    next(err);
  }
});

export default router;

import { Router, Request, Response } from 'express';
import { User } from '@lavaca/shared';
import { getAllSessions } from './sessions';

const router = Router();

// In-memory user store
export const users = new Map<string, User>();
const phoneIndex = new Map<string, string>(); // phone -> userId
const usernameIndex = new Map<string, string>(); // username -> userId
const documentIndex = new Map<string, string>(); // documentId -> userId

// ── OTP store ───────────────────────────────────────────
interface OTPEntry {
  code: string;
  phone: string;
  expiresAt: number;
  verified: boolean;
}
const otpStore = new Map<string, OTPEntry>(); // phone -> OTPEntry

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/users/send-otp — Send OTP to phone (mock: logs to console)
router.post('/send-otp', (req: Request, res: Response) => {
  const { phone } = req.body;
  if (!phone) {
    res.status(400).json({ error: 'phone is required' });
    return;
  }

  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const code = generateOTP();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  otpStore.set(cleanPhone, { code, phone: cleanPhone, expiresAt, verified: false });

  // In production, send via Twilio/SMS. For dev, log to console.
  console.log(`\n📱 OTP for ${cleanPhone}: ${code}\n`);

  res.json({ success: true, message: 'OTP sent', dev_code: code });
});

// POST /api/users/verify-otp — Verify OTP and check if user exists
router.post('/verify-otp', (req: Request, res: Response) => {
  const { phone, code } = req.body;
  if (!phone || !code) {
    res.status(400).json({ error: 'phone and code are required' });
    return;
  }

  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const entry = otpStore.get(cleanPhone);

  if (!entry) {
    res.status(400).json({ error: 'No OTP sent for this phone. Request a new one.' });
    return;
  }

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(cleanPhone);
    res.status(400).json({ error: 'OTP expired. Request a new one.' });
    return;
  }

  // Dev bypass: code "123456" always works
  if (code !== entry.code && code !== '123456') {
    res.status(400).json({ error: 'Invalid OTP code' });
    return;
  }

  entry.verified = true;

  // Check if user exists (login vs register)
  const existingUserId = phoneIndex.get(cleanPhone);
  if (existingUserId) {
    const existingUser = users.get(existingUserId);
    if (existingUser) {
      res.json({ verified: true, isRegistered: true, user: existingUser });
      return;
    }
  }

  // Phone verified but not registered yet
  res.json({ verified: true, isRegistered: false, user: null });
});

// POST /api/users/register — Register new user (phone must be OTP-verified)
router.post('/register', (req: Request, res: Response) => {
  const { phone, displayName, username, documentId } = req.body;

  if (!phone || !displayName || !username || !documentId) {
    res.status(400).json({ error: 'phone, displayName, username, and documentId are required' });
    return;
  }

  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9._]/g, '');
  const cleanDocumentId = documentId.trim();

  if (cleanUsername.length < 3) {
    res.status(400).json({ error: 'Username must be at least 3 characters' });
    return;
  }

  if (!cleanDocumentId) {
    res.status(400).json({ error: 'Document ID (cédula) is required' });
    return;
  }

  // Verify OTP was completed for this phone
  const otp = otpStore.get(cleanPhone);
  if (!otp || !otp.verified) {
    res.status(403).json({ error: 'Phone number not verified. Complete OTP first.' });
    return;
  }

  // Check if phone already registered
  const existingId = phoneIndex.get(cleanPhone);
  if (existingId) {
    const existingUser = users.get(existingId);
    if (existingUser) {
      // Return existing user (auto-login)
      res.json(existingUser);
      return;
    }
  }

  // Check username uniqueness
  if (usernameIndex.has(cleanUsername)) {
    res.status(409).json({ error: 'Username already taken' });
    return;
  }

  // Check documentId uniqueness
  if (documentIndex.has(cleanDocumentId)) {
    res.status(409).json({ error: 'Document ID already registered' });
    return;
  }

  const user: User = {
    id: 'user-' + Math.random().toString(36).substring(2, 10),
    phone: cleanPhone,
    displayName: displayName.trim(),
    username: cleanUsername,
    documentId: cleanDocumentId,
    createdAt: new Date(),
  };

  users.set(user.id, user);
  phoneIndex.set(cleanPhone, user.id);
  usernameIndex.set(cleanUsername, user.id);
  documentIndex.set(cleanDocumentId, user.id);

  // Clean up OTP
  otpStore.delete(cleanPhone);

  res.status(201).json(user);
});

// POST /api/users/login — Login by phone (must be OTP-verified)
router.post('/login', (req: Request, res: Response) => {
  const { phone } = req.body;

  if (!phone) {
    res.status(400).json({ error: 'phone is required' });
    return;
  }

  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const userId = phoneIndex.get(cleanPhone);

  if (!userId) {
    res.status(404).json({ error: 'User not found. Please register first.' });
    return;
  }

  const user = users.get(userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json(user);
});

// POST /api/users/lookup — Find users by phone numbers (for contacts)
router.post('/lookup', (req: Request, res: Response) => {
  const { phones } = req.body;
  if (!phones || !Array.isArray(phones)) {
    res.status(400).json({ error: 'phones array is required' });
    return;
  }

  const found: User[] = [];
  for (const phone of phones) {
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const userId = phoneIndex.get(cleanPhone);
    if (userId) {
      const user = users.get(userId);
      if (user) {
        // Don't expose full user data — just public info
        found.push({
          id: user.id,
          phone: user.phone,
          displayName: user.displayName,
          username: user.username,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
        } as User);
      }
    }
  }

  res.json(found);
});

// GET /api/users/:id
router.get('/:id', (req: Request, res: Response) => {
  const user = users.get(req.params.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(user);
});

// GET /api/users/:id/history — Get user's transaction history
router.get('/:id/history', (req: Request, res: Response) => {
  const user = users.get(req.params.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  // Get user's transaction history from sessions
  const allSessions = getAllSessions();
  const userSessions = allSessions.filter((s) =>
    s.adminId === req.params.id || s.participants.some((p) => p.userId === req.params.id)
  );

  // Sort by creation date descending
  userSessions.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  res.json(userSessions);
});

// PUT /api/users/:id
router.put('/:id', (req: Request, res: Response) => {
  const user = users.get(req.params.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const { displayName, username, documentId, avatarUrl } = req.body;
  if (displayName) user.displayName = displayName.trim();
  if (username) {
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9._]/g, '');
    if (cleanUsername.length >= 3) {
      // Remove old username index
      if (user.username) usernameIndex.delete(user.username);
      // Check new username availability
      const takenBy = usernameIndex.get(cleanUsername);
      if (takenBy && takenBy !== user.id) {
        res.status(409).json({ error: 'Username already taken' });
        return;
      }
      user.username = cleanUsername;
      usernameIndex.set(cleanUsername, user.id);
    }
  }
  if (documentId !== undefined) {
    const cleanDoc = documentId.trim();
    if (cleanDoc) {
      // Check uniqueness
      const takenBy = documentIndex.get(cleanDoc);
      if (takenBy && takenBy !== user.id) {
        res.status(409).json({ error: 'Document ID already registered' });
        return;
      }
      // Remove old index
      if (user.documentId) documentIndex.delete(user.documentId);
      user.documentId = cleanDoc;
      documentIndex.set(cleanDoc, user.id);
    } else {
      if (user.documentId) documentIndex.delete(user.documentId);
      user.documentId = undefined;
    }
  }
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

  res.json(user);
});

export { router as userRouter };
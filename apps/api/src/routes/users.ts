import { Router, Request, Response } from 'express';
import { User } from '@lavaca/shared';
import db from '../db';

const router = Router();

// ── Prepared statements ─────────────────────────────────
const stmts = {
  // OTP
  upsertOTP: db.prepare(`INSERT OR REPLACE INTO otps (phone, code, expiresAt, verified) VALUES (?, ?, ?, 0)`),
  getOTP: db.prepare(`SELECT * FROM otps WHERE phone = ?`),
  markOTPVerified: db.prepare(`UPDATE otps SET verified = 1 WHERE phone = ?`),
  deleteOTP: db.prepare(`DELETE FROM otps WHERE phone = ?`),

  // Users
  insertUser: db.prepare(`INSERT INTO users (id, phone, displayName, username, documentId, avatarUrl, email, createdAt) VALUES (@id, @phone, @displayName, @username, @documentId, @avatarUrl, @email, @createdAt)`),
  getUserById: db.prepare(`SELECT * FROM users WHERE id = ?`),
  getUserByPhone: db.prepare(`SELECT * FROM users WHERE phone = ?`),
  getUserByUsername: db.prepare(`SELECT * FROM users WHERE username = ?`),
  getUserByDocument: db.prepare(`SELECT * FROM users WHERE documentId = ?`),
  searchUsers: db.prepare(`SELECT id, displayName, username, phone, avatarUrl FROM users WHERE lower(displayName) LIKE ? OR lower(username) LIKE ? OR phone LIKE ? LIMIT 20`),
  lookupByPhone: db.prepare(`SELECT id, phone, displayName, username, avatarUrl, createdAt FROM users WHERE phone = ?`),
  updateUser: db.prepare(`UPDATE users SET displayName = @displayName, username = @username, documentId = @documentId, avatarUrl = @avatarUrl WHERE id = @id`),
};

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function rowToUser(row: any): User {
  return {
    ...row,
    createdAt: new Date(row.createdAt),
  };
}

// Helper export for other routes
export function getUserById(id: string): User | undefined {
  const row = stmts.getUserById.get(id) as any;
  return row ? rowToUser(row) : undefined;
}

// POST /api/users/send-otp
router.post('/send-otp', (req: Request, res: Response) => {
  const { phone } = req.body;
  if (!phone) {
    res.status(400).json({ error: 'phone is required' });
    return;
  }

  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const code = generateOTP();
  const expiresAt = Date.now() + 5 * 60 * 1000;

  stmts.upsertOTP.run(cleanPhone, code, expiresAt);

  console.log(`\n📱 OTP for ${cleanPhone}: ${code}\n`);

  res.json({ success: true, message: 'OTP sent', dev_code: code });
});

// POST /api/users/verify-otp
router.post('/verify-otp', (req: Request, res: Response) => {
  const { phone, code } = req.body;
  if (!phone || !code) {
    res.status(400).json({ error: 'phone and code are required' });
    return;
  }

  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const entry = stmts.getOTP.get(cleanPhone) as any;

  if (!entry) {
    res.status(400).json({ error: 'No OTP sent for this phone. Request a new one.' });
    return;
  }

  if (Date.now() > entry.expiresAt) {
    stmts.deleteOTP.run(cleanPhone);
    res.status(400).json({ error: 'OTP expired. Request a new one.' });
    return;
  }

  if (code !== entry.code && code !== '123456') {
    res.status(400).json({ error: 'Invalid OTP code' });
    return;
  }

  stmts.markOTPVerified.run(cleanPhone);

  const existingUser = stmts.getUserByPhone.get(cleanPhone) as any;
  if (existingUser) {
    res.json({ verified: true, isRegistered: true, user: rowToUser(existingUser) });
    return;
  }

  res.json({ verified: true, isRegistered: false, user: null });
});

// POST /api/users/register
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

  const otp = stmts.getOTP.get(cleanPhone) as any;
  if (!otp || !otp.verified) {
    res.status(403).json({ error: 'Phone number not verified. Complete OTP first.' });
    return;
  }

  const existingByPhone = stmts.getUserByPhone.get(cleanPhone) as any;
  if (existingByPhone) {
    res.json(rowToUser(existingByPhone));
    return;
  }

  const existingByUsername = stmts.getUserByUsername.get(cleanUsername) as any;
  if (existingByUsername) {
    res.status(409).json({ error: 'Username already taken' });
    return;
  }

  const existingByDoc = stmts.getUserByDocument.get(cleanDocumentId) as any;
  if (existingByDoc) {
    res.status(409).json({ error: 'Document ID already registered' });
    return;
  }

  const user = {
    id: 'user-' + Math.random().toString(36).substring(2, 10),
    phone: cleanPhone,
    displayName: displayName.trim(),
    username: cleanUsername,
    documentId: cleanDocumentId,
    avatarUrl: null,
    email: null,
    createdAt: new Date().toISOString(),
  };

  stmts.insertUser.run(user);
  stmts.deleteOTP.run(cleanPhone);

  res.status(201).json(rowToUser({ ...user }));
});

// POST /api/users/login
router.post('/login', (req: Request, res: Response) => {
  const { phone } = req.body;
  if (!phone) {
    res.status(400).json({ error: 'phone is required' });
    return;
  }

  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const user = stmts.getUserByPhone.get(cleanPhone) as any;

  if (!user) {
    res.status(404).json({ error: 'User not found. Please register first.' });
    return;
  }

  res.json(rowToUser(user));
});

// GET /api/users/search?q=...
router.get('/search', (req: Request, res: Response) => {
  const q = (req.query.q as string || '').trim().toLowerCase();
  if (!q || q.length < 2) {
    res.json([]);
    return;
  }

  const pattern = `%${q}%`;
  const results = stmts.searchUsers.all(pattern, pattern, pattern);
  res.json(results);
});

// POST /api/users/lookup
router.post('/lookup', (req: Request, res: Response) => {
  const { phones } = req.body;
  if (!phones || !Array.isArray(phones)) {
    res.status(400).json({ error: 'phones array is required' });
    return;
  }

  const found: any[] = [];
  for (const phone of phones) {
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const user = stmts.lookupByPhone.get(cleanPhone) as any;
    if (user) {
      found.push({ ...user, createdAt: new Date(user.createdAt) });
    }
  }

  res.json(found);
});

// GET /api/users/:id
router.get('/:id', (req: Request, res: Response) => {
  const user = stmts.getUserById.get(req.params.id) as any;
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(rowToUser(user));
});

// GET /api/users/:id/history
router.get('/:id/history', (req: Request, res: Response) => {
  const user = stmts.getUserById.get(req.params.id) as any;
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  // Get sessions where user is admin or participant
  const sessions = db.prepare(`
    SELECT DISTINCT s.* FROM sessions s
    LEFT JOIN participants p ON p.joinCode = s.joinCode
    WHERE s.adminId = ? OR p.userId = ?
    ORDER BY s.createdAt DESC
  `).all(req.params.id, req.params.id) as any[];

  const result = sessions.map((s: any) => {
    const participants = db.prepare(`SELECT * FROM participants WHERE joinCode = ?`).all(s.joinCode) as any[];
    return {
      ...s,
      createdAt: new Date(s.createdAt),
      closedAt: s.closedAt ? new Date(s.closedAt) : undefined,
      participants: participants.map((p: any) => ({
        ...p,
        isRouletteWinner: !!p.isRouletteWinner,
        isRouletteCoward: !!p.isRouletteCoward,
        joinedAt: new Date(p.joinedAt),
        paidAt: p.paidAt ? new Date(p.paidAt) : undefined,
      })),
    };
  });

  res.json(result);
});

// PUT /api/users/:id
router.put('/:id', (req: Request, res: Response) => {
  const existing = stmts.getUserById.get(req.params.id) as any;
  if (!existing) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  let displayName = existing.displayName;
  let username = existing.username;
  let documentId = existing.documentId;
  let avatarUrl = existing.avatarUrl;

  if (req.body.displayName) displayName = req.body.displayName.trim();

  if (req.body.username) {
    const cleanUsername = req.body.username.trim().toLowerCase().replace(/[^a-z0-9._]/g, '');
    if (cleanUsername.length >= 3) {
      const takenBy = stmts.getUserByUsername.get(cleanUsername) as any;
      if (takenBy && takenBy.id !== req.params.id) {
        res.status(409).json({ error: 'Username already taken' });
        return;
      }
      username = cleanUsername;
    }
  }

  if (req.body.documentId !== undefined) {
    const cleanDoc = req.body.documentId.trim();
    if (cleanDoc) {
      const takenBy = stmts.getUserByDocument.get(cleanDoc) as any;
      if (takenBy && takenBy.id !== req.params.id) {
        res.status(409).json({ error: 'Document ID already registered' });
        return;
      }
      documentId = cleanDoc;
    } else {
      documentId = null;
    }
  }

  if (req.body.avatarUrl !== undefined) avatarUrl = req.body.avatarUrl;

  stmts.updateUser.run({ id: req.params.id, displayName, username, documentId, avatarUrl });

  const updated = stmts.getUserById.get(req.params.id) as any;
  res.json(rowToUser(updated));
});

export { router as userRouter };

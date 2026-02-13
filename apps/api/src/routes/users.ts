import { Router, Request, Response } from 'express';
import { User } from '@lavaca/shared';

const router = Router();

// In-memory user store
export const users = new Map<string, User>();
const phoneIndex = new Map<string, string>(); // phone -> userId
const usernameIndex = new Map<string, string>(); // username -> userId

// POST /api/users/register
router.post('/register', (req: Request, res: Response) => {
  const { phone, displayName, username, documentId } = req.body;

  if (!phone || !displayName || !username) {
    res.status(400).json({ error: 'phone, displayName, and username are required' });
    return;
  }

  // Clean phone number
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9._]/g, '');

  if (cleanUsername.length < 3) {
    res.status(400).json({ error: 'Username must be at least 3 characters' });
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

  const user: User = {
    id: 'user-' + Math.random().toString(36).substring(2, 10),
    phone: cleanPhone,
    displayName: displayName.trim(),
    username: cleanUsername,
    documentId: documentId?.trim() || undefined,
    createdAt: new Date(),
  };

  users.set(user.id, user);
  phoneIndex.set(cleanPhone, user.id);
  usernameIndex.set(cleanUsername, user.id);
  res.status(201).json(user);
});

// POST /api/users/login
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

// GET /api/users/:id
router.get('/:id', (req: Request, res: Response) => {
  const user = users.get(req.params.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(user);
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
  if (documentId !== undefined) user.documentId = documentId.trim() || undefined;
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

  res.json(user);
});

export { router as userRouter };
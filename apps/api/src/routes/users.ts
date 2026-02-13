import { Router, Request, Response } from 'express';
import { User } from '@lavaca/shared';

const router = Router();

// In-memory user store
export const users = new Map<string, User>();
const phoneIndex = new Map<string, string>(); // phone -> userId

// POST /api/users/register
router.post('/register', (req: Request, res: Response) => {
  const { phone, displayName } = req.body;

  if (!phone || !displayName) {
    res.status(400).json({ error: 'phone and displayName are required' });
    return;
  }

  // Clean phone number
  const cleanPhone = phone.replace(/[^0-9+]/g, '');

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

  const user: User = {
    id: 'user-' + Math.random().toString(36).substring(2, 10),
    phone: cleanPhone,
    displayName: displayName.trim(),
    createdAt: new Date(),
  };

  users.set(user.id, user);
  phoneIndex.set(cleanPhone, user.id);
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

  const { displayName, avatarUrl } = req.body;
  if (displayName) user.displayName = displayName.trim();
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

  res.json(user);
});

export { router as userRouter };
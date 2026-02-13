import { Router, Request, Response } from 'express';
import { Group } from '@lavaca/shared';
import { users } from './users';

const router = Router();

// In-memory group store
const groups = new Map<string, Group>();
const userGroupsIndex = new Map<string, string[]>(); // userId -> groupId[]

function addToUserIndex(userId: string, groupId: string) {
  const existing = userGroupsIndex.get(userId) || [];
  if (!existing.includes(groupId)) {
    existing.push(groupId);
    userGroupsIndex.set(userId, existing);
  }
}

function removeFromUserIndex(userId: string, groupId: string) {
  const existing = userGroupsIndex.get(userId) || [];
  userGroupsIndex.set(userId, existing.filter((id) => id !== groupId));
}

// POST /api/groups — Create a new group
router.post('/', (req: Request, res: Response) => {
  const { name, icon, memberIds, createdBy } = req.body;

  if (!name || !createdBy) {
    res.status(400).json({ error: 'name and createdBy are required' });
    return;
  }

  const group: Group = {
    id: 'grp-' + Math.random().toString(36).substring(2, 10),
    name: name.trim(),
    icon: icon || undefined,
    memberIds: [createdBy, ...(memberIds || [])],
    createdBy,
    createdAt: new Date(),
  };

  // Deduplicate member IDs
  group.memberIds = [...new Set(group.memberIds)];

  groups.set(group.id, group);

  // Update user index
  group.memberIds.forEach((uid) => addToUserIndex(uid, group.id));

  res.status(201).json(group);
});

// GET /api/groups/user/:userId — Get all groups for a user
router.get('/user/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const groupIds = userGroupsIndex.get(userId) || [];

  const result = groupIds
    .map((gid) => groups.get(gid))
    .filter(Boolean)
    .map((group) => {
      const members = group!.memberIds
        .map((uid) => {
          const u = users.get(uid);
          return u
            ? { id: u.id, displayName: u.displayName, username: u.username, avatarUrl: u.avatarUrl }
            : null;
        })
        .filter(Boolean);

      return { ...group!, members };
    });

  res.json(result);
});

// GET /api/groups/:id — Get a specific group
router.get('/:id', (req: Request, res: Response) => {
  const group = groups.get(req.params.id);
  if (!group) {
    res.status(404).json({ error: 'Group not found' });
    return;
  }

  const members = group.memberIds
    .map((uid) => {
      const u = users.get(uid);
      return u
        ? { id: u.id, displayName: u.displayName, username: u.username, avatarUrl: u.avatarUrl, phone: u.phone }
        : null;
    })
    .filter(Boolean);

  res.json({ ...group, members });
});

// PUT /api/groups/:id — Update group name/icon
router.put('/:id', (req: Request, res: Response) => {
  const group = groups.get(req.params.id);
  if (!group) {
    res.status(404).json({ error: 'Group not found' });
    return;
  }

  const { name, icon } = req.body;
  if (name) group.name = name.trim();
  if (icon !== undefined) group.icon = icon;

  res.json(group);
});

// POST /api/groups/:id/members — Add members to a group
router.post('/:id/members', (req: Request, res: Response) => {
  const group = groups.get(req.params.id);
  if (!group) {
    res.status(404).json({ error: 'Group not found' });
    return;
  }

  const { userIds } = req.body;
  if (!userIds || !Array.isArray(userIds)) {
    res.status(400).json({ error: 'userIds array is required' });
    return;
  }

  for (const uid of userIds) {
    if (!group.memberIds.includes(uid)) {
      group.memberIds.push(uid);
      addToUserIndex(uid, group.id);
    }
  }

  res.json(group);
});

// DELETE /api/groups/:id/members/:userId — Remove member from group
router.delete('/:id/members/:userId', (req: Request, res: Response) => {
  const group = groups.get(req.params.id);
  if (!group) {
    res.status(404).json({ error: 'Group not found' });
    return;
  }

  const { userId } = req.params;
  group.memberIds = group.memberIds.filter((id) => id !== userId);
  removeFromUserIndex(userId, group.id);

  res.json(group);
});

// DELETE /api/groups/:id — Delete a group
router.delete('/:id', (req: Request, res: Response) => {
  const group = groups.get(req.params.id);
  if (!group) {
    res.status(404).json({ error: 'Group not found' });
    return;
  }

  // Clean up user indexes
  group.memberIds.forEach((uid) => removeFromUserIndex(uid, group.id));
  groups.delete(group.id);

  res.json({ success: true });
});

export { router as groupRouter };

import { Router, Request, Response } from 'express';
import { Group } from '@lavaca/shared';
import db from '../db';

const router = Router();

// ── Prepared statements ─────────────────────────────────
const stmts = {
  insertGroup: db.prepare(`INSERT INTO groups (id, name, icon, createdBy, createdAt) VALUES (?, ?, ?, ?, ?)`),
  addMember: db.prepare(`INSERT OR IGNORE INTO group_members (groupId, userId) VALUES (?, ?)`),
  removeMember: db.prepare(`DELETE FROM group_members WHERE groupId = ? AND userId = ?`),
  getGroup: db.prepare(`SELECT * FROM groups WHERE id = ?`),
  getGroupMembers: db.prepare(`SELECT userId FROM group_members WHERE groupId = ?`),
  getGroupsForUser: db.prepare(`SELECT g.* FROM groups g JOIN group_members gm ON g.id = gm.groupId WHERE gm.userId = ?`),
  getMemberDetails: db.prepare(`SELECT id, displayName, username, avatarUrl, phone FROM users WHERE id = ?`),
  updateGroup: db.prepare(`UPDATE groups SET name = ?, icon = ? WHERE id = ?`),
  deleteGroup: db.prepare(`DELETE FROM groups WHERE id = ?`),
  deleteGroupMembers: db.prepare(`DELETE FROM group_members WHERE groupId = ?`),
};

function buildGroupWithMembers(groupRow: any): any {
  const memberRows = stmts.getGroupMembers.all(groupRow.id) as any[];
  const memberIds = memberRows.map((m: any) => m.userId);
  const members = memberIds
    .map((uid: string) => stmts.getMemberDetails.get(uid))
    .filter(Boolean);

  return {
    ...groupRow,
    memberIds,
    createdAt: new Date(groupRow.createdAt),
    members,
  };
}

// POST /api/groups
router.post('/', (req: Request, res: Response) => {
  const { name, icon, memberIds, createdBy } = req.body;

  if (!name || !createdBy) {
    res.status(400).json({ error: 'name and createdBy are required' });
    return;
  }

  const groupId = 'grp-' + Math.random().toString(36).substring(2, 10);
  const now = new Date().toISOString();

  const allMembers = [...new Set([createdBy, ...(memberIds || [])])];

  const insertAll = db.transaction(() => {
    stmts.insertGroup.run(groupId, name.trim(), icon || null, createdBy, now);
    for (const uid of allMembers) {
      stmts.addMember.run(groupId, uid);
    }
  });
  insertAll();

  const group = stmts.getGroup.get(groupId) as any;
  res.status(201).json(buildGroupWithMembers(group));
});

// GET /api/groups/user/:userId
router.get('/user/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const groups = stmts.getGroupsForUser.all(userId) as any[];
  const result = groups.map(buildGroupWithMembers);
  res.json(result);
});

// GET /api/groups/:id
router.get('/:id', (req: Request, res: Response) => {
  const group = stmts.getGroup.get(req.params.id) as any;
  if (!group) {
    res.status(404).json({ error: 'Group not found' });
    return;
  }
  res.json(buildGroupWithMembers(group));
});

// PUT /api/groups/:id
router.put('/:id', (req: Request, res: Response) => {
  const group = stmts.getGroup.get(req.params.id) as any;
  if (!group) {
    res.status(404).json({ error: 'Group not found' });
    return;
  }

  const { name, icon } = req.body;
  stmts.updateGroup.run(
    name ? name.trim() : group.name,
    icon !== undefined ? icon : group.icon,
    req.params.id
  );

  const updated = stmts.getGroup.get(req.params.id) as any;
  res.json(buildGroupWithMembers(updated));
});

// POST /api/groups/:id/members
router.post('/:id/members', (req: Request, res: Response) => {
  const group = stmts.getGroup.get(req.params.id) as any;
  if (!group) {
    res.status(404).json({ error: 'Group not found' });
    return;
  }

  const { userIds } = req.body;
  if (!userIds || !Array.isArray(userIds)) {
    res.status(400).json({ error: 'userIds array is required' });
    return;
  }

  const addAll = db.transaction(() => {
    for (const uid of userIds) {
      stmts.addMember.run(req.params.id, uid);
    }
  });
  addAll();

  const updated = stmts.getGroup.get(req.params.id) as any;
  res.json(buildGroupWithMembers(updated));
});

// DELETE /api/groups/:id/members/:userId
router.delete('/:id/members/:userId', (req: Request, res: Response) => {
  const group = stmts.getGroup.get(req.params.id) as any;
  if (!group) {
    res.status(404).json({ error: 'Group not found' });
    return;
  }

  stmts.removeMember.run(req.params.id, req.params.userId);

  const updated = stmts.getGroup.get(req.params.id) as any;
  res.json(buildGroupWithMembers(updated));
});

// DELETE /api/groups/:id
router.delete('/:id', (req: Request, res: Response) => {
  const group = stmts.getGroup.get(req.params.id) as any;
  if (!group) {
    res.status(404).json({ error: 'Group not found' });
    return;
  }

  const deleteAll = db.transaction(() => {
    stmts.deleteGroupMembers.run(req.params.id);
    stmts.deleteGroup.run(req.params.id);
  });
  deleteAll();

  res.json({ success: true });
});

export { router as groupRouter };


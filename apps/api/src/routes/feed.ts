import { Router, Request, Response } from 'express';
import { FeedEvent } from '@lavaca/shared';
import db from '../db';

const router = Router();

// ── Prepared statements ─────────────────────────────────
const stmts = {
  insertEvent: db.prepare(`INSERT INTO feed_events (id, groupId, sessionId, type, message, createdAt) VALUES (?, ?, ?, ?, ?, ?)`),
  insertEventUser: db.prepare(`INSERT INTO feed_event_users (eventId, userId) VALUES (?, ?)`),
  getAll: db.prepare(`SELECT * FROM feed_events ORDER BY createdAt DESC LIMIT 50`),
  getEventUsers: db.prepare(`SELECT userId FROM feed_event_users WHERE eventId = ?`),
  getUserEvents: db.prepare(`
    SELECT fe.* FROM feed_events fe
    JOIN feed_event_users feu ON fe.id = feu.eventId
    WHERE feu.userId = ?
    ORDER BY fe.createdAt DESC
    LIMIT 50
  `),
  countEvents: db.prepare(`SELECT COUNT(*) as cnt FROM feed_events`),
  deleteOldest: db.prepare(`DELETE FROM feed_events WHERE id IN (SELECT id FROM feed_events ORDER BY createdAt ASC LIMIT ?)`),
};

function rowToEvent(row: any): FeedEvent {
  const userRows = stmts.getEventUsers.all(row.id) as any[];
  return {
    id: row.id,
    groupId: row.groupId ?? undefined,
    sessionId: row.sessionId ?? undefined,
    type: row.type,
    message: row.message,
    userIds: userRows.map((u: any) => u.userId),
    createdAt: new Date(row.createdAt),
  };
}

/** Helper to add a feed event */
export function addFeedEvent(event: Omit<FeedEvent, 'id' | 'createdAt'>) {
  const id = 'evt-' + Math.random().toString(36).substring(2, 10);
  const now = new Date().toISOString();

  const insertAll = db.transaction(() => {
    stmts.insertEvent.run(id, event.groupId || null, event.sessionId || null, event.type, event.message, now);
    for (const userId of event.userIds) {
      stmts.insertEventUser.run(id, userId);
    }

    // Keep max 200 events
    const count = (stmts.countEvents.get() as any).cnt;
    if (count > 200) {
      stmts.deleteOldest.run(count - 200);
    }
  });
  insertAll();
}

// GET /api/feed
router.get('/', (_req: Request, res: Response) => {
  const rows = stmts.getAll.all() as any[];
  res.json(rows.map(rowToEvent));
});

// GET /api/feed/user/:userId
router.get('/user/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const rows = stmts.getUserEvents.all(userId) as any[];
  res.json(rows.map(rowToEvent));
});

export { router as feedRouter };

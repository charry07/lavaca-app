import { Router, Request, Response } from 'express';
import { FeedEvent } from '@lavaca/shared';

const router = Router();

// In-memory feed store
export const feedEvents: FeedEvent[] = [];

/** Helper to add a feed event */
export function addFeedEvent(event: Omit<FeedEvent, 'id' | 'createdAt'>) {
  feedEvents.unshift({
    ...event,
    id: 'evt-' + Math.random().toString(36).substring(2, 10),
    createdAt: new Date(),
  });
  // Keep max 200 events
  if (feedEvents.length > 200) feedEvents.length = 200;
}

// GET /api/feed - Get all feed events (global feed)
router.get('/', (_req: Request, res: Response) => {
  res.json(feedEvents.slice(0, 50));
});

// GET /api/feed/user/:userId - Get feed for a specific user
router.get('/user/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const userFeed = feedEvents.filter((e) => e.userIds.includes(userId));
  res.json(userFeed.slice(0, 50));
});

export { router as feedRouter };
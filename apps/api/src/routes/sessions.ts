import { Router, Request, Response } from 'express';
import {
  PaymentSession,
  Participant,
  SplitMode,
  generateJoinCode,
  splitEqual,
  splitByPercentage,
  rouletteSelect,
  formatCOP,
} from '@lavaca/shared';
import { addFeedEvent } from './feed';

const router = Router();

// In-memory store (will be replaced with DB later)
const sessions = new Map<string, PaymentSession>();

// POST /api/sessions - Create a new session
router.post('/', (req: Request, res: Response) => {
  const { adminId, totalAmount, currency = 'COP', splitMode = 'equal', description } = req.body;

  if (!adminId || !totalAmount) {
    res.status(400).json({ error: 'adminId and totalAmount are required' });
    return;
  }

  const joinCode = generateJoinCode();
  const now = new Date();

  const session: PaymentSession = {
    id: Math.random().toString(36).substring(2, 15),
    joinCode,
    adminId,
    totalAmount: Number(totalAmount),
    currency,
    splitMode: splitMode as SplitMode,
    participants: [],
    status: 'open',
    description,
    createdAt: now,
  };

  sessions.set(joinCode, session);
  res.status(201).json(session);
});

// GET /api/sessions/:joinCode - Get session by join code
router.get('/:joinCode', (req: Request, res: Response) => {
  const session = sessions.get(req.params.joinCode);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  res.json(session);
});

// POST /api/sessions/:joinCode/join - Join a session
router.post('/:joinCode/join', (req: Request, res: Response) => {
  const session = sessions.get(req.params.joinCode);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  if (session.status !== 'open') {
    res.status(400).json({ error: 'Session is not open' });
    return;
  }

  const { userId, displayName } = req.body;
  if (!userId || !displayName) {
    res.status(400).json({ error: 'userId and displayName are required' });
    return;
  }

  const existing = session.participants.find((p) => p.userId === userId);
  if (existing) {
    res.status(400).json({ error: 'User already in session' });
    return;
  }

  const participant: Participant = {
    userId,
    displayName,
    amount: 0,
    status: 'pending',
    joinedAt: new Date(),
  };

  session.participants.push(participant);
  res.json(session);
});

// POST /api/sessions/:joinCode/split - Calculate the split
router.post('/:joinCode/split', (req: Request, res: Response) => {
  const session = sessions.get(req.params.joinCode);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  const count = session.participants.length;
  if (count === 0) {
    res.status(400).json({ error: 'No participants in session' });
    return;
  }

  if (session.splitMode === 'equal') {
    const amounts = splitEqual(session.totalAmount, count);
    session.participants.forEach((p, i) => {
      p.amount = amounts[i];
    });
  } else if (session.splitMode === 'percentage') {
    const { percentages } = req.body;
    if (!percentages || percentages.length !== count) {
      res.status(400).json({ error: 'Percentages array must match participant count' });
      return;
    }
    try {
      const amounts = splitByPercentage(session.totalAmount, percentages);
      session.participants.forEach((p, i) => {
        p.amount = amounts[i];
        p.percentage = percentages[i];
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
      return;
    }
  } else if (session.splitMode === 'roulette') {
    const winnerIndex = rouletteSelect(count);
    session.participants.forEach((p, i) => {
      if (i === winnerIndex) {
        p.amount = session.totalAmount;
        p.isRouletteWinner = true;
      } else {
        p.amount = 0;
        p.isRouletteWinner = false;
      }
    });

    // Feed event: roulette winner
    const winner = session.participants[winnerIndex];
    addFeedEvent({
      type: 'roulette_win',
      sessionId: session.id,
      message: `🎰 ${winner.displayName} perdio la ruleta y paga ${formatCOP(session.totalAmount)}!`,
      userIds: session.participants.map((p) => p.userId),
    });
  }

  res.json(session);
});

// POST /api/sessions/:joinCode/pay - Mark a participant as paid
router.post('/:joinCode/pay', (req: Request, res: Response) => {
  const session = sessions.get(req.params.joinCode);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  const { userId, paymentMethod } = req.body;
  const participant = session.participants.find((p) => p.userId === userId);
  if (!participant) {
    res.status(404).json({ error: 'Participant not found' });
    return;
  }

  participant.status = 'confirmed';
  participant.paymentMethod = paymentMethod || 'other';
  participant.paidAt = new Date();

  // Check if all participants have paid
  const allPaid = session.participants.every((p) => p.status === 'confirmed');
  if (allPaid) {
    session.status = 'closed';
    session.closedAt = new Date();

    // Feed event: session closed
    addFeedEvent({
      type: 'session_closed',
      sessionId: session.id,
      message: `🎉 Mesa cerrada! ${session.participants.length} personas pagaron ${formatCOP(session.totalAmount)}${session.description ? ' — ' + session.description : ''}`,
      userIds: session.participants.map((p) => p.userId),
    });
  }

  // Feed event: fast payer (paid within 60 seconds of split)
  const splitTime = session.participants.find((p) => p.amount > 0 && p.paidAt)?.joinedAt;
  if (participant.paidAt && splitTime) {
    const secondsSinceSplit = (participant.paidAt.getTime() - splitTime.getTime()) / 1000;
    if (secondsSinceSplit < 60) {
      addFeedEvent({
        type: 'fast_payer',
        sessionId: session.id,
        message: `⚡ ${participant.displayName} pago en menos de 1 minuto! Velocidad pura 🏎️`,
        userIds: [participant.userId],
      });
    }
  }

  res.json(session);
});

/** Helper to get all sessions (used by history endpoint) */
export function getAllSessions(): PaymentSession[] {
  return Array.from(sessions.values());
}

export { router as sessionRouter };

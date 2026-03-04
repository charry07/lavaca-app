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
import { getUserById } from './users';
import db from '../db';

const router = Router();

// ── Emit helper ─────────────────────────────────────────
function emitSessionUpdate(req: Request, joinCode: string, session: PaymentSession) {
  const io = req.app.get('io');
  if (io) io.to(joinCode).emit('session-update', session);
}

// ── Prepared statements ─────────────────────────────────
const stmts = {
  insertSession: db.prepare(`INSERT INTO sessions (id, joinCode, adminId, totalAmount, currency, splitMode, description, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?)`),
  getSession: db.prepare(`SELECT * FROM sessions WHERE joinCode = ?`),
  getParticipants: db.prepare(`SELECT * FROM participants WHERE joinCode = ?`),
  getParticipant: db.prepare(`SELECT * FROM participants WHERE joinCode = ? AND userId = ?`),
  insertParticipant: db.prepare(`INSERT INTO participants (joinCode, userId, displayName, amount, status, joinedAt) VALUES (?, ?, ?, 0, 'pending', ?)`),
  updateParticipantAmount: db.prepare(`UPDATE participants SET amount = ?, percentage = ?, isRouletteWinner = ?, isRouletteCoward = ? WHERE joinCode = ? AND userId = ?`),
  reportParticipantPaid: db.prepare(`UPDATE participants SET status = 'reported', paymentMethod = ?, paidAt = NULL WHERE joinCode = ? AND userId = ?`),
  approveParticipantPaid: db.prepare(`UPDATE participants SET status = 'confirmed', paymentMethod = COALESCE(?, paymentMethod), paidAt = ? WHERE joinCode = ? AND userId = ?`),
  closeSession: db.prepare(`UPDATE sessions SET status = 'closed', closedAt = ? WHERE joinCode = ?`),
  deleteSession: db.prepare(`DELETE FROM sessions WHERE joinCode = ?`),
  deleteFeedEventsBySession: db.prepare(`DELETE FROM feed_events WHERE sessionId = ?`),
};

function buildSession(row: any): PaymentSession {
  const participants = (stmts.getParticipants.all(row.joinCode) as any[]).map((p: any) => ({
    userId: p.userId,
    displayName: p.displayName,
    amount: p.amount,
    percentage: p.percentage ?? undefined,
    status: p.status,
    paymentMethod: p.paymentMethod ?? undefined,
    isRouletteWinner: !!p.isRouletteWinner,
    isRouletteCoward: !!p.isRouletteCoward,
    joinedAt: new Date(p.joinedAt),
    paidAt: p.paidAt ? new Date(p.paidAt) : undefined,
  }));

  return {
    id: row.id,
    joinCode: row.joinCode,
    adminId: row.adminId,
    totalAmount: row.totalAmount,
    currency: row.currency,
    splitMode: row.splitMode as SplitMode,
    participants,
    status: row.status,
    description: row.description ?? undefined,
    createdAt: new Date(row.createdAt),
    closedAt: row.closedAt ? new Date(row.closedAt) : undefined,
  };
}

// POST /api/sessions
router.post('/', (req: Request, res: Response) => {
  const { adminId, totalAmount, currency = 'COP', splitMode = 'equal', description } = req.body;

  if (!adminId || !totalAmount) {
    res.status(400).json({ error: 'adminId and totalAmount are required' });
    return;
  }

  const joinCode = generateJoinCode();
  const now = new Date().toISOString();
  const id = Math.random().toString(36).substring(2, 15);

  // Auto-join the admin as the first participant
  const adminUser = getUserById(adminId);
  const adminName = adminUser?.displayName || 'Admin';

  const createAll = db.transaction(() => {
    stmts.insertSession.run(id, joinCode, adminId, Number(totalAmount), currency, splitMode, description || null, now);
    stmts.insertParticipant.run(joinCode, adminId, adminName, now);
  });
  createAll();

  const session = stmts.getSession.get(joinCode) as any;
  res.status(201).json(buildSession(session));
});

// GET /api/sessions/:joinCode
router.get('/:joinCode', (req: Request, res: Response) => {
  const session = stmts.getSession.get(req.params.joinCode) as any;
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  res.json(buildSession(session));
});

// POST /api/sessions/:joinCode/join
router.post('/:joinCode/join', (req: Request, res: Response) => {
  const session = stmts.getSession.get(req.params.joinCode) as any;
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

  const existing = stmts.getParticipant.get(req.params.joinCode, userId) as any;
  if (existing) {
    // Already in session — return session data instead of error
    res.json(buildSession(session));
    return;
  }

  const now = new Date().toISOString();
  stmts.insertParticipant.run(req.params.joinCode, userId, displayName, now);

  // Return fresh data that includes the new participant
  const updatedSession = stmts.getSession.get(req.params.joinCode) as any;
  const builtSession = buildSession(updatedSession);
  emitSessionUpdate(req, req.params.joinCode, builtSession);
  res.json(builtSession);
});

// POST /api/sessions/:joinCode/split
router.post('/:joinCode/split', (req: Request, res: Response) => {
  const session = stmts.getSession.get(req.params.joinCode) as any;
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  const participants = stmts.getParticipants.all(req.params.joinCode) as any[];
  const count = participants.length;
  if (count === 0) {
    res.status(400).json({ error: 'No participants in session' });
    return;
  }

  const updateAll = db.transaction(() => {
    if (session.splitMode === 'equal') {
      const amounts = splitEqual(session.totalAmount, count);
      participants.forEach((p: any, i: number) => {
        stmts.updateParticipantAmount.run(amounts[i], null, 0, 0, req.params.joinCode, p.userId);
      });
    } else if (session.splitMode === 'percentage') {
      const { percentages } = req.body;
      if (!percentages || percentages.length !== count) {
        throw new Error('Percentages array must match participant count');
      }
      const amounts = splitByPercentage(session.totalAmount, percentages);
      participants.forEach((p: any, i: number) => {
        stmts.updateParticipantAmount.run(amounts[i], percentages[i], 0, 0, req.params.joinCode, p.userId);
      });
    } else if (session.splitMode === 'roulette') {
      const winnerIndex = rouletteSelect(count);
      participants.forEach((p: any, i: number) => {
        if (i === winnerIndex) {
          stmts.updateParticipantAmount.run(session.totalAmount, null, 1, 0, req.params.joinCode, p.userId);
        } else {
          // Non-winners pay 0 — mark as coward (they "escaped" the roulette)
          stmts.updateParticipantAmount.run(0, null, 0, 1, req.params.joinCode, p.userId);
        }
      });

      const winner = participants[winnerIndex];
      const cowards = participants.filter((_: any, i: number) => i !== winnerIndex);

      addFeedEvent({
        type: 'roulette_win',
        sessionId: session.id,
        message: `🎰 ${winner.displayName} perdio la ruleta y paga ${formatCOP(session.totalAmount)}!`,
        userIds: participants.map((p: any) => p.userId),
      });

      if (cowards.length > 0) {
        addFeedEvent({
          type: 'roulette_coward',
          sessionId: session.id,
          message: `🐔 ${cowards.map((p: any) => p.displayName).join(', ')} se salvaron de la ruleta!`,
          userIds: cowards.map((p: any) => p.userId),
        });
      }
    }
  });

  try {
    updateAll();
  } catch (err: any) {
    res.status(400).json({ error: err.message });
    return;
  }

  const splitResult = buildSession(stmts.getSession.get(req.params.joinCode) as any);
  emitSessionUpdate(req, req.params.joinCode, splitResult);
  res.json(splitResult);
});

function closeSessionIfAllPaid(session: any, joinCode: string, now: string): void {
  const allParticipants = stmts.getParticipants.all(joinCode) as any[];
  const owedParticipants = allParticipants.filter((p: any) => Number(p.amount) > 0);
  const allPaid = owedParticipants.length > 0 && owedParticipants.every((p: any) => p.status === 'confirmed');

  if (!allPaid) return;

  stmts.closeSession.run(now, joinCode);
  addFeedEvent({
    type: 'session_closed',
    sessionId: session.id,
    message: `🎉 Mesa cerrada! ${allParticipants.length} personas pagaron ${formatCOP(session.totalAmount)}${session.description ? ' — ' + session.description : ''}`,
    userIds: allParticipants.map((p: any) => p.userId),
  });
}

// POST /api/sessions/:joinCode/pay/report
router.post('/:joinCode/pay/report', (req: Request, res: Response) => {
  const session = stmts.getSession.get(req.params.joinCode) as any;
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  if (session.status !== 'open') {
    res.status(400).json({ error: 'Session is not open' });
    return;
  }

  const { userId, reporterId, paymentMethod } = req.body;
  if (!userId || !reporterId) {
    res.status(400).json({ error: 'userId and reporterId are required' });
    return;
  }

  if (userId !== reporterId) {
    res.status(403).json({ error: 'Only the participant can report their own payment' });
    return;
  }

  const participant = stmts.getParticipant.get(req.params.joinCode, userId) as any;
  if (!participant) {
    res.status(404).json({ error: 'Participant not found' });
    return;
  }

  if (participant.status === 'confirmed') {
    res.json(buildSession(session));
    return;
  }

  stmts.reportParticipantPaid.run(paymentMethod || participant.paymentMethod || 'other', req.params.joinCode, userId);
  const updatedSession = stmts.getSession.get(req.params.joinCode) as any;
  const reportResult = buildSession(updatedSession);
  emitSessionUpdate(req, req.params.joinCode, reportResult);
  res.json(reportResult);
});

// POST /api/sessions/:joinCode/pay/approve
router.post('/:joinCode/pay/approve', (req: Request, res: Response) => {
  const session = stmts.getSession.get(req.params.joinCode) as any;
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  if (session.status !== 'open') {
    res.status(400).json({ error: 'Session is not open' });
    return;
  }

  const { userId, adminId, paymentMethod } = req.body;
  if (!userId || !adminId) {
    res.status(400).json({ error: 'userId and adminId are required' });
    return;
  }

  if (adminId !== session.adminId) {
    res.status(403).json({ error: 'Only admin can approve payments' });
    return;
  }

  const participant = stmts.getParticipant.get(req.params.joinCode, userId) as any;
  if (!participant) {
    res.status(404).json({ error: 'Participant not found' });
    return;
  }

  if (participant.status === 'confirmed') {
    res.json(buildSession(session));
    return;
  }

  if (participant.status !== 'reported') {
    res.status(400).json({ error: 'Participant has not reported payment yet' });
    return;
  }

  const now = new Date().toISOString();
  stmts.approveParticipantPaid.run(paymentMethod || null, now, req.params.joinCode, userId);
  closeSessionIfAllPaid(session, req.params.joinCode, now);

  // Feed event: fast payer
  const paidAt = new Date(now);
  const joinedAt = new Date(participant.joinedAt);
  const secondsSinceJoin = (paidAt.getTime() - joinedAt.getTime()) / 1000;
  if (secondsSinceJoin < 60) {
    addFeedEvent({
      type: 'fast_payer',
      sessionId: session.id,
      message: `⚡ ${participant.displayName} pago en menos de 1 minuto! Velocidad pura 🏎️`,
      userIds: [userId],
    });
  }

  const updatedSession = stmts.getSession.get(req.params.joinCode) as any;
  const approveResult = buildSession(updatedSession);
  emitSessionUpdate(req, req.params.joinCode, approveResult);
  res.json(approveResult);
});

// POST /api/sessions/:joinCode/pay
// Legacy endpoint: directly confirms payment (kept for backward compatibility)
router.post('/:joinCode/pay', (req: Request, res: Response) => {
  const session = stmts.getSession.get(req.params.joinCode) as any;
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  const { userId, paymentMethod } = req.body;
  const participant = stmts.getParticipant.get(req.params.joinCode, userId) as any;
  if (!participant) {
    res.status(404).json({ error: 'Participant not found' });
    return;
  }

  const now = new Date().toISOString();
  stmts.approveParticipantPaid.run(paymentMethod || 'other', now, req.params.joinCode, userId);
  closeSessionIfAllPaid(session, req.params.joinCode, now);

  const updatedSession = stmts.getSession.get(req.params.joinCode) as any;
  res.json(buildSession(updatedSession));
});

// PATCH /api/sessions/:joinCode/close  (admin manual close)
router.patch('/:joinCode/close', (req: Request, res: Response) => {
  const session = stmts.getSession.get(req.params.joinCode) as any;
  if (!session) { res.status(404).json({ error: 'Session not found' }); return; }
  if (session.status === 'closed') { res.json(buildSession(session)); return; }
  const now = new Date().toISOString();
  stmts.closeSession.run(now, req.params.joinCode);
  const closedResult = buildSession(stmts.getSession.get(req.params.joinCode) as any);
  emitSessionUpdate(req, req.params.joinCode, closedResult);
  res.json(closedResult);
});

// DELETE /api/sessions/:joinCode  (admin delete)
router.delete('/:joinCode', (req: Request, res: Response) => {
  const session = stmts.getSession.get(req.params.joinCode) as any;
  if (!session) { res.status(404).json({ error: 'Session not found' }); return; }

  const adminId = (req.body && req.body.adminId) || (req.query && (req.query.adminId as string));
  if (!adminId) { res.status(400).json({ error: 'adminId is required' }); return; }
  if (adminId !== session.adminId) { res.status(403).json({ error: 'Only admin can delete session' }); return; }

  const deleteAll = db.transaction(() => {
    stmts.deleteFeedEventsBySession.run(session.id);
    stmts.deleteSession.run(req.params.joinCode);
  });

  deleteAll();
  res.json({ success: true });
});

/** Helper to get all sessions (used by history endpoint) */
export function getAllSessions(): PaymentSession[] {
  const rows = db.prepare('SELECT * FROM sessions').all() as any[];
  return rows.map(buildSession);
}

export { router as sessionRouter };


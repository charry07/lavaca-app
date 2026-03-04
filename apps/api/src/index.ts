import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { sessionRouter } from './routes/sessions';
import { userRouter } from './routes/users';
import { feedRouter } from './routes/feed';
import { groupRouter } from './routes/groups';

const app = express();
const server = http.createServer(app);

const isDev = process.env.NODE_ENV !== 'production';

// In dev allow any origin (Expo DevTools connects from dynamic IPs).
// In production, set ALLOWED_ORIGINS env var (comma-separated).
const allowedOrigins: string | string[] | boolean = isDev
  ? true
  : (process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) ?? false);

const corsOptions: cors.CorsOptions = {
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

// Security headers (disable frameguard for API; keep the rest)
app.use(helmet({ frameguard: false, contentSecurityPolicy: false }));
app.use(cors(corsOptions));

// Default body limit 256 KB — avatar upload endpoint overrides inline
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: true, limit: '256kb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', name: 'La Vaca API', version: '0.1.0' });
});

// Routes
app.use('/api/sessions', sessionRouter);
app.use('/api/users', userRouter);
app.use('/api/feed', feedRouter);
app.use('/api/groups', groupRouter);

// WebSocket for real-time session updates
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-session', (joinCode: string) => {
    socket.join(joinCode);
    console.log(`Socket ${socket.id} joined session ${joinCode}`);
  });

  socket.on('leave-session', (joinCode: string) => {
    socket.leave(joinCode);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`La Vaca API running on http://localhost:${PORT}`);
});

export { io };

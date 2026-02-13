import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { sessionRouter } from './routes/sessions';
import { userRouter } from './routes/users';
import { feedRouter } from './routes/feed';

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', name: 'La Vaca API', version: '0.1.0' });
});

// Routes
app.use('/api/sessions', sessionRouter);
app.use('/api/users', userRouter);
app.use('/api/feed', feedRouter);

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

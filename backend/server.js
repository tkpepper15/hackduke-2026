require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const dataRoutes      = require('./routes/data');
const patientRoutes   = require('./routes/patients');
const aiSummaryRoutes = require('./routes/aiSummary');
const { startSerialBridge } = require('./serial/bridge');
const { startBotPatients }  = require('./db/botPatients');

const app = express();
const server = http.createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

// Make io accessible to route handlers
app.set('io', io);

app.use('/data', dataRoutes);
app.use('/patients', patientRoutes);
app.use('/ai-summary', aiSummaryRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

io.on('connection', (socket) => {
  console.log(`[ws] client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[ws] client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`IV Monitor backend running on port ${PORT}`);
  startSerialBridge(io);   // real ESP32 data via USB serial
  startBotPatients(io);    // synthetic demo patients
});

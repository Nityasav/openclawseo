require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const http = require('http');
const { Client, GatewayIntentBits } = require('discord.js');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Connected WebSocket clients
const wsClients = new Set();

// FIFO queue of pending HTTP requests waiting for a bot reply
const pendingRequests = [];

// Discord client — needs MessageContent intent to read message bodies
const discord = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const CEO_BOT_ID = process.env.DISCORD_BOT_USER_ID;

discord.on('ready', () => {
  console.log(`✅ Bridge bot logged in as ${discord.user.tag}`);
});

// When the CEO bot posts in the channel, route its reply back to the web
discord.on('messageCreate', (message) => {
  if (message.channelId !== CHANNEL_ID) return;
  if (message.author.id !== CEO_BOT_ID) return;

  const content = message.content;
  const timestamp = message.createdAt.toISOString();
  console.log(`[Discord → Web] ${content.substring(0, 100)}`);

  // Resolve the oldest pending HTTP request (FIFO)
  if (pendingRequests.length > 0) {
    const pending = pendingRequests.shift();
    clearTimeout(pending.timeout);
    pending.resolve(content);
  }

  // Also push to all live WebSocket clients
  const payload = JSON.stringify({
    type: 'agent_response',
    data: { content, timestamp },
  });
  wsClients.forEach((ws) => {
    if (ws.readyState === 1) ws.send(payload);
  });
});

// ── WebSocket ──────────────────────────────────────────────────────────────
wss.on('connection', (ws) => {
  wsClients.add(ws);
  console.log(`[WS] Client connected (${wsClients.size} total)`);
  ws.on('close', () => {
    wsClients.delete(ws);
    console.log(`[WS] Client disconnected (${wsClients.size} total)`);
  });
});

// ── REST endpoints ─────────────────────────────────────────────────────────

// POST /api/send-message
app.post('/api/send-message', async (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) {
    return res.status(400).json({ success: false, message: 'message is required' });
  }

  try {
    const channel = await discord.channels.fetch(CHANNEL_ID);
    await channel.send(message);
    console.log(`[Web → Discord] ${message.substring(0, 100)}`);

    // Wait up to 60 s for the CEO bot to reply
    const content = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const idx = pendingRequests.findIndex((p) => p.resolve === resolve);
        if (idx !== -1) pendingRequests.splice(idx, 1);
        reject(new Error('CEO bot did not respond within 60 s'));
      }, 60_000);
      pendingRequests.push({ resolve, reject, timeout });
    });

    res.json({
      success: true,
      message: 'Message delivered',
      response: {
        id: Date.now().toString(),
        content,
        role: 'assistant',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/optimization-request
app.post('/api/optimization-request', async (req, res) => {
  const request = req.body;
  try {
    const channel = await discord.channels.fetch(CHANNEL_ID);

    const reqs = Object.entries(request.requirements || {})
      .filter(([, v]) => v)
      .map(([k]) => k.replace(/([A-Z])/g, ' $1').toLowerCase())
      .join(', ');

    const lines = [
      '**New Optimization Request**',
      `**Repository:** ${request.repositoryUrl}`,
      `**Type:** ${(request.optimizationType || 'both').toUpperCase()}`,
      `**Priority:** ${request.priority || 'normal'}`,
      `**Requirements:** ${reqs || 'none'}`,
      request.notes ? `**Notes:** ${request.notes}` : null,
    ].filter(Boolean);

    await channel.send(lines.join('\n'));
    console.log(`[Web → Discord] Optimization request for ${request.repositoryUrl}`);

    res.json({
      requestId: Date.now().toString(),
      status: 'pending',
      message: 'Optimization request submitted to CEO agent',
      estimatedCompletion: new Date(Date.now() + 48 * 3_600_000).toISOString(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/projects
app.get('/api/projects', (_req, res) => {
  res.json({ projects: [] });
});

// GET /api/ws-info
app.get('/api/ws-info', (_req, res) => {
  res.json({
    wsEndpoint: process.env.BRIDGE_WS_URL || `ws://localhost:${PORT}`,
    supportedEvents: ['agent_response', 'project_update'],
  });
});

// ── Start ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Bridge server listening on http://localhost:${PORT}`);
  discord.login(process.env.DISCORD_BOT_TOKEN).catch((err) => {
    console.error('❌ Discord login failed:', err.message);
    process.exit(1);
  });
});

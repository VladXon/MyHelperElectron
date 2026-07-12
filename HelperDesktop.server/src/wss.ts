import { WebSocketServer, type WebSocket } from 'ws';
import type { Server } from 'node:http';
import { logger } from './logger';

let wss: WebSocketServer;

export function startWebSocket(httpServer: Server) {
  wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req) => {
    const ip = req.socket.remoteAddress || 'unknown';
    logger.websocket('Client connected', { ip, url: req.url });

    ws.send(JSON.stringify({ type: 'connected', message: 'WebSocket connected' }));

    ws.on('close', () => {
      logger.websocket('Client disconnected', { ip });
    });

    ws.on('error', (err) => {
      logger.error('WebSocket error', err, { ip });
    });
  });

  setInterval(() => {
    const payload = JSON.stringify({
      type: 'health',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(payload);
      }
    });
    logger.websocket('Health ping sent', { clients: wss.clients.size });
  }, 10000);

  logger.info('WebSocket server started', { path: '/ws' });
}

export function getWebSocketServer(): WebSocketServer {
  return wss;
}

export function broadcast(data: unknown) {
  if (!wss) return;
  const payload = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(payload);
    }
  });
}
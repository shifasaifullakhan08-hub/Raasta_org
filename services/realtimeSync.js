// services/realtimeSync.js
// High-performance Server-Sent Events (SSE) manager with automatic reconnection & heartbeat

class RealtimeSyncManager {
  constructor() {
    this.clients = new Set();
    this.eventBuffer = []; // Circular buffer of last 50 events for replay / polling fallback
    this.maxBufferSize = 50;
    this.heartbeatInterval = null;
    this.startHeartbeat();
  }

  startHeartbeat() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    // Send lightweight comment heartbeat every 20 seconds to keep Render / proxy connections alive
    this.heartbeatInterval = setInterval(() => {
      this.broadcastRaw(': heartbeat\n\n');
    }, 20000);
  }

  /**
   * Handle incoming SSE connection
   */
  handleConnection(req, res) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'X-Accel-Buffering': 'no' // Prevent Nginx / proxy response buffering
    });

    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const client = { id: clientId, res };
    this.clients.add(client);

    // Send initial connected handshake with server time
    const initialPayload = JSON.stringify({
      type: 'connected',
      clientId,
      serverTime: new Date().toISOString(),
      timezone: 'Asia/Kolkata',
      activeClientsCount: this.clients.size
    });
    res.write(`event: handshake\ndata: ${initialPayload}\n\n`);

    req.on('close', () => {
      this.clients.delete(client);
    });

    req.on('error', () => {
      this.clients.delete(client);
    });
  }

  /**
   * Broadcast an event to all connected SSE clients
   */
  broadcast(eventType, payload) {
    const eventRecord = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type: eventType,
      data: payload,
      timestamp: new Date().toISOString()
    };

    // Buffer event for polling fallback
    this.eventBuffer.push(eventRecord);
    if (this.eventBuffer.length > this.maxBufferSize) {
      this.eventBuffer.shift();
    }

    const sseMessage = `id: ${eventRecord.id}\nevent: ${eventType}\ndata: ${JSON.stringify(eventRecord)}\n\n`;
    this.broadcastRaw(sseMessage);
  }

  broadcastRaw(dataString) {
    for (const client of this.clients) {
      try {
        client.res.write(dataString);
      } catch (err) {
        this.clients.delete(client);
      }
    }
  }

  /**
   * Fallback endpoint data for clients unable to maintain SSE
   */
  getRecentEvents(sinceTimestamp) {
    if (!sinceTimestamp) return this.eventBuffer.slice(-10);
    const sinceDate = new Date(sinceTimestamp).getTime();
    return this.eventBuffer.filter(e => new Date(e.timestamp).getTime() > sinceDate);
  }

  getClientCount() {
    return this.clients.size;
  }
}

const realtimeSync = new RealtimeSyncManager();
module.exports = realtimeSync;

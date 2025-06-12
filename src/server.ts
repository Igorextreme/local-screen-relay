import { createServer } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import * as os from 'node:os';

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const server = createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/local-ip') {
    const ip = getLocalIP();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ip }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

const wss = new WebSocketServer({ noServer: true });

let transmitterSocket: WebSocket | null = null;
const viewers: Set<WebSocket> = new Set();

server.on('upgrade', (request, socket, head) => {
  const { url } = request;
  if (url === '/transmitter' || url === '/viewer') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      (ws as any).path = url;
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});



wss.on('connection', (ws, request) => {
  const path = (ws as any).path;

  if (path === '/transmitter') {
    console.log('Transmissor conectado.');
    transmitterSocket = ws;

    ws.on('message', (data) => {
      

      // Transmite a todos os viewers conectados
      for (const viewer of viewers) {
        if (viewer.readyState === WebSocket.OPEN) {
          viewer.send(data);
        }
      }
    });

    ws.on('close', () => {
      console.log('Transmissor desconectado.');
      transmitterSocket = null;
    });

  } else if (path === '/viewer') {
    console.log('Viewer conectado.');
    viewers.add(ws);

    ws.on('close', () => {
      console.log('Viewer desconectado.');
      viewers.delete(ws);
    });
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Servidor HTTP escutando em http://${getLocalIP()}:${PORT}`);
});

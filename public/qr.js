let sessionKey = null;

async function generateQR() {
  const loadingBar = document.getElementById("loading-bar");
  const qrWrapper = document.getElementById("qrWrapper");
  const qrImage = document.getElementById("qrImage");
  const errorMsg = document.getElementById("errorMsg");
  const btn = document.getElementById("generateBtn");

  loadingBar.style.display = "block";
  qrWrapper.style.display = "none";
  errorMsg.style.display = "none";
  btn.disabled = true;
  sessionKey = null;

  try {
    const res = await fetch("/api/qr", { method: "POST" });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    sessionKey = data.sessionKey;
    pollQR();
  } catch (err) {
    loadingBar.style.display = "none";
    btn.disabled = false;
    errorMsg.textContent = err.message || "Could not connect to server. Try again.";
    errorMsg.style.display = "block";
  }
}

async function pollQR() {
  if (!sessionKey) return;
  try {
    const res = await fetch("/api/qr/image/" + sessionKey);
    const data = await res.json();
    if (data.error) {
      document.getElementById("loading-bar").style.display = "none";
      document.getElementById("generateBtn").disabled = false;
      const errorMsg = document.getElementById("errorMsg");
      errorMsg.textContent = data.error;
      errorMsg.style.display = "block";
      return;
    }
    if (data.qr) {
      document.getElementById("qrImage").src = data.qr;
      document.getElementById("qrWrapper").style.display = "block";
      document.getElementById("loading-bar").style.display = "none";
      pollSession();
      return;
    }
    setTimeout(pollQR, 1000);
  } catch {
    setTimeout(pollQR, 2000);
  }
}

async function pollSession() {
  if (!sessionKey) return;
  try {
    const res = await fetch("/api/qr/session/" + sessionKey);
    const data = await res.json();
    if (data.error) return;
    if (data.session) {
      showSession(data.session);
      return;
    }
    setTimeout(pollSession, 2000);
  } catch {
    setTimeout(pollSession, 2000);
  }
}

function showSession(session) {
  const qrWrapper = document.getElementById("qrWrapper");
  qrWrapper.innerHTML = `
    <div class="result-label" style="margin-bottom:10px;">Session Generated!</div>
    <div style="font-family:'JetBrains Mono',monospace;font-size:0.72rem;color:var(--primary);word-break:break-all;background:rgba(0,255,0,0.04);border:1px solid rgba(0,255,0,0.2);border-radius:8px;padding:12px;margin-bottom:12px;max-height:120px;overflow-y:auto;" id="sessionStr">${esc(session)}</div>
    <button class="btn-copy" onclick="copySession()" style="width:100%;padding:10px;background:rgba(0,255,0,0.12);color:var(--primary);border:1px solid rgba(0,255,0,0.3);border-radius:8px;font-family:'JetBrains Mono',monospace;font-size:0.8rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      Copy Session
    </button>`;
  qrWrapper.style.display = "block";
  document.getElementById("generateBtn").disabled = false;
}

function copySession() {
  const t = document.getElementById("sessionStr")?.textContent || "";
  navigator.clipboard.writeText(t).then(() => alert("Session copied!")).catch(() => {});
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

let currentCode = "";
let sessionKey = null;

async function generatePairCode() {
  const number = document.getElementById("number").value.trim().replace(/[^0-9]/g, "");
  const loadingBar = document.getElementById("loading-bar");
  const resultBox = document.getElementById("resultBox");
  const pairCode = document.getElementById("pairCode");
  const errorMsg = document.getElementById("errorMsg");
  const btn = document.getElementById("generateBtn");

  if (!number || number.length < 7) {
    errorMsg.textContent = "Please enter your WhatsApp number with country code.";
    errorMsg.style.display = "block";
    return;
  }

  loadingBar.style.display = "block";
  resultBox.style.display = "none";
  errorMsg.style.display = "none";
  btn.disabled = true;
  currentCode = "";
  sessionKey = null;

  try {
    const res = await fetch("/api/pair", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: number }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    sessionKey = data.sessionKey;
    pollCode();
  } catch (err) {
    loadingBar.style.display = "none";
    btn.disabled = false;
    errorMsg.textContent = err.message || "Could not connect to server. Try again.";
    errorMsg.style.display = "block";
  }
}

async function pollCode() {
  if (!sessionKey) return;
  try {
    const res = await fetch("/api/pair/code/" + sessionKey);
    const data = await res.json();
    if (data.error) {
      document.getElementById("loading-bar").style.display = "none";
      document.getElementById("generateBtn").disabled = false;
      const errorMsg = document.getElementById("errorMsg");
      errorMsg.textContent = data.error;
      errorMsg.style.display = "block";
      return;
    }
    if (data.code) {
      currentCode = data.code;
      const formatted = String(data.code).match(/.{1,4}/g)?.join("-") || data.code;
      document.getElementById("pairCode").textContent = formatted;
      document.getElementById("resultBox").style.display = "block";
      document.getElementById("loading-bar").style.display = "none";
      pollSession();
      return;
    }
    setTimeout(pollCode, 1000);
  } catch {
    setTimeout(pollCode, 2000);
  }
}

async function pollSession() {
  if (!sessionKey) return;
  try {
    const res = await fetch("/api/pair/session/" + sessionKey);
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
  const resultBox = document.getElementById("resultBox");
  resultBox.innerHTML = `
    <div class="result-label">Session Generated!</div>
    <div style="font-family:'JetBrains Mono',monospace;font-size:0.72rem;color:var(--primary);word-break:break-all;background:rgba(0,255,0,0.04);border:1px solid rgba(0,255,0,0.2);border-radius:8px;padding:12px;margin-bottom:12px;max-height:120px;overflow-y:auto;" id="sessionStr">${esc(session)}</div>
    <button class="btn-copy" onclick="copySession()">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      Copy Session
    </button>`;
  resultBox.style.display = "block";
  document.getElementById("generateBtn").disabled = false;
}

function copyCode() {
  if (!currentCode) return;
  navigator.clipboard.writeText(currentCode).then(() => {
    const btns = document.querySelectorAll(".btn-copy");
    btns.forEach(b => {
      const orig = b.innerHTML;
      b.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;
      setTimeout(() => { b.innerHTML = orig; }, 2000);
    });
  });
}

function copySession() {
  const t = document.getElementById("sessionStr")?.textContent || "";
  navigator.clipboard.writeText(t).then(() => alert("Session copied!")).catch(() => {});
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("number").addEventListener("keydown", (e) => {
    if (e.key === "Enter") generatePairCode();
  });
});

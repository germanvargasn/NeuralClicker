/* Neural Clicker + Presenter Notes
 * Glasses web app.
 * Sends click commands to Apps Script and polls current PowerPoint notes via JSONP.
 */

const RELAY_URL = "https://script.google.com/macros/s/AKfycbygAUPBWXLHzGrDYgAieiJo4cm1EpNrtBPXPxB-LukptS75zxz4irol-js6QGh3x5nUdw/exec";
const SHARED_SECRET = "CHANGE_THIS_TO_A_RANDOM_PASSWORD";

const COMMAND_FLASH_MS = 180;
const NOTES_POLL_MS = 900;
const SWIPE_THRESHOLD_PX = 35;

const elements = {
  up: document.getElementById("arrowUp"),
  down: document.getElementById("arrowDown"),
  left: document.getElementById("arrowLeft"),
  right: document.getElementById("arrowRight"),
  enter: document.getElementById("centerClick"),
  status: document.getElementById("statusText"),
  slideLabel: document.getElementById("slideLabel"),
  notesText: document.getElementById("notesText"),
};

let touchStartX = null;
let touchStartY = null;
let lastNotesVersion = null;
let jsonpCounter = 0;

function setStatus(text) {
  elements.status.textContent = text;
}

function flash(command) {
  const el = elements[command];
  if (!el) return;
  el.classList.add("active");
  window.setTimeout(() => el.classList.remove("active"), COMMAND_FLASH_MS);
}

function makeCommandId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function sendCommand(command) {
  flash(command);
  setStatus(`Sent: ${command.toUpperCase()}`);

  const payload = {
    secret: SHARED_SECRET,
    type: "command",
    command,
    commandId: makeCommandId(),
    sentAt: new Date().toISOString(),
  };

  try {
    fetch(RELAY_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    }).catch(() => {
      setStatus("Relay send failed");
    });
  } catch (err) {
    setStatus("Relay unavailable");
  }
}

function handleKey(event) {
  const key = event.key;
  if (key === "ArrowRight") sendCommand("right");
  else if (key === "ArrowLeft") sendCommand("left");
  else if (key === "ArrowUp") sendCommand("up");
  else if (key === "ArrowDown") sendCommand("down");
  else if (key === "Enter" || key === " ") sendCommand("enter");
}

function handlePointerDown(event) {
  touchStartX = event.clientX;
  touchStartY = event.clientY;
}

function handlePointerUp(event) {
  if (touchStartX === null || touchStartY === null) return;

  const dx = event.clientX - touchStartX;
  const dy = event.clientY - touchStartY;
  touchStartX = null;
  touchStartY = null;

  if (Math.abs(dx) < SWIPE_THRESHOLD_PX && Math.abs(dy) < SWIPE_THRESHOLD_PX) {
    sendCommand("enter");
    return;
  }

  if (Math.abs(dx) > Math.abs(dy)) {
    sendCommand(dx > 0 ? "right" : "left");
  } else {
    sendCommand(dy > 0 ? "down" : "up");
  }
}

function pollNotes() {
  const callbackName = `neuralClickerNotes_${Date.now()}_${jsonpCounter++}`;
  const script = document.createElement("script");
  const url = new URL(RELAY_URL);

  url.searchParams.set("action", "status");
  url.searchParams.set("secret", SHARED_SECRET);
  url.searchParams.set("callback", callbackName);
  url.searchParams.set("_", String(Date.now()));

  window[callbackName] = function(data) {
    try {
      updateNotes(data);
    } finally {
      delete window[callbackName];
      script.remove();
    }
  };

  script.onerror = function() {
    delete window[callbackName];
    script.remove();
    setStatus("Notes relay unavailable");
  };

  script.src = url.toString();
  document.body.appendChild(script);
}

function updateNotes(data) {
  if (!data || data.ok === false) {
    elements.slideLabel.textContent = "Waiting for PowerPoint…";
    elements.notesText.textContent = data && data.message ? data.message : "No notes available.";
    return;
  }

  if (data.version === lastNotesVersion) return;
  lastNotesVersion = data.version;

  const slideIndex = data.slideIndex || "—";
  const slideCount = data.slideCount || "—";
  const title = data.slideTitle ? ` · ${data.slideTitle}` : "";
  elements.slideLabel.textContent = `Slide ${slideIndex} / ${slideCount}${title}`;

  const notes = String(data.notes || "").trim();
  elements.notesText.textContent = notes || "No speaker notes for this slide.";
  setStatus(data.source || "Notes updated");
}

window.addEventListener("keydown", handleKey);
window.addEventListener("pointerdown", handlePointerDown);
window.addEventListener("pointerup", handlePointerUp);

setInterval(pollNotes, NOTES_POLL_MS);
pollNotes();

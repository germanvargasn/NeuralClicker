/* Neural Clicker
   Glasses web app -> Google Apps Script relay -> PC listener -> PowerPoint key press
*/

// ==============================
// Configuration
// ==============================

// Paste your deployed Google Apps Script /exec URL here.
const RELAY_ENDPOINT = "PASTE_YOUR_APPS_SCRIPT_EXEC_URL_HERE";

// Must match SECRET in neural-clicker-relay.gs and pc_listener.py.
const RELAY_SECRET = "CHANGE_THIS_TO_A_RANDOM_PASSWORD";

// Optional: useful if you deploy multiple clickers.
const DEVICE_NAME = "neural-clicker-01";

// Minimum time between commands to avoid accidental double-fire.
const COMMAND_COOLDOWN_MS = 220;

// Touch swipe threshold in pixels for desktop/mobile testing.
const SWIPE_THRESHOLD_PX = 35;

// Visual flash duration.
const FLASH_MS = 150;

// ==============================
// DOM references
// ==============================

const permissionScreen = document.getElementById("permissionScreen");
const clickerScreen = document.getElementById("clickerScreen");
const startButton = document.getElementById("startButton");
const statusText = document.getElementById("statusText");

const controls = {
  up: document.getElementById("upArrow"),
  down: document.getElementById("downArrow"),
  left: document.getElementById("leftArrow"),
  right: document.getElementById("rightArrow"),
  enter: document.getElementById("centerButton")
};

let started = false;
let lastCommandAt = 0;
let touchStartX = null;
let touchStartY = null;
let lastSentCommand = null;
let lastSentId = 0;

// ==============================
// App lifecycle
// ==============================

function startApp() {
  started = true;
  permissionScreen.classList.remove("active");
  clickerScreen.classList.add("active");
  setStatus("READY");
}

startButton.addEventListener("click", startApp);

// Pinch/Enter starts from the first screen.
document.addEventListener("keydown", (e) => {
  if (!started && (e.key === "Enter" || e.key === " ")) {
    e.preventDefault();
    startApp();
    return;
  }

  if (!started) return;

  if (e.key === "ArrowRight") {
    e.preventDefault();
    triggerCommand("right");
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    triggerCommand("left");
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    triggerCommand("up");
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    triggerCommand("down");
  } else if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    triggerCommand("enter");
  }
});

// Touch/mouse swipe fallback for browser testing.
document.addEventListener("touchstart", (e) => {
  if (!started) return;
  const t = e.changedTouches[0];
  touchStartX = t.clientX;
  touchStartY = t.clientY;
}, { passive: true });

document.addEventListener("touchend", (e) => {
  if (!started || touchStartX === null || touchStartY === null) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStartX;
  const dy = t.clientY - touchStartY;
  touchStartX = null;
  touchStartY = null;

  if (Math.abs(dx) < SWIPE_THRESHOLD_PX && Math.abs(dy) < SWIPE_THRESHOLD_PX) {
    triggerCommand("enter");
    return;
  }

  if (Math.abs(dx) > Math.abs(dy)) {
    triggerCommand(dx > 0 ? "right" : "left");
  } else {
    triggerCommand(dy > 0 ? "down" : "up");
  }
}, { passive: true });

// Pointer fallback for desktop click/tap on controls.
for (const [command, el] of Object.entries(controls)) {
  el.addEventListener("click", () => {
    if (started) triggerCommand(command);
  });
}

// ==============================
// Command handling
// ==============================

function triggerCommand(command) {
  const now = Date.now();
  if (now - lastCommandAt < COMMAND_COOLDOWN_MS) return;
  lastCommandAt = now;

  lastSentId += 1;
  const commandId = `${DEVICE_NAME}-${now}-${lastSentId}`;
  lastSentCommand = command;

  flashControl(command);
  setStatus(command.toUpperCase());
  sendCommand(command, commandId);
}

function flashControl(command, isError = false) {
  const el = controls[command];
  if (!el) return;
  el.classList.remove("flash", "error");
  void el.offsetWidth;
  el.classList.add(isError ? "error" : "flash");
  setTimeout(() => el.classList.remove("flash", "error"), FLASH_MS);
}

function setStatus(text) {
  statusText.textContent = text;
}

async function sendCommand(command, commandId) {
  if (!RELAY_ENDPOINT || RELAY_ENDPOINT.includes("PASTE_YOUR")) {
    setStatus("NO ENDPOINT");
    flashControl(command, true);
    return;
  }

  const payload = {
    secret: RELAY_SECRET,
    device: DEVICE_NAME,
    command,
    commandId,
    timestamp: new Date().toISOString()
  };

  try {
    // no-cors keeps this compatible with simple Apps Script deployments.
    // The glasses app will not be able to read the response, but the command is sent.
    await fetch(RELAY_ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    setTimeout(() => {
      if (lastSentCommand === command) setStatus("READY");
    }, 260);
  } catch (err) {
    console.error("Command send failed", err);
    setStatus("SEND ERROR");
    flashControl(command, true);
  }
}

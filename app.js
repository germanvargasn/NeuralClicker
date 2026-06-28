/* Neural Clicker + Presenter Notes
 * Glasses web app.
 * Sends slide commands to Apps Script and polls current PowerPoint notes via JSONP.
 * v5: long speaker notes are paged locally. Swipe right/left changes slides.
 * Swipe down/up moves through notes pages only.
 */

const RELAY_URL = "https://script.google.com/macros/s/AKfycbygAUPBWXLHzGrDYgAieiJo4cm1EpNrtBPXPxB-LukptS75zxz4irol-js6QGh3x5nUdw/exec";
const SHARED_SECRET = "CHANGE_THIS_TO_A_RANDOM_PASSWORD";

const COMMAND_FLASH_MS = 180;
const NOTES_POLL_MS = 900;
const SWIPE_THRESHOLD_PX = 35;

// These values are intentionally simple and easy to tune for the 600 x 600 display.
const NOTES_LINES_PER_PAGE = 8;
const NOTES_CHARS_PER_LINE = 38;

const elements = {
  up: document.getElementById("arrowUp"),
  down: document.getElementById("arrowDown"),
  left: document.getElementById("arrowLeft"),
  right: document.getElementById("arrowRight"),
  enter: document.getElementById("centerClick"),
  status: document.getElementById("statusText"),
  slideLabel: document.getElementById("slideLabel"),
  notesText: document.getElementById("notesText"),
  pageLabel: document.getElementById("pageLabel"),
};

let touchStartX = null;
let touchStartY = null;
let lastNotesVersion = null;
let jsonpCounter = 0;
let notePages = ["Start the PC listener and open a PowerPoint slideshow."];
let currentNotePage = 0;
let currentNotesSignature = "";

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

function wrapTextIntoLines(text, charsPerLine) {
  const source = String(text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const paragraphs = source.split("\n");
  const lines = [];

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) {
      if (lines.length && lines[lines.length - 1] !== "") lines.push("");
      continue;
    }

    const words = trimmed.split(/\s+/);
    let current = "";

    for (const word of words) {
      if (!current) {
        current = word;
      } else if ((current.length + 1 + word.length) <= charsPerLine) {
        current += " " + word;
      } else {
        lines.push(current);
        current = word;
      }

      // Hard-break very long tokens so they do not disappear past the edge.
      while (current.length > charsPerLine) {
        lines.push(current.slice(0, charsPerLine));
        current = current.slice(charsPerLine);
      }
    }

    if (current) lines.push(current);
  }

  return lines.length ? lines : [""];
}

function paginateNotes(text) {
  const lines = wrapTextIntoLines(text, NOTES_CHARS_PER_LINE);
  const pages = [];

  for (let i = 0; i < lines.length; i += NOTES_LINES_PER_PAGE) {
    pages.push(lines.slice(i, i + NOTES_LINES_PER_PAGE).join("\n").trim());
  }

  return pages.length ? pages : [""];
}

function renderCurrentNotesPage() {
  const pageCount = notePages.length;
  currentNotePage = Math.max(0, Math.min(currentNotePage, pageCount - 1));
  elements.notesText.textContent = notePages[currentNotePage] || "";

  if (pageCount > 1) {
    elements.pageLabel.textContent = `Page ${currentNotePage + 1}/${pageCount}`;
    elements.pageLabel.classList.remove("hidden");
  } else {
    elements.pageLabel.textContent = "";
    elements.pageLabel.classList.add("hidden");
  }
}

function nextNotesPage() {
  flash("down");
  if (notePages.length <= 1) {
    setStatus("Notes fit on one page");
    return;
  }
  if (currentNotePage < notePages.length - 1) {
    currentNotePage += 1;
    renderCurrentNotesPage();
    setStatus(`Notes page ${currentNotePage + 1}/${notePages.length}`);
  } else {
    setStatus("Last notes page");
  }
}

function previousNotesPage() {
  flash("up");
  if (notePages.length <= 1) {
    setStatus("Notes fit on one page");
    return;
  }
  if (currentNotePage > 0) {
    currentNotePage -= 1;
    renderCurrentNotesPage();
    setStatus(`Notes page ${currentNotePage + 1}/${notePages.length}`);
  } else {
    setStatus("First notes page");
  }
}

function handleKey(event) {
  const key = event.key;
  if (key === "ArrowRight") sendCommand("right");
  else if (key === "ArrowLeft") sendCommand("left");
  else if (key === "ArrowUp") previousNotesPage();
  else if (key === "ArrowDown") nextNotesPage();
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
    if (dy > 0) nextNotesPage();
    else previousNotesPage();
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
    setNotesContent(data && data.message ? data.message : "No notes available.", "error");
    return;
  }

  if (data.version === lastNotesVersion) return;
  lastNotesVersion = data.version;

  const slideIndex = data.slideIndex || "—";
  const slideCount = data.slideCount || "—";
  const title = data.slideTitle ? ` · ${data.slideTitle}` : "";

  if (Number(data.slideIndex || 0) > 0 && Number(data.slideCount || 0) > 0) {
    elements.slideLabel.textContent = `Slide ${slideIndex} / ${slideCount}${title}`;
  } else {
    elements.slideLabel.textContent = data.source || "Waiting for PowerPoint…";
  }

  const notes = String(data.notes || "").trim() || "No speaker notes for this slide.";
  setNotesContent(notes, `${data.slideIndex || 0}|${data.slideCount || 0}|${notes}`);
  setStatus(data.source || "Notes updated");
}

function setNotesContent(notes, signature) {
  if (signature !== currentNotesSignature) {
    currentNotePage = 0;
    currentNotesSignature = signature;
  }
  notePages = paginateNotes(notes);
  renderCurrentNotesPage();
}

window.addEventListener("keydown", handleKey);
window.addEventListener("pointerdown", handlePointerDown);
window.addEventListener("pointerup", handlePointerUp);

setInterval(pollNotes, NOTES_POLL_MS);
pollNotes();

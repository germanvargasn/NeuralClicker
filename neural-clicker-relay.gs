/* Neural Clicker Google Apps Script Relay

   Deploy as Web App:
   - Execute as: Me
   - Who has access: Anyone

   The glasses web app POSTs commands here.
   The PC listener polls this script using GET.
*/

const SECRET = "CHANGE_THIS_TO_A_RANDOM_PASSWORD";
const PROPERTY_PREFIX = "NEURAL_CLICKER_";
const MAX_COMMAND_AGE_MS = 30000;

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");

    if (body.secret !== SECRET) {
      return jsonResponse({ ok: false, error: "Unauthorized" });
    }

    const command = sanitizeCommand(body.command);
    if (!command) {
      return jsonResponse({ ok: false, error: "Invalid command" });
    }

    const now = new Date();
    const commandRecord = {
      ok: true,
      command,
      commandId: sanitizeText(body.commandId || Utilities.getUuid()),
      device: sanitizeText(body.device || "unknown"),
      receivedAt: now.toISOString(),
      receivedAtMs: now.getTime()
    };

    const props = PropertiesService.getScriptProperties();
    props.setProperty(PROPERTY_PREFIX + "LATEST_COMMAND", JSON.stringify(commandRecord));

    return jsonResponse(commandRecord);
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function doGet(e) {
  try {
    const secret = e && e.parameter ? e.parameter.secret : "";

    if (secret !== SECRET) {
      return jsonResponse({ ok: false, error: "Unauthorized" });
    }

    const props = PropertiesService.getScriptProperties();
    const raw = props.getProperty(PROPERTY_PREFIX + "LATEST_COMMAND");

    if (!raw) {
      return jsonResponse({ ok: true, hasCommand: false });
    }

    const record = JSON.parse(raw);
    const ageMs = Date.now() - Number(record.receivedAtMs || 0);

    if (ageMs > MAX_COMMAND_AGE_MS) {
      return jsonResponse({ ok: true, hasCommand: false, stale: true });
    }

    return jsonResponse({
      ok: true,
      hasCommand: true,
      command: record.command,
      commandId: record.commandId,
      device: record.device,
      receivedAt: record.receivedAt,
      ageMs
    });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function testRelay() {
  const props = PropertiesService.getScriptProperties();
  props.setProperty(PROPERTY_PREFIX + "LATEST_COMMAND", JSON.stringify({
    ok: true,
    command: "right",
    commandId: "test-" + Date.now(),
    device: "test",
    receivedAt: new Date().toISOString(),
    receivedAtMs: Date.now()
  }));
  Logger.log("Test command queued: right");
}

function sanitizeCommand(value) {
  const command = String(value || "").toLowerCase().trim();
  const allowed = ["left", "right", "up", "down", "enter"];
  return allowed.includes(command) ? command : "";
}

function sanitizeText(value) {
  return String(value || "").replace(/[^a-zA-Z0-9_.:-]/g, "").slice(0, 120);
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

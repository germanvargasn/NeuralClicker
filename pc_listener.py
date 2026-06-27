"""Neural Clicker PC Listener

Polls the Google Apps Script relay for commands and converts them into local
keyboard presses. Keep this running on the presentation computer.

Requirements:
    pip install requests pyautogui

Run:
    python pc_listener.py
"""

import json
import sys
import time
from dataclasses import dataclass

import requests
import pyautogui

# ==============================
# Configuration
# ==============================

RELAY_URL = "https://script.google.com/macros/s/AKfycbygAUPBWXLHzGrDYgAieiJo4cm1EpNrtBPXPxB-LukptS75zxz4irol-js6QGh3x5nUdw/exec"
SECRET = "CHANGE_THIS_TO_A_RANDOM_PASSWORD"
POLL_SECONDS = 0.20
REQUEST_TIMEOUT_SECONDS = 5

# PowerPoint usually responds to arrow keys in slide-show mode.
KEY_MAP = {
    "left": "left",
    "right": "right",
    "up": "up",
    "down": "down",
    "enter": "enter",
}

# Prevent pyautogui from moving too slowly.
pyautogui.PAUSE = 0


@dataclass
class ListenerState:
    last_command_id: str | None = None
    consecutive_errors: int = 0


def poll_relay() -> dict | None:
    if "PASTE_YOUR" in RELAY_URL:
        raise RuntimeError("Set RELAY_URL in pc_listener.py first.")

    response = requests.get(
        RELAY_URL,
        params={"secret": SECRET, "t": int(time.time() * 1000)},
        timeout=REQUEST_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    return response.json()


def send_key(command: str) -> None:
    key = KEY_MAP.get(command)
    if not key:
        return
    pyautogui.press(key)


def main() -> int:
    print("Neural Clicker PC Listener")
    print("--------------------------")
    print("Keep PowerPoint slide show focused.")
    print("Press Ctrl+C to stop.\n")

    state = ListenerState()

    while True:
        try:
            data = poll_relay()
            state.consecutive_errors = 0

            if not data or not data.get("ok"):
                print("Relay error:", data)
                time.sleep(POLL_SECONDS)
                continue

            if not data.get("hasCommand"):
                time.sleep(POLL_SECONDS)
                continue

            command_id = data.get("commandId")
            command = data.get("command")

            if command_id and command_id != state.last_command_id:
                state.last_command_id = command_id
                print(f"{time.strftime('%H:%M:%S')} -> {command}")
                send_key(command)

            time.sleep(POLL_SECONDS)

        except KeyboardInterrupt:
            print("\nStopped.")
            return 0
        except Exception as exc:
            state.consecutive_errors += 1
            wait = min(2.0, POLL_SECONDS * state.consecutive_errors)
            print(f"Listener error: {exc} | retrying in {wait:.1f}s")
            time.sleep(wait)


if __name__ == "__main__":
    sys.exit(main())

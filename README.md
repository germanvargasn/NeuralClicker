# Neural Clicker

Neural Clicker is a prototype wearable presentation controller for Meta Ray-Ban Display-style web apps.

Flow:

```text
Glasses web app
   -> Google Apps Script relay
      -> PC listener
         -> simulated keyboard press
            -> PowerPoint advances slides
```

## Files

```text
index.html                  Glasses web app
styles.css                  Glasses UI styling
app.js                      Glasses command sender
neural-clicker-relay.gs     Google Apps Script relay
pc_listener.py              PC listener that simulates keyboard presses
requirements.txt            Python dependencies
build_windows.bat           Windows executable build helper
manifest.json               Web app metadata
```

## Step 1: Create the Google Apps Script relay

1. Go to `https://script.google.com`.
2. Create a new project called `Neural Clicker Relay`.
3. Paste the contents of `neural-clicker-relay.gs`.
4. Change:

```javascript
const SECRET = "CHANGE_THIS_TO_A_RANDOM_PASSWORD";
```

Use the same value later in `app.js` and `pc_listener.py`.

5. Deploy as a Web App:
   - Execute as: `Me`
   - Who has access: `Anyone`
6. Copy the Web App URL ending in `/exec`.

## Step 2: Configure the glasses web app

In `app.js`, set:

```javascript
const RELAY_ENDPOINT = "https://script.google.com/macros/s/AKfycbygAUPBWXLHzGrDYgAieiJo4cm1EpNrtBPXPxB-LukptS75zxz4irol-js6QGh3x5nUdw/exec";
const RELAY_SECRET = "YOUR_SECRET";
```

Then upload `index.html`, `styles.css`, `app.js`, and `manifest.json` to your hosting/GitHub Pages.

## Step 3: Configure the PC listener

On the presentation PC, install Python.

Then edit `pc_listener.py`:

```python
RELAY_URL = "https://script.google.com/macros/s/AKfycbygAUPBWXLHzGrDYgAieiJo4cm1EpNrtBPXPxB-LukptS75zxz4irol-js6QGh3x5nUdw/exec"
SECRET = "YOUR_SECRET"
```

Install dependencies:

```bash
pip install requests pyautogui
```

Run:

```bash
python pc_listener.py
```

Open PowerPoint in slide-show mode and keep it focused.

## Step 4: Optional Windows executable

From the project folder:

```bat
build_windows.bat
```

The executable will appear in:

```text
dist\NeuralClickerListener.exe
```

## Controls

Glasses:

```text
Swipe right  -> right arrow
Swipe left   -> left arrow
Swipe up     -> up arrow
Swipe down   -> down arrow
Pinch        -> Enter
```

Desktop test mode:

```text
Keyboard arrow keys -> arrow commands
Enter / Space       -> Enter command
```

## Latency note

This polling-based prototype checks for commands every 0.2 seconds. For presentations this should feel acceptable, but it is not intended for games or low-latency applications.

## Security note

The shared secret is a lightweight barrier, not full authentication. For a polished product, use a proper backend relay with authenticated sessions.

## Windows build note

The build script now uses:

```bat
python -m PyInstaller --onefile --name NeuralClickerListener pc_listener.py
```

This avoids the common Windows issue where `pyinstaller` is installed but is not available on the PATH.

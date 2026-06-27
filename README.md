# Neural Clicker v4 — Clicker + Presenter Notes

Neural Clicker is a Meta Ray-Ban Display web app that sends presentation commands to a Windows PC and displays private PowerPoint speaker notes on the glasses.

## Flow

```text
Glasses web app
  → Google Apps Script relay
  → Windows Python listener
  → PowerPoint key press + speaker notes extraction
  → relay
  → glasses notes display
```

## Files

```text
index.html
styles.css
app.js
manifest.json
neural-clicker-relay.gs
pc_listener.py
requirements.txt
build_windows.bat
run_listener.bat
README.md
```

## Glasses controls

```text
Swipe right  → right arrow
Swipe left   → left arrow
Swipe up     → up arrow
Swipe down   → down arrow
Pinch / tap  → enter
```

The same commands can be tested on desktop with the keyboard arrows and Enter.

## Step 1 — Google Apps Script relay

1. Go to https://script.google.com
2. Create a new Apps Script project.
3. Paste the contents of `neural-clicker-relay.gs`.
4. Save.
5. Deploy → New deployment → Web app.
6. Use:
   - Execute as: Me
   - Who has access: Anyone
7. Deploy and copy the `/exec` URL.

This package is already configured to use:

```text
https://script.google.com/macros/s/AKfycbygAUPBWXLHzGrDYgAieiJo4cm1EpNrtBPXPxB-LukptS75zxz4irol-js6QGh3x5nUdw/exec
```

and the shared secret:

```text
CHANGE_THIS_TO_A_RANDOM_PASSWORD
```

If you change either one, update both `app.js` and `pc_listener.py`.

## Step 2 — Host the glasses app

Upload these files to GitHub Pages or another HTTPS host:

```text
index.html
styles.css
app.js
manifest.json
```

Connect the resulting URL as a Meta Ray-Ban Display web app.

## Step 3 — Run the Windows listener

For quick testing, run:

```text
run_listener.bat
```

For an executable, run:

```text
build_windows.bat
```

The executable will be created at:

```text
dist\NeuralClickerListener.exe
```

## PowerPoint setup

No special PowerPoint plugin is needed.

Use Windows desktop PowerPoint:

1. Open your presentation in PowerPoint.
2. Start slideshow mode.
3. Run `pc_listener.py` or `NeuralClickerListener.exe`.
4. Open Neural Clicker on the glasses.

The listener reads the active slideshow through Windows COM automation and publishes the current slide speaker notes to the glasses.

## Notes sync behavior

The listener does not merely count clicks. It repeatedly checks PowerPoint for the currently displayed slide. This helps preserve sync if you:

- start on a later slide,
- jump to another slide,
- use the keyboard/mouse,
- or navigate with the glasses.

## Troubleshooting

### Commands work but notes do not appear

Make sure:

- Desktop PowerPoint is running.
- Slideshow mode is active.
- The listener is running on the same Windows user session.
- `pywin32` installed successfully.

### Listener cannot read PowerPoint

Try running:

```text
python pc_listener.py
```

instead of the compiled EXE first. The console output will show whether PowerPoint is visible.

### Glasses show old notes

Reload the web app and restart the listener. Apps Script stores the latest notes state until a new one is published.

## Security note

This is a prototype relay. The shared secret is embedded in the web app and is not strong security. For production, use a real backend with authenticated users and short-lived tokens.

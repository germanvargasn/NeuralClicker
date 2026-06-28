# Neural Clicker v5

Neural Clicker is a Meta Ray-Ban Display web app plus Windows PowerPoint listener.
It lets the presenter advance/reverse slides from the glasses and privately view
speaker notes from the currently active PowerPoint slideshow.

## v5 changes

- Long speaker notes are now split into pages on the glasses.
- Notes display shows `Page 1/3` when multiple pages are available.
- Swipe down moves to the next notes page.
- Swipe up moves to the previous notes page.
- Swipe right moves to the next slide.
- Swipe left moves to the previous slide.
- Pinch/Enter still sends an Enter key press.
- PowerPoint's final black end-of-show screen is treated as a normal presentation state instead of an error.

## Files

- `index.html`, `styles.css`, `app.js` — glasses web app.
- `neural-clicker-relay.gs` — Google Apps Script relay.
- `pc_listener.py` — Windows PowerPoint listener.
- `requirements.txt` — Python dependencies.
- `build_windows.bat` — builds the listener executable using `python -m PyInstaller`.
- `run_listener.bat` — runs the listener from Python.

## Setup

1. Replace your Apps Script code with `neural-clicker-relay.gs`.
2. Deploy Apps Script as a new web app version.
3. Upload the web app files to GitHub Pages.
4. On the Windows presentation PC, install Python and run:

```bat
build_windows.bat
```

or run directly:

```bat
run_listener.bat
```

5. Open PowerPoint and start slideshow mode.
6. Open the glasses web app.

The listener uses Windows COM automation, so this is intended for Windows desktop PowerPoint.

# Life Reset — Smart Neon Dashboard

A responsive personal productivity dashboard with a neon purple/blue interface and aqua accent option.

## Features
- Daily tasks with **search**, All/Active/Done filters, priority labels, and priority-first sorting
- Focus timer with 5, 15, and 25-minute presets
- Daily habit tracker and completion progress
- Weekly progress chart and 7-day habit consistency map
- Browser-local saving for tasks, habits, theme, focus time, and recent progress
- Responsive desktop and mobile layout

## Run locally
Open `index.html` in a modern browser. No build step or dependencies are required.

## Publish with GitHub Pages
1. Upload `index.html`, `style.css`, `script.js`, and `README.md` to the repository root.
2. Open **Settings → Pages**.
3. Select **Deploy from a branch**, choose `main` and `/(root)`, then save.

## Data note
Progress is stored in the current browser using `localStorage`; it does not automatically sync between devices. Clearing browser data can remove saved progress.


## New practical upgrades
- Edit an existing task without deleting and recreating it.
- Export your Life Reset data to a JSON backup file.
- Import a previously exported backup on the same or another browser/device. Importing replaces current data after confirmation.
- Data remains browser-local unless you export and move the backup yourself; there is no account-based cloud sync.

## Daily quote behavior
- The dashboard tries to load the daily quote from ZenQuotes and caches the result for the current local date.
- The ZenQuotes attribution link is shown only when a quote was actually loaded from that service.
- If the request fails (for example, offline or blocked by browser cross-origin rules), a stable date-based fallback quote is shown without misleading attribution.
- The online quote request has a 4.5-second timeout so the fallback remains usable if the service does not respond.

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

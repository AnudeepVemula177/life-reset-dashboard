# Life Reset — Personal Command Center

A responsive, neon-inspired productivity dashboard built with vanilla HTML, CSS, and JavaScript.

## Features
- Futuristic purple/blue UI with an aqua accent theme toggle
- Daily task manager with All / Active / Completed filters
- Focus timer with 5, 15, and 25-minute presets
- Daily habit tracker and progress summary
- Weekly progress chart and 7-day habit consistency map
- Local browser persistence for tasks, habits, focus time, theme, and daily history
- Responsive desktop and mobile layouts

## Run locally
Open `index.html` in a modern browser. No build step or dependencies are required.

## Publish with GitHub Pages
1. Upload `index.html`, `style.css`, and `script.js` to the root of a GitHub repository.
2. Open **Settings → Pages**.
3. Choose **Deploy from a branch**, select `main` and `/(root)`, then save.

## Data and privacy
Progress is saved in the current browser using `localStorage`. It is not synced between devices or browsers, and clearing browser site data can erase it. Weekly insights build up as you use the dashboard; older days from before this feature was added may show as empty.

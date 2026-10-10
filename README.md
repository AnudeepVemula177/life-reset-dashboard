# Life Reset — Music Favorites Upgrade

This package preserves the existing dashboard and neon styling while adding:
- Save up to 30 YouTube video/playlist links as favorites in this browser.
- Reopen a saved favorite in the embedded player.
- Remove saved favorites.
- A floating “Jump to player” quick-return control after loading a YouTube link.

Favorites use localStorage on the current browser/device; they are not synced between devices. YouTube playback remains user-initiated and depends on whether a video allows embedding. If a video blocks embedding, use the existing Open on YouTube link.

## Apply
Replace `index.html`, `style.css`, and `script.js` in the repository root, commit, then test the live GitHub Pages site. Keep a backup of your existing files first.


### Music favorites modal upgrade
- Saving a YouTube link now opens a custom neon-styled in-page dialog instead of the browser prompt.
- Supports Save, Cancel, close button, backdrop click, Escape key, and focus return.
- Existing browser-local favorite storage, Play, and Remove actions are retained.

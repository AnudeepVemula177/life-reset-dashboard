# Life Reset — functional audit follow-up

## Changes in this package
- Added a mobile-only `Reset` action in the header. It forwards to the existing reset handler so the confirmation prompt and original reset behavior stay in one place.
- Added a visible neon-cyan focus indicator to the YouTube search field and URL input for keyboard navigation.
- Kept the existing neon design, dashboard sections, and soundscape/player functionality.

## Checks performed
- `node --check script.js` passed.
- Static source inspection confirms the mobile button is hidden by default and shown at the existing mobile breakpoint (680px).

## Not verified
- Full interactive browser/device testing was not performed in this environment.
- YouTube playback and GitHub Pages deployment must be tested after uploading/committing the files.

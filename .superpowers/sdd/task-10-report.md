## Task 10: Add Material Symbols Font

### What I implemented

Added the Material Symbols Outlined font from Google Fonts to `index.html`:
- `<link>` tag for the Material Symbols font with full variable font axis support (opsz, wght, FILL, GRAD)
- Global `.material-symbols-outlined` CSS class with default font-variation-settings

### Files changed

- `HelperDesktop.io/index.html` — added font link and global CSS style block

### Test results

This task is a pure HTML/CSS addition with no testable logic. No tests were required.

### Self-review

- All three steps from the task brief implemented exactly as specified
- The font link and CSS match the provided snippets verbatim
- The link is placed after the existing Inter font link, maintaining logical grouping
- The preconnect hints already existed for `fonts.googleapis.com` and `fonts.gstatic.com`, so no duplicate preconnects were added

### Commit

- `723e8f7` — `feat: add Material Symbols font`

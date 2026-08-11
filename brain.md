# Testing-URL — Project Brain

## Project Goal
Build a browser-based device information and privacy testing tool that shows what information a website can obtain from the user's browser/device.

## Core Principles
- User-visible testing only.
- No hidden tracking.
- No credential/password collection.
- No access to personal files without explicit browser permission.
- Clearly distinguish between available, unavailable, and permission-restricted data.
- Prefer browser-native APIs and standard JavaScript.

## Planned Information Categories
- Browser and browser version
- Operating system/platform
- Device type
- Screen and viewport information
- Device pixel ratio
- Language and locale
- Timezone
- CPU logical cores
- Approximate device memory where supported
- Network information where supported
- Battery information where supported
- WebGL/GPU-related information where available
- Browser capabilities
- Privacy/fingerprinting-related signals

## Current Architecture
Not implemented yet.

Planned:
- `index.html` — application structure
- `style.css` — UI/styling
- `script.js` — browser/device information collection
- `brain.md` — persistent project context
- `README.md` — project documentation

## Changes
### 2026-08-11
- Initialized the project brain/documentation file.
- Confirmed GitHub repository and local Git working tree.
- Established `brain.md` as the required context document for future development.

## Problems
### 2026-08-11
- No implementation problems yet.

## Solutions
### 2026-08-11
- Repository is connected through GitHub/VS Code.
- Project documentation will be maintained in `brain.md`.

## Technical Decisions
- Primary language: JavaScript.
- Frontend: HTML + CSS + JavaScript.
- Backend is optional and will only be introduced if a legitimate feature requires it.
- Device information should be displayed transparently to the user.
- Browser limitations and unavailable APIs must be handled gracefully.

## Pending Tasks
- Create initial HTML structure.
- Create UI.
- Implement browser/device information detection.
- Handle unsupported APIs.
- Add privacy explanation.
- Test across desktop and mobile browsers.
- Create README.
- Commit initial implementation.

## Commit History
- Initial project context setup — 2026-08-11

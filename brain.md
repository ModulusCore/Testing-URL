# Testing-URL � Project Brain

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
- `index.html` � application structure
- `style.css` � UI/styling
- `script.js` � browser/device information collection
- `brain.md` � persistent project context
- `README.md` � project documentation

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
- Initial project context setup � 2026-08-11

## Test Results — Initial Prototype
### 2026-08-11

The initial prototype was tested inside the VS Code integrated browser environment.

### Working Features
- Platform detection
- Device memory detection
- Logical CPU core detection
- Browser detection
- User-Agent detection
- Language and timezone detection
- Screen and viewport detection
- Device pixel ratio
- Color/pixel depth
- Network Information API where supported
- Battery Status API where supported
- WebGL detection
- Geolocation API availability
- Camera/microphone API availability
- Clipboard API availability

### Problems Found
1. Device detection incorrectly classified the desktop environment as a tablet because it relied on viewport width.
2. The User-Agent showed `Code/... Electron/...`, confirming that the test was running inside VS Code's Electron environment.
3. Timezone was reported as `Asia/Calcutta`, which should be normalized to `Asia/Kolkata` for display.
4. Network values such as `3g`, `0.45 Mbps`, and `500 ms` are browser-provided estimates rather than actual measured network performance.
5. Permission/API availability was mixed with general browser information and needs a dedicated section.
6. The raw User-Agent is difficult to read and should be presented separately from the interpreted browser information.

### Planned Solutions
1. Replace viewport-only device detection with User-Agent/platform-based detection and use viewport dimensions only as a secondary signal.
2. Detect Chromium/Electron environments separately from regular Chrome.
3. Normalize known timezone aliases for user-facing display.
4. Label Network Information API values as browser-reported estimates.
5. Add a dedicated Permissions section.
6. Add a Browser Environment section and keep raw User-Agent as an expandable/raw value.
7. Add a fingerprint-signal section with clear privacy explanations.
8. Add a manual Rescan action.

## Phase 1.2 — Server-side IP Detection
### 2026-08-11

### Implementation
- Added a Node.js HTTP server.
- Moved frontend files into the `public/` directory.
- Added `/api/ip` endpoint for server-side client IP detection.
- IP information is returned to the browser without persistent storage.
- Added localhost detection for development environments.
- Localhost addresses such as `::1` and `127.0.0.1` are not presented as public IP addresses.
- Added `Cache-Control: no-store` to the IP endpoint response.

### Security Decisions
- The server does not intentionally store IP addresses.
- `X-Forwarded-For` is not blindly trusted.
- Direct socket address is used during the current development setup.
- Production reverse-proxy configuration will require explicit trusted-proxy handling.
- Path traversal protection was added to static file serving.

### Test Result
- Local Node.js server starts successfully.
- `/api/ip` responds successfully.
- Localhost requests are correctly identified.
- Public IP is not falsely displayed during local testing.
- Frontend successfully communicates with the backend.

### Known Limitation
- A local development server cannot determine the user's public Internet IP from the localhost socket.
- Public IP detection must be tested after deploying the application to an Internet-accessible server.

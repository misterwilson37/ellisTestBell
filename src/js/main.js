// Ellis Web Bell 6.0.0 — module entry point.
// index.html loads THIS file (<script type="module" src="src/js/main.js">).
// Import order preserves the pre-7.0 concatenation order of script.js;
// modules also import each other directly, so evaluation order is the
// dependency-correct refinement of this list. script.js no longer exists.
import './state.js';
import './00-header.js';
import './01-firebase-imports.js';
import './02-dom-elements.js';
import './03-memory-management.js';
import './04-app-state-and-bells.js';
import './05-preferences-cloud-sync.js';
import './06-warning-effects.js';
import './07-kiosk-mode.js';
import './08-theme-and-display.js';
import './09-picture-in-picture.js';
import './10-clock-engine.js';
import './11-quick-bell-broadcast.js';
import './12-quick-bell-queue.js';
import './13-schedule-resolution-and-ringing.js';
import './14-render-schedule-list.js';
import './15-firebase-init.js';
import './16-schedule-management.js';
import './17-share-codes.js';
import './18-bell-crud-and-modals.js';
import './19-visual-cues-and-files.js';
import './20-schedule-calendar.js';
import './21-emergency-shift.js';
import './22-audit-log.js';
import './23-clock-drift.js';
import './24-notifications.js';
import './25-status-view.js';
import './26-modal-chrome.js'; // 6.2.0: expand shared modal chrome BEFORE init wiring
import './27-school-branding.js'; // 6.3.0: apply school-config.js branding
import './28-presence.js'; // 6.4.0: presence heartbeat (design Layer 1)
import './29-admin-dashboard.js'; // 6.4.0: Who's Online admin panel
import './99-init-and-listeners.js';

// boot.js — post-bootstrap hooks that don't belong in app.js (avoid file edits)
// - Initializes SVG icon enhancer
// - Hooks celebration effects to badge events via app's event bus

import { initIcons } from './core/icons.js';
import { initCelebrations } from './core/celebrate.js';
import { on } from './app.js';

// Run after modules are parsed
initIcons();
initCelebrations(on);

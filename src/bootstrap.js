// Import side-effect: registers all built-in spaces with the registry.
// Every v3 entry point (tests, src/swatch.js later) should import this
// once so every `convert()` and `Swatch#to(id)` finds its targets.

import "./spaces/xyz.js";
import "./spaces/srgb.js";
import "./spaces/lab.js";
import "./spaces/lch.js";
import "./spaces/oklab.js";
import "./spaces/oklch.js";
import "./spaces/hsl.js";

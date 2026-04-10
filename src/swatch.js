// swatch — main entry point.
//
// Importing this module has two effects:
//
//   1. Side effects from `./bootstrap.js`: every registered color space
//      is loaded, the CSS Color 4 parser is attached, and the operations
//      (channels, gamut, manipulation, tint/shade, mix, blend, ΔE,
//      naming, temperature, accessibility, APCA, CVD, scales, palettes)
//      are wired onto the Swatch prototype and the factory.
//
//   2. Re-exports: the `swatch` factory function (callable, with statics
//      for temperature, random, scale, bezier, cubehelix, palettes,
//      contrast, isReadable, ensureContrast, apcaContrast, simulate,
//      daltonize, checkPalette, nearestDistinguishable, mostReadable),
//      the `Swatch` class, and the default export.
//
// Typical usage:
//
//   import swatch from "swatch";
//   swatch("oklch(0.7 0.15 240)").lighten(0.05).toString({ format: "hex" });

import "./bootstrap.js";
import { swatch, Swatch } from "./core/swatch-class.js";

export { swatch, Swatch };
export default swatch;

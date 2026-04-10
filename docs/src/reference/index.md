---
title: Overview
order: 1
eyebrow: "Reference · §01"
---

**Swatch** is a zero-dependency color library with first-class colorblind
support, CSS Color 4 parsing, wide-gamut spaces, OKLCh manipulation, color
scales, built-in palettes, blend modes, WCAG 2.1 and APCA contrast.

> **3.0** is a breaking rewrite. Storage moved to a canonical `{ space, coords,
> alpha }` state, conversions route through a lazy CIE XYZ D65 hub, and the
> monolith has been split into focused modules. See
> [MIGRATING.md](https://github.com/luntta/swatch/blob/master/MIGRATING.md) for
> the v2 → v3 cookbook.

## Install

```bash
npm install swatch
```

```js
import swatch from "swatch";
```

## A 30-second tour

```js
const c = swatch("#3366cc");

c.srgb;                                 // { r: 0.2, g: 0.4, b: 0.8 }
c.oklch;                                // { l, c, h }
c.simulate("deutan");                   // a new swatch, deuteranope view
c.daltonize("deutan");                  // pre-corrected for deuteranopes
c.contrast("#fff");                     // 4.78
c.deltaE("#3366cd");                    // 0.18 (CIEDE2000)
c.lighten(0.1).spin(45).toString({ format: "hex" });

swatch("oklch(0.7 0.15 240)");         // CSS Color 4
swatch("color(display-p3 1 0 0)");     // wide-gamut
swatch.scale(["#00f", "#f00"]).colors(5);
```

Every instance is **immutable** — every transformation returns a new `swatch`.

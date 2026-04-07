---
title: Overview
order: 1
eyebrow: "Reference · §01"
---

**Swatch** is a multi-purpose color library with first-class color blindness
support: physically correct Brettel/Viénot simulation, a severity continuum,
Fidaner daltonization, and palette distinguishability checks. It also covers
the everyday work of color: parsing, perceptual spaces (OKLab, CIE Lab, LCh),
ΔE, manipulation, harmonies, WCAG 2.1 and APCA contrast.

> **2.0** is a breaking rewrite. The old `toColorBlindRGB()` and `deficiency()`
> methods are gone — use [`simulate()`](/reference/simulation/) and
> [`daltonize()`](/reference/daltonization/) instead.

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

c.hex;                              // "#3366cc"
c.rgb;                              // { r: 51, g: 102, b: 204 }
c.simulate("deutan");               // a new swatch, deuteranope view
c.daltonize("deutan");              // pre-corrected for deuteranopes
c.contrast("#fff");                 // 4.78
c.toOklch();                        // { l, c, h }
c.deltaE("#3366cd");                // 0.18 (CIEDE2000)
c.lighten(20).spin(45).toRgbString();
```

Every instance is **immutable** — every transformation returns a new
`swatch`.

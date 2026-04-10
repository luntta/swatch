---
title: Harmonies
order: 9
eyebrow: "Reference · §09"
---

The v2 harmony methods (`.complementary()`, `.triad()`, etc.) are not in v3.0.
They will return in a follow-up release. In the meantime, use `spin()` and
`set()` to build any harmony:

```js
const c = swatch("#ff0000");

// Complementary — [self, +180°]
[c, c.spin(180)];

// Triad — 0°, 120°, 240°
[c, c.spin(120), c.spin(240)];

// Tetrad — 0°, 90°, 180°, 270°
[c, c.spin(90), c.spin(180), c.spin(270)];

// Split-complement — 0°, 150°, 210°
[c, c.spin(150), c.spin(210)];

// Analogous — 6 colors over a 150° arc
Array.from({ length: 6 }, (_, i) => c.spin(-75 + i * 30));

// Monochromatic — 6 lightness steps holding hue and chroma
Array.from({ length: 6 }, (_, i) => {
  const step = i / 5;
  return c.set("oklch.l", 0.15 + step * 0.7);
});
```

The §08 playground panel wires all six of these patterns into a tabbed UI.

Pair harmonies with [`mostReadable`](/reference/wcag/) to pick a foreground
from the resulting palette without leaving the library.

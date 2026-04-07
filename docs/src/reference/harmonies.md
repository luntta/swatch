---
title: Harmonies
order: 9
eyebrow: "Reference · §09"
---

Each harmony returns an array of new `swatch` instances with the full API.

```js
const c = swatch("#ff0000");

c.complementary();    // [self, +180°]
c.triad();            // 0°, 120°, 240°
c.tetrad();           // 0°, 90°, 180°, 270°
c.splitComplement();  // 0°, 150°, 210°
c.analogous(6, 30);   // 6 colors evenly spaced over 30°
c.monochromatic(5);   // 5 same-hue colors varying lightness
```

Pair this with [`mostReadable`](/reference/wcag/) to pick a foreground from
the resulting palette without leaving the library.

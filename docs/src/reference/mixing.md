---
title: Mixing
order: 8
eyebrow: "Reference · §08"
---

```js
a.mix(b);                  // perceptual midpoint in OKLab (default)
a.mix(b, 0.25);            // weighted 25% toward b
a.mix(b, 0.5, "lab");      // CIE Lab interpolation
a.mix(b, 0.5, "linear");   // linear sRGB (physically-accurate blend)
a.mix(b, 0.5, "rgb");      // naive gamma-space blend
a.mix(b, 0.5, "hsl");      // HSL, shortest-arc hue
```

Alpha is interpolated linearly regardless of space.

## Picking a space

| Space    | When to reach for it |
|----------|----------------------|
| `oklab`  | Default. Best perceptual midpoint. |
| `lab`    | When you specifically need CIE Lab. |
| `linear` | Physically-accurate light blending (e.g. anti-aliasing). |
| `rgb`    | Naïve gamma-space blend; use only when matching legacy tools. |
| `hsl`    | When the hue arc matters (e.g. spinning between named hues). |

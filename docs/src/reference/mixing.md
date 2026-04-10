---
title: Mixing & blending
order: 8
eyebrow: "Reference · §08"
---

## Mix

```js
a.mix(b);                                // midpoint in OKLab (default)
a.mix(b, 0.25);                          // 25% toward b
a.mix(b, 0.5, { space: "lab" });         // CIE Lab interpolation
a.mix(b, 0.5, { space: "oklch" });       // OKLCh, shortest-arc hue
a.mix(b, 0.5, { space: "srgb" });        // gamma-space sRGB
a.mix(b, 0.5, { space: "srgb-linear" }); // linear-light blend
a.mix(b, 0.5, { space: "hsl" });         // HSL, shortest-arc hue
```

Alpha is interpolated linearly regardless of space.

### Picking a space

| Space | When to reach for it |
|---|---|
| `oklab` | Default. Best perceptual midpoint. |
| `oklch` | When preserving chroma and cycling hue matters. |
| `lab` | When you specifically need CIE Lab blending. |
| `srgb-linear` | Physically accurate light mixing (anti-aliasing). |
| `srgb` | Naïve gamma-space blend; matches legacy tools. |
| `hsl` | When the hue arc matters (spinning between named hues). |

## Blend modes

W3C Compositing and Blending Level 1, applied per-channel in linear sRGB:

```js
a.blend(b, "multiply");
a.blend(b, "screen");
a.blend(b, "overlay");
a.blend(b, "darken");
a.blend(b, "lighten");
a.blend(b, "color-dodge");
a.blend(b, "color-burn");
a.blend(b, "hard-light");
a.blend(b, "soft-light");
a.blend(b, "difference");
a.blend(b, "exclusion");
a.blend(b, "normal");
```

See the §07 playground panel for live preview.

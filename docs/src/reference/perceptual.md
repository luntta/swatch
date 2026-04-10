---
title: Perceptual spaces & ΔE
order: 6
eyebrow: "Reference · §06"
---

Space conversions are lazy memoized getters, each returning a named-channel
object. Conversions route through a CIE XYZ D65 hub.

```js
const c = swatch("#3366cc");

c.srgb;          // { r, g, b }        0–1 linear-decoded sRGB
c.linearSrgb;    // { r, g, b }        scene-linear sRGB
c.hsl;           // { h, s, l }        CSS convention
c.hsv;           // { h, s, v }
c.hwb;           // { h, w, b }
c.lab;           // { l, a, b }        CIE Lab D65
c.lch;           // { l, c, h }        CIE LCh D65
c.oklab;         // { l, a, b }        OKLab
c.oklch;         // { l, c, h }        OKLCh
c.xyz;           // { x, y, z }        CIE XYZ D65
c.displayP3;     // { r, g, b }        Display P3
c.rec2020;       // { r, g, b }        ITU-R BT.2020
c.a98;           // { r, g, b }        Adobe RGB 1998
c.prophoto;      // { r, g, b }        ProPhoto RGB
c.hsluv;         // { h, s, l }        HSLuv
c.luv;           // { l, u, v }        CIE Luv
c.cmyk;          // { c, m, y, k }     naïve device CMYK
```

Use `.to(spaceId)` to get a new `Swatch` in a different native space:

```js
c.to("oklch");          // Swatch with space: "oklch"
c.to("display-p3");     // Swatch with space: "display-p3"
```

## Delta E

Six metrics, covering three eras of color-difference research:

```js
c.deltaE(other);                 // CIEDE2000 (default)
c.deltaE(other, "76");           // CIE76 — Euclidean in Lab
c.deltaE(other, "ok");           // Euclidean in OKLab
c.deltaE(other, "94");           // CIE94 graphic arts
c.deltaE(other, "cmc");          // CMC l:c
c.deltaE(other, "hyab");         // HyAB (Abasi & Fairchild)
```

CMC accepts optional weighting:

```js
c.deltaE(other, "cmc", { l: 2, c: 1 });
```

## Quality bands

| ΔE (76 / 2000 / 94 / CMC) | Perceptual meaning |
|---|---|
| `< 1` | Imperceptible |
| `1–2` | Just noticeable |
| `2–5` | Perceptible |
| `5–10` | Easily distinguishable |
| `10–50` | Different colors |
| `> 50` | Opposite |

ΔE OK uses a 0–1 scale (divide by 100). HyAB has a wider range — see the
§13 playground panel for live comparison.

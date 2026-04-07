---
title: Perceptual spaces & ΔE
order: 6
eyebrow: "Reference · §06"
---

```js
const c = swatch("#3366cc");

c.toLinearRGB();
c.toXYZ();
c.toLab();     // CIE Lab
c.toLch();     // CIE LCh
c.toOklab();   // OKLab (Björn Ottosson 2020)
c.toOklch();
```

## Delta E

```js
c.deltaE("#3366cd");           // CIEDE2000 by default
c.deltaE("#3366cd", "76");     // Delta E 76
c.deltaE("#3366cd", "ok");     // Delta E OK
```

## Rule of thumb

| ΔE             | Perceptual meaning |
|----------------|---------------------|
| `< 1`          | Imperceptible to most viewers |
| `1–2`          | Just noticeable to a trained eye |
| `2–10`         | Perceptible at a glance |
| `10–50`        | Easily distinguishable colors |
| `> 50`         | Different colors entirely |

The §08 playground panel runs all three modes side-by-side.

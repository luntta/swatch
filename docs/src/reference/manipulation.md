---
title: Manipulation
order: 7
eyebrow: "Reference · §07"
---

Immutable OKLCh-space adjustments. Each call returns a new `swatch`. Amounts
are in OKLCh L/C units (0–1 scale), not HSL percentages.

```js
swatch("#ff0000").lighten(0.1);
swatch("#ff0000").darken(0.1);
swatch("#ff0000").saturate(0.05);
swatch("#ff0000").desaturate(0.05);
swatch("#ff0000").spin(180);          // complement
swatch("#ff0000").greyscale();
swatch("#ff0000").complement();
swatch("#ff0000").invert();
```

`lighten` / `darken` shift OKLCh L. `saturate` / `desaturate` shift OKLCh C.
`spin` rotates OKLCh H in degrees (wraps modulo 360).

## v2 → v3 migration

v2 used HSL with 0–100 amounts. v3 uses OKLCh with 0–1 amounts:

```js
// v2: swatch("#ff0000").lighten(20)
// v3:
swatch("#ff0000").lighten(0.1);
```

OKLCh is perceptually uniform — the same lightness step produces the same
visual shift regardless of hue.

## Tint, shade, tone

Mix toward white, black, or mid-grey in OKLab:

```js
c.tint(0.2);    // 20% toward white
c.shade(0.2);   // 20% toward black
c.tone(0.2);    // 20% toward mid-grey
```

## Chaining

```js
swatch("#0a84ff").darken(0.05).saturate(0.02).spin(-12);
```

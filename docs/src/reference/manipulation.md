---
title: Manipulation
order: 7
eyebrow: "Reference · §07"
---

Immutable HSL-space adjustments. Each call returns a new `swatch`.

```js
swatch("#ff0000").lighten(20);
swatch("#ff0000").darken(20);
swatch("#ff0000").saturate(10);
swatch("#ff0000").desaturate(10);
swatch("#ff0000").spin(180);       // complement
swatch("#ff0000").greyscale();
swatch("#ff0000").complement();
swatch("#ff0000").invert();
```

`lighten` / `darken` / `saturate` / `desaturate` take percentage points
(absolute, not relative). `spin` takes degrees and wraps modulo 360.

## Chaining

Because every call is immutable, you can chain freely:

```js
swatch("#0a84ff").darken(10).saturate(5).spin(-12);
```

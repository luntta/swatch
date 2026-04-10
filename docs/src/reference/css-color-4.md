---
title: CSS Color 4
order: 13
eyebrow: "Reference · §13"
---

Swatch parses and serializes the full CSS Color Module Level 4 grammar.

## Parsing

```js
swatch("oklch(0.7 0.15 240)");
swatch("oklab(0.5 -0.1 0.08)");
swatch("lab(52.2% 40 -70)");
swatch("lch(52.2% 80.1 270)");
swatch("hwb(240 0% 0%)");
swatch("color(display-p3 1 0 0)");
swatch("color(rec2020 1 0 0)");
swatch("color(a98-rgb 1 0 0)");
swatch("color(prophoto-rgb 0.5 0.3 0.1)");
swatch("color(xyz-d65 0.4 0.2 0.2)");
swatch("color(xyz-d50 0.4 0.2 0.2)");
```

Percentage values, slash-alpha, degree units, and the `none` keyword are all
supported:

```js
swatch("oklch(70% 0.15 240deg / 0.5)");
swatch("rgb(50% 0% 100%)");
swatch("hsl(240deg 100% 50% / 50%)");
swatch("oklch(0.7 none 240)");          // none = missing channel
```

## Serialization

```js
c.toString();                            // default for the color's native space
c.toString({ format: "hex" });           // "#3366cc"
c.toString({ format: "oklch" });         // "oklch(0.529 0.122 262.4)"
c.toString({ format: "oklab" });
c.toString({ format: "lab" });
c.toString({ format: "lch" });
c.toString({ format: "hwb" });
c.toString({ format: "color", space: "display-p3" });
c.toString({ format: "color", space: "rec2020" });
```

`toCss()` is an alias for `toString()`.

---
title: Creating a color
order: 2
eyebrow: "Reference · §02"
---

`swatch(input)` accepts any of the usual CSS forms, object literals, or
another `swatch` instance.

```js
swatch("#0000ff");
swatch("#00f");
swatch("#0000ff80");                 // with alpha
swatch("rgb(0, 0, 255)");
swatch("rgb(0 0 255)");
swatch("rgba(0 0 255 / 0.5)");
swatch("hsl(240, 100%, 50%)");
swatch("hsla(240deg 100% 50% / 0.5)");
swatch("rebeccapurple");             // all 148 CSS named colors
swatch({ r: 0, g: 0, b: 255 });
swatch({ h: 240, s: 100, l: 50, a: 0.5 });
```

## Instance properties

Every instance exposes:

```js
const c = swatch("#3366cc");

c.rgb;        // { r: 51, g: 102, b: 204 }
c.hsl;        // { h: 220, s: 60, l: 50 }
c.hex;        // "#3366cc"
c.isValid;    // true
c.hasAlpha;   // false
```

## String getters

```js
c.toRgbString();    // "rgb(51, 102, 204)"
c.toHslString();    // "hsl(220, 60%, 50%)"
c.toHex();          // "#3366cc"
```

## Validity

If the input cannot be parsed, `isValid` is `false`. The constructor never
throws — guard with `if (c.isValid)` before reading other properties.

```js
const c = swatch("not a color");
c.isValid; // false
```

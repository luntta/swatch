---
title: Creating a color
order: 2
eyebrow: "Reference · §02"
---

`swatch(input)` accepts CSS Color 4 strings, legacy CSS, named colors, object
literals, state objects, or an existing `Swatch` instance. Invalid input throws.

## CSS strings

```js
swatch("#0000ff");
swatch("#00f");
swatch("#0000ff80");                     // 8-digit hex with alpha
swatch("rgb(0 0 255)");
swatch("rgb(0 0 255 / 0.5)");
swatch("hsl(240 100% 50%)");
swatch("hsl(240deg 100% 50% / 0.5)");
swatch("hwb(240 0% 0%)");
swatch("oklch(0.7 0.15 240)");
swatch("oklab(0.5 -0.1 0.08)");
swatch("lab(52.2% 40 -70)");
swatch("lch(52.2% 80.1 270)");
swatch("color(display-p3 1 0 0)");
swatch("color(rec2020 1 0 0)");
swatch("color(xyz-d65 0.4 0.2 0.2)");
swatch("rebeccapurple");                 // all 148 CSS named colors
```

The `none` keyword is supported per CSS Color 4:

```js
swatch("oklch(0.7 none 240)");          // achromatic, h preserved
```

## Object literals

```js
swatch({ r: 0, g: 0, b: 255 });         // sRGB 0-255 legacy shorthand
swatch({ h: 240, s: 100, l: 50 });      // HSL
```

## State objects

The canonical v3 form round-trips cleanly:

```js
const state = { space: "oklch", coords: [0.7, 0.15, 240], alpha: 1 };
swatch(state);
swatch(c.toJSON());                      // also works
```

## Space getters

Every registered space has a getter that returns a named-channel object:

```js
const c = swatch("#3366cc");

c.srgb;        // { r: 0.2, g: 0.4, b: 0.8 }
c.hsl;         // { h: 220, s: 60, l: 50 }
c.oklch;       // { l, c, h }
c.lab;         // { l, a, b }
c.displayP3;   // { r, g, b }
```

Getters are lazily memoized on the instance. See [§06](/reference/perceptual/)
for the full list of 21 spaces.

## Serialization

```js
c.toString();                            // default CSS form
c.toString({ format: "hex" });           // "#3366cc"
c.toString({ format: "oklch" });         // "oklch(0.529 0.122 262.4)"
c.toString({ format: "lab" });
c.toString({ format: "hwb" });
c.toString({ format: "color", space: "display-p3" });
```

## Error handling

Invalid input throws — use `try/catch`:

```js
try {
  const c = swatch("not a color");
} catch (e) {
  // handle
}
```

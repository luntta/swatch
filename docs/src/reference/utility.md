---
title: Utility
order: 12
eyebrow: "Reference · §12"
---

```js
c.clone();                               // independent copy
c.equals(other, epsilon);                // equality within epsilon
c.equals(other, { space: "oklab" });     // compare in an explicit space
c.toJSON();                              // { space, coords, alpha }
JSON.stringify(c);                       // uses toJSON automatically
```

## equals

Compares another color's coords in the receiver's native space by default.
Different source spaces round-trip through conversion, so visually-equivalent
colors compare equal. `other` can be any normal `ColorInput`, not just a
`Swatch` instance.

```js
a.equals("#3366cc");                         // default epsilon = 1e-6
a.equals("rgb(51 102 204)");
a.equals(b, 0.01);                           // looser tolerance
a.equals(b, { space: "oklab", epsilon: 0.01 });
```

## toJSON / from JSON

```js
const json = c.toJSON();   // { space: "srgb", coords: [0.2, 0.4, 0.8], alpha: 1 }
swatch(json);              // round-trips cleanly
```

## CSS serialization

```js
c.toString();                            // default CSS form
c.toString({ format: "hex" });           // "#3366cc"
c.toString({ format: "oklch" });         // "oklch(0.529 0.122 262.4)"
c.toString({ format: "lab" });
c.toString({ format: "hwb" });
c.toString({ format: "color", space: "display-p3" });
c.toCss();                               // alias for toString()
c.css({ format: "oklch" });              // shorter alias
c.hex();                                 // "#3366cc"
c.hex({ alpha: true });                  // "#3366ccff"
c.rgb();                                 // { r: 51, g: 102, b: 204 }
```

`hex()` and `rgb()` perceptually map wide-gamut colors into sRGB before
serializing (pass `{ gamut: false }` for a raw clamp). `toString()` / `toCss()`
do not — they clip naively. See [Wide-gamut & gamut mapping](/reference/wide-gamut/).

## TypeScript

Hand-written declarations ship in `types/swatch.d.ts` and are referenced by
`package.json`. No configuration required. Channel paths are typed, so typos are
caught at compile time:

```ts
import swatch from "@luntta/swatch";

const c = swatch("#3366cc");
const sim: ReturnType<typeof c.simulate> = c.simulate("deutan");
c.get("oklch.l");          // ok
c.to(swatch.spaces.oklch); // ok
// c.get("oklch.lightness"); // TypeScript error
```

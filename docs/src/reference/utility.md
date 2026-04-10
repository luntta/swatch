---
title: Utility
order: 12
eyebrow: "Reference · §12"
---

```js
c.clone();                               // independent copy
c.equals(other, epsilon);                // structural equality within epsilon
c.toJSON();                              // { space, coords, alpha }
JSON.stringify(c);                       // uses toJSON automatically
```

## equals

Compares the other swatch's coords in the receiver's native space. Different
source spaces round-trip through conversion, so visually-equivalent colors
compare equal.

```js
a.equals(b);               // default epsilon = 1e-6
a.equals(b, 0.01);         // looser tolerance
```

`other` must be a `Swatch` instance.

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
```

## TypeScript

Hand-written declarations ship in `types/swatch.d.ts` and are referenced by
`package.json`. No configuration required:

```ts
import swatch from "swatch";

const c = swatch("#3366cc");
const sim: ReturnType<typeof c.simulate> = c.simulate("deutan");
```

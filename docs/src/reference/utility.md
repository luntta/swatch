---
title: Utility
order: 12
eyebrow: "Reference · §12"
---

```js
c.clone();                                  // independent copy
c.equals(other);                            // exact rgb match
c.equals(other, { tolerance: 1 });          // within 1 rgb unit per channel
c.equals(other, { space: "oklab", tolerance: 0.01 });
c.toJSON();                                 // { hex, rgb, hsl, isValid, format }
JSON.stringify(c);                          // uses toJSON automatically
```

## TypeScript

Hand-written declarations ship in `types/swatch.d.ts` and are referenced by
`package.json`. No configuration required:

```ts
import swatch from "swatch";

const c = swatch("#3366cc");
const sim: ReturnType<typeof c.simulate> = c.simulate("deutan");
```

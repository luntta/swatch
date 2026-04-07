---
title: Daltonization
order: 4
eyebrow: "Reference · §04"
---

Fidaner error-redistribution: the information lost to a dichromat is shifted
into channels they can still see.

```js
swatch("#ff0000").daltonize("deutan");
swatch("#ff0000").daltonize("protan", { severity: 0.8 });
```

Typically used to *pre-compensate* a color so it remains distinguishable
under simulation:

```js
const red       = swatch("#ff0000");
const corrected = red.daltonize("deutan");
corrected.simulate("deutan");   // still readable, even after the projection
```

The §03 panel of the [playground](/) shows the before/after for all three
deficiency types side-by-side.

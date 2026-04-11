---
title: Daltonization
order: 4
eyebrow: "Reference · §04"
---

Fidaner error-redistribution: the information lost to a dichromat is shifted
into channels they can still see. If you're building a "color blind mode",
these are the colors you'd put on screen.

```js
swatch("#ff0000").daltonize("deutan");
swatch("#ff0000").daltonize("protan", { severity: 0.8 });
```

The corrected color may look shifted to a trichromat — that's expected. What
matters is that a CVD viewer can now distinguish it from its neighbors.

Verify the fix by running the daltonized color back through simulation:

```js
const red       = swatch("#ff0000");
const corrected = red.daltonize("deutan");
corrected.simulate("deutan");   // should be more distinct than red.simulate("deutan")
```

The §03 panel of the [playground](/) shows all three steps side-by-side:
**Original (sim)** → **Daltonized** → **Daltonized (sim)**.

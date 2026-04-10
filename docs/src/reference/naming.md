---
title: Color naming
order: 19
eyebrow: "Reference · §19"
---

Find the nearest CSS named color by CIEDE2000 distance.

```js
const c = swatch("#c5341c");

c.name();       // { name: "firebrick", hex: "#b22222", deltaE: 8.2 }
c.toName();     // "firebrick"
```

The lookup table contains all 148 CSS named colors (excluding `transparent`),
deduplicated by hex value (aqua/cyan, grey/gray, magenta/fuchsia map to the
same entry).

Lab D65 coordinates are precomputed at module load time so each `name()` call
only converts the query color once.

---
title: Random colors
order: 21
eyebrow: "Reference · §21"
---

```js
swatch.random();
```

## Constrained ranges

```js
swatch.random({ hue: [180, 240] });              // ocean hues
swatch.random({ lightness: [0.4, 0.7] });        // mid-range lightness
swatch.random({ chroma: [0.1, 0.2] });           // moderate saturation
swatch.random({ space: "oklch" });                // sample in OKLCh
```

## Seeded PRNG

Pass a `seed` for reproducible results (xorshift32):

```js
swatch.random({ seed: 42 });    // always the same color
swatch.random({ seed: 42 });    // same again
```

Useful for tests, generative art, and deterministic palettes.

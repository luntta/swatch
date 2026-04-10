---
title: Built-in palettes
order: 17
eyebrow: "Reference · §17"
---

List all available palette names:

```js
swatch.palettes();   // ["viridis", "magma", ..., "Dark2"]
```

## Matplotlib perceptually-uniform

`viridis`, `magma`, `plasma`, `inferno`, `cividis`

## ColorBrewer 2.0

### Sequential

`Blues`, `Greens`, `Reds`, `Oranges`, `Purples`, `Greys`

### Diverging

`RdBu`, `RdYlBu`, `PiYG`, `BrBG`, `Spectral`

### Qualitative

`Set1`, `Set2`, `Set3`, `Pastel1`, `Dark2`

## Usage

```js
swatch.scale("viridis").colors(9);
swatch.scale("RdBu").domain([-1, 1])(0);     // midpoint of diverging scale
swatch.scale("Set1").classes(8).colors(8);    // 8 discrete qualitative colors
```

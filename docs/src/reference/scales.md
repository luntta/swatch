---
title: Color scales
order: 16
eyebrow: "Reference · §16"
---

Build continuous color ramps from discrete stops. The API is chroma.js-style
with chainable setters.

```js
const scale = swatch.scale(["#00f", "#ff0", "#f00"]);
scale(0.5);                      // midpoint swatch
scale.colors(9);                 // array of 9 evenly-spaced swatches
scale.colors(5, "hex");          // 5 hex strings
```

## Chainable methods

```js
swatch.scale(["#00f", "#f00"])
  .domain([0, 100])              // remap the input domain
  .mode("oklch")                 // interpolation space
  .classes(5)                    // quantize into 5 discrete steps
  .padding([0.1, 0.1])          // trim 10% from each end
  .gamma(1.5)                   // apply gamma correction
  .correctLightness()           // enforce monotonic perceptual lightness
  .cache(true);                 // memoize lookups (default: true)
```

## Built-in palettes

Pass a palette name instead of stops:

```js
swatch.scale("viridis");
swatch.scale("RdBu");
swatch.scale("Set1");
```

See [§17 Built-in palettes](/reference/palettes-builtin/) for the full list.

## Interpolators

```js
// de Casteljau Bézier in Lab
swatch.bezier(["#f00", "#0f0", "#00f"]);

// Green 2011 cubehelix
swatch.cubehelix({ start: 200, rotations: -0.5, hue: 0.8, gamma: 1, lightness: [0.3, 0.8] });
```

Both return a `(t: number) => Swatch` function.

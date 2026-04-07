---
title: Palette distinguishability
order: 5
eyebrow: "Reference · §05"
---

Check whether every pair in a palette stays apart under a given color vision
deficiency.

```js
const report = swatch.checkPalette(
	["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00"],
	{ cvd: "deutan", minDeltaE: 11 }
);

report.safe;        // false
report.minDeltaE;   // e.g. 7.2
report.unsafe;      // [{ i, j, deltaE, safe: false }, …]
```

## Options

| Option       | Default    | Notes |
|--------------|------------|-------|
| `cvd`        | `null`     | One of `protan` / `deutan` / `tritan` / `achroma`. `null` checks the trichromat baseline. |
| `severity`   | `1`        | Passed to `simulate()`. |
| `minDeltaE`  | `11`       | Threshold for "safe". |
| `mode`       | `"2000"`   | ΔE mode: `2000`, `76`, or `ok`. |

## Nudging a single color

Walk a color's lightness until it clears a threshold against a reference,
preserving hue and chroma:

```js
swatch.nearestDistinguishable("#ff6666", "#ff0000", {
	cvd: "deutan",
	minDeltaE: 15
});
```

The §07 panel of the [playground](/) wires both calls together — paste a
palette and click `nudge` on any unsafe pair.

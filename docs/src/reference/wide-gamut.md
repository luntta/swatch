---
title: Wide-gamut & gamut mapping
order: 14
eyebrow: "Reference · §14"
---

v3 preserves wide-gamut inputs losslessly. A P3 red stays in P3 until you
explicitly convert or gamut-map it.

```js
const p3 = swatch("color(display-p3 1 0 0)");
p3.space;             // "display-p3"
p3.coords;            // [1, 0, 0]
p3.srgb;              // { r: 1.093, g: -0.227, b: -0.150 } — out of range!
```

## Wide-gamut spaces

| Space | Getter | Primaries |
|---|---|---|
| Display P3 | `c.displayP3` | DCI-P3 with D65 white |
| Rec. 2020 | `c.rec2020` | ITU-R BT.2020 |
| Adobe RGB 1998 | `c.a98` | Adobe RGB (1998) |
| ProPhoto RGB | `c.prophoto` | ROMM RGB, D50 white (Bradford CAT to D65) |

## Gamut checking

```js
c.gamut;                    // smallest containing gamut: "srgb" | "display-p3"
                            //   | "rec2020" | "prophoto" | null
c.inGamut("srgb");          // true/false
c.inGamut("display-p3");
```

## Gamut mapping

```js
c.toGamut();                               // default: CSS4 chroma reduction in sRGB
c.toGamut({ space: "srgb" });              // explicit target
c.toGamut({ space: "srgb", method: "clip" });
c.toGamut({ space: "srgb", method: "css4" });
c.toGamut({ space: "display-p3", method: "css4" });
```

### Methods

| Method | Description |
|---|---|
| `css4` | CSS Color 4 binary chroma reduction in OKLCh (default) |
| `oklch-chroma` | Alias for `css4` |
| `clip` | Hard clamp to [0, 1] per channel |

The `.hex()` and `.rgb()` helpers already apply `css4` mapping to sRGB for you,
so they are display-ready for wide-gamut sources (pass `{ gamut: false }` to opt
out). Use `.toGamut()` directly when you need a different target space or method,
or before reading the raw `.srgb` / `.toString({ format: "hex" })` math, which do
not gamut-map.

# Swatch

A color library with **first-class colorblind support** — physically correct Brettel/Viénot simulation, severity continuum, Fidaner daltonization, and palette distinguishability checks — plus the things you expect from a modern color library: CSS Color 4 parsing, wide-gamut spaces, OKLab/OKLCh manipulation, color scales, built-in scientific palettes, blend modes, naming, temperature, WCAG 2.1, and APCA.

**Docs & interactive playground:** <https://luntta.github.io/swatch/>

> **3.0** is a breaking rewrite. See [MIGRATING.md](./MIGRATING.md) for the v2 → v3 cookbook. The most visible change is that `lighten`/`darken`/`saturate` now operate in OKLCh with amounts in `0..1` instead of HSL with amounts in `0..100`.

## Install

```bash
npm install swatch
```

```js
import swatch from "swatch";
```

## Creating a color

`swatch(input)` accepts any of the usual CSS forms — including CSS Color 4 — object literals, or another `swatch`.

```js
// Legacy CSS.
swatch("#0000ff");
swatch("#00f");
swatch("#0000ff80");                   // with alpha
swatch("rgb(0, 0, 255)");
swatch("rgba(0, 0, 255, 0.5)");
swatch("hsl(240, 100%, 50%)");
swatch("rebeccapurple");               // all 148 CSS named colors

// CSS Color 4.
swatch("rgb(0 0 255 / 0.5)");          // modern slash-alpha
swatch("hsl(240 100% 50% / 50%)");
swatch("hwb(240 0% 0%)");
swatch("lab(52.2% 40 -70)");
swatch("lch(52.2% 80.5 300)");
swatch("oklab(0.5 0.1 -0.2)");
swatch("oklch(0.7 0.15 240)");
swatch("color(display-p3 1 0 0)");     // wide-gamut
swatch("color(rec2020 1 0 0)");
swatch("color(xyz-d65 0.4124 0.2126 0.0193)");

// Objects.
swatch({ r: 0, g: 0, b: 255 });
swatch({ h: 240, s: 100, l: 50, a: 0.5 });
swatch({ space: "oklch", coords: [0.7, 0.15, 240] });
```

Instances are **immutable** — every operation returns a new `swatch`.

## Color spaces

Each instance exposes a getter for every registered space. Conversions go through CIE XYZ D65 and are lazily memoized on the instance.

```js
const c = swatch("oklch(0.7 0.15 240)");

c.srgb;        // { r, g, b }     — may be out of [0,1] for wide-gamut sources
c.linearSrgb;  // { r, g, b }
c.hsl;         // { h, s, l }
c.hsv;         // { h, s, v }
c.hwb;         // { h, w, b }
c.cmyk;        // { c, m, y, k }  — naive, uncalibrated
c.lab;         // { l, a, b }     — CIE Lab D65
c.lch;         // { l, c, h }
c.oklab;       // { l, a, b }
c.oklch;       // { l, c, h }
c.hsluv;       // { h, s, l }     — human-friendly HSL
c.luv;         // { l, u, v }
c.xyz;         // { x, y, z }     — D65
c.displayP3;   // { r, g, b }
c.rec2020;     // { r, g, b }
c.a98;         // { r, g, b }
c.prophoto;    // { r, g, b }
```

Getters return mathematically correct coordinates — they do not gamut-map. For a wide-gamut source like `color(display-p3 1 0 0)`, `.srgb` will include out-of-range values. Use [`.toGamut()`](#gamut-mapping) if you need an in-gamut sRGB version.

Switch the canonical space with `c.to(spaceId)`:

```js
swatch("#ff0000").to("oklch");
// Swatch { space: "oklch", coords: [0.628, 0.258, 29.2], alpha: 1 }
```

## Channels

Address any channel with a string path:

```js
const c = swatch("oklch(0.7 0.15 240)");
c.get("oklch.l");   // 0.7
c.get("hsl.h");     // 240 (converted from oklch)
c.get("alpha");     // 1

c.set("oklch.h", 120);  // returns a new Swatch with hue = 120°
```

## Manipulation

**Breaking change from v2.** Manipulation now operates in OKLCh (perceptually uniform) instead of HSL. Amounts are in `0..1`, not `0..100`.

```js
swatch("#ff0000").lighten(0.1);      // +0.1 in OKLCh L
swatch("#ff0000").darken(0.1);
swatch("#ff0000").saturate(0.05);    // +0.05 in OKLCh C
swatch("#ff0000").desaturate(0.05);
swatch("#ff0000").spin(180);         // +180° OKLCh hue
swatch("#ff0000").greyscale();       // OKLCh C = 0
swatch("#ff0000").complement();
swatch("#ff0000").invert();          // per-channel sRGB invert
```

OKLCh-based lightening means `#ffff00` and `#0000ff` both become *visually* brighter by the same amount — unlike HSL, where yellow barely changed at all.

Results are re-mapped to sRGB after each operation. Pass `{ gamut: false }` to opt out.

## Tint, shade, tone

Mix toward white / black / mid-grey in OKLab.

```js
swatch("#ff0000").tint(0.2);    // 20% toward white
swatch("#ff0000").shade(0.2);   // 20% toward black
swatch("#ff0000").tone(0.2);    // 20% toward 50% grey
```

## Mix and blend

```js
const a = swatch("#ff0000");
const b = swatch("#0000ff");

a.mix(b);                            // oklab, 50/50 (default)
a.mix(b, 0.25);                      // weighted 25% toward b
a.mix(b, 0.5, { space: "lab" });
a.mix(b, 0.5, { space: "oklch" });   // polar, shortest-arc hue
a.mix(b, 0.5, { space: "srgb" });    // naive gamma-space blend
```

W3C Compositing and Blending Level 1 blend modes:

```js
swatch("#ff0000").blend("#0000ff", "multiply");
swatch("#ff0000").blend("#00ff00", "screen");
// Also: darken, lighten, overlay, color-dodge, color-burn,
//       hard-light, soft-light, difference, exclusion, normal
```

## Color scales

Chroma.js-style scale builder. Interpolates between stops in OKLab by default.

```js
const s = swatch.scale(["#ff0000", "#ffff00", "#00ff00"]);

s(0);                  // Swatch at the start
s(0.5);                // midpoint
s.colors(5);           // [Swatch, Swatch, Swatch, Swatch, Swatch]
s.colors(5, "hex");    // ["#ff0000", "#ffa000", "#ffff00", "#b0ff00", "#00ff00"]
```

Shape the curve:

```js
swatch.scale(["#000", "#fff"])
  .domain([0, 100])          // remap the input range
  .padding([0.1, 0.1])       // trim fractional amounts off each end
  .gamma(0.5)                // pow the normalized t (emphasis curve)
  .classes(5)                // bucket into 5 discrete bins
  .mode("oklch")             // interpolation space
  .correctLightness()        // resample so the output Lab L is linear
  .cache(true);              // memoize samples (default)
```

Interpolators that feed into `.scale(...)`:

```js
swatch.bezier(["#ff0000", "#ffff00", "#00ff00"]);
swatch.cubehelix({ start: 300, rotations: -1.5, hue: 1, lightness: [0, 1] });
```

## Built-in palettes

Matplotlib perceptually-uniform colormaps (Smith & van der Walt) and the full ColorBrewer 2.0 set (Cynthia Brewer).

```js
swatch.scale("viridis");
swatch.scale("magma");
swatch.scale("plasma");
swatch.scale("inferno");
swatch.scale("cividis");      // colorblind-safe by design

swatch.scale("Blues");
swatch.scale("RdBu");
swatch.scale("Spectral");
swatch.scale("Set1").classes(9);  // qualitative → discrete

swatch.palettes();            // all registered palette names
```

## Gamut mapping

```js
const p3red = swatch("color(display-p3 1 0 0)");

p3red.inGamut("srgb");        // false
p3red.toGamut({ space: "srgb" });
p3red.toGamut({ space: "srgb", method: "clip" });       // naive clipping
p3red.toGamut({ space: "srgb", method: "css4" });       // CSS Color 4 binary chroma reduction (default)
```

The `.srgb` / `.linearSrgb` / `.hsl` getters return raw conversions, so wide-gamut sources can produce out-of-range values. `c.toString({ format: "hex" })` clips to a valid 6-digit hex for presentation (which drops chromaticity). Use `toGamut` when you need a proper, perceptually-minimal remapping.

## Colorblind simulation

Physically correct sRGB → linear → LMS projection onto the dichromat confusion plane (Brettel 1997 / Viénot 1999).

```js
const red = swatch("#ff0000");

red.simulate("protan");                       // full protanopia
red.simulate("deutan", { severity: 0.6 });    // 60% deuteranomaly
red.simulate("tritan");
red.simulate("achroma");                      // Rec. 709 grayscale
```

Accepted aliases: `protanopia`/`protanomaly` → `protan`, `deuteranopia`/`deuteranomaly` → `deutan`, `tritanopia`/`tritanomaly` → `tritan`, `achromatopsia` → `achroma`.

Severity `0.0` is identity, `1.0` is the full dichromat, in between is a linear interpolation of the RGB transform matrix.

## Daltonization

Fidaner error-redistribution: the information lost to a dichromat is shifted into channels they can still see.

```js
swatch("#ff0000").daltonize("deutan");
swatch("#ff0000").daltonize("protan", { severity: 0.8 });
```

## Palette distinguishability

```js
const report = swatch.checkPalette(
  ["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00"],
  { cvd: "deutan", minDeltaE: 11 }
);

report.safe;        // false
report.minDeltaE;   // e.g. 7.2
report.unsafe;      // [{ i, j, deltaE, safe: false }, …]
```

Nudge a single color until it clears a threshold against a reference:

```js
swatch.nearestDistinguishable("#ff6666", "#ff0000", {
  cvd: "deutan",
  minDeltaE: 15
});
```

## WCAG 2.1 contrast

```js
swatch.contrast("#ffffff", "#000000");      // 21
swatch("#767676").isReadable("#ffffff");    // true (AA normal body text)
swatch("#767676").isReadable("#ffffff", { level: "AAA", size: "normal" });
swatch("#767676").isReadable("#ffffff", { level: "AA",  size: "large"  });
```

Auto-fix a foreground until it meets a target ratio:

```js
swatch("#888888").ensureContrast("#ffffff", { minRatio: 4.5 });
```

Pick the best candidate from a list:

```js
swatch.mostReadable("#ffffff", ["#888", "#555", "#222"]);
// → Swatch("#222222")
```

## APCA

Andrew Somers' SAPC-based contrast. Returns signed Lc on a ~[-108, +106] scale.

```js
swatch.apcaContrast("#000000", "#ffffff");    //  106.04  (BoW)
swatch.apcaContrast("#ffffff", "#000000");    // -107.88  (WoB)
swatch.apcaContrast("#767676", "#ffffff");    //   71.57  (fails body-text min)
```

Positive = dark text on a light background; negative = light text on a dark background. Typical body-text thresholds: `|Lc| ≥ 75` comfortable, `≥ 60` minimum.

## Delta E

```js
const a = swatch("#3366cc");
a.deltaE("#3366cd");                          // ΔE2000 (default)
a.deltaE("#3366cd", "76");                    // ΔE76
a.deltaE("#3366cd", "94");                    // ΔE94 graphic arts
a.deltaE("#3366cd", "cmc", { l: 2, c: 1 });   // CMC l:c (2:1 acceptability)
a.deltaE("#3366cd", "hyab");                  // HyAB (large differences)
a.deltaE("#3366cd", "ok");                    // ΔE OK
```

## Color naming

```js
swatch("#dc143c").name();
// { name: "crimson", hex: "#dc143c", deltaE: 0 }

swatch("#dc1b3d").toName();
// "crimson"
```

Nearest match from the 148 CSS Color Module 4 named colors, measured in ΔE2000.

## Temperature

```js
swatch.temperature(6500);       // D65-ish white
swatch.temperature(2000);       // warm candlelight orange
swatch("#ffb070").temperature();// → ~2870 K (McCamy approximation)
```

Krystek 1985 blackbody for kelvin → color; McCamy 1992 for the inverse.

## Random

```js
swatch.random();

swatch.random({
  space: "oklch",
  lightness: [0.6, 0.8],
  chroma: [0.1, 0.2],
  hue: [180, 240],
  seed: 42
});
```

Pass `seed` for reproducible sequences (xorshift32).

## TypeScript

Hand-written declarations ship in `types/swatch.d.ts` and are referenced by `package.json`. No configuration required.

## License

MIT

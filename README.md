# Swatch

A color library with **first-class color-blindness support**: physically correct Brettel/Viénot simulation, severity continuum, Fidaner daltonization, and palette distinguishability checks. Plus the usual things — parsing, perceptual spaces (OKLab, Lab, LCh), Delta E, manipulation, harmonies, WCAG 2.1 & APCA contrast.

**Docs & interactive playground:** <https://luntta.github.io/swatch/>  
**Source for the docs site:** [`docs/`](./docs/)

> **2.0** is a breaking rewrite. The old `toColorBlindRGB()` / `deficiency()` methods are gone; use `simulate()` and `daltonize()` instead.

## Install

```bash
npm install swatch
```

```js
import swatch from "swatch";
```

## Creating a color

`swatch(input)` accepts any of the usual CSS forms, object literals, or another `swatch`.

```js
swatch("#0000ff");
swatch("#00f");
swatch("#0000ff80");           // with alpha
swatch("rgb(0, 0, 255)");
swatch("rgb(0 0 255)");
swatch("rgba(0 0 255 / 0.5)");
swatch("hsl(240, 100%, 50%)");
swatch("hsla(240deg 100% 50% / 0.5)");
swatch("rebeccapurple");       // all 148 CSS named colors
swatch({ r: 0, g: 0, b: 255 });
swatch({ h: 240, s: 100, l: 50, a: 0.5 });
```

Every instance exposes:

```js
const c = swatch("#3366cc");
c.rgb;        // { r: 51, g: 102, b: 204 }
c.hsl;        // { h: 220, s: 60, l: 50 }
c.hex;        // "#3366cc"
c.isValid;    // true
c.hasAlpha;   // false
```

Instances are **immutable** — every transformation returns a new `swatch`.

## Colorblind simulation

Physically correct sRGB → linear → LMS projection onto the dichromat confusion plane (Brettel 1997 / Viénot 1999).

```js
const red = swatch("#ff0000");

red.simulate("protan");                 // full protanopia
red.simulate("deutan", { severity: 0.6 }); // 60% deuteranomaly
red.simulate("tritan");
red.simulate("achroma");                // Rec. 709 grayscale
```

Accepted type aliases:

| Canonical | Aliases |
|-----------|---------|
| `protan`  | `protanopia`, `protanomaly` |
| `deutan`  | `deuteranopia`, `deuteranomaly` |
| `tritan`  | `tritanopia`, `tritanomaly` |
| `achroma` | `achromatopsia` |

Severity `0.0` returns the identity; `1.0` returns the full dichromat; in between is a linear interpolation of the RGB transform matrix, matching the Machado 2009 model's behavior along the continuum.

## Daltonization (color correction)

Fidaner error-redistribution: the information lost to a dichromat is shifted into channels they can still see.

```js
swatch("#ff0000").daltonize("deutan");
swatch("#ff0000").daltonize("protan", { severity: 0.8 });
```

Typically used to *pre-compensate* a color so it remains distinguishable under simulation.

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

## Perceptual spaces & Delta E

```js
const c = swatch("#3366cc");

c.toLinearRGB();
c.toXYZ();
c.toLab();     // CIE Lab
c.toLch();     // CIE LCh
c.toOklab();   // OKLab (Björn Ottosson 2020)
c.toOklch();

c.deltaE("#3366cd");           // CIEDE2000 by default
c.deltaE("#3366cd", "76");     // Delta E 76
c.deltaE("#3366cd", "ok");     // Delta E OK
```

## Manipulation

Immutable HSL-space adjustments:

```js
swatch("#ff0000").lighten(20);
swatch("#ff0000").darken(20);
swatch("#ff0000").saturate(10);
swatch("#ff0000").desaturate(10);
swatch("#ff0000").spin(180);       // complement
swatch("#ff0000").greyscale();
swatch("#ff0000").complement();
swatch("#ff0000").invert();
```

## Mixing

```js
a.mix(b);                  // perceptual midpoint in OKLab (default)
a.mix(b, 0.25);            // weighted 25% toward b
a.mix(b, 0.5, "lab");      // CIE Lab interpolation
a.mix(b, 0.5, "linear");   // linear sRGB (physically-accurate blend)
a.mix(b, 0.5, "rgb");      // naive gamma-space blend
a.mix(b, 0.5, "hsl");      // HSL, shortest-arc hue
```

Alpha is interpolated linearly regardless of space.

## Harmonies

```js
const c = swatch("#ff0000");

c.complementary();    // [self, +180°]
c.triad();            // 0°, 120°, 240°
c.tetrad();           // 0°, 90°, 180°, 270°
c.splitComplement();  // 0°, 150°, 210°
c.analogous(6, 30);   // 6 colors evenly spaced over 30°
c.monochromatic(5);   // 5 same-hue colors varying lightness
```

Each harmony returns an array of new `swatch` instances with the full API.

## WCAG accessibility

```js
swatch("#ffffff").contrast("#000000");   // 21
swatch("#767676").isReadable("#ffffff"); // true (AA normal)
swatch("#767676").isReadable("#ffffff", { level: "AAA", size: "normal" });
swatch("#767676").isReadable("#ffffff", { level: "AA",  size: "large" });
```

Auto-fix a foreground until it meets a target ratio, preserving hue:

```js
swatch("#888888").ensureContrast("#ffffff", { minRatio: 4.5 });
// → a darker version of #888 that clears 4.5:1 on white.
```

Pick the best candidate from a list:

```js
swatch.mostReadable("#ffffff", ["#888", "#555", "#222"]);
// → swatch("#222222")
```

## APCA (WCAG 3 draft)

Andrew Somers' SAPC-based contrast. Returns signed Lc on a ~[-108, +106] scale.

```js
swatch.apcaContrast("#000000", "#ffffff");  //  106.04  (BoW)
swatch.apcaContrast("#ffffff", "#000000");  // -107.88  (WoB)
swatch.apcaContrast("#767676", "#ffffff");  //   71.6   (fails body-text min)
```

Positive = dark text on a light background; negative = light text on a dark background. Typical body-text thresholds: `|Lc| ≥ 75` comfortable, `≥ 60` minimum.

## Utility

```js
c.clone();                                  // independent copy
c.equals(other);                            // exact rgb match
c.equals(other, { tolerance: 1 });          // within 1 rgb unit per channel
c.equals(other, { space: "oklab", tolerance: 0.01 });
c.toJSON();                                 // { hex, rgb, hsl, isValid, format }
JSON.stringify(c);                          // uses toJSON automatically
```

## TypeScript

Hand-written declarations ship in `types/swatch.d.ts` and are referenced by `package.json`. No configuration required.

## License

MIT

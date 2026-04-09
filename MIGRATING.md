# Migrating from swatch 2.x to 3.0

Swatch 3.0 is a breaking rewrite. Storage moved to a canonical `{ space, coords, alpha }` state, conversions are lazy and memoized, manipulation became OKLCh-based by default, and the library gained CSS Color 4 parsing, wide-gamut spaces, color scales, built-in palettes, and more.

Most existing code will work with only small changes. The sections below cover the breakages, from most visible to most obscure.

## 1. Manipulation amounts and space (the big one)

In v2 `lighten`/`darken`/`saturate`/`desaturate` operated in HSL with amounts in `0..100` (percentage-ish). In v3 they operate in OKLCh with amounts in `0..1` (OKLCh L and C units).

```js
// v2
swatch("#ff0000").lighten(20);     // +20 HSL L
swatch("#ff0000").saturate(10);    // +10 HSL S

// v3
swatch("#ff0000").lighten(0.1);    // +0.1 OKLCh L
swatch("#ff0000").saturate(0.05);  // +0.05 OKLCh C
```

**Why the change?** HSL lightness isn't perceptually uniform — `#ffff00` barely moves when you lighten it in HSL, because yellow already has near-maximum HSL L. OKLCh L is perceptually uniform, so `swatch("#ffff00").lighten(0.05)` and `swatch("#0000ff").lighten(0.05)` look equally brighter.

**Rough conversion:** v2 HSL amounts divide by about 200 to get a comparable v3 OKLCh amount, but the results are not numerically equivalent — they're perceptually better. Re-test visually.

`spin(degrees)` is unchanged (still degrees). `greyscale`, `complement`, and `invert` keep their v2 behavior.

## 2. Space conversions are getters, not methods

```js
// v2
c.toRGB();
c.toLab();
c.toOklch();

// v3
c.srgb;
c.lab;
c.oklch;
```

v3 also adds a large set of new space getters: `c.hsv`, `c.hwb`, `c.cmyk`, `c.hsluv`, `c.luv`, `c.displayP3`, `c.rec2020`, `c.a98`, `c.prophoto`, `c.linearSrgb`, `c.xyz`.

Use `c.to("<spaceId>")` to move the canonical space itself (not just read in another space):

```js
const p3 = swatch("#ff0000").to("display-p3");
p3.space;     // "display-p3"
p3.coords;    // [r, g, b] in Display P3, not sRGB
```

## 3. Wide-gamut inputs are no longer clamped at parse

v2 parsed `color(display-p3 1 0 0)` by immediately projecting into sRGB (which clipped the chromaticity). v3 preserves the original Display P3 coordinates losslessly in the canonical state.

```js
const p3red = swatch("color(display-p3 1 0 0)");
p3red.space;             // "display-p3"
p3red.inGamut("srgb");   // false
p3red.displayP3;         // { r: 1, g: 0, b: 0 }
p3red.srgb;              // { r: 1.093, g: -0.227, b: -0.150 } — raw conversion, out of range
p3red.toString({ format: "hex" });  // "#ff0000" (naive clip for presentation)
```

The `.srgb` / `.linearSrgb` / `.hsl` getters no longer gamut-map. For a wide-gamut source, they will return out-of-range coordinates. Call `.toGamut({ space: "srgb", method: "css4" })` explicitly to get a properly chroma-reduced in-gamut Swatch, then read its `.srgb` / `.hex`.

## 4. New `toJSON()` shape

```js
// v2
c.toJSON();
// { hex: "#3366cc", rgb: { r, g, b }, hsl: { h, s, l }, isValid: true, format: "HEX" }

// v3
c.toJSON();
// { space: "srgb", coords: [0.2, 0.4, 0.8], alpha: 1 }
```

The new shape round-trips cleanly: `swatch(c.toJSON()).equals(c)` is true.

If you stored v2 JSON blobs, read them through an adapter that extracts `hex` and passes it to `swatch()`.

## 5. `equals()` signature changed

```js
// v2
c.equals(other);
c.equals(other, { tolerance: 1 });
c.equals(other, { space: "oklab", tolerance: 0.01 });

// v3
c.equals(other);              // default epsilon 1e-6 in the source space
c.equals(other, 1e-4);        // custom epsilon
```

`other` must be a `Swatch` instance in v3 (wrap strings with `swatch(...)` first).

## 6. Removed: `isValid`, `hasAlpha`, `_original`, `_originalFormat`

In v2, invalid input produced a swatch with `isValid: false`. In v3, invalid input throws. Use `try`/`catch` to validate:

```js
// v2
if (swatch(input).isValid) { ... }

// v3
try {
  const c = swatch(input);
  ...
} catch {
  // invalid
}
```

For alpha presence, check the numeric channel directly:

```js
c.alpha < 1     // v3 replacement for v2's `c.hasAlpha`
```

`_original` and `_originalFormat` (v2 internals) are gone; use `c.space` and `c.coords` to introspect the canonical state.

## 7. `mix()` takes an options bag for the space

```js
// v2
a.mix(b, 0.5, "lab");
a.mix(b, 0.5, "rgb");

// v3
a.mix(b, 0.5, { space: "lab" });
a.mix(b, 0.5, { space: "srgb" });
```

Default space is still `oklab`.

## 8. Harmonies are not yet ported

v2's `complementary()`, `triad()`, `tetrad()`, `splitComplement()`, `analogous()`, `monochromatic()` are not in v3.0. They will return in a follow-up release. As a workaround, `spin()` + an array literal covers most cases:

```js
// v2
c.triad();

// v3 workaround
const s = swatch(c);
[s, s.spin(120), s.spin(240)];
```

Tracked for follow-up. If you rely on harmonies, pin to v2 or file an issue.

## 9. Named color list moved

v2 exported `named-colors.js` directly. v3 moved it to `src/data/named-colors.js`. If you imported the raw table, update the path. For most users, `c.toName()` / `c.name()` are the preferred API.

## 10. New APIs worth learning

Things v2 didn't have at all:

| Feature | API |
|---|---|
| CSS Color 4 parsing | `swatch("oklch(0.7 0.15 240)")`, `swatch("color(display-p3 1 0 0)")` |
| Channel get/set | `c.get("oklch.l")`, `c.set("oklch.h", 120)` |
| Gamut mapping | `c.inGamut("srgb")`, `c.toGamut({ space, method })` |
| Tint / shade / tone | `c.tint(0.2)`, `c.shade(0.2)`, `c.tone(0.2)` |
| Blend modes | `c.blend(other, "multiply")` — all W3C Level 1 modes |
| Color scales | `swatch.scale([...])`, `.domain`, `.classes`, `.padding`, `.gamma`, `.mode`, `.correctLightness`, `.cache`, `.colors(n)` |
| Built-in palettes | `swatch.scale("viridis")`, `swatch.scale("RdBu")`, `swatch.palettes()` |
| Interpolators | `swatch.bezier([...])`, `swatch.cubehelix({...})` |
| Color naming | `c.name()`, `c.toName()` |
| Temperature | `swatch.temperature(6500)`, `c.temperature()` |
| Random | `swatch.random({ space, hue, lightness, chroma, seed })` |
| Extra ΔE | `"94"`, `"cmc"`, `"hyab"` on top of `"76"`, `"2000"`, `"ok"` |
| New spaces | HSV, HWB, CMYK, HSLuv, Luv, Display P3, Rec2020, A98, ProPhoto |

See [README.md](./README.md) for examples of each.

## 11. Unchanged

The CVD/APCA/WCAG story — the heart of swatch — is unchanged:

- `simulate(type, { severity })` — Brettel/Viénot dichromat simulation
- `daltonize(type, { severity })` — Fidaner error redistribution
- `swatch.checkPalette(colors, { cvd, minDeltaE, mode })`
- `swatch.nearestDistinguishable(target, against, { cvd, minDeltaE, step })`
- `swatch.mostReadable(bg, candidates, { level, size })`
- `contrast(a, b)`, `isReadable(a, b, { level, size })`, `ensureContrast(a, b, { minRatio, direction, step })`
- `apcaContrast(text, background)`

All of these moved to new module paths internally but kept their public signatures.

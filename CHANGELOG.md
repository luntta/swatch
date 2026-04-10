# Changelog

## 3.0.0 — BREAKING

A complete rewrite. Storage moved to a canonical `{ space, coords, alpha }` state (colorjs.io / culori model) so wide-gamut inputs are preserved losslessly, conversions go through a lazy CIE XYZ D65 hub, and the monolithic `src/swatch.js` has been split into `src/core`, `src/spaces`, `src/parse`, `src/format`, `src/operations`, `src/scale`, `src/palettes`, and `src/data`.

See [`MIGRATING.md`](./MIGRATING.md) for the v2 → v3 cookbook.

### Breaking

- **Manipulation moved to OKLCh.** `lighten`, `darken`, `saturate`, `desaturate`, `spin`, `greyscale`, and `complement` now operate in OKLCh instead of HSL, with amounts in `0..1` OKLCh L/C units instead of `0..100` HSL %. `swatch("#ff0000").lighten(20)` (v2) becomes `swatch("#ff0000").lighten(0.1)` (v3). Rationale: HSL lightness is not perceptually uniform, so v2's `swatch("#ffff00").lighten(0.1)` looked almost unchanged while `swatch("#0000ff").lighten(0.1)` jumped.
- **Space conversions are getters, not methods.** `c.toLab()` → `c.lab`, `c.toOklch()` → `c.oklch`, `c.toRGB()` → `c.srgb`, etc. Getters are lazily memoized on the instance.
- **Wide-gamut inputs are no longer clamped at parse.** `swatch("color(display-p3 1 0 0)")` keeps its P3 coordinates; `.srgb` on that swatch returns a raw, possibly out-of-range conversion. Use `.toGamut({ space: "srgb", method: "css4" })` to get a properly chroma-reduced in-gamut version.
- **`toJSON()` shape changed** from `{ hex, rgb, hsl, isValid, format }` to `{ space, coords, alpha }`. The new shape round-trips cleanly through `swatch(...)`.
- **`equals()` signature changed** from `equals(other, { tolerance, space })` to `equals(other, epsilon)`. `other` must now be a `Swatch` instance.
- **Removed v2 fields:** `isValid`, `hasAlpha`, `_original`, `_originalFormat`. Invalid input now throws; check `alpha < 1` for alpha presence; use `c.space` / `c.coords` to introspect state.
- **`mix()` takes an options bag** for the interpolation space: `a.mix(b, 0.5, "lab")` → `a.mix(b, 0.5, { space: "lab" })`.
- **Harmonies not yet ported.** `complementary`, `triad`, `tetrad`, `splitComplement`, `analogous`, `monochromatic` are not in v3.0. They will return in a follow-up release. Workaround: `[c, c.spin(120), c.spin(240)]`.
- **Internal rename.** The v2 monolith lives at `src/_v2-monolith.js` as an internal artifact and is not part of the public API. Do not import from it.

### Added

- **CSS Color 4 parsing and serialization.** `swatch("oklch(0.7 0.15 240)")`, `swatch("lab(52.2% 40 -70)")`, `swatch("hwb(240 0% 0%)")`, `swatch("color(display-p3 1 0 0)")`, `swatch("color(rec2020 1 0 0)")`, `swatch("color(xyz-d65 0.4 0.2 0.2)")`, modern slash-alpha, `none` keyword, percentage values, the whole set. `c.toString({ format: "oklch" })` / `"lab"` / `"hwb"` / `"lch"` / `"oklab"` / `"color"` for output.
- **Wide-gamut spaces.** Display P3, Rec2020, Adobe RGB 1998, ProPhoto RGB. Each registered in the conversion graph with their correct primaries and transfer functions; ProPhoto carries a Bradford D50 → D65 CAT internally.
- **Additional spaces.** HSV, HWB, CMYK (naive), HSLuv, Luv, linear sRGB, XYZ D65 and D50.
- **Channel get/set.** `c.get("oklch.l")`, `c.set("hsl.h", 120)`, `c.get("alpha")`.
- **Gamut mapping.** `c.inGamut("srgb")`, `c.toGamut({ space, method })`, with `"clip"`, `"css4"` (CSS Color 4 binary chroma reduction in OKLCh, default), and `"oklch-chroma"` (alias).
- **Tint, shade, tone.** `c.tint(0.2)`, `c.shade(0.2)`, `c.tone(0.2)` — mix toward white / black / mid-grey in OKLab.
- **W3C Compositing and Blending Level 1 blend modes.** `normal`, `multiply`, `screen`, `darken`, `lighten`, `overlay`, `color-dodge`, `color-burn`, `hard-light`, `soft-light`, `difference`, `exclusion`. Per-channel in linear sRGB, then re-encoded.
- **Color scales.** `swatch.scale([c1, c2, ...])` returns a chroma.js-style `Scale` with chainable `.domain([a, b])`, `.classes(n)`, `.padding([l, r])`, `.gamma(g)`, `.mode(spaceId)`, `.correctLightness()`, `.cache(on)`, plus `.colors(n, format?)`.
- **Built-in palettes.** Matplotlib perceptually-uniform colormaps (`viridis`, `magma`, `plasma`, `inferno`, `cividis`) and the ColorBrewer 2.0 sequential (`Blues`, `Greens`, `Reds`, `Oranges`, `Purples`, `Greys`), diverging (`RdBu`, `RdYlBu`, `PiYG`, `BrBG`, `Spectral`), and qualitative (`Set1`, `Set2`, `Set3`, `Pastel1`, `Dark2`) sets. Look up by name: `swatch.scale("viridis")`, `swatch.scale("RdBu")`, etc. List all: `swatch.palettes()`.
- **Scale interpolators.** `swatch.bezier([colors])` (de Casteljau in Lab), `swatch.cubehelix({ start, rotations, hue, gamma, lightness })` (Green 2011).
- **Color naming.** `c.name()` returns `{ name, hex, deltaE }` of the nearest CSS named color measured in ΔE2000; `c.toName()` returns just the string.
- **Temperature.** `swatch.temperature(6500)` (Krystek 1985 blackbody polynomial) and `c.temperature()` (McCamy 1992 inverse approximation). Range 1000 K – 40000 K.
- **Random color generation.** `swatch.random({ space, hue, lightness, chroma, saturation, seed })` with a seeded xorshift32 PRNG for reproducibility.
- **Extra ΔE metrics.** `"94"` (CIE94 graphic arts), `"cmc"` (CMC l:c with optional `{ l, c }` coefficients), `"hyab"` (Abasi & Fairchild HyAB). Existing `"76"`, `"2000"`, `"ok"` still supported.
- **TypeScript definitions rewritten.** `types/swatch.d.ts` now covers the full v3 surface including the `SpaceId` literal union, all per-space channel shapes, the widened `ColorInput`, every option bag, the `Scale` interface, and the `SwatchFactory` statics.
- **New docs.** [`README.md`](./README.md) rewritten for v3. [`MIGRATING.md`](./MIGRATING.md) added with the v2 → v3 cookbook.

### Unchanged

The CVD / APCA / WCAG story is preserved end-to-end:

- `simulate(type, { severity })` — Brettel/Viénot dichromat simulation with a severity continuum
- `daltonize(type, { severity })` — Fidaner error redistribution
- `swatch.checkPalette(colors, { cvd, minDeltaE, mode })`
- `swatch.nearestDistinguishable(target, against, { cvd, minDeltaE, step })`
- `swatch.mostReadable(bg, candidates, { level, size })`
- `contrast(a, b)`, `isReadable(a, b, { level, size })`, `ensureContrast(a, b, { minRatio, direction, step })`
- `apcaContrast(text, background)`

All of these moved to new module paths internally but kept their public signatures.

## 2.0.0-alpha.2 and earlier

See the git history.

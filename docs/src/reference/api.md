---
title: API quick reference
order: 2.5
eyebrow: "Reference · lookup"
description: "A compact lookup table for Swatch factory helpers, instance methods, options, spaces, and color vision deficiency types."
---

Use this page when you already know what you want and need the exact method
name, return shape, or option bag. The deeper pages explain behavior and trade
offs in more detail.

## Factory

| API | Returns | Notes |
| --- | --- | --- |
| `swatch(input)` | `Swatch` | Parse CSS strings, named colors, object literals, state objects, or existing `Swatch` instances. Throws on invalid input. |
| `swatch.try(input)` | `Swatch \| null` | Safe parse helper for live text fields and validation. |
| `swatch.isColor(input)` | `boolean` | Predicate wrapper around `swatch.try`. |
| `swatch.temperature(kelvin)` | `Swatch` | Kelvin → display color. |
| `swatch.random(options?)` | `Swatch` | Random OKLCh or HSL color, optionally seeded/constrained. |
| `swatch.scale(stops)` | `Scale` | Build a continuous scale from color stops, a built-in palette name, or an interpolator. |
| `swatch.bezier(colors)` | `(t) => Swatch` | Bezier interpolator for `swatch.scale`. |
| `swatch.cubehelix(options?)` | `(t) => Swatch` | Cubehelix interpolator for `swatch.scale`. |
| `swatch.palettes()` | `string[]` | Registered built-in palette names. |

## Factory accessibility and CVD helpers

| API | Returns | Notes |
| --- | --- | --- |
| `swatch.contrast(a, b)` | `number` | WCAG 2.1 contrast ratio. |
| `swatch.isReadable(a, b, options?)` | `boolean` | WCAG AA/AAA readability check. |
| `swatch.ensureContrast(a, b, options?)` | `Swatch` | Adjust foreground `a` until it reaches a target ratio against `b`. |
| `swatch.apcaContrast(text, background)` | `number` | Signed APCA Lc value. |
| `swatch.simulate(color, type, options?)` | `Swatch` | CVD simulation. |
| `swatch.daltonize(color, type, options?)` | `Swatch` | Fidaner-style correction for protan/deutan/tritan. |
| `swatch.simulateImageData(imageData, type, options?)` | `ImageDataLike` | Batch CVD simulation for canvas pixels; mutates in place by default. |
| `swatch.daltonizeImageData(imageData, type, options?)` | `ImageDataLike` | Batch raster daltonization; mutates in place by default. |
| `swatch.image.simulate(...)` | `ImageDataLike` | Namespace alias for `simulateImageData`. |
| `swatch.image.daltonize(...)` | `ImageDataLike` | Namespace alias for `daltonizeImageData`. |
| `swatch.checkPalette(colors, options?)` | `PaletteReport` | Pairwise palette distinguishability report. |
| `swatch.nearestDistinguishable(target, against, options?)` | `Swatch` | Nudge one color until it clears a ΔE threshold. |
| `swatch.mostReadable(background, candidates, options?)` | `Swatch` | Pick the best readable foreground candidate. |

## Instance basics

| API | Returns | Notes |
| --- | --- | --- |
| `c.space` | `SpaceId` | Canonical source space. |
| `c.coords` | `[number, number, number]` | Canonical coordinates. |
| `c.alpha` | `number` | Alpha channel. |
| `c.to(space)` | `Swatch` | Convert canonical state to another registered space. |
| `c.clone()` | `Swatch` | Independent copy. |
| `c.equals(other, epsilonOrOptions?)` | `boolean` | Structural comparison with tolerance. |
| `c.toJSON()` | `{ space, coords, alpha }` | Canonical v3 state shape. |

## Space getters

Getters return named-channel objects and do not gamut-map. Wide-gamut colors can
produce out-of-range `.srgb` values.

| Getter | Shape |
| --- | --- |
| `c.srgb`, `c.linearSrgb`, `c.displayP3`, `c.rec2020`, `c.a98`, `c.prophoto` | `{ r, g, b }` |
| `c.xyz` | `{ x, y, z }` |
| `c.lab`, `c.oklab` | `{ l, a, b }` |
| `c.lch`, `c.oklch` | `{ l, c, h }` |
| `c.hsl`, `c.hsluv` | `{ h, s, l }` |
| `c.hsv` | `{ h, s, v }` |
| `c.hwb` | `{ h, w, b }` |
| `c.luv` | `{ l, u, v }` |
| `c.cmyk` | `{ c, m, y, k }` |

## Serialization

| API | Returns | Notes |
| --- | --- | --- |
| `c.toString(options?)` | `string` | CSS serialization. |
| `c.toCss(options?)`, `c.css(options?)` | `string` | Aliases for CSS serialization. |
| `c.hex(options?)` | `string` | `#rrggbb` by default; gamut-maps to sRGB before serializing. |
| `c.rgb(options?)` | `{ r, g, b, a? }` | Byte RGB object; gamut-maps to sRGB before serializing. |

Common `format` values: `"hex"`, `"hex-alpha"`, `"rgb"`, `"hsl"`, `"hwb"`,
`"lab"`, `"lch"`, `"oklab"`, `"oklch"`, and `"color"`.

## Channels and gamut

| API | Returns | Notes |
| --- | --- | --- |
| `c.get(path)` | `number` | Read `"alpha"` or a path such as `"oklch.l"`. |
| `c.set(path, value)` | `Swatch` | Return a new color with one channel changed. |
| `c.gamut` | `SpaceId \| null` | Smallest standard RGB gamut containing the color. |
| `c.inGamut(space?, options?)` | `boolean` | Check whether the color fits a target RGB gamut. |
| `c.toGamut(options?)` | `Swatch` | Map into a target gamut. |

## Manipulation, mixing, and blending

| API | Returns | Notes |
| --- | --- | --- |
| `c.lighten(amount?, options?)` | `Swatch` | Add to OKLCh `L`. |
| `c.darken(amount?, options?)` | `Swatch` | Subtract from OKLCh `L`. |
| `c.saturate(amount?, options?)` | `Swatch` | Add to OKLCh `C`. |
| `c.desaturate(amount?, options?)` | `Swatch` | Subtract from OKLCh `C`. |
| `c.spin(degrees, options?)` | `Swatch` | Rotate OKLCh hue. |
| `c.greyscale(options?)` | `Swatch` | Set OKLCh chroma to zero. |
| `c.complement(options?)` | `Swatch` | `spin(180)`. |
| `c.invert()` | `Swatch` | Invert sRGB channels. |
| `c.tint(amount?)` | `Swatch` | Mix toward white in OKLab. |
| `c.shade(amount?)` | `Swatch` | Mix toward black in OKLab. |
| `c.tone(amount?)` | `Swatch` | Mix toward mid-grey in OKLab. |
| `c.mix(other, amount?, options?)` | `Swatch` | Interpolate toward another color. |
| `c.blend(other, mode)` | `Swatch` | W3C-style blend mode. |

## Color science and accessibility

| API | Returns | Notes |
| --- | --- | --- |
| `c.deltaE(other, mode?, options?)` | `number` | Default mode is CIEDE2000. |
| `c.name()` | `{ name, hex, deltaE }` | Nearest CSS named color. |
| `c.toName()` | `string` | Name only. |
| `c.temperature()` | `number` | Estimated correlated color temperature. |
| `c.luminance()` | `number` | WCAG relative luminance. |
| `c.contrast(other)` | `number` | WCAG 2.1 contrast ratio. |
| `c.isReadable(other, options?)` | `boolean` | WCAG readability check. |
| `c.ensureContrast(other, options?)` | `Swatch` | Adjust this foreground against `other`. |
| `c.apcaContrast(background)` | `number` | Signed APCA Lc, with receiver as text. |
| `c.simulate(type, options?)` | `Swatch` | CVD simulation. |
| `c.daltonize(type, options?)` | `Swatch` | CVD correction for protan/deutan/tritan. |

## Scale

| API | Returns | Notes |
| --- | --- | --- |
| `scale(t)` | `Swatch` | Sample at `t`. |
| `scale.colors(n)` | `Swatch[]` | Sample `n` colors. |
| `scale.colors(n, format)` | `string[]` | Sample and serialize. |
| `scale.domain([min, max])` | `Scale` | Set input domain. |
| `scale.classes(nOrBreaks)` | `Scale` | Discretize output. |
| `scale.padding(p)` | `Scale` | Trim scale ends. |
| `scale.gamma(g)` | `Scale` | Apply emphasis curve. |
| `scale.mode(space)` | `Scale` | Set interpolation space. |
| `scale.correctLightness(enable?)` | `Scale` | Resample for linear Lab lightness. |
| `scale.cache(on)` | `Scale` | Toggle memoization. |

## Constants and option values

Use constants when you want autocomplete:

```js
swatch("#ff0000").to(swatch.spaces.oklch);
swatch("#ff0000").simulate(swatch.cvd.deutan);
```

Common option values:

| Option | Values |
| --- | --- |
| Color spaces | `srgb`, `display-p3`, `rec2020`, `a98`, `prophoto`, `xyz`, `lab`, `lch`, `oklab`, `oklch`, `hsl`, `hsv`, `hwb`, `cmyk`, `luv`, `hsluv` |
| CVD types | `protan`, `deutan`, `tritan`, `achroma` plus `*-opia` / `*-omaly` aliases |
| ΔE modes | `2000`, `76`, `94`, `cmc`, `hyab`, `ok` |
| Gamut methods | `css4`, `oklch-chroma`, `clip` |
| Blend modes | `normal`, `multiply`, `screen`, `darken`, `lighten`, `overlay`, `color-dodge`, `color-burn`, `hard-light`, `soft-light`, `difference`, `exclusion` |
| WCAG levels | `AA`, `AAA` |
| WCAG sizes | `normal`, `large`, `ui` |

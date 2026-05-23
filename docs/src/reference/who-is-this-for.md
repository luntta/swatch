---
title: Who is this library for?
order: 1.5
eyebrow: "Guide"
description: "When Swatch is a good fit, when it is probably overkill, and the kinds of color work it is designed to make safer."
---

Swatch is for developers who need colors to behave like colors people actually
see — not just hex strings with convenience methods.

It is a good fit when correctness, accessibility, perceptual uniformity, or
wide-gamut color matter more than having the smallest possible helper.

## Use Swatch when you are building

### Design systems and UI kits

Use Swatch when your tokens need predictable hover states, selected states,
disabled states, and accessible foreground/background pairs:

```js
const brand = swatch("#3b82f6");

export const button = {
  bg: brand.hex(),
  hover: brand.darken(0.08).hex(),
  active: brand.darken(0.14).hex(),
  text: swatch.mostReadable(brand, ["#fff", "#000"]).hex(),
};
```

OKLCh-based manipulation keeps lightness and chroma changes closer to how the
eye perceives them than HSL-style channel math.

### Accessibility tooling

Swatch is especially useful in lint rules, color-token audits, visual QA tools,
and design-system checks:

```js
const fg = swatch("#767676");
const bg = swatch("#ffffff");

fg.contrast(bg);                    // WCAG 2.1 ratio
fg.apcaContrast(bg);                // signed APCA Lc
fg.isReadable(bg, { level: "AA" }); // boolean
fg.ensureContrast(bg, { minRatio: 4.5 }).hex();
```

It also includes first-class color vision deficiency simulation and palette
distinguishability checks, which are usually separate concerns in smaller color
libraries.

### Data visualization, maps, and dashboards

If colors encode meaning, you need more than "looks different to me." Swatch can
generate scales, use ColorBrewer and scientific palettes, and check whether
palette colors remain distinguishable under color vision deficiencies:

```js
const palette = swatch.scale("viridis").colors(7, "hex");

const report = swatch.checkPalette(palette, {
  cvd: "deutan",
  minDeltaE: 11,
});

if (!report.safe) {
  console.warn(report.unsafe);
}
```

### Product features for colorblind users

Swatch is a good fit for apps, games, editors, and dashboards that need
colorblind preview or a "color blind mode":

```js
const danger = swatch("#ef4444");

danger.simulate("protan").hex();  // preview
danger.daltonize("protan").hex(); // adjusted display color
```

### Modern CSS and wide-gamut workflows

Use it when you need to parse, convert, or serialize modern CSS colors without
collapsing everything to sRGB too early:

```js
const p3 = swatch("color(display-p3 1 0 0)");

p3.inGamut("srgb");                       // false
p3.toGamut({ space: "srgb" }).hex();      // mapped display-safe fallback
p3.toString({ format: "color" });         // preserve native color() form
```

### Color science-adjacent work

Swatch is useful when you need OKLab/OKLCh, Lab/LCh, ΔE, color temperature,
blend modes, mixing spaces, gamut mapping, or CSS Color 4 behavior without
assembling those pieces yourself.

## It may be overkill when

- You only need to normalize `#rgb` to `#rrggbb`.
- You only need a tiny HSL lighten/darken helper.
- Bundle size is more important than perceptual correctness or accessibility.
- You need print-production CMYK with ICC profiles. Swatch's CMYK support is a
  naive screen-oriented view, not a color-management system.
- You need a mutable object model. Swatch instances are immutable by design.

## Mental model

Swatch keeps the original color space as canonical state, converts lazily, and
returns a new `Swatch` for every operation:

```js
const root = swatch("oklch(0.62 0.18 250)");
const hover = root.lighten(0.06);

root.hex();  // unchanged
hover.hex(); // derived color
```

That makes it a good foundation for code that treats color as durable data:
design tokens, generated palettes, accessibility checks, visual regression
fixtures, and user-facing color tools.

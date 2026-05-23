---
title: Channel get / set
order: 15
eyebrow: "Reference · §15"
---

Read or write individual channels using a `"space.channel"` path syntax.

## get

```js
c.get("oklch.l");        // lightness in OKLCh
c.get("hsl.h");          // hue in HSL
c.get("srgb.r");         // red in sRGB (0–1)
c.get("cmyk.k");         // computed CMYK black
c.get("alpha");          // alpha channel
```

## set

Returns a new swatch (immutable):

```js
c.set("oklch.l", 0.8);          // set OKLCh lightness to 0.8
c.set("hsl.h", 120);            // set HSL hue to 120°
c.set("cmyk.k", 0.5);           // adjust computed CMYK black
c.set("alpha", 0.5);            // set alpha
```

In TypeScript, channel paths are a string-literal union, so
`"oklch.lightness"` is a compile-time error.

## .to()

Convert to a new native space:

```js
c.to("oklch");                   // Swatch with space: "oklch"
c.to("display-p3");              // Swatch with space: "display-p3"
```

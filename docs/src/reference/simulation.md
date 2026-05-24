---
title: Simulation
order: 3
eyebrow: "Reference · §03"
---

Physically correct sRGB → linear → LMS projection onto the dichromat
confusion plane (Brettel 1997 / Viénot 1999).

```js
const red = swatch("#ff0000");

red.simulate("protan");                       // full protanopia
red.simulate("deutan", { severity: 0.6 });    // 60% deuteranomaly
red.simulate("tritan");
red.simulate("achroma");                      // Rec. 709 grayscale
```

## Accepted types

| Canonical | Aliases |
|-----------|---------|
| `protan`  | `protanopia`, `protanomaly` |
| `deutan`  | `deuteranopia`, `deuteranomaly` |
| `tritan`  | `tritanopia`, `tritanomaly` |
| `achroma` | `achromatopsia` |

## The severity continuum

`severity` `0.0` returns the identity (the original color). `1.0` returns the
full dichromat. Values in between are a linear interpolation of the RGB
transform matrix, matching the Machado 2009 model's behavior along the
continuum.

```js
red.simulate("protan", { severity: 0 });   // identity
red.simulate("protan", { severity: 0.5 }); // mild protanomaly
red.simulate("protan", { severity: 1 });   // full protanopia
```

Walk the slider in the §02 panel of the [playground](/) to feel it live.

## Images and canvas

For JPEG/PNG/WebP previews, draw the user-selected file to a `<canvas>`, read
the pixels, and run the batch ImageData transform:

```js
const bitmap = await createImageBitmap(file);
canvas.width = bitmap.width;
canvas.height = bitmap.height;

const ctx = canvas.getContext("2d");
ctx.drawImage(bitmap, 0, 0);

const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
swatch.simulateImageData(imageData, "deutan", { severity: 1 });
ctx.putImageData(imageData, 0, 0);
```

`simulateImageData` mutates in place by default and returns the same
ImageData-like object. Pass `{ inPlace: false }` when you need a copy:

```js
const simulated = swatch.simulateImageData(source, "protan", {
  severity: 0.8,
  inPlace: false,
});
```

The image path is optimized for throughput: sRGB byte → linear-light and
linear-light → sRGB byte lookup tables are reused, the CVD matrix is computed
once per image, and alpha bytes are preserved untouched. For large live
previews, run it in a Web Worker or downscale the preview while the user drags a
slider.

The §14 panel of the [playground](/#image-cvd) lets you try this locally with a
user-chosen image.

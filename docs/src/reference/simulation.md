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

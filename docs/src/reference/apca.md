---
title: APCA (WCAG 3 draft)
order: 11
eyebrow: "Reference · §11"
---

Andrew Somers' SAPC-based contrast algorithm. Returns a signed `Lc` value on
a roughly `[-108, +106]` scale.

```js
swatch.apcaContrast("#000000", "#ffffff");  //  106.04  (BoW)
swatch.apcaContrast("#ffffff", "#000000");  // -107.88  (WoB)
swatch.apcaContrast("#767676", "#ffffff");  //   71.6   (fails body-text min)
```

**Sign:** positive = dark text on a light background; negative = light text
on a dark background.

**Typical body-text thresholds:** `|Lc| ≥ 75` is comfortable for sustained
reading; `≥ 60` is the practical minimum.

APCA runs alongside the WCAG 2.1 ratio in §04 of the [playground](/).

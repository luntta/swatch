---
title: Temperature
order: 20
eyebrow: "Reference · §20"
---

## From Kelvin to color

Krystek 1985 blackbody polynomial, valid 1000 K – 40000 K:

```js
swatch.temperature(6500);    // D65 daylight white
swatch.temperature(2700);    // warm incandescent
swatch.temperature(10000);   // cool blue sky
```

## From color to Kelvin

McCamy 1992 inverse CCT approximation:

```js
swatch("#ff8844").temperature();   // ≈ 2100 K
swatch("#ffffff").temperature();   // ≈ 6500 K
```

The §11 playground panel has a live slider and inverse readout.

---
title: WCAG accessibility
order: 10
eyebrow: "Reference · §10"
---

```js
swatch("#ffffff").contrast("#000000");          // 21
swatch("#767676").isReadable("#ffffff");        // true (AA normal)
swatch("#767676").isReadable("#ffffff", { level: "AAA", size: "normal" });
swatch("#767676").isReadable("#ffffff", { level: "AA",  size: "large" });
```

## Auto-fix

`ensureContrast` walks a foreground until it meets a target ratio, preserving
hue:

```js
swatch("#888888").ensureContrast("#ffffff", { minRatio: 4.5 });
// → a darker version of #888 that clears 4.5:1 on white.
```

## Pick the best of N

```js
swatch.mostReadable("#ffffff", ["#888", "#555", "#222"]);
// → swatch("#222222")
```

Both helpers are exposed live in §04 of the [playground](/).

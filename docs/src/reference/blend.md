---
title: Blend modes
order: 18
eyebrow: "Reference · §18"
---

W3C Compositing and Blending Level 1 blend modes, applied per-channel in
linear sRGB then re-encoded.

```js
a.blend(b, "multiply");
```

## Available modes

| Mode | Formula |
|---|---|
| `normal` | `B` |
| `multiply` | `A × B` |
| `screen` | `A + B − A × B` |
| `darken` | `min(A, B)` |
| `lighten` | `max(A, B)` |
| `overlay` | multiply/screen split at 0.5 |
| `color-dodge` | `A / (1 − B)` |
| `color-burn` | `1 − (1 − A) / B` |
| `hard-light` | overlay with swapped inputs |
| `soft-light` | W3C soft-light formula |
| `difference` | `|A − B|` |
| `exclusion` | `A + B − 2AB` |

All operations happen in linear sRGB to avoid gamma artifacts. The result is
returned as a new swatch in sRGB space.

See the §07 playground panel for live preview.

import { describe, it, expect } from "vitest";
import "../src/bootstrap.js";
import { swatch } from "../src/core/swatch-class.js";
import {
	luminance,
	contrast,
	isReadable,
	ensureContrast
} from "../src/operations/accessibility.js";
import { apcaContrast } from "../src/operations/apca.js";
import { simulate, daltonize } from "../src/operations/cvd.js";
import {
	checkPalette,
	nearestDistinguishable,
	mostReadable
} from "../src/operations/palette.js";

// Phase 16: port CVD, accessibility, palette helpers.

describe("Phase 16: WCAG contrast + luminance", () => {
	it("black on white is exactly 21:1", () => {
		expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 5);
	});

	it("white on white is exactly 1", () => {
		expect(contrast("#ffffff", "#ffffff")).toBeCloseTo(1, 9);
	});

	it("is symmetric", () => {
		const a = contrast("#123456", "#fedcba");
		const b = contrast("#fedcba", "#123456");
		expect(a).toBeCloseTo(b, 10);
	});

	it("luminance of white is 1", () => {
		expect(luminance("#ffffff")).toBeCloseTo(1, 5);
	});

	it("luminance of black is 0", () => {
		expect(luminance("#000000")).toBeCloseTo(0, 10);
	});

	it("maps wide-gamut inputs into sRGB before WCAG metrics", () => {
		const wide = swatch("color(display-p3 1 0 0)");
		const mapped = wide.toGamut({ space: "srgb" });
		expect(luminance(wide)).toBeCloseTo(luminance(mapped), 10);
		expect(contrast(wide, "#ffffff")).toBeCloseTo(
			contrast(mapped, "#ffffff"),
			10
		);
	});
});

describe("Phase 16: isReadable", () => {
	it("black on white passes AA normal", () => {
		expect(isReadable("#000000", "#ffffff")).toBe(true);
	});

	it("white on white fails", () => {
		expect(isReadable("#ffffff", "#ffffff")).toBe(false);
	});

	it("respects level AAA", () => {
		// #767676 on white is ~4.5:1 (near the AA threshold).
		// Should pass AA normal but fail AAA normal.
		expect(isReadable("#767676", "#ffffff", { level: "AA" })).toBe(true);
		expect(isReadable("#767676", "#ffffff", { level: "AAA" })).toBe(false);
	});

	it("respects size large (lower threshold)", () => {
		// A mid-gray that passes large AA (≥3) but not normal AA (≥4.5).
		const c = "#949494";
		const ratio = contrast(c, "#ffffff");
		expect(ratio).toBeGreaterThan(3);
		expect(ratio).toBeLessThan(4.5);
		expect(isReadable(c, "#ffffff", { size: "large" })).toBe(true);
		expect(isReadable(c, "#ffffff", { size: "normal" })).toBe(false);
	});
});

describe("Phase 16: ensureContrast", () => {
	it("returns color unchanged if already meets threshold", () => {
		const c = swatch("#000000");
		const r = ensureContrast(c, "#ffffff", { minRatio: 4.5 });
		expect(r.hsl.l).toBeCloseTo(c.hsl.l, 5);
	});

	it("walks until threshold met", () => {
		const r = ensureContrast("#888888", "#ffffff", { minRatio: 7 });
		expect(contrast(r, "#ffffff")).toBeGreaterThanOrEqual(7);
	});

	it("direction auto darkens on a light background", () => {
		const r = ensureContrast("#ff8800", "#ffffff", { minRatio: 4.5 });
		// Should be darker than the input.
		expect(r.hsl.l).toBeLessThan(swatch("#ff8800").hsl.l);
	});

	it("direction auto lightens on a dark background", () => {
		const r = ensureContrast("#333333", "#000000", { minRatio: 4.5 });
		expect(r.hsl.l).toBeGreaterThan(swatch("#333333").hsl.l);
	});

	it("falls back to black/white when no walk succeeds", () => {
		// A pathological request — no color in HSL can give 22:1 contrast
		// against mid-gray, because 21 is the max possible ratio.
		const r = ensureContrast("#777777", "#7f7f7f", { minRatio: 22 });
		// Will end up at the fallback — either black or white.
		const hex = r.toString({ format: "hex" });
		expect(["#000000", "#ffffff"]).toContain(hex);
	});

	it("adjusts wide-gamut foregrounds against sRGB backgrounds", () => {
		const r = ensureContrast("color(display-p3 1 0 0)", "#ffffff", {
			minRatio: 4.5
		});
		expect(contrast(r, "#ffffff")).toBeGreaterThanOrEqual(4.5);
	});
});

describe("Phase 16: APCA", () => {
	it("black text on white background is positive", () => {
		expect(apcaContrast("#000000", "#ffffff")).toBeGreaterThan(100);
	});

	it("white text on black background is negative", () => {
		expect(apcaContrast("#ffffff", "#000000")).toBeLessThan(-100);
	});

	it("identical colors give 0", () => {
		expect(apcaContrast("#888888", "#888888")).toBe(0);
	});

	it("wired as c.apcaContrast(bg)", () => {
		const text = swatch("#000000");
		expect(text.apcaContrast("#ffffff")).toBeGreaterThan(100);
	});

	it("maps wide-gamut inputs into sRGB before APCA", () => {
		const wide = swatch("color(display-p3 1 0 0)");
		const mapped = wide.toGamut({ space: "srgb" });
		const lc = apcaContrast(wide, "#ffffff");
		expect(Number.isFinite(lc)).toBe(true);
		expect(lc).toBeCloseTo(apcaContrast(mapped, "#ffffff"), 10);
	});
});

describe("Phase 16: CVD simulate", () => {
	it("severity=0 returns near-identical color", () => {
		const c = swatch("#ff0000");
		const out = simulate(c, "protan", { severity: 0 });
		expect(out.srgb.r).toBeCloseTo(1, 5);
		expect(out.srgb.g).toBeCloseTo(0, 5);
		expect(out.srgb.b).toBeCloseTo(0, 5);
	});

	it("severity=1 protan dims red significantly", () => {
		const c = swatch("#ff0000");
		const out = simulate(c, "protan", { severity: 1 });
		expect(out.srgb.r).toBeLessThan(0.5);
	});

	it("deutan and tritan are also supported", () => {
		expect(() => simulate("#00ff00", "deutan")).not.toThrow();
		expect(() => simulate("#0000ff", "tritan")).not.toThrow();
	});

	it("achromatopsia turns red into a gray", () => {
		const out = simulate("#ff0000", "achroma", { severity: 1 }).srgb;
		// All three channels should be equal (monochrome).
		expect(out.g).toBeCloseTo(out.r, 3);
		expect(out.b).toBeCloseTo(out.r, 3);
	});

	it("aliases are accepted", () => {
		expect(() => simulate("#ff0000", "protanopia")).not.toThrow();
		expect(() => simulate("#ff0000", "deuteranomaly")).not.toThrow();
	});

	it("unknown type throws", () => {
		expect(() => simulate("#ff0000", "nope")).toThrow(/Unknown CVD/);
	});

	it("wired as c.simulate(type)", () => {
		const out = swatch("#ff0000").simulate("protan");
		expect(out.space).toBe("srgb");
	});
});

describe("Phase 16: CVD daltonize", () => {
	it("daltonizing red for protanopia produces a distinguishable result", () => {
		const red = swatch("#ff0000");
		const corrected = daltonize(red, "protan");
		// The daltonized result should differ from the input — it's a
		// shifted color designed for the remaining channels.
		expect(corrected.equals(red, 0.01)).toBe(false);
	});

	it("achroma is not correctable", () => {
		expect(() => daltonize("#ff0000", "achroma")).toThrow(
			/cannot be corrected/
		);
	});

	it("wired as c.daltonize(type)", () => {
		expect(() => swatch("#ff0000").daltonize("deutan")).not.toThrow();
	});
});

describe("Phase 16: palette helpers", () => {
	it("checkPalette reports safe for a well-separated palette", () => {
		const r = checkPalette(["#ff0000", "#00ff00", "#0000ff"], {
			minDeltaE: 20
		});
		expect(r.safe).toBe(true);
		expect(r.pairs.length).toBe(3);
	});

	it("checkPalette reports unsafe for near-duplicate colors", () => {
		const r = checkPalette(["#ff0000", "#ff0001"], { minDeltaE: 5 });
		expect(r.safe).toBe(false);
		expect(r.unsafe.length).toBe(1);
	});

	it("checkPalette with cvd option runs simulation first", () => {
		// Two colors that are fine in normal vision but collide in protanopia.
		const r = checkPalette(["#ff0000", "#9f7000"], {
			cvd: "protan",
			minDeltaE: 20
		});
		// The test verifies it runs and returns a structure.
		expect(r).toHaveProperty("pairs");
		expect(r).toHaveProperty("unsafe");
	});

	it("nearestDistinguishable finds a more-contrasted variant", () => {
		const r = nearestDistinguishable("#ff0000", "#ff0001", {
			minDeltaE: 10
		});
		// Result must be at least 10 ΔE away from #ff0001 in the given mode.
		const target = swatch("#ff0001");
		expect(r.deltaE(target, "2000")).toBeGreaterThanOrEqual(10);
	});

	it("mostReadable picks highest-contrast candidate passing WCAG", () => {
		const picked = mostReadable("#ffffff", ["#eeeeee", "#888888", "#000000"]);
		// Only #000000 passes AA normal against white.
		expect(picked.toString({ format: "hex" })).toBe("#000000");
	});

	it("mostReadable falls back to black/white when none pass", () => {
		const picked = mostReadable("#888888", ["#7a7a7a", "#969696"]);
		const hex = picked.toString({ format: "hex" });
		expect(["#000000", "#ffffff"]).toContain(hex);
	});

	it("mostReadable with includeFallback=false returns the best attempt", () => {
		const picked = mostReadable("#888888", ["#7a7a7a", "#969696"], {
			includeFallback: false
		});
		const hex = picked.toString({ format: "hex" });
		expect(["#7a7a7a", "#969696"]).toContain(hex);
	});
});

describe("Phase 16: static wiring", () => {
	it("swatch.contrast works", () => {
		expect(swatch.contrast("#000", "#fff")).toBeCloseTo(21, 5);
	});

	it("swatch.apcaContrast works", () => {
		expect(swatch.apcaContrast("#000", "#fff")).toBeGreaterThan(100);
	});

	it("swatch.checkPalette works", () => {
		const r = swatch.checkPalette(["#ff0000", "#00ff00"]);
		expect(r.pairs.length).toBe(1);
	});

	it("swatch.mostReadable works", () => {
		const picked = swatch.mostReadable("#ffffff", ["#000000", "#cccccc"]);
		expect(picked.toString({ format: "hex" })).toBe("#000000");
	});
});

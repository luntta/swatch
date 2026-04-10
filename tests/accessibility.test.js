import { describe, it, expect } from "vitest";
import swatch from "../src/_v2-monolith.js";

describe("contrast (WCAG 2.1 ratio)", () => {
	it("white on black = 21", () => {
		expect(swatch("#ffffff").contrast("#000000")).toBeCloseTo(21, 1);
	});

	it("is symmetric", () => {
		const a = swatch("#3366cc");
		const b = swatch("#ffa500");
		expect(a.contrast(b)).toBeCloseTo(b.contrast(a), 6);
	});

	it("identity = 1", () => {
		expect(swatch("#abcdef").contrast("#abcdef")).toBeCloseTo(1, 6);
	});

	it("#767676 on white is exactly the 4.5 threshold", () => {
		// WCAG 2.1 AA body text minimum; #767676 is the canonical
		// reference that sits just at 4.5:1 on white.
		expect(swatch("#767676").contrast("#ffffff")).toBeCloseTo(4.54, 1);
	});

	it("accepts string, object, and swatch inputs", () => {
		const c = swatch("#ffffff");
		expect(c.contrast("#000000")).toBeCloseTo(21, 1);
		expect(c.contrast({ r: 0, g: 0, b: 0 })).toBeCloseTo(21, 1);
		expect(c.contrast(swatch("#000000"))).toBeCloseTo(21, 1);
	});
});

describe("isReadable (WCAG 2.1)", () => {
	const white = "#ffffff";

	it("defaults to AA / normal (threshold 4.5)", () => {
		expect(swatch("#767676").isReadable(white)).toBe(true);
		expect(swatch("#777777").isReadable(white)).toBe(false);
	});

	it("AA large text threshold is 3", () => {
		// #888888 ≈ 3.5:1 (passes), #a0a0a0 ≈ 2.7:1 (fails); the 3:1
		// boundary sits between them.
		expect(
			swatch("#888888").isReadable(white, { size: "large" })
		).toBe(true);
		expect(
			swatch("#a0a0a0").isReadable(white, { size: "large" })
		).toBe(false);
	});

	it("AA ui threshold is 3", () => {
		expect(
			swatch("#888888").isReadable(white, { size: "ui" })
		).toBe(true);
	});

	it("AAA normal threshold is 7", () => {
		// #595959 on white ≈ 7.0
		expect(
			swatch("#595959").isReadable(white, { level: "AAA" })
		).toBe(true);
		expect(
			swatch("#6a6a6a").isReadable(white, { level: "AAA" })
		).toBe(false);
	});

	it("AAA large threshold is 4.5", () => {
		expect(
			swatch("#767676").isReadable(white, {
				level: "AAA",
				size: "large"
			})
		).toBe(true);
	});
});

describe("ensureContrast", () => {
	it("returns the same color when already readable", () => {
		const c = swatch("#000000");
		const out = c.ensureContrast("#ffffff", { minRatio: 4.5 });
		expect(out.rgb).toEqual(c.rgb);
	});

	it("walks lightness until the ratio is met", () => {
		const out = swatch("#888888").ensureContrast("#ffffff", {
			minRatio: 4.5
		});
		expect(out.contrast("#ffffff")).toBeGreaterThanOrEqual(4.5);
	});

	it("preserves hue", () => {
		const c = swatch("hsl(200,80%,60%)");
		const out = c.ensureContrast("#ffffff", { minRatio: 4.5 });
		// Tolerance: round-trip HSL drift of a degree or two.
		expect(Math.abs(out.hsl.h - c.hsl.h)).toBeLessThan(3);
	});

	it("auto direction picks darker for light backgrounds", () => {
		const c = swatch("#999999");
		const out = c.ensureContrast("#ffffff", { minRatio: 4.5 });
		expect(out.hsl.l).toBeLessThan(c.hsl.l);
	});

	it("auto direction picks lighter for dark backgrounds", () => {
		const c = swatch("#444444");
		const out = c.ensureContrast("#000000", { minRatio: 4.5 });
		expect(out.hsl.l).toBeGreaterThan(c.hsl.l);
	});

	it("honors explicit direction even against auto", () => {
		const c = swatch("#666666");
		const out = c.ensureContrast("#ffffff", {
			minRatio: 4.5,
			direction: "lighter"
		});
		// "lighter" on white will fail; the function falls back to
		// the opposite direction and should still satisfy the ratio.
		expect(out.contrast("#ffffff")).toBeGreaterThanOrEqual(4.5);
	});

	it("when the threshold is unreachable, falls back to the highest-contrast extreme", () => {
		// No HSL lightness against white can reach a 25:1 ratio (max is
		// 21:1 at pure black). The function should fall back to pure
		// black, the highest-contrast option on a white background.
		const out = swatch("#ffff00").ensureContrast("#ffffff", {
			minRatio: 25
		});
		expect(out.hex).toBe("#000000");
	});
});

describe("swatch.mostReadable", () => {
	it("picks the highest-contrast candidate that passes", () => {
		const out = swatch.mostReadable("#ffffff", [
			"#888888",
			"#555555",
			"#222222"
		]);
		expect(out.hex).toBe("#222222");
	});

	it("excludes candidates that fail the threshold", () => {
		// All candidates fail AA (4.5) against white; with a strict
		// level nothing passes and we fall back.
		const out = swatch.mostReadable(
			"#ffffff",
			["#aaaaaa", "#999999", "#cccccc"],
			{ level: "AA" }
		);
		// Fallback is black (highest contrast extreme on white).
		expect(out.hex).toBe("#000000");
	});

	it("includeFallback=false returns the highest-contrast candidate regardless", () => {
		const out = swatch.mostReadable(
			"#ffffff",
			["#aaaaaa", "#cccccc"],
			{ level: "AA", includeFallback: false }
		);
		expect(out.hex).toBe("#aaaaaa"); // higher contrast of the two
	});

	it("accepts swatch instances in the candidate list", () => {
		const out = swatch.mostReadable("#ffffff", [
			swatch("#222222"),
			swatch("#999999")
		]);
		expect(out.hex).toBe("#222222");
	});
});

describe("swatch.apcaContrast (WCAG 3 draft)", () => {
	// Reference values from Andrew Somers' SAPC-APCA test data.
	// Tolerance 0.5 Lc allows for our "simple" gamma model.

	it("black on white ≈ 106.04", () => {
		expect(swatch.apcaContrast("#000000", "#ffffff")).toBeCloseTo(
			106.04,
			1
		);
	});

	it("white on black ≈ -107.88", () => {
		expect(swatch.apcaContrast("#ffffff", "#000000")).toBeCloseTo(
			-107.88,
			1
		);
	});

	it("#767676 on white ≈ 71.6 (the WCAG 2.1 4.5 threshold fails APCA body text)", () => {
		// #767676 barely clears WCAG 2.1 AA (4.54:1) but is clearly
		// below the APCA 75 Lc body-text minimum — demonstrates why
		// APCA is more conservative for small text.
		const lc = swatch.apcaContrast("#767676", "#ffffff");
		expect(lc).toBeGreaterThan(70);
		expect(lc).toBeLessThan(75);
	});

	it("identity = 0", () => {
		expect(swatch.apcaContrast("#888888", "#888888")).toBe(0);
	});

	it("sign flips when polarity flips", () => {
		const bow = swatch.apcaContrast("#000000", "#ffffff"); // positive
		const wob = swatch.apcaContrast("#ffffff", "#000000"); // negative
		expect(bow).toBeGreaterThan(0);
		expect(wob).toBeLessThan(0);
	});

	it("clamps near-equal luminances to 0", () => {
		// Values within deltaYmin (0.0005) should produce 0.
		expect(swatch.apcaContrast("#808080", "#818181")).toBe(0);
	});

	it("accepts swatch instances", () => {
		const lc = swatch.apcaContrast(swatch("#000"), swatch("#fff"));
		expect(lc).toBeCloseTo(106.04, 1);
	});
});

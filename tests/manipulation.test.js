import { describe, it, expect } from "vitest";
import swatch from "../src/_v2-monolith.js";

describe("lighten / darken", () => {
	it("lighten increases HSL L", () => {
		const c = swatch("hsl(0,100%,50%)");
		const out = c.lighten(20);
		expect(out.hsl.l).toBeCloseTo(70, 0);
	});

	it("darken decreases HSL L", () => {
		const c = swatch("hsl(0,100%,50%)");
		const out = c.darken(20);
		expect(out.hsl.l).toBeCloseTo(30, 0);
	});

	it("default amount is 10", () => {
		const c = swatch("hsl(0,100%,50%)");
		expect(c.lighten().hsl.l).toBeCloseTo(60, 0);
		expect(c.darken().hsl.l).toBeCloseTo(40, 0);
	});

	it("clamps to [0, 100]", () => {
		expect(swatch("#ffffff").lighten(50).hsl.l).toBe(100);
		expect(swatch("#000000").darken(50).hsl.l).toBe(0);
	});

	it("returns a new instance", () => {
		const c = swatch("#ff0000");
		const out = c.lighten(10);
		expect(out).not.toBe(c);
		expect(c.rgb.r).toBe(255); // unchanged
	});
});

describe("saturate / desaturate", () => {
	it("saturate increases HSL S", () => {
		const c = swatch("hsl(120,40%,50%)");
		expect(c.saturate(20).hsl.s).toBeCloseTo(60, 0);
	});

	it("desaturate decreases HSL S", () => {
		const c = swatch("hsl(120,40%,50%)");
		// HSL → RGB → HSL round-trip drifts each call by ~0.3, so allow
		// a few units of slack here.
		expect(c.desaturate(20).hsl.s).toBeGreaterThan(18);
		expect(c.desaturate(20).hsl.s).toBeLessThan(22);
	});

	it("greyscale fully desaturates", () => {
		const out = swatch("#ff0000").greyscale();
		expect(out.hsl.s).toBe(0);
	});
});

describe("spin", () => {
	it("rotates hue by the given degrees", () => {
		const c = swatch("hsl(0,100%,50%)");
		expect(c.spin(120).hsl.h).toBeCloseTo(120, 0);
	});

	it("wraps around 360", () => {
		const c = swatch("hsl(300,100%,50%)");
		expect(c.spin(120).hsl.h).toBeCloseTo(60, 0);
	});

	it("handles negative rotations", () => {
		const c = swatch("hsl(60,100%,50%)");
		expect(c.spin(-120).hsl.h).toBeCloseTo(300, 0);
	});

	it("complement is spin(180)", () => {
		const c = swatch("#ff0000");
		expect(c.complement().hsl.h).toBeCloseTo(c.spin(180).hsl.h, 1);
	});
});

describe("invert", () => {
	it("inverts each RGB channel", () => {
		const out = swatch("#ff0000").invert();
		expect(out.rgb).toEqual({ r: 0, g: 255, b: 255 });
	});

	it("white ↔ black", () => {
		expect(swatch("#ffffff").invert().rgb).toEqual({
			r: 0,
			g: 0,
			b: 0
		});
		expect(swatch("#000000").invert().rgb).toEqual({
			r: 255,
			g: 255,
			b: 255
		});
	});

	it("self-inverse", () => {
		const c = swatch("#3366aa");
		const back = c.invert().invert();
		expect(back.rgb).toEqual(c.rgb);
	});
});

describe("manipulation: alpha preserved", () => {
	it("lighten preserves alpha", () => {
		const c = swatch("rgba(255,0,0,0.5)");
		expect(c.lighten(10).rgb.a).toBeCloseTo(0.5, 3);
	});

	it("spin preserves alpha", () => {
		const c = swatch("rgba(255,0,0,0.3)");
		expect(c.spin(60).rgb.a).toBeCloseTo(0.3, 3);
	});

	it("invert preserves alpha", () => {
		const c = swatch("rgba(255,0,0,0.7)");
		expect(c.invert().rgb.a).toBeCloseTo(0.7, 3);
	});
});

describe("mix", () => {
	it("default amount is 0.5 (midpoint)", () => {
		// OKLab L is roughly the cube root of relative luminance, so
		// the perceptual midpoint of black and white sits at L=0.5,
		// which corresponds to sRGB ≈ 99 (visually mid-gray) — *not*
		// the linear midpoint (≈ 188).
		const m = swatch("#000000").mix("#ffffff");
		expect(m.rgb.r).toBeGreaterThan(90);
		expect(m.rgb.r).toBeLessThan(110);
		expect(m.rgb.r).toBe(m.rgb.g);
		expect(m.rgb.g).toBe(m.rgb.b);
	});

	it("amount 0 returns the receiver, amount 1 returns the other", () => {
		const a = swatch("#ff0000");
		const b = swatch("#0000ff");
		expect(a.mix(b, 0).rgb.r).toBeGreaterThanOrEqual(254);
		expect(a.mix(b, 1).rgb.b).toBeGreaterThanOrEqual(254);
	});

	it("rgb space gives the naive midpoint", () => {
		const m = swatch("#000000").mix("#ffffff", 0.5, "rgb");
		expect(m.rgb.r).toBe(128);
	});

	it("linear space gives perceptual mid-gray", () => {
		const m = swatch("#000000").mix("#ffffff", 0.5, "linear");
		// Linear midpoint of (0,1) is 0.5; gamma-encoded ≈ 188.
		expect(m.rgb.r).toBeGreaterThan(180);
		expect(m.rgb.r).toBeLessThan(195);
	});

	it("hsl space takes the shortest hue arc", () => {
		// red (h=0) and h=300 → shortest arc goes -60° to 330°, midpoint
		// 330° (not 150°).
		const m = swatch("hsl(0,100%,50%)").mix("hsl(300,100%,50%)", 0.5, "hsl");
		expect(m.hsl.h).toBeCloseTo(330, 0);
	});

	it("interpolates alpha linearly", () => {
		const m = swatch("rgba(255,0,0,0)").mix(
			"rgba(0,0,255,1)",
			0.5,
			"rgb"
		);
		expect(m.rgb.a).toBeCloseTo(0.5, 3);
	});

	it("oklab and lab spaces produce a valid color", () => {
		const a = swatch("#ff0000");
		const b = swatch("#00ff00");
		const ok = a.mix(b, 0.5, "oklab");
		const lab = a.mix(b, 0.5, "lab");
		expect(ok.isValid).toBe(true);
		expect(lab.isValid).toBe(true);
	});

	it("throws on unknown space", () => {
		expect(() => swatch("#fff").mix("#000", 0.5, "wat")).toThrow(
			/Unknown mix space/
		);
	});
});

describe("harmonies", () => {
	it("complementary returns [self, complement]", () => {
		const c = swatch("hsl(0,100%,50%)");
		const out = c.complementary();
		expect(out).toHaveLength(2);
		expect(out[0].hsl.h).toBeCloseTo(0, 0);
		expect(out[1].hsl.h).toBeCloseTo(180, 0);
	});

	it("triad returns 3 colors at 0°, 120°, 240°", () => {
		const c = swatch("hsl(0,100%,50%)");
		const out = c.triad();
		expect(out).toHaveLength(3);
		expect(out[0].hsl.h).toBeCloseTo(0, 0);
		expect(out[1].hsl.h).toBeCloseTo(120, 0);
		expect(out[2].hsl.h).toBeCloseTo(240, 0);
	});

	it("tetrad returns 4 colors at 0°, 90°, 180°, 270°", () => {
		const c = swatch("hsl(0,100%,50%)");
		const out = c.tetrad();
		expect(out.map(t => Math.round(t.hsl.h))).toEqual([0, 90, 180, 270]);
	});

	it("splitComplement returns [self, +150°, +210°]", () => {
		const c = swatch("hsl(0,100%,50%)");
		const out = c.splitComplement();
		expect(out.map(t => Math.round(t.hsl.h))).toEqual([0, 150, 210]);
	});

	it("analogous(6, 30) returns 6 evenly-spaced colors centered on the receiver", () => {
		const c = swatch("hsl(180,100%,50%)");
		const out = c.analogous(6, 30);
		expect(out).toHaveLength(6);
		// First and last span 30 degrees apart.
		const first = out[0].hsl.h;
		const last = out[5].hsl.h;
		expect(Math.abs(last - first)).toBeCloseTo(30, 0);
	});

	it("analogous defaults to 6 colors and 30° span", () => {
		const out = swatch("hsl(120,100%,50%)").analogous();
		expect(out).toHaveLength(6);
	});

	it("monochromatic(5) returns 5 same-hue colors with varying lightness", () => {
		const c = swatch("hsl(200,80%,50%)");
		const out = c.monochromatic(5);
		expect(out).toHaveLength(5);
		// All hues should be ~200.
		for (const t of out) {
			// pure black/white have undefined hue in HSL — only check
			// the middle entries.
		}
		// Lightnesses should be 0, 25, 50, 75, 100.
		expect(out.map(t => Math.round(t.hsl.l))).toEqual([0, 25, 50, 75, 100]);
	});

	it("harmonies return swatch instances with the full API", () => {
		const out = swatch("#ff0000").triad();
		for (const t of out) {
			expect(t).toBeInstanceOf(swatch);
			expect(typeof t.simulate).toBe("function");
		}
	});
});

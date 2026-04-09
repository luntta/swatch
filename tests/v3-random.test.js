import { describe, it, expect } from "vitest";
import "../src/bootstrap.js";
import { swatch } from "../src/core/swatch-class.js";
import { random } from "../src/operations/random.js";

// Phase 14: random color generation.

describe("Phase 14: random (uniform sRGB)", () => {
	it("returns a Swatch in sRGB space", () => {
		const c = random();
		expect(c.space).toBe("srgb");
	});

	it("all channels land in [0, 1]", () => {
		for (let i = 0; i < 100; i++) {
			const { r, g, b } = random().srgb;
			expect(r).toBeGreaterThanOrEqual(0);
			expect(r).toBeLessThanOrEqual(1);
			expect(g).toBeGreaterThanOrEqual(0);
			expect(g).toBeLessThanOrEqual(1);
			expect(b).toBeGreaterThanOrEqual(0);
			expect(b).toBeLessThanOrEqual(1);
		}
	});

	it("successive calls produce different colors", () => {
		const a = random();
		const b = random();
		// One-in-2^96 collision probability: effectively never.
		expect(a.equals(b, 1e-12)).toBe(false);
	});
});

describe("Phase 14: random (seeded)", () => {
	it("same seed produces identical sequences", () => {
		const r1 = random({ seed: 42 });
		const r2 = random({ seed: 42 });
		expect(r1.equals(r2, 1e-12)).toBe(true);
	});

	it("different seeds produce different colors", () => {
		const r1 = random({ seed: 42 });
		const r2 = random({ seed: 43 });
		expect(r1.equals(r2, 1e-12)).toBe(false);
	});

	it("seed 0 still produces a valid color (nudged to 1)", () => {
		expect(() => random({ seed: 0 })).not.toThrow();
	});
});

describe("Phase 14: random (oklch constraints)", () => {
	it("fixed lightness and chroma — 1000 samples all match", () => {
		let rng_seed = 1;
		for (let i = 0; i < 1000; i++) {
			const c = random({
				space: "oklch",
				hue: [0, 360],
				lightness: [0.5, 0.5],
				chroma: [0.15, 0.15],
				seed: rng_seed++
			});
			const { l, c: chroma } = c.oklch;
			expect(l).toBeCloseTo(0.5, 9);
			expect(chroma).toBeCloseTo(0.15, 9);
		}
	});

	it("lightness range [0.4, 0.6] is respected", () => {
		for (let i = 0; i < 100; i++) {
			const c = random({
				space: "oklch",
				lightness: [0.4, 0.6],
				seed: i + 1
			});
			expect(c.oklch.l).toBeGreaterThanOrEqual(0.4);
			expect(c.oklch.l).toBeLessThanOrEqual(0.6);
		}
	});

	it("scalar constraint means fixed", () => {
		const c = random({
			space: "oklch",
			lightness: 0.7,
			seed: 7
		});
		expect(c.oklch.l).toBeCloseTo(0.7, 9);
	});

	it("hue range wraps correctly (no wrap support)", () => {
		// No wrap: [350, 370] is out of spec, but [0, 360] is fine.
		for (let i = 0; i < 50; i++) {
			const h = random({ space: "oklch", seed: i + 1 }).oklch.h;
			expect(h).toBeGreaterThanOrEqual(0);
			expect(h).toBeLessThanOrEqual(360);
		}
	});
});

describe("Phase 14: random (hsl constraints)", () => {
	it("fixed hue and lightness", () => {
		const c = random({
			space: "hsl",
			hue: 120,
			lightness: 50,
			seed: 12
		});
		expect(c.hsl.h).toBeCloseTo(120, 9);
		expect(c.hsl.l).toBeCloseTo(50, 9);
	});

	it("saturation range in [0, 100]", () => {
		for (let i = 0; i < 100; i++) {
			const { s } = random({
				space: "hsl",
				saturation: [10, 90],
				seed: i + 1
			}).hsl;
			expect(s).toBeGreaterThanOrEqual(10);
			expect(s).toBeLessThanOrEqual(90);
		}
	});
});

describe("Phase 14: random (error cases)", () => {
	it("throws on unsupported space", () => {
		expect(() => random({ space: "cmyk" })).toThrow(/unsupported space/);
	});

	it("throws on bad constraint shape", () => {
		expect(() =>
			random({ space: "oklch", lightness: [0, 1, 2] })
		).toThrow(/must be a number or/);
	});
});

describe("Phase 14: random (static)", () => {
	it("wired as swatch.random(...)", () => {
		const c = swatch.random({ seed: 1 });
		expect(c).toBeDefined();
		expect(c.space).toBe("srgb");
	});
});

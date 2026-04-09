import { describe, it, expect } from "vitest";
import "../src/bootstrap.js";
import { swatch } from "../src/core/swatch-class.js";
import { temperature, kelvin } from "../src/operations/temperature.js";

// Phase 13: correlated color temperature (CCT) ↔ color.

describe("Phase 13: temperature forward (kelvin → color)", () => {
	it("6500K is near white (D65 approximation)", () => {
		const c = temperature(6500).srgb;
		// Blackbody at 6500K isn't *exactly* D65 (D65 is daylight, not
		// a Planckian radiator), but it should be very close to neutral.
		expect(c.r).toBeGreaterThan(0.9);
		expect(c.g).toBeGreaterThan(0.9);
		expect(c.b).toBeGreaterThan(0.9);
	});

	it("2000K is a warm orange (R > G > B)", () => {
		const c = temperature(2000).srgb;
		expect(c.r).toBeCloseTo(1, 5);
		expect(c.r).toBeGreaterThan(c.g);
		expect(c.g).toBeGreaterThan(c.b);
		// Deeply orange, so blue should be near zero.
		expect(c.b).toBeLessThan(0.3);
	});

	it("1500K is even warmer than 2000K (less blue)", () => {
		const a = temperature(2000).srgb;
		const b = temperature(1500).srgb;
		expect(b.b).toBeLessThan(a.b);
	});

	it("10000K is cool blue-white (B >= R)", () => {
		const c = temperature(10000).srgb;
		expect(c.b).toBeGreaterThanOrEqual(c.r);
	});

	it("normalizes so the brightest channel is 1", () => {
		for (const k of [1500, 3000, 5500, 6500, 9000, 15000]) {
			const c = temperature(k).srgb;
			const m = Math.max(c.r, c.g, c.b);
			expect(m).toBeCloseTo(1, 9);
		}
	});

	it("throws out of range", () => {
		expect(() => temperature(500)).toThrow(/out of range/);
		expect(() => temperature(50000)).toThrow(/out of range/);
	});

	it("accepts the endpoints 1000K and 40000K", () => {
		expect(() => temperature(1000)).not.toThrow();
		expect(() => temperature(40000)).not.toThrow();
	});

	it("returns a Swatch in sRGB space", () => {
		const c = temperature(6500);
		expect(c.space).toBe("srgb");
	});

	it("wired as swatch.temperature(k)", () => {
		const c = swatch.temperature(3000);
		expect(c.srgb.r).toBeCloseTo(1, 5);
	});
});

describe("Phase 13: temperature inverse (color → kelvin)", () => {
	it("c.temperature() on swatch.temperature(6500) round-trips approximately", () => {
		// McCamy's approximation isn't an exact inverse, but within a
		// few hundred K is expected for the daylight range.
		const c = swatch.temperature(6500);
		const back = c.temperature();
		expect(back).toBeGreaterThan(5000);
		expect(back).toBeLessThan(8000);
	});

	it("warm colors give lower CCT than cool colors", () => {
		const warm = swatch.temperature(2500).temperature();
		const cool = swatch.temperature(8000).temperature();
		expect(warm).toBeLessThan(cool);
	});

	it("works on a user-supplied color", () => {
		// A neutral mid-gray. McCamy's formula gives a number; just
		// verify it's finite and in a plausible range.
		const k = swatch("#808080").temperature();
		expect(Number.isFinite(k)).toBe(true);
		expect(k).toBeGreaterThan(1000);
		expect(k).toBeLessThan(20000);
	});

	it("wired as c.temperature()", () => {
		const c = swatch("#ffdc99");
		expect(typeof c.temperature()).toBe("number");
	});
});

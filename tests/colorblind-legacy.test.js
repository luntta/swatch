import { describe, it, expect } from "vitest";
import tincture from "../src/tincture.js";

// These tests cover the legacy (pre-Brettel) toColorBlindRGB API.
// The full replacement arrives in Phase 4 (simulate/daltonize); these
// tests lock in correctness of the bug-fixed legacy behavior:
//  - no input mutation
//  - alpha preserved as a 0..1 float (not rounded to 0..255)
//  - identity "True" returns the input unchanged

describe("toColorBlindRGB: identity", () => {
	it("'True' is an identity transform for mid-gray", () => {
		const c = tincture("#808080");
		const out = c.toColorBlindRGB("True");
		expect(out.r).toBe(128);
		expect(out.g).toBe(128);
		expect(out.b).toBe(128);
	});

	it("'True' is an identity for saturated red", () => {
		const c = tincture("#ff0000");
		const out = c.toColorBlindRGB("True");
		expect(out.r).toBe(255);
		expect(out.g).toBe(0);
		expect(out.b).toBe(0);
	});
});

describe("toColorBlindRGB: does not mutate input", () => {
	it("leaves an opaque input object unchanged", () => {
		const c = tincture("#ff0000");
		const input = { r: 255, g: 0, b: 0 };
		const before = JSON.stringify(input);
		c.toColorBlindRGB("Protanopia", input);
		expect(JSON.stringify(input)).toBe(before);
		expect(Object.prototype.hasOwnProperty.call(input, "a")).toBe(false);
	});

	it("leaves an RGBA input unchanged", () => {
		const c = tincture("#ff0000");
		const input = { r: 255, g: 0, b: 0, a: 0.25 };
		const before = JSON.stringify(input);
		c.toColorBlindRGB("Protanopia", input);
		expect(JSON.stringify(input)).toBe(before);
	});
});

describe("toColorBlindRGB: alpha passthrough", () => {
	it("preserves alpha as a 0..1 float", () => {
		const c = tincture("#ff000080"); // alpha = 128/255 ≈ 0.502
		const out = c.toColorBlindRGB("Protanopia");
		expect(out.a).toBeCloseTo(c.rgb.a, 3);
		expect(out.a).toBeGreaterThan(0);
		expect(out.a).toBeLessThanOrEqual(1);
	});

	it("omits alpha when input had none", () => {
		const c = tincture("#ff0000");
		const out = c.toColorBlindRGB("Protanopia");
		expect(Object.prototype.hasOwnProperty.call(out, "a")).toBe(false);
	});

	it("does not round alpha through 0..255 clamp", () => {
		const c = tincture("#ff0000");
		const out = c.toColorBlindRGB("Deuteranomaly", {
			r: 255,
			g: 0,
			b: 0,
			a: 0.3
		});
		// Previously alpha was routed through _correctRGBChannelValue
		// which rounds to 0..255 → 0.3 would become 0.
		expect(out.a).toBe(0.3);
	});
});

describe("toColorBlindRGB: each CVD type produces a result", () => {
	const types = [
		"Protanopia",
		"Protanomaly",
		"Deuteranopia",
		"Deuteranomaly",
		"Tritanopia",
		"Tritanomaly",
		"Achromatopsia",
		"Achromatomaly"
	];
	it.each(types)("returns an rgb for %s", (type) => {
		const c = tincture("#ff4080");
		const out = c.toColorBlindRGB(type);
		expect(out).toBeDefined();
		expect(out.r).toBeGreaterThanOrEqual(0);
		expect(out.r).toBeLessThanOrEqual(255);
		expect(out.g).toBeGreaterThanOrEqual(0);
		expect(out.g).toBeLessThanOrEqual(255);
		expect(out.b).toBeGreaterThanOrEqual(0);
		expect(out.b).toBeLessThanOrEqual(255);
	});
});

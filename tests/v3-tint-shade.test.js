import { describe, it, expect } from "vitest";
import "../src/bootstrap.js";
import { swatch } from "../src/core/swatch-class.js";

// Phase 10: tint / shade / tone.

describe("Phase 10: tint", () => {
	it("amount 0 is identity", () => {
		const red = swatch("#ff0000");
		const tinted = red.tint(0);
		expect(tinted.equals(red, 1e-6)).toBe(true);
	});

	it("amount 1 is white", () => {
		const red = swatch("#ff0000");
		const tinted = red.tint(1);
		expect(tinted.equals(swatch("#ffffff"), 1e-5)).toBe(true);
	});

	it("default amount is 0.1", () => {
		const red = swatch("#ff0000");
		const a = red.tint();
		const b = red.tint(0.1);
		expect(a.equals(b, 1e-9)).toBe(true);
	});

	it("intermediate tint lies on the oklab line", () => {
		const red = swatch("#ff0000");
		const tinted = red.tint(0.5);
		// L should be halfway between red's L and 1.
		const redL = red.oklab.l;
		const expectedL = redL + (1 - redL) * 0.5;
		expect(tinted.oklab.l).toBeCloseTo(expectedL, 10);
	});
});

describe("Phase 10: shade", () => {
	it("amount 0 is identity", () => {
		const red = swatch("#ff0000");
		const shaded = red.shade(0);
		expect(shaded.equals(red, 1e-6)).toBe(true);
	});

	it("amount 1 is black", () => {
		const red = swatch("#ff0000");
		const shaded = red.shade(1);
		expect(shaded.equals(swatch("#000000"), 1e-5)).toBe(true);
	});

	it("intermediate shade halves L toward 0", () => {
		const red = swatch("#ff0000");
		const shaded = red.shade(0.5);
		const redL = red.oklab.l;
		expect(shaded.oklab.l).toBeCloseTo(redL * 0.5, 10);
	});
});

describe("Phase 10: tone", () => {
	it("amount 0 is identity", () => {
		const red = swatch("#ff0000");
		const toned = red.tone(0);
		expect(toned.equals(red, 1e-6)).toBe(true);
	});

	it("amount 1 is mid-gray (OKLab 0.5, 0, 0)", () => {
		const red = swatch("#ff0000");
		const toned = red.tone(1);
		const lab = toned.oklab;
		expect(lab.l).toBeCloseTo(0.5, 6);
		expect(lab.a).toBeCloseTo(0, 6);
		expect(lab.b).toBeCloseTo(0, 6);
	});

	it("intermediate tone pulls chroma toward zero", () => {
		const red = swatch("#ff0000");
		const halfTone = red.tone(0.5);
		expect(Math.abs(halfTone.oklab.a)).toBeLessThan(Math.abs(red.oklab.a));
		expect(Math.abs(halfTone.oklab.b)).toBeLessThan(Math.abs(red.oklab.b));
	});
});

describe("Phase 10: equals", () => {
	it("same color compares equal", () => {
		const a = swatch("#ff0000");
		const b = swatch("#ff0000");
		expect(a.equals(b)).toBe(true);
	});

	it("cross-space comparison works", () => {
		const hex = swatch("#ff0000");
		const rgb = swatch("rgb(255 0 0)");
		expect(hex.equals(rgb)).toBe(true);
	});

	it("different colors compare unequal", () => {
		const red = swatch("#ff0000");
		const blue = swatch("#0000ff");
		expect(red.equals(blue)).toBe(false);
	});

	it("different alphas compare unequal", () => {
		const a = swatch("rgb(255 0 0)");
		const b = swatch("rgb(255 0 0 / 0.5)");
		expect(a.equals(b)).toBe(false);
	});

	it("non-Swatch input returns false", () => {
		const a = swatch("#ff0000");
		expect(a.equals("foo")).toBe(false);
		expect(a.equals(null)).toBe(false);
		expect(a.equals({})).toBe(false);
	});
});

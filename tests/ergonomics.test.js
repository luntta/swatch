import { describe, it, expect } from "vitest";
import swatch from "../src/swatch.js";

describe("clone", () => {
	it("returns a new swatch with the same rgb", () => {
		const a = swatch("#3366cc");
		const b = a.clone();
		expect(b).not.toBe(a);
		expect(b).toBeInstanceOf(swatch);
		expect(b.rgb).toEqual(a.rgb);
		expect(b.hex).toBe(a.hex);
	});

	it("preserves alpha", () => {
		const a = swatch("rgba(10,20,30,0.42)");
		const b = a.clone();
		expect(b.rgb.a).toBeCloseTo(0.42, 3);
	});

	it("clone is independent (mutations to one do not affect the other)", () => {
		const a = swatch("#ff0000");
		const b = a.clone();
		b.rgb.r = 0;
		expect(a.rgb.r).toBe(255);
	});
});

describe("equals", () => {
	it("exact match in rgb space by default", () => {
		expect(swatch("#abcdef").equals("#abcdef")).toBe(true);
		expect(swatch("#abcdef").equals("#abcdee")).toBe(false);
	});

	it("tolerance in rgb space", () => {
		expect(
			swatch("#abcdef").equals("#abcdee", { tolerance: 1 })
		).toBe(true);
		expect(
			swatch("#abcdef").equals("#a0cdef", { tolerance: 1 })
		).toBe(false);
	});

	it("accepts swatch and object inputs", () => {
		const c = swatch("#112233");
		expect(c.equals(swatch("#112233"))).toBe(true);
		expect(c.equals({ r: 17, g: 34, b: 51 })).toBe(true);
	});

	it("hex space compares canonical hex strings case-insensitively", () => {
		expect(
			swatch("#ABCDEF").equals("#abcdef", { space: "hex" })
		).toBe(true);
	});

	it("oklab space uses Delta E OK as the tolerance", () => {
		// Two very close colors.
		const a = swatch("#445566");
		const b = swatch("#445567");
		expect(a.equals(b, { space: "oklab", tolerance: 0.01 })).toBe(true);
		// Very different colors should fail even with a generous threshold.
		expect(
			swatch("#ff0000").equals("#0000ff", {
				space: "oklab",
				tolerance: 0.01
			})
		).toBe(false);
	});

	it("lab space uses CIEDE2000", () => {
		const a = swatch("#ff0000");
		const b = swatch("#fe0000");
		expect(a.equals(b, { space: "lab", tolerance: 1 })).toBe(true);
	});

	it("invalid inputs are not equal", () => {
		expect(swatch("notacolor").equals("#000000")).toBe(false);
		expect(swatch("#000000").equals("notacolor")).toBe(false);
	});

	it("throws on unknown space", () => {
		expect(() =>
			swatch("#000").equals("#000", { space: "xyzzy" })
		).toThrow(/Unknown equals space/);
	});
});

describe("toJSON", () => {
	it("returns a plain object with hex, rgb, hsl, isValid", () => {
		const c = swatch("#ff0000");
		const j = c.toJSON();
		expect(j.hex).toBe("#ff0000");
		expect(j.rgb).toEqual({ r: 255, g: 0, b: 0 });
		expect(j.hsl.h).toBeCloseTo(0, 0);
		expect(j.isValid).toBe(true);
	});

	it("is consumed by JSON.stringify automatically", () => {
		const c = swatch("#112233");
		const s = JSON.stringify(c);
		const parsed = JSON.parse(s);
		expect(parsed.hex).toBe("#112233");
		expect(parsed.rgb).toEqual({ r: 17, g: 34, b: 51 });
	});

	it("includes the original format identifier", () => {
		expect(swatch("red").toJSON().format).toBe("Named");
		expect(swatch("#112233").toJSON().format).toBe("HEX");
	});
});

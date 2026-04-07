import { describe, it, expect } from "vitest";
import tincture from "../src/tincture.js";

describe("clone", () => {
	it("returns a new tincture with the same rgb", () => {
		const a = tincture("#3366cc");
		const b = a.clone();
		expect(b).not.toBe(a);
		expect(b).toBeInstanceOf(tincture);
		expect(b.rgb).toEqual(a.rgb);
		expect(b.hex).toBe(a.hex);
	});

	it("preserves alpha", () => {
		const a = tincture("rgba(10,20,30,0.42)");
		const b = a.clone();
		expect(b.rgb.a).toBeCloseTo(0.42, 3);
	});

	it("clone is independent (mutations to one do not affect the other)", () => {
		const a = tincture("#ff0000");
		const b = a.clone();
		b.rgb.r = 0;
		expect(a.rgb.r).toBe(255);
	});
});

describe("equals", () => {
	it("exact match in rgb space by default", () => {
		expect(tincture("#abcdef").equals("#abcdef")).toBe(true);
		expect(tincture("#abcdef").equals("#abcdee")).toBe(false);
	});

	it("tolerance in rgb space", () => {
		expect(
			tincture("#abcdef").equals("#abcdee", { tolerance: 1 })
		).toBe(true);
		expect(
			tincture("#abcdef").equals("#a0cdef", { tolerance: 1 })
		).toBe(false);
	});

	it("accepts tincture and object inputs", () => {
		const c = tincture("#112233");
		expect(c.equals(tincture("#112233"))).toBe(true);
		expect(c.equals({ r: 17, g: 34, b: 51 })).toBe(true);
	});

	it("hex space compares canonical hex strings case-insensitively", () => {
		expect(
			tincture("#ABCDEF").equals("#abcdef", { space: "hex" })
		).toBe(true);
	});

	it("oklab space uses Delta E OK as the tolerance", () => {
		// Two very close colors.
		const a = tincture("#445566");
		const b = tincture("#445567");
		expect(a.equals(b, { space: "oklab", tolerance: 0.01 })).toBe(true);
		// Very different colors should fail even with a generous threshold.
		expect(
			tincture("#ff0000").equals("#0000ff", {
				space: "oklab",
				tolerance: 0.01
			})
		).toBe(false);
	});

	it("lab space uses CIEDE2000", () => {
		const a = tincture("#ff0000");
		const b = tincture("#fe0000");
		expect(a.equals(b, { space: "lab", tolerance: 1 })).toBe(true);
	});

	it("invalid inputs are not equal", () => {
		expect(tincture("notacolor").equals("#000000")).toBe(false);
		expect(tincture("#000000").equals("notacolor")).toBe(false);
	});

	it("throws on unknown space", () => {
		expect(() =>
			tincture("#000").equals("#000", { space: "xyzzy" })
		).toThrow(/Unknown equals space/);
	});
});

describe("toJSON", () => {
	it("returns a plain object with hex, rgb, hsl, isValid", () => {
		const c = tincture("#ff0000");
		const j = c.toJSON();
		expect(j.hex).toBe("#ff0000");
		expect(j.rgb).toEqual({ r: 255, g: 0, b: 0 });
		expect(j.hsl.h).toBeCloseTo(0, 0);
		expect(j.isValid).toBe(true);
	});

	it("is consumed by JSON.stringify automatically", () => {
		const c = tincture("#112233");
		const s = JSON.stringify(c);
		const parsed = JSON.parse(s);
		expect(parsed.hex).toBe("#112233");
		expect(parsed.rgb).toEqual({ r: 17, g: 34, b: 51 });
	});

	it("includes the original format identifier", () => {
		expect(tincture("red").toJSON().format).toBe("Named");
		expect(tincture("#112233").toJSON().format).toBe("HEX");
	});
});

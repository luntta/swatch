import { describe, it, expect } from "vitest";
import "../src/bootstrap.js";
import { swatch } from "../src/core/swatch-class.js";

// Phase 3: legacy parsing + named colors. Inputs are the same forms v2
// accepts, to make the Phase 16 entry swap painless.

describe("Phase 3: hex", () => {
	it("parses 6-digit hex", () => {
		const c = swatch("#3366cc");
		expect(c.space).toBe("srgb");
		expect(c.coords[0]).toBeCloseTo(0x33 / 255, 6);
		expect(c.coords[1]).toBeCloseTo(0x66 / 255, 6);
		expect(c.coords[2]).toBeCloseTo(0xcc / 255, 6);
		expect(c.alpha).toBe(1);
	});

	it("parses 3-digit hex", () => {
		const c = swatch("#f00");
		expect(c.coords[0]).toBeCloseTo(1, 6);
		expect(c.coords[1]).toBeCloseTo(0, 6);
		expect(c.coords[2]).toBeCloseTo(0, 6);
	});

	it("parses 8-digit hex with alpha", () => {
		const c = swatch("#0000ff80");
		expect(c.coords[2]).toBeCloseTo(1, 6);
		expect(c.alpha).toBeCloseTo(0x80 / 255, 6);
	});

	it("parses 4-digit hex with alpha", () => {
		const c = swatch("#00f8");
		expect(c.coords[2]).toBeCloseTo(1, 6);
		expect(c.alpha).toBeCloseTo(0x88 / 255, 6);
	});
});

describe("Phase 3: rgb / rgba", () => {
	it("parses comma rgb", () => {
		const c = swatch("rgb(0, 0, 255)");
		expect(c.coords[2]).toBeCloseTo(1, 6);
	});

	it("parses whitespace rgb", () => {
		const c = swatch("rgb(0 0 255)");
		expect(c.coords[2]).toBeCloseTo(1, 6);
	});

	it("parses percent rgb", () => {
		const c = swatch("rgb(0%, 0%, 100%)");
		expect(c.coords[2]).toBeCloseTo(1, 6);
	});

	it("parses rgba comma", () => {
		const c = swatch("rgba(0, 0, 255, 0.5)");
		expect(c.alpha).toBe(0.5);
	});

	it("parses rgba slash", () => {
		const c = swatch("rgba(0 0 255 / 0.5)");
		expect(c.alpha).toBe(0.5);
	});
});

describe("Phase 3: hsl / hsla", () => {
	it("parses comma hsl", () => {
		const c = swatch("hsl(240, 100%, 50%)");
		expect(c.space).toBe("hsl");
		expect(c.coords).toEqual([240, 100, 50]);
	});

	it("parses whitespace hsl", () => {
		const c = swatch("hsl(240 100% 50%)");
		expect(c.coords).toEqual([240, 100, 50]);
	});

	it("parses deg hue", () => {
		const c = swatch("hsl(240deg, 100%, 50%)");
		expect(c.coords[0]).toBe(240);
	});

	it("parses turn hue", () => {
		const c = swatch("hsl(0.5turn, 100%, 50%)");
		expect(c.coords[0]).toBeCloseTo(180, 5);
	});

	it("parses rad hue", () => {
		const c = swatch("hsl(3.14rad, 100%, 50%)");
		expect(c.coords[0]).toBeCloseTo(179.9, 0);
	});

	it("parses hsla", () => {
		const c = swatch("hsla(240, 100%, 50%, 0.5)");
		expect(c.alpha).toBe(0.5);
	});

	it("parses hsla slash", () => {
		const c = swatch("hsla(240 100% 50% / 0.5)");
		expect(c.alpha).toBe(0.5);
	});
});

describe("Phase 3: named colors", () => {
	it("parses basic names", () => {
		const c = swatch("rebeccapurple");
		expect(c.coords[0]).toBeCloseTo(0x66 / 255, 6);
		expect(c.coords[1]).toBeCloseTo(0x33 / 255, 6);
		expect(c.coords[2]).toBeCloseTo(0x99 / 255, 6);
	});

	it("is case insensitive", () => {
		expect(swatch("Crimson").coords[0]).toBeCloseTo(0xdc / 255, 6);
		expect(swatch("CRIMSON").coords[0]).toBeCloseTo(0xdc / 255, 6);
	});
});

describe("Phase 3: object inputs", () => {
	it("parses rgb object", () => {
		const c = swatch({ r: 255, g: 0, b: 0 });
		expect(c.space).toBe("srgb");
		expect(c.coords[0]).toBeCloseTo(1, 6);
	});

	it("parses hsl object", () => {
		const c = swatch({ h: 240, s: 100, l: 50 });
		expect(c.space).toBe("hsl");
		expect(c.coords).toEqual([240, 100, 50]);
	});

	it("parses canonical state object", () => {
		const c = swatch({ space: "oklab", coords: [0.5, 0.1, -0.1] });
		expect(c.space).toBe("oklab");
		expect(c.coords[0]).toBe(0.5);
	});

	it("accepts alpha on rgb object", () => {
		const c = swatch({ r: 0, g: 0, b: 255, a: 0.3 });
		expect(c.alpha).toBe(0.3);
	});
});

describe("Phase 3: identity on existing Swatch", () => {
	it("returns the same instance for Swatch input", () => {
		const a = swatch("#ff0000");
		const b = swatch(a);
		expect(b).toBe(a);
	});
});

describe("Phase 3: throws on garbage", () => {
	it("throws on unrecognized string", () => {
		expect(() => swatch("not-a-color")).toThrow(/could not parse/);
	});

	it("throws on unrecognized object shape", () => {
		expect(() => swatch({ q: 1 })).toThrow(/could not parse/);
	});
});

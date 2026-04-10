import { describe, it, expect } from "vitest";
import swatch from "../src/_v2-monolith.js";

describe("CSS named colors", () => {
	const cases = [
		["blue", "#0000ff"],
		["red", "#ff0000"],
		["lime", "#00ff00"],
		["white", "#ffffff"],
		["black", "#000000"],
		["rebeccapurple", "#663399"],
		["transparent" /* not a named color in this set; tested separately */]
	];
	// Filter the smoke-test list to entries with explicit hex.
	for (const [name, hex] of cases.filter(c => c[1])) {
		it(`${name} → ${hex}`, () => {
			expect(swatch(name).hex).toBe(hex);
		});
	}

	it("is case-insensitive", () => {
		expect(swatch("RED").hex).toBe("#ff0000");
		expect(swatch("Rebeccapurple").hex).toBe("#663399");
	});

	it("grey and gray are synonyms", () => {
		expect(swatch("grey").hex).toBe(swatch("gray").hex);
		expect(swatch("darkgrey").hex).toBe(swatch("darkgray").hex);
	});

	it("named-color swatchs are valid and have rgb populated", () => {
		const c = swatch("dodgerblue");
		expect(c.isValid).toBe(true);
		expect(c.rgb).toEqual({ r: 30, g: 144, b: 255 });
	});

	it("unknown names are invalid", () => {
		expect(swatch("notacolor").isValid).toBe(false);
		expect(swatch("zzzthistle").isValid).toBe(false);
	});

	it("preserves the named-color format identifier", () => {
		const c = swatch("crimson");
		expect(c._originalFormat).toBe("Named");
	});

	it("can round-trip via hex", () => {
		const named = swatch("tomato");
		const fromHex = swatch(named.hex);
		expect(fromHex.rgb).toEqual(named.rgb);
	});

	it("named colors work with simulate and deltaE", () => {
		const red = swatch("red");
		const blue = swatch("blue");
		expect(red.deltaE(blue)).toBeGreaterThan(20);
		expect(red.simulate("protan").rgb).toBeDefined();
	});
});

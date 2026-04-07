import { describe, it, expect } from "vitest";
import tincture from "../src/tincture.js";

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
			expect(tincture(name).hex).toBe(hex);
		});
	}

	it("is case-insensitive", () => {
		expect(tincture("RED").hex).toBe("#ff0000");
		expect(tincture("Rebeccapurple").hex).toBe("#663399");
	});

	it("grey and gray are synonyms", () => {
		expect(tincture("grey").hex).toBe(tincture("gray").hex);
		expect(tincture("darkgrey").hex).toBe(tincture("darkgray").hex);
	});

	it("named-color tinctures are valid and have rgb populated", () => {
		const c = tincture("dodgerblue");
		expect(c.isValid).toBe(true);
		expect(c.rgb).toEqual({ r: 30, g: 144, b: 255 });
	});

	it("unknown names are invalid", () => {
		expect(tincture("notacolor").isValid).toBe(false);
		expect(tincture("zzzthistle").isValid).toBe(false);
	});

	it("preserves the named-color format identifier", () => {
		const c = tincture("crimson");
		expect(c._originalFormat).toBe("Named");
	});

	it("can round-trip via hex", () => {
		const named = tincture("tomato");
		const fromHex = tincture(named.hex);
		expect(fromHex.rgb).toEqual(named.rgb);
	});

	it("named colors work with simulate and deltaE", () => {
		const red = tincture("red");
		const blue = tincture("blue");
		expect(red.deltaE(blue)).toBeGreaterThan(20);
		expect(red.simulate("protan").rgb).toBeDefined();
	});
});

import { describe, it, expect } from "vitest";
import swatch from "../src/swatch.js";

// Reference color: solid blue #0000ff (hue = 240°).
// All of the inputs below should parse to the same underlying RGB.
const blueInputs = [
	"rgb(0,0,255)",
	"rgb(0 0 255)",
	"rgb(0%,0%,100%)",
	"rgb(0% 0% 100%)",
	"#0000ff",
	"#00f",
	"hsl(240,100%,50%)",
	"hsl(240deg,100%,50%)",
	"hsl(240 100% 50%)",
	"hsl(240deg 100% 50%)"
];

describe("parsing: opaque blue", () => {
	for (const input of blueInputs) {
		it(`parses ${input}`, () => {
			const c = swatch(input);
			expect(c.isValid).toBe(true);
			expect(c.rgb.r).toBe(0);
			expect(c.rgb.g).toBe(0);
			expect(c.rgb.b).toBe(255);
			expect(c.hex).toBe("#0000ff");
		});
	}
});

// 0.5 turn = 180° and 3.14 rad ≈ 180° → both map to cyan, not blue.
// (The original README mislabeled these as blue inputs.)
describe("parsing: 180° cyan from non-degree hue units", () => {
	const cyanInputs = [
		"hsl(0.5turn,100%,50%)",
		"hsl(0.5turn 100% 50%)",
		"hsl(3.14rad,100%,50%)"
	];
	for (const input of cyanInputs) {
		it(`parses ${input} as cyan`, () => {
			const c = swatch(input);
			expect(c.isValid).toBe(true);
			expect(c.rgb.r).toBe(0);
			expect(c.rgb.g).toBe(255);
			expect(c.rgb.b).toBe(255);
		});
	}
});

describe("parsing: semi-transparent blue (alpha)", () => {
	const alphaInputs = [
		"rgba(0,0,255,0.5)",
		"rgba(0 0 255 / 0.5)",
		"#0000ff80",
		"hsla(240,100%,50%,0.5)",
		"hsla(240 100% 50% / 0.5)"
	];
	for (const input of alphaInputs) {
		it(`parses ${input}`, () => {
			const c = swatch(input);
			expect(c.isValid).toBe(true);
			expect(c.hasAlpha).toBe(true);
			expect(c.rgb.r).toBe(0);
			expect(c.rgb.g).toBe(0);
			expect(c.rgb.b).toBe(255);
			// hex alpha 80 = 128/255 ≈ 0.502; tolerance for parser precision.
			expect(c.rgb.a).toBeCloseTo(0.5, 1);
		});
	}
});

describe("parsing: percent-alpha forms", () => {
	const pctInputs = [
		"rgba(0%,50%,100%,50%)",
		"rgba(0% 50% 100% / 50%)",
		"hsla(240,100%,50%,50%)",
		"hsla(240 100% 50% / 50%)"
	];
	for (const input of pctInputs) {
		it(`parses ${input}`, () => {
			const c = swatch(input);
			expect(c.isValid).toBe(true);
			expect(c.hasAlpha).toBe(true);
			expect(c.rgb.a).toBeCloseTo(0.5, 2);
		});
	}
});

describe("parsing: invalid input", () => {
	it("marks garbage as invalid", () => {
		const c = swatch("not a color");
		expect(c.isValid).toBe(false);
	});
});

import { describe, it, expect } from "vitest";
import swatch from "../src/swatch.js";

function expectRgbClose(a, b, tol) {
	expect(Math.abs(a.r - b.r)).toBeLessThanOrEqual(tol);
	expect(Math.abs(a.g - b.g)).toBeLessThanOrEqual(tol);
	expect(Math.abs(a.b - b.b)).toBeLessThanOrEqual(tol);
}

describe("daltonize: identity at severity 0", () => {
	const inputs = ["#ff0000", "#00ff00", "#3366aa", "#ffaa33"];
	const types = ["protan", "deutan", "tritan"];
	for (const input of inputs) {
		for (const type of types) {
			it(`${type}@0 leaves ${input} unchanged`, () => {
				const c = swatch(input);
				const out = c.daltonize(type, { severity: 0 });
				expectRgbClose(out.rgb, c.rgb, 1);
			});
		}
	}
});

describe("daltonize: achromatic axis is preserved", () => {
	const grays = ["#000000", "#808080", "#ffffff"];
	const types = ["protan", "deutan", "tritan"];
	for (const g of grays) {
		for (const t of types) {
			it(`${t}: ${g} stays gray`, () => {
				const out = swatch(g).daltonize(t);
				expectRgbClose(out.rgb, swatch(g).rgb, 1);
			});
		}
	}
});

describe("daltonize: alpha is preserved", () => {
	it("RGBA input keeps alpha", () => {
		const c = swatch("#ff000080");
		const out = c.daltonize("protan");
		expect(out.rgb.a).toBeCloseTo(c.rgb.a, 3);
	});

	it("RGB input has no alpha", () => {
		const out = swatch("#ff0000").daltonize("deutan");
		expect(out.rgb.a).toBeUndefined();
	});
});

describe("daltonize: improves protan/deutan distinguishability", () => {
	// On the red-green confusion line, daltonization should make a pair
	// more distinguishable to the dichromat than the unmodified pair.
	const cases = [
		["#ff0000", "#00cc00", "protan"],
		["#ff0000", "#00cc00", "deutan"],
		["#cc4400", "#118800", "protan"],
		["#cc4400", "#118800", "deutan"]
	];
	it.each(cases)("%s vs %s under %s", (a, b, type) => {
		const A = swatch(a);
		const B = swatch(b);
		const before = A.simulate(type).deltaE(B.simulate(type), "2000");
		const dA = A.daltonize(type).simulate(type);
		const dB = B.daltonize(type).simulate(type);
		const after = dA.deltaE(dB, "2000");
		expect(after).toBeGreaterThan(before);
	});
});

describe("daltonize: returns a swatch instance", () => {
	it("result has the same prototype API", () => {
		const out = swatch("#ff0000").daltonize("protan");
		expect(out).toBeInstanceOf(swatch);
		expect(typeof out.simulate).toBe("function");
	});
});

describe("daltonize: rejects unsupported / bad input", () => {
	it("throws for achromatopsia (no remaining channels)", () => {
		expect(() => swatch("#ff0000").daltonize("achroma")).toThrow(
			/achromatopsia/
		);
	});
	it("throws on unknown type", () => {
		expect(() => swatch("#ff0000").daltonize("bogus")).toThrow(
			/CVD type/
		);
	});
});

describe("daltonize: severity scales the correction", () => {
	it("severity=0 is identity, larger severity moves further", () => {
		const c = swatch("#ff0000");
		const d0 = c.daltonize("protan", { severity: 0 });
		const d05 = c.daltonize("protan", { severity: 0.5 });
		const d1 = c.daltonize("protan", { severity: 1 });
		const dist0 = c.deltaE(d0);
		const dist05 = c.deltaE(d05);
		const dist1 = c.deltaE(d1);
		expect(dist0).toBeLessThan(1); // identity
		expect(dist05).toBeGreaterThan(dist0);
		expect(dist1).toBeGreaterThan(dist05);
	});
});

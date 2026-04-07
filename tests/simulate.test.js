import { describe, it, expect } from "vitest";
import tincture from "../src/tincture.js";

// Helper: assert two RGB objects agree within ±tol per channel.
function expectRgbClose(a, b, tol) {
	expect(Math.abs(a.r - b.r)).toBeLessThanOrEqual(tol);
	expect(Math.abs(a.g - b.g)).toBeLessThanOrEqual(tol);
	expect(Math.abs(a.b - b.b)).toBeLessThanOrEqual(tol);
}

describe("simulate: identity at severity 0", () => {
	const inputs = ["#ff0000", "#00ff00", "#0000ff", "#ffaa33", "#345678"];
	const types = ["protan", "deutan", "tritan", "achroma"];
	for (const input of inputs) {
		for (const type of types) {
			it(`${type}@0 leaves ${input} unchanged`, () => {
				const c = tincture(input);
				const out = c.simulate(type, { severity: 0 });
				// Allow ±1 for sRGB ↔ linear round-trip rounding.
				expectRgbClose(out.rgb, c.rgb, 1);
			});
		}
	}
});

describe("simulate: achromatic axis is preserved", () => {
	const grays = ["#000000", "#404040", "#808080", "#c0c0c0", "#ffffff"];
	const types = ["protan", "deutan", "tritan", "achroma"];
	for (const g of grays) {
		for (const t of types) {
			it(`${t}: ${g} stays gray`, () => {
				const out = tincture(g).simulate(t);
				// Gray in, gray out — channels should match each other.
				expect(Math.abs(out.rgb.r - out.rgb.g)).toBeLessThanOrEqual(1);
				expect(Math.abs(out.rgb.g - out.rgb.b)).toBeLessThanOrEqual(1);
				// And it should still be the same gray (within rounding).
				expectRgbClose(out.rgb, tincture(g).rgb, 2);
			});
		}
	}
});

describe("simulate: type aliases are equivalent", () => {
	const cases = [
		["protan", "protanopia", "protanomaly"],
		["deutan", "deuteranopia", "deuteranomaly"],
		["tritan", "tritanopia", "tritanomaly"],
		["achroma", "achromatopsia", "achromatomaly"]
	];
	for (const group of cases) {
		it(`${group.join("/")} all map to the same simulation`, () => {
			const c = tincture("#3366aa");
			const ref = c.simulate(group[0]);
			for (const alias of group.slice(1)) {
				const out = c.simulate(alias);
				expectRgbClose(out.rgb, ref.rgb, 0);
			}
		});
	}
});

describe("simulate: alpha is preserved as 0..1 float", () => {
	it("RGBA input keeps alpha through simulate", () => {
		const c = tincture("#ff000080"); // alpha ≈ 0.502
		const out = c.simulate("protan");
		expect(out.rgb.a).toBeCloseTo(c.rgb.a, 3);
		expect(out.rgb.a).toBeGreaterThan(0);
		expect(out.rgb.a).toBeLessThanOrEqual(1);
	});

	it("RGB input has no alpha after simulate", () => {
		const out = tincture("#ff0000").simulate("deutan");
		expect(out.rgb.a).toBeUndefined();
	});
});

describe("simulate: achromatopsia produces zero chroma", () => {
	const inputs = ["#ff0000", "#00ff00", "#0000ff", "#ffaa33"];
	for (const input of inputs) {
		it(`${input} → grayscale (a≈0, b≈0 in OKLab)`, () => {
			const ok = tincture(input).simulate("achroma").toOklab();
			expect(Math.abs(ok.a)).toBeLessThan(0.01);
			expect(Math.abs(ok.b)).toBeLessThan(0.01);
		});
	}

	it("achroma uses Rec.709 luminance weights", () => {
		// At full severity, the gray value should equal Y in linear space.
		// Yred = 0.2126 → linear, then re-gamma to ~127/255
		const r = tincture("#ff0000").simulate("achroma");
		expect(r.rgb.r).toBe(r.rgb.g);
		expect(r.rgb.g).toBe(r.rgb.b);
		expect(r.rgb.r).toBe(127); // matches Math.round(255 * gamma(0.2126))

		// Yblue = 0.0722 → ~76
		const b = tincture("#0000ff").simulate("achroma");
		expect(b.rgb.r).toBe(76);

		// Ygreen = 0.7152 → ~220
		const g = tincture("#00ff00").simulate("achroma");
		expect(g.rgb.r).toBe(220);
	});
});

describe("simulate: red-green confusion collapses for protan/deutan", () => {
	it("ΔE(simRed, simGreen) shrinks under protan", () => {
		const red = tincture("#ff0000");
		const green = tincture("#00cc00");
		const before = red.deltaE(green, "2000");
		const after = red
			.simulate("protan")
			.deltaE(green.simulate("protan"), "2000");
		expect(after).toBeLessThan(before);
	});

	it("ΔE(simRed, simGreen) shrinks under deutan", () => {
		const red = tincture("#ff0000");
		const green = tincture("#00cc00");
		const before = red.deltaE(green, "2000");
		const after = red
			.simulate("deutan")
			.deltaE(green.simulate("deutan"), "2000");
		expect(after).toBeLessThan(before);
	});
});

describe("simulate: severity monotonicity", () => {
	// As severity increases from 0 → 1, the simulated color drifts
	// monotonically away from the original (for confusion-line colors).
	it("deutan red drifts monotonically with severity", () => {
		const red = tincture("#ff0000");
		const d = function(s) {
			return red.deltaE(red.simulate("deutan", { severity: s }), "2000");
		};
		const a = d(0);
		const b = d(0.25);
		const c = d(0.5);
		const e = d(0.75);
		const f = d(1);
		expect(a).toBeLessThanOrEqual(b);
		expect(b).toBeLessThanOrEqual(c);
		expect(c).toBeLessThanOrEqual(e);
		expect(e).toBeLessThanOrEqual(f);
	});
});

describe("simulate: golden values (Brettel/Viénot pipeline)", () => {
	// Locked-in references from this implementation's HPE LMS pipeline.
	// These match the standard Brettel 1997 / Viénot 1999 results within
	// rounding for the LMS matrix used; deviations from third-party tools
	// (Coblis, Sim Daltonism) come from differing LMS conventions.
	const cases = [
		// [input, type, expected r, g, b]
		["#ff0000", "protan", 115, 115, 0],
		["#ff0000", "deutan", 156, 156, 0],
		["#ff0000", "tritan", 255, 0, 0],
		["#00ff00", "protan", 235, 235, 14],
		["#00ff00", "deutan", 214, 214, 46],
		["#00ff00", "tritan", 100, 240, 240],
		["#0000ff", "protan", 0, 0, 255],
		["#0000ff", "deutan", 0, 0, 255],
		["#0000ff", "tritan", 0, 99, 99],
		["#ffff00", "protan", 255, 255, 0],
		["#ffff00", "deutan", 255, 255, 0],
		["#ffff00", "tritan", 255, 240, 240],
		["#ff00ff", "protan", 115, 115, 254],
		["#ff00ff", "deutan", 156, 156, 252],
		["#ff00ff", "tritan", 240, 99, 99]
	];
	it.each(cases)(
		"%s → %s ≈ rgb(%i, %i, %i)",
		(input, type, r, g, b) => {
			const out = tincture(input).simulate(type);
			expectRgbClose(out.rgb, { r: r, g: g, b: b }, 1);
		}
	);
});

describe("simulate: returns a tincture instance", () => {
	it("result has the same prototype API", () => {
		const out = tincture("#ff0000").simulate("protan");
		expect(out).toBeInstanceOf(tincture);
		expect(typeof out.toRgbString).toBe("function");
		expect(typeof out.deltaE).toBe("function");
	});
});

describe("simulate: rejects bad input", () => {
	it("throws on unknown type", () => {
		expect(() => tincture("#fff").simulate("bogus")).toThrow(/CVD type/);
	});
	it("throws on non-string type", () => {
		expect(() => tincture("#fff").simulate(42)).toThrow(/string/);
	});
});

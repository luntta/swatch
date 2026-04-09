import { describe, it, expect } from "vitest";
import "../src/bootstrap.js";
import { swatch } from "../src/core/swatch-class.js";
import {
	deltaE,
	deltaE76,
	deltaE94,
	deltaE2000,
	deltaECMC,
	deltaEHyAB,
	deltaEOK
} from "../src/operations/deltaE.js";

// Phase 15: ΔE metrics.
//
// Reference: Sharma, Wu, Dalal (2005) "The CIEDE2000 color-
// difference formula: Implementation notes, supplementary test
// data, and mathematical observations" — tabled ΔE76, ΔE94, ΔE2000
// values for published Lab pairs. We reuse a couple of those pairs
// for ΔE76/ΔE94 reference checks.

describe("Phase 15: ΔE identity cases", () => {
	for (const mode of ["76", "94", "2000", "cmc", "hyab", "ok"]) {
		it(`${mode}: identical colors → 0`, () => {
			const a = swatch("#ff0000");
			const b = swatch("#ff0000");
			expect(deltaE(a, b, mode)).toBeCloseTo(0, 10);
		});
	}
});

describe("Phase 15: ΔE76", () => {
	it("red vs. blue is large", () => {
		const d = deltaE76("#ff0000", "#0000ff");
		expect(d).toBeGreaterThan(100);
	});

	it("tiny change is tiny", () => {
		const d = deltaE76("#ff0000", "#ff0001");
		expect(d).toBeLessThan(0.5);
	});

	it("matches Sharma et al. pair 1 (approx)", () => {
		// Pair from Sharma 2005 Table 1, row 1:
		//   Lab1 = (50.0000, 2.6772, -79.7751)
		//   Lab2 = (50.0000, 0.0000, -82.7485)
		// Reported ΔE76 ≈ 4.0011
		const a = swatch({ space: "lab", coords: [50, 2.6772, -79.7751] });
		const b = swatch({ space: "lab", coords: [50, 0, -82.7485] });
		expect(deltaE76(a, b)).toBeCloseTo(4.0011, 3);
	});
});

describe("Phase 15: ΔE94", () => {
	it("matches Sharma 2005 pair 1 (approx)", () => {
		// Same pair as above. Reported ΔE94 ≈ 1.3950 (graphic arts).
		const a = swatch({ space: "lab", coords: [50, 2.6772, -79.7751] });
		const b = swatch({ space: "lab", coords: [50, 0, -82.7485] });
		expect(deltaE94(a, b)).toBeCloseTo(1.395, 2);
	});

	it("is smaller than ΔE76 for typical pairs (weighting effect)", () => {
		const a = "#ff0000";
		const b = "#cc3333";
		expect(deltaE94(a, b)).toBeLessThan(deltaE76(a, b));
	});
});

describe("Phase 15: ΔE2000", () => {
	it("matches v2 baseline for a well-known pair", () => {
		// (50, 2.6772, -79.7751) vs. (50, 0, -82.7485) → Sharma reports ≈ 2.0425
		const a = swatch({ space: "lab", coords: [50, 2.6772, -79.7751] });
		const b = swatch({ space: "lab", coords: [50, 0, -82.7485] });
		expect(deltaE2000(a, b)).toBeCloseTo(2.0425, 3);
	});
});

describe("Phase 15: CMC l:c", () => {
	it("default is l=1 c=1", () => {
		const a = "#ff0000";
		const b = "#ff3333";
		const a1 = deltaECMC(a, b);
		const a2 = deltaECMC(a, b, { l: 1, c: 1 });
		expect(a1).toBeCloseTo(a2, 10);
	});

	it("l=2 gives smaller L-weighted distance than l=1", () => {
		// Changing L should be penalized less at l=2.
		const a = swatch({ space: "lab", coords: [50, 0, 0] });
		const b = swatch({ space: "lab", coords: [60, 0, 0] });
		const l1 = deltaECMC(a, b, { l: 1, c: 1 });
		const l2 = deltaECMC(a, b, { l: 2, c: 1 });
		expect(l2).toBeLessThan(l1);
		expect(l2).toBeCloseTo(l1 / 2, 10);
	});

	it("non-identical returns positive", () => {
		expect(deltaECMC("#ff0000", "#ff3333")).toBeGreaterThan(0);
	});
});

describe("Phase 15: HyAB", () => {
	it("collapses to sum of |dL| + ab-distance", () => {
		// For two colors with only L difference, HyAB equals |dL|.
		const a = swatch({ space: "lab", coords: [30, 5, -10] });
		const b = swatch({ space: "lab", coords: [70, 5, -10] });
		expect(deltaEHyAB(a, b)).toBeCloseTo(40, 10);
	});

	it("pure chroma difference matches ab-euclidean", () => {
		const a = swatch({ space: "lab", coords: [50, 0, 0] });
		const b = swatch({ space: "lab", coords: [50, 3, 4] });
		expect(deltaEHyAB(a, b)).toBeCloseTo(5, 10);
	});

	it("is larger than ΔE76 for mixed differences", () => {
		// HyAB uses L1 norm on L + L2 on (a,b); typically >= ΔE76's pure L2.
		const a = swatch({ space: "lab", coords: [50, 0, 0] });
		const b = swatch({ space: "lab", coords: [60, 3, 4] });
		expect(deltaEHyAB(a, b)).toBeGreaterThanOrEqual(deltaE76(a, b));
	});
});

describe("Phase 15: deltaE dispatcher", () => {
	it("dispatches to the right implementation", () => {
		const a = "#ff0000";
		const b = "#0000ff";
		expect(deltaE(a, b, "76")).toBeCloseTo(deltaE76(a, b), 10);
		expect(deltaE(a, b, "94")).toBeCloseTo(deltaE94(a, b), 10);
		expect(deltaE(a, b, "2000")).toBeCloseTo(deltaE2000(a, b), 10);
		expect(deltaE(a, b, "cmc")).toBeCloseTo(deltaECMC(a, b), 10);
		expect(deltaE(a, b, "hyab")).toBeCloseTo(deltaEHyAB(a, b), 10);
		expect(deltaE(a, b, "ok")).toBeCloseTo(deltaEOK(a, b), 10);
	});

	it("defaults to 2000", () => {
		const a = "#ff0000";
		const b = "#cc3333";
		expect(deltaE(a, b)).toBeCloseTo(deltaE2000(a, b), 10);
	});

	it("throws on unknown mode", () => {
		expect(() => deltaE("#000", "#fff", "nope")).toThrow(/unknown mode/);
	});

	it("wired as c.deltaE(other, mode)", () => {
		const c = swatch("#ff0000");
		expect(c.deltaE("#0000ff", "2000")).toBeCloseTo(
			deltaE2000("#ff0000", "#0000ff"),
			10
		);
	});

	it("c.deltaE passes through opts", () => {
		const c = swatch({ space: "lab", coords: [50, 0, 0] });
		const d1 = c.deltaE(
			swatch({ space: "lab", coords: [60, 0, 0] }),
			"cmc",
			{ l: 2, c: 1 }
		);
		const d2 = c.deltaE(
			swatch({ space: "lab", coords: [60, 0, 0] }),
			"cmc"
		);
		expect(d1).toBeCloseTo(d2 / 2, 10);
	});
});

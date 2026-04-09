// Color scales — chroma.js-style.
//
//   swatch.scale([c0, c1, c2, ...])        // fixed stops
//   swatch.scale('viridis')                // built-in palette (Phase 18)
//
// Returns a `Scale` function you can call with a number in [0, 1]
// (the default domain) to interpolate between the stops. The scale
// also carries methods for reshaping the curve:
//
//   .domain([a, b])       — map input through this domain before lerp
//   .classes(n | [...])   — bucket the output into n (or explicit) bins
//   .padding(p | [l, r])  — trim fractional amounts off each end
//   .gamma(g)             — pow the normalized t by g (emphasis curve)
//   .mode(space)          — interpolation color space (default 'oklab')
//   .correctLightness()   — resample t so the output Lab L is linear
//   .cache(on)            — toggle result memoization
//
// Calling pattern:
//   scale(t)                — Swatch at position t
//   scale.colors(n, fmt?)   — array of n Swatches or formatted strings
//
// Also:
//   swatch.bezier([colors])     — returns a fn that can be passed to scale
//   swatch.cubehelix({start, rotations, hue, gamma, lightness}) — ditto

import { Swatch, swatch } from "../core/swatch-class.js";
import { mix } from "../operations/mix.js";
import { getPalette } from "../palettes/index.js";

function toSwatch(input) {
	return input instanceof Swatch ? input : swatch(input);
}

function clamp01(x) {
	return x < 0 ? 0 : x > 1 ? 1 : x;
}

// Interpolate directly between two Swatches in `space`. This is the
// same math as mix(a, b, t, {space}); we bypass the toSwatch dance
// inside the hot path.
function interp(a, b, t, space) {
	return mix(a, b, t, { space });
}

function buildScale(stops, state) {
	const arr = stops.map(toSwatch);
	if (arr.length < 2) {
		// Single-stop: always that color.
		arr.push(arr[0]);
	}

	function sampleRaw(t) {
		// Input t is in state.domain coords; normalize to [0, 1].
		const [d0, d1] = state.domain;
		let u = d0 === d1 ? 0 : (t - d0) / (d1 - d0);
		u = clamp01(u);

		// Padding: compress [0,1] to [pl, 1-pr] *before* other shaping.
		const [pl, pr] = state.padding;
		u = pl + u * (1 - pl - pr);

		// Gamma: emphasis curve on the normalized position.
		if (state.gamma !== 1) u = Math.pow(u, state.gamma);

		// correctLightness: resample via the precomputed L lookup.
		if (state.lightnessCorrection) {
			u = state.lightnessCorrection(u);
		}

		// Classes: bucket output into bins (step-function).
		if (state.classes) {
			u = bucketize(u, state.classes);
		}

		// Map u onto the piecewise-linear sequence of stops.
		const n = arr.length - 1;
		const p = u * n;
		const i = Math.min(Math.floor(p), n - 1);
		const localT = p - i;
		return interp(arr[i], arr[i + 1], localT, state.space);
	}

	function sample(t) {
		if (state.cache) {
			const key = t;
			if (state.cacheMap.has(key)) return state.cacheMap.get(key);
			const v = sampleRaw(t);
			state.cacheMap.set(key, v);
			return v;
		}
		return sampleRaw(t);
	}

	function scale(t) {
		return sample(t);
	}

	scale.colors = function (n, format) {
		const out = [];
		const [d0, d1] = state.domain;
		if (n <= 0) return out;
		if (n === 1) {
			out.push(sample((d0 + d1) / 2));
		} else {
			for (let i = 0; i < n; i++) {
				const t = d0 + (d1 - d0) * (i / (n - 1));
				out.push(sample(t));
			}
		}
		if (format) {
			return out.map((c) => c.toString({ format }));
		}
		return out;
	};

	function clearCache() {
		state.cacheMap = new Map();
	}

	scale.domain = function (d) {
		if (d === undefined) return state.domain.slice();
		state.domain = [d[0], d[1]];
		clearCache();
		return scale;
	};

	scale.classes = function (n) {
		if (n === undefined) return state.classes;
		if (typeof n === "number") {
			// Build n+1 evenly-spaced breakpoints in normalized [0, 1].
			const breaks = [];
			for (let i = 0; i <= n; i++) breaks.push(i / n);
			state.classes = breaks;
		} else if (Array.isArray(n)) {
			// Caller provided explicit domain-space breakpoints; convert
			// to normalized positions via the *current* domain.
			const [d0, d1] = state.domain;
			state.classes = n.map((v) => clamp01((v - d0) / (d1 - d0)));
			state.classes.sort((a, b) => a - b);
		} else {
			state.classes = null;
		}
		clearCache();
		return scale;
	};

	scale.padding = function (p) {
		if (p === undefined) return state.padding.slice();
		if (typeof p === "number") state.padding = [p, p];
		else state.padding = [p[0], p[1]];
		clearCache();
		return scale;
	};

	scale.gamma = function (g) {
		if (g === undefined) return state.gamma;
		state.gamma = g;
		clearCache();
		return scale;
	};

	scale.mode = function (space) {
		if (space === undefined) return state.space;
		state.space = space;
		clearCache();
		return scale;
	};

	scale.correctLightness = function (enable = true) {
		if (!enable) {
			state.lightnessCorrection = null;
		} else {
			// Precompute: sample the raw scale at uniform t, record Lab L,
			// then build an inverse lookup from desired-L to actual-t.
			const samples = 64;
			const ts = new Array(samples + 1);
			const ls = new Array(samples + 1);
			const saved = state.lightnessCorrection;
			state.lightnessCorrection = null;
			for (let i = 0; i <= samples; i++) {
				const t = i / samples;
				ts[i] = t;
				ls[i] = sampleRaw(normalizedToDomain(t, state.domain)).lab.l;
			}
			state.lightnessCorrection = saved;
			const lStart = ls[0];
			const lEnd = ls[samples];
			state.lightnessCorrection = function (u) {
				// Desired L at position u (linear in L).
				const targetL = lStart + (lEnd - lStart) * u;
				// Find the two sample indices bracketing targetL.
				// (Monotonic-in-t but not necessarily monotonic-in-L,
				// so we take the segment whose endpoints straddle it.)
				for (let i = 0; i < samples; i++) {
					const la = ls[i];
					const lb = ls[i + 1];
					if (
						(la <= targetL && targetL <= lb) ||
						(lb <= targetL && targetL <= la)
					) {
						const frac =
							lb === la ? 0 : (targetL - la) / (lb - la);
						return ts[i] + frac * (ts[i + 1] - ts[i]);
					}
				}
				return u;
			};
		}
		clearCache();
		return scale;
	};

	scale.cache = function (on) {
		if (on === undefined) return state.cache;
		state.cache = !!on;
		if (!state.cache) state.cacheMap = new Map();
		return scale;
	};

	return scale;
}

function normalizedToDomain(u, domain) {
	const [d0, d1] = domain;
	return d0 + u * (d1 - d0);
}

function bucketize(u, breaks) {
	// Classes are normalized breakpoints in [0, 1]; find the bin
	// index, return the midpoint of its normalized bin.
	for (let i = 0; i < breaks.length - 1; i++) {
		if (u >= breaks[i] && u <= breaks[i + 1]) {
			return (breaks[i] + breaks[i + 1]) / 2;
		}
	}
	return u;
}

// Public entry: swatch.scale(stops or palette name)
export function scale(stops) {
	let resolved;
	if (typeof stops === "string") {
		const palette = getPalette(stops);
		if (!palette) {
			throw new Error(`scale: unknown palette "${stops}"`);
		}
		resolved = palette;
	} else if (typeof stops === "function") {
		// Caller passed a bezier/cubehelix function: wrap it as a
		// pre-built sampler. It already takes t in [0,1] and returns a
		// Swatch, so we just expose it with the same surface API.
		return wrapFunctionScale(stops);
	} else {
		resolved = stops;
	}

	const state = {
		domain: [0, 1],
		padding: [0, 0],
		gamma: 1,
		classes: null,
		space: "oklab",
		lightnessCorrection: null,
		cache: true,
		cacheMap: new Map()
	};
	return buildScale(resolved, state);
}

function wrapFunctionScale(fn) {
	const state = {
		domain: [0, 1],
		padding: [0, 0],
		gamma: 1,
		classes: null,
		space: "oklab",
		lightnessCorrection: null,
		cache: true,
		cacheMap: new Map()
	};

	function sampleRaw(t) {
		const [d0, d1] = state.domain;
		let u = d0 === d1 ? 0 : (t - d0) / (d1 - d0);
		u = clamp01(u);
		const [pl, pr] = state.padding;
		u = pl + u * (1 - pl - pr);
		if (state.gamma !== 1) u = Math.pow(u, state.gamma);
		if (state.lightnessCorrection) u = state.lightnessCorrection(u);
		if (state.classes) u = bucketize(u, state.classes);
		return fn(u);
	}

	function sample(t) {
		if (state.cache) {
			if (state.cacheMap.has(t)) return state.cacheMap.get(t);
			const v = sampleRaw(t);
			state.cacheMap.set(t, v);
			return v;
		}
		return sampleRaw(t);
	}

	function scale(t) {
		return sample(t);
	}

	scale.colors = function (n, format) {
		const out = [];
		const [d0, d1] = state.domain;
		if (n <= 0) return out;
		if (n === 1) {
			out.push(sample((d0 + d1) / 2));
		} else {
			for (let i = 0; i < n; i++) {
				const t = d0 + (d1 - d0) * (i / (n - 1));
				out.push(sample(t));
			}
		}
		if (format) return out.map((c) => c.toString({ format }));
		return out;
	};
	scale.domain = function (d) {
		if (d === undefined) return state.domain.slice();
		state.domain = [d[0], d[1]];
		state.cacheMap = new Map();
		return scale;
	};
	scale.classes = function (n) {
		if (n === undefined) return state.classes;
		if (typeof n === "number") {
			const breaks = [];
			for (let i = 0; i <= n; i++) breaks.push(i / n);
			state.classes = breaks;
		} else if (Array.isArray(n)) {
			const [d0, d1] = state.domain;
			state.classes = n
				.map((v) => clamp01((v - d0) / (d1 - d0)))
				.sort((a, b) => a - b);
		} else state.classes = null;
		state.cacheMap = new Map();
		return scale;
	};
	scale.padding = function (p) {
		if (p === undefined) return state.padding.slice();
		state.padding = typeof p === "number" ? [p, p] : [p[0], p[1]];
		state.cacheMap = new Map();
		return scale;
	};
	scale.gamma = function (g) {
		if (g === undefined) return state.gamma;
		state.gamma = g;
		state.cacheMap = new Map();
		return scale;
	};
	scale.mode = function (space) {
		if (space === undefined) return state.space;
		state.space = space;
		state.cacheMap = new Map();
		return scale;
	};
	scale.correctLightness = function (enable = true) {
		// Not implemented for wrapped function scales — the semantics
		// are the same but would require resampling through the input
		// fn, and bezier/cubehelix usually already control L explicitly.
		return scale;
	};
	scale.cache = function (on) {
		if (on === undefined) return state.cache;
		state.cache = !!on;
		if (!state.cache) state.cacheMap = new Map();
		return scale;
	};
	return scale;
}

/* Some ideas and inspiration, such as regular expressions, are from Jon Kantner's CSS-tricks article.
 * https://css-tricks.com/converting-color-spaces-in-javascript/
 * Formulas for HSL conversions come from https://www.vocal.com/video/rgb-and-hsvhsihsl-color-space-conversion/
 */

import namedColors from "./named-colors.js";

function tincture(color, options) {
	color = color ? color : "";
	options = options || {};

	if (color instanceof tincture) {
		return color;
	}

	if (!(this instanceof tincture)) {
		return new tincture(color, options);
	}

	this._original = color;

	this._originalFormat = this.getFormat(color);
	switch (this._originalFormat) {
		case "RGB":
			this.hasAlpha = false;
			this.rgb = this.RGBStringToRGBObj(color, this.hasAlpha);
			break;
		case "RGBA":
			this.hasAlpha = true;
			this.rgb = this.RGBStringToRGBObj(color, this.hasAlpha);
			break;
		case "HEX":
			this.hasAlpha = false;
			this.rgb = this._HEXToRGB(color, true);
			break;
		case "Named":
			this.hasAlpha = false;
			this.rgb = this._HEXToRGB(
				"#" + namedColors[color.toLowerCase()],
				true
			);
			break;
		case "HEXA":
			this.hasAlpha = true;
			this.rgb = this._HEXAToRGBA(color, true);
			break;
		case "HSL":
			this.hasAlpha = false;
			this.rgb = this._HSLToRGB(color, true);
			break;
		case "HSLA":
			this.hasAlpha = true;
			this.rgb = this._HSLAToRGBA(color, true);
			break;
		case "RGBObj":
			this.hasAlpha = false;
			this.rgb = { r: +color.r, g: +color.g, b: +color.b };
			break;
		case "RGBAObj":
			this.hasAlpha = true;
			this.rgb = {
				r: +color.r,
				g: +color.g,
				b: +color.b,
				a: +color.a
			};
			break;
		case "HSLObj":
			this.hasAlpha = false;
			this.rgb = this._HSLToRGB(
				"hsl(" + color.h + "," + color.s + "%," + color.l + "%)",
				true
			);
			break;
		case "HSLAObj":
			this.hasAlpha = true;
			this.rgb = this._HSLAToRGBA(
				"hsla(" +
					color.h +
					"," +
					color.s +
					"%," +
					color.l +
					"%," +
					color.a +
					")",
				true
			);
			break;
		default:
			this.isValid = false;
			return;
	}

	if (this.hasAlpha) {
		this.hex = this._RGBAToHEXA(this.RGBObjToRGBString(this.rgb), true);
		this.hsl = this._RGBAToHSLA(this.RGBObjToRGBString(this.rgb), true);
	} else {
		this.hex = this._RGBToHEX(this.RGBObjToRGBString(this.rgb), true);
		this.hsl = this._RGBToHSL(this.RGBObjToRGBString(this.rgb), true);
	}

	this.isValid = true;
}

tincture.prototype = {
	RGBStringToRGBObj: function(color) {
		if (this.isRGBAString(color)) {
			let sep = color.indexOf(",") > -1 ? "," : " ";
			color = color
				.substr(5)
				.split(")")[0]
				.split(sep);

			if (color.indexOf("/") > -1) color.splice(3, 1);

			for (let i in color) {
				let r = color[i];
				if (r.indexOf("%") > -1) {
					let p = r.substr(0, r.length - 1) / 100;

					if (i < 3) {
						color[i] = Math.round(p * 255);
					} else {
						color[i] = p;
					}
				}
			}

			let r = color[0],
				g = color[1],
				b = color[2],
				a = color[3];

			return { r: +r, g: +g, b: +b, a: +a };
		} else if (this.isRGBString(color)) {
			let sep = color.indexOf(",") > -1 ? "," : " ";
			color = color
				.substr(4)
				.split(")")[0]
				.split(sep);

			for (let i in color) {
				let r = color[i];
				if (r.indexOf("%") > -1)
					color[i] = Math.round(
						(r.substr(0, r.length - 1) / 100) * 255
					);
			}

			let r = color[0],
				g = color[1],
				b = color[2];

			return { r: +r, g: +g, b: +b };
		}
	},
	RGBObjToRGBString: function(color) {
		if (typeof color === "object") {
			if (color.hasOwnProperty("a")) {
				return (
					"rgba(" +
					+color.r +
					"," +
					+color.g +
					"," +
					+color.b +
					"," +
					+color.a +
					")"
				);
			} else {
				return (
					"rgb(" + +color.r + "," + +color.g + "," + +color.b + ")"
				);
			}
		}
	},
	HSLObjToHSLString: function(color) {
		if (typeof color === "object") {
			if (color.hasOwnProperty("a")) {
				return (
					"hsla(" +
					+color.h +
					"," +
					+color.s +
					"%," +
					+color.l +
					"%," +
					+color.a +
					")"
				);
			} else {
				return (
					"hsl(" + +color.h + "," + +color.s + "%," + +color.l + "%)"
				);
			}
		}
	},
	toRgb: function() {
		return this.rgb;
	},
	toRgbString: function() {
		return this.RGBObjToRGBString(this.rgb);
	},
	toHsl: function() {
		return this.hsl;
	},
	toHslString: function() {
		return this.HSLObjToHSLString(this.hsl);
	},
	toHex: function() {
		return this.hex;
	},
	clone: function() {
		// The constructor short-circuits on `instanceof tincture`, so
		// pass the rgb object — which always carries the right alpha
		// shape — to produce an independent copy.
		return tincture(this.rgb);
	},
	equals: function(other, options) {
		if (!this.isValid) return false;
		if (!(other instanceof tincture)) other = tincture(other);
		if (!other.isValid) return false;

		options = options || {};
		const space = options.space || "rgb";
		const tolerance = options.tolerance != null ? options.tolerance : 0;

		if (space === "rgb") {
			const a = this.rgb;
			const b = other.rgb;
			const aA = a.a != null ? a.a : 1;
			const bA = b.a != null ? b.a : 1;
			return (
				Math.abs(a.r - b.r) <= tolerance &&
				Math.abs(a.g - b.g) <= tolerance &&
				Math.abs(a.b - b.b) <= tolerance &&
				Math.abs(aA - bA) <= (tolerance > 0 ? tolerance / 255 : 0)
			);
		}
		if (space === "hex") {
			return this.hex.toLowerCase() === other.hex.toLowerCase();
		}
		if (space === "hsl") {
			const a = this.hsl;
			const b = other.hsl;
			return (
				Math.abs(a.h - b.h) <= tolerance &&
				Math.abs(a.s - b.s) <= tolerance &&
				Math.abs(a.l - b.l) <= tolerance
			);
		}
		if (space === "lab" || space === "oklab") {
			// Compare via Delta E in the requested space. Treat
			// `tolerance` as a Delta E threshold.
			const dE = space === "lab"
				? this.deltaE(other, "2000")
				: this.deltaE(other, "ok");
			return dE <= tolerance;
		}
		throw new Error("Unknown equals space: " + space);
	},
	toJSON: function() {
		const out = {
			hex: this.hex,
			rgb: this.rgb,
			hsl: this.hsl,
			isValid: this.isValid
		};
		if (this._originalFormat) out.format = this._originalFormat;
		return out;
	},
	isRGBString: function(color) {
		color = color ? color : this._original;
		let expression = /^rgb\((((((((1?[1-9]?\d)|10\d|(2[0-4]\d)|25[0-5]),\s?)){2}|((((1?[1-9]?\d)|10\d|(2[0-4]\d)|25[0-5])\s)){2})((1?[1-9]?\d)|10\d|(2[0-4]\d)|25[0-5]))|((((([1-9]?\d(\.\d+)?)|100|(\.\d+))%,\s?){2}|((([1-9]?\d(\.\d+)?)|100|(\.\d+))%\s){2})(([1-9]?\d(\.\d+)?)|100|(\.\d+))%))\)$/i;
		return expression.test(color);
	},

	isRGBAString: function(color) {
		color = color ? color : this._original;
		let expression = /^rgba\((((((((1?[1-9]?\d)|10\d|(2[0-4]\d)|25[0-5]),\s?)){3})|(((([1-9]?\d(\.\d+)?)|100|(\.\d+))%,\s?){3}))|(((((1?[1-9]?\d)|10\d|(2[0-4]\d)|25[0-5])\s){3})|(((([1-9]?\d(\.\d+)?)|100|(\.\d+))%\s){3}))\/\s)((0?\.\d+)|[01]|(([1-9]?\d(\.\d+)?)|100|(\.\d+))%)\)$/i;
		return expression.test(color);
	},

	isHEX: function(color) {
		color = color ? color : this._original;
		let expression = /^#([\da-f]{3}){1,2}$/i;
		return expression.test(color);
	},

	isHEXA: function(color) {
		color = color ? color : this._original;
		let expression = /^#([\da-f]{4}){1,2}$/i;
		return expression.test(color);
	},

	isHSLString: function(color) {
		color = color ? color : this._original;
		let expression = /^hsl\(((((([12]?[1-9]?\d)|[12]0\d|(3[0-5]\d))(\.\d+)?)|(\.\d+))(deg)?|(0|0?\.\d+)turn|(([0-6](\.\d+)?)|(\.\d+))rad)((,\s?(([1-9]?\d(\.\d+)?)|100|(\.\d+))%){2}|(\s(([1-9]?\d(\.\d+)?)|100|(\.\d+))%){2})\)$/i;
		return expression.test(color);
	},

	isHSLAString: function(color) {
		color = color ? color : this._original;
		let expression = /^hsla\(((((([12]?[1-9]?\d)|[12]0\d|(3[0-5]\d))(\.\d+)?)|(\.\d+))(deg)?|(0|0?\.\d+)turn|(([0-6](\.\d+)?)|(\.\d+))rad)(((,\s?(([1-9]?\d(\.\d+)?)|100|(\.\d+))%){2},\s?)|((\s(([1-9]?\d(\.\d+)?)|100|(\.\d+))%){2}\s\/\s))((0?\.\d+)|[01]|(([1-9]?\d(\.\d+)?)|100|(\.\d+))%)\)$/i;
		return expression.test(color);
	},

	getLuminance: function(rgbObj) {
		rgbObj = rgbObj ? rgbObj : this.rgb;
		let arr = [rgbObj.r, rgbObj.g, rgbObj.b].map(function(value) {
			value /= 255;
			return value <= 0.03928
				? value / 12.92
				: Math.pow((value + 0.055) / 1.055, 2.4);
		});
		return arr[0] * 0.2126 + arr[1] * 0.7152 + arr[2] * 0.0722;
	},

	getContrast: function(rgbObj1, rgbObj2) {
		rgbObj2 = rgbObj2 ? rgbObj2 : this.rgb;
		var res =
			(this.getLuminance(rgbObj1) + 0.05) /
			(this.getLuminance(rgbObj2) + 0.05);
		if (res < 1) res = 1 / res;
		return res;
	},

	// ─── Accessibility helpers ─────────────────────────────────────────
	//
	// contrast(other) — WCAG 2.1 contrast ratio against another color.
	// Accepts a tincture, a CSS string, or any plain object the
	// constructor accepts. Symmetric: contrast(a, b) === contrast(b, a).
	contrast: function(other) {
		if (!(other instanceof tincture)) other = tincture(other);
		return this.getContrast(other.rgb);
	},

	// isReadable(other[, options]) — WCAG 2.1 readability check.
	//
	//   options — {
	//     level: "AA" | "AAA"            (default "AA")
	//     size:  "normal" | "large" | "ui" (default "normal")
	//   }
	//
	// Thresholds:
	//   normal AA  = 4.5,  normal AAA = 7
	//   large  AA  = 3,    large  AAA = 4.5
	//   ui     AA  = 3   (UI components, level AAA n/a in WCAG 2.1)
	isReadable: function(other, options) {
		options = options || {};
		const level = options.level || "AA";
		const size = options.size || "normal";
		let threshold;
		if (size === "large") {
			threshold = level === "AAA" ? 4.5 : 3;
		} else if (size === "ui") {
			threshold = 3;
		} else {
			threshold = level === "AAA" ? 7 : 4.5;
		}
		return this.contrast(other) >= threshold;
	},

	// ensureContrast(other[, options]) — return a new tincture whose
	// contrast against `other` meets `minRatio`, by walking HSL
	// lightness while preserving hue and saturation. If walking up
	// fails to clear the threshold the search reverses direction; if
	// neither direction succeeds, falls back to pure white or black
	// depending on `other`'s luminance.
	//
	//   options — {
	//     minRatio:  WCAG ratio target            (default 4.5)
	//     direction: "auto" | "lighter" | "darker" (default "auto")
	//     step:      HSL L step in %              (default 1)
	//   }
	ensureContrast: function(other, options) {
		options = options || {};
		const minRatio = options.minRatio != null ? options.minRatio : 4.5;
		const step = options.step != null ? options.step : 1;
		if (!(other instanceof tincture)) other = tincture(other);

		if (this.contrast(other) >= minRatio) return tincture(this.rgb);

		let dir = options.direction || "auto";
		if (dir === "auto") {
			// Move away from `other`'s luminance.
			dir = other.getLuminance() > 0.5 ? "darker" : "lighter";
		}

		const baseHsl = this.hsl;
		const tryWalk = function(sign) {
			let l = baseHsl.l;
			while (true) {
				l += sign * step;
				if (l < 0 || l > 100) return null;
				const candidate = tincture({
					h: baseHsl.h,
					s: baseHsl.s,
					l: l
				});
				if (candidate.contrast(other) >= minRatio) return candidate;
			}
		};

		const primary = tryWalk(dir === "lighter" ? 1 : -1);
		if (primary) return primary;
		const fallback = tryWalk(dir === "lighter" ? -1 : 1);
		if (fallback) return fallback;

		// Last resort: highest-contrast extreme.
		return tincture(other.getLuminance() > 0.5 ? "#000000" : "#ffffff");
	},

	getFormat: function(color) {
		color = color ? color : this._original;

		// Object inputs: { r, g, b [, a] } or { h, s, l [, a] }
		if (color !== null && typeof color === "object") {
			const hasRGB =
				Object.prototype.hasOwnProperty.call(color, "r") &&
				Object.prototype.hasOwnProperty.call(color, "g") &&
				Object.prototype.hasOwnProperty.call(color, "b");
			if (hasRGB) {
				return Object.prototype.hasOwnProperty.call(color, "a")
					? "RGBAObj"
					: "RGBObj";
			}
			const hasHSL =
				Object.prototype.hasOwnProperty.call(color, "h") &&
				Object.prototype.hasOwnProperty.call(color, "s") &&
				Object.prototype.hasOwnProperty.call(color, "l");
			if (hasHSL) {
				return Object.prototype.hasOwnProperty.call(color, "a")
					? "HSLAObj"
					: "HSLObj";
			}
		}

		// String inputs
		if (typeof color === "string") {
			if (this.isRGBString(color) == true) return "RGB";
			if (this.isRGBAString(color) == true) return "RGBA";
			if (this.isHEX(color) == true) return "HEX";
			if (this.isHEXA(color) == true) return "HEXA";
			if (this.isHSLString(color) == true) return "HSL";
			if (this.isHSLAString(color) == true) return "HSLA";
			// CSS named colors are matched last so a custom format can
			// shadow them. Comparison is case-insensitive.
			if (
				Object.prototype.hasOwnProperty.call(
					namedColors,
					color.toLowerCase()
				)
			) {
				return "Named";
			}
		}

		this.isValid = false;
		return;
	},

	_HEXToRGB: function(color, returnObj) {
		if (this.isHEX(color)) {
			let r = 0,
				g = 0,
				b = 0;

			if (color.length == 4) {
				r = "0x" + color[1] + color[1];
				g = "0x" + color[2] + color[2];
				b = "0x" + color[3] + color[3];
			} else if (color.length == 7) {
				r = "0x" + color[1] + color[2];
				g = "0x" + color[3] + color[4];
				b = "0x" + color[5] + color[6];
			}
			if (returnObj) {
				return { r: +r, g: +g, b: +b };
			} else {
				return "rgb(" + +r + "," + +g + "," + +b + ")";
			}
		} else {
			this.isValid = false;
			return;
		}
	},

	_HEXToHSL: function(color, returnObj) {
		returnObj = returnObj === true;
		if (this.isHEX(color)) {
			color = this._HEXToRGB(color);
			return this._RGBToHSL(color, returnObj);
		} else {
			this.isValid = false;
			return;
		}
	},

	_HEXAToRGBA: function(color, returnObj) {
		returnObj = returnObj === true;
		if (this.isHEXA(color)) {
			let r = 0,
				g = 0,
				b = 0,
				a = 1;

			if (color.length == 5) {
				r = "0x" + color[1] + color[1];
				g = "0x" + color[2] + color[2];
				b = "0x" + color[3] + color[3];
				a = "0x" + color[4] + color[4];
			} else if (color.length == 9) {
				r = "0x" + color[1] + color[2];
				g = "0x" + color[3] + color[4];
				b = "0x" + color[5] + color[6];
				a = "0x" + color[7] + color[8];
			}

			a = +(a / 255).toFixed(3);

			if (returnObj) {
				return { r: +r, g: +g, b: +b, a: +a };
			}

			return "rgba(" + +r + "," + +g + "," + +b + "," + a + ")";
		} else {
			this.isValid = false;
			return;
		}
	},

	_HEXAToHSLA: function(color, returnObj) {
		returnObj = returnObj === true;
		if (this.isHEXA(color)) {
			color = this._HEXAToRGBA(color);
			return this._RGBAToHSLA(color, returnObj);
		} else {
			this.isValid = false;
			return;
		}
	},

	_HSLToRGB: function(color, returnObj) {
		returnObj = returnObj === true;
		if (this.isHSLString(color)) {
			let sep = color.indexOf(",") > -1 ? "," : " ";
			color = color
				.substr(4)
				.split(")")[0]
				.split(sep);

			let h = color[0],
				s = color[1].substr(0, color[1].length - 1) / 100,
				l = color[2].substr(0, color[2].length - 1) / 100;

			if (h.indexOf("deg") > -1) {
				h = h.substr(0, h.length - 3);
			} else if (h.indexOf("rad") > -1) {
				h = Math.round(h.substr(0, h.length - 3) * (180 / Math.PI));
			} else if (h.indexOf("turn") > -1) {
				h = Math.round(h.substr(0, h.length - 4) * 360);
			}

			if (h >= 360) h %= 360;

			let c = (1 - Math.abs(2 * l - 1)) * s,
				x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
				m = l - c / 2,
				r = 0,
				g = 0,
				b = 0;

			if (h >= 0 && h < 60) {
				r = c;
				g = x;
				b = 0;
			} else if (h >= 60 && h < 120) {
				r = x;
				g = c;
				b = 0;
			} else if (h >= 120 && h < 180) {
				r = 0;
				g = c;
				b = x;
			} else if (h >= 180 && h < 240) {
				r = 0;
				g = x;
				b = c;
			} else if (h >= 240 && h < 300) {
				r = x;
				g = 0;
				b = c;
			} else if (h >= 300 && h < 360) {
				r = c;
				g = 0;
				b = x;
			}

			r = Math.round((r + m) * 255);
			g = Math.round((g + m) * 255);
			b = Math.round((b + m) * 255);
			if (returnObj) {
				return { r: r, b: b, g: g };
			}
			return "rgb(" + r + "," + g + "," + b + ")";
		} else {
			this.isValid = false;
			return;
		}
	},

	_HSLToHEX: function(color) {
		if (this.isHSLString(color)) {
			color = this._HSLToRGB(color);
			return this._RGBToHEX(color);
		} else {
			this.isValid = false;
			return;
		}
	},

	_HSLAToRGBA: function(color, returnObj) {
		returnObj = returnObj === true;
		if (this.isHSLAString(color)) {
			let sep = color.indexOf(",") > -1 ? "," : " ";
			color = color
				.substr(5)
				.split(")")[0]
				.split(sep);

			if (color.indexOf("/") > -1) color.splice(3, 1);

			let h = color[0],
				s = color[1].substr(0, color[1].length - 1),
				l = color[2].substr(0, color[2].length - 1),
				a = color[3];

			if (a.indexOf("%") > -1) {
				a = +a.substr(0, a.length - 1) / 100;
			}

			if (h.indexOf("deg") > -1) {
				h = h.substr(0, h.length - 3);
			} else if (h.indexOf("rad") > -1) {
				h = Math.round(h.substr(0, h.length - 3) * (180 / Math.PI));
			} else if (h.indexOf("turn") > -1) {
				h = Math.round(h.substr(0, h.length - 4) * 360);
			}

			if (h >= 360) h %= 360;

			let obj = this._HSLToRGB(
				"hsl(" + h + "," + s + "%," + l + "%)",
				true
			);
			obj.a = +a;
			if (returnObj) {
				return obj;
			}
			return "rgba(" + obj.r + "," + obj.g + "," + obj.b + "," + a + ")";
		} else {
			this.isValid = false;
			return;
		}
	},

	_HSLAToHEXA: function(color) {
		if (this.isHSLAString(color)) {
			color = this._HSLAToRGBA(color);
			return this._RGBAToHEXA(color);
		} else {
			this.isValid = false;
			return;
		}
	},

	_RGBToHEX: function(color) {
		if (this.isRGBString(color)) {
			let sep = color.indexOf(",") > -1 ? "," : " ";
			color = color
				.substr(4)
				.split(")")[0]
				.split(sep);

			for (let i in color) {
				let r = color[i];
				if (r.indexOf("%") > -1)
					color[i] = Math.round(
						(r.substr(0, r.length - 1) / 100) * 255
					);
			}

			let r = (+color[0]).toString(16),
				g = (+color[1]).toString(16),
				b = (+color[2]).toString(16);

			if (r.length == 1) r = "0" + r;
			if (g.length == 1) g = "0" + g;
			if (b.length == 1) b = "0" + b;

			return "#" + r + g + b;
		} else {
			this.isValid = false;
			return;
		}
	},

	_RGBToHSL: function(color, returnObj) {
		returnObj = returnObj === true;
		if (this.isRGBString(color)) {
			let sep = color.indexOf(",") > -1 ? "," : " ";
			color = color
				.substr(4)
				.split(")")[0]
				.split(sep);

			for (let i in color) {
				let r = color[i];
				if (r.indexOf("%") > -1)
					color[i] = Math.round(
						(r.substr(0, r.length - 1) / 100) * 255
					);
			}

			let r = color[0] / 255,
				g = color[1] / 255,
				b = color[2] / 255;

			let cmin = Math.min(r, g, b),
				cmax = Math.max(r, g, b),
				delta = cmax - cmin,
				h = 0,
				s = 0,
				l = 0;

			if (delta == 0) {
				h = 0;
			} else if (cmax == r) {
				h = ((g - b) / delta) % 6;
			} else if (cmax == g) {
				h = (b - r) / delta + 2;
			} else {
				h = (r - g) / delta + 4;
			}

			h = Math.round(h * 60);

			if (h < 0) {
				h += 360;
			}

			l = (cmax + cmin) / 2;
			s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

			s = +(s * 100).toFixed(1);
			l = +(l * 100).toFixed(1);
			if (returnObj) {
				return { h: h, s: s, l: l };
			}
			return "hsl(" + h + "," + s + "%," + l + "%)";
		} else {
			this.isValid = false;
			return;
		}
	},

	_RGBAToHEXA: function(color) {
		if (this.isRGBAString(color)) {
			let sep = color.indexOf(",") > -1 ? "," : " ";
			color = color
				.substr(5)
				.split(")")[0]
				.split(sep);

			if (color.indexOf("/") > -1) color.splice(3, 1);

			for (let i in color) {
				let r = color[i];
				if (r.indexOf("%") > -1) {
					let p = r.substr(0, r.length - 1) / 100;

					if (i < 3) {
						color[i] = Math.round(p * 255);
					} else {
						color[i] = p;
					}
				}
			}
			let r = (+color[0]).toString(16),
				g = (+color[1]).toString(16),
				b = (+color[2]).toString(16),
				a = Math.round(+color[3] * 255).toString(16);

			if (r.length == 1) r = "0" + r;
			if (g.length == 1) g = "0" + g;
			if (b.length == 1) b = "0" + b;
			if (a.length == 1) a = "0" + a;
			return "#" + r + g + b + a;
		} else {
			this.isValid = false;
			return;
		}
	},

	_RGBAToHSLA: function(color, returnObj) {
		returnObj = returnObj === true;
		if (this.isRGBAString(color)) {
			let sep = color.indexOf(",") > -1 ? "," : " ";
			color = color
				.substr(5)
				.split(")")[0]
				.split(sep);

			if (color.indexOf("/") > -1) color.splice(3, 1);

			for (let i in color) {
				let r = color[i];
				if (r.indexOf("%") > -1) {
					let p = r.substr(0, r.length - 1) / 100;

					if (i < 3) {
						color[i] = Math.round(p * 255);
					} else {
						color[i] = p;
					}
				}
			}

			let r = color[0] / 255,
				g = color[1] / 255,
				b = color[2] / 255,
				a = color[3];

			let cmin = Math.min(r, g, b),
				cmax = Math.max(r, g, b),
				delta = cmax - cmin,
				h = 0,
				s = 0,
				l = 0;

			if (delta == 0) {
				h = 0;
			} else if (cmax == r) {
				h = ((g - b) / delta) % 6;
			} else if (cmax == g) {
				h = (b - r) / delta + 2;
			} else {
				h = (r - g) / delta + 4;
			}

			h = Math.round(h * 60);

			if (h < 0) {
				h += 360;
			}

			l = (cmax + cmin) / 2;
			s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

			s = +(s * 100).toFixed(1);
			l = +(l * 100).toFixed(1);

			if (returnObj) {
				return { h: +h, s: +s, l: +l, a: +a };
			}
			return "hsl(" + h + "," + s + "%," + l + "%," + a + ")";
		} else {
			this.isValid = false;
			return;
		}
	},
	_correctRGBChannelValue: function (value) {
		return value < 0 ? 0 : value < 255 ? Math.round(value) : 255;
	},

	// ─── Manipulation ──────────────────────────────────────────────────
	//
	// Mutating-by-name methods that return a *new* tincture instance.
	// Lighten/darken/saturate/desaturate operate in HSL space; spin
	// rotates hue. Amounts are in [0, 100] (HSL units) for L/S, in
	// degrees for hue. All preserve alpha.

	lighten: function(amount) {
		amount = amount == null ? 10 : amount;
		const h = this.hsl;
		const out = {
			h: h.h,
			s: h.s,
			l: Math.max(0, Math.min(100, h.l + amount))
		};
		if (this.hasAlpha) out.a = h.a;
		return tincture(out);
	},

	darken: function(amount) {
		return this.lighten(-(amount == null ? 10 : amount));
	},

	saturate: function(amount) {
		amount = amount == null ? 10 : amount;
		const h = this.hsl;
		const out = {
			h: h.h,
			s: Math.max(0, Math.min(100, h.s + amount)),
			l: h.l
		};
		if (this.hasAlpha) out.a = h.a;
		return tincture(out);
	},

	desaturate: function(amount) {
		return this.saturate(-(amount == null ? 10 : amount));
	},

	spin: function(degrees) {
		degrees = degrees || 0;
		const h = this.hsl;
		// Wrap into [0, 360).
		let newH = (h.h + degrees) % 360;
		if (newH < 0) newH += 360;
		const out = { h: newH, s: h.s, l: h.l };
		if (this.hasAlpha) out.a = h.a;
		return tincture(out);
	},

	greyscale: function() {
		return this.desaturate(100);
	},

	complement: function() {
		return this.spin(180);
	},

	invert: function() {
		const out = {
			r: 255 - this.rgb.r,
			g: 255 - this.rgb.g,
			b: 255 - this.rgb.b
		};
		if (this.hasAlpha) out.a = this.rgb.a;
		return tincture(out);
	},

	// mix(other, amount, space)
	//
	//   other  — color input
	//   amount — 0..1 (0 = self, 1 = other; default 0.5)
	//   space  — "oklab" (default) | "lab" | "linear" | "rgb" | "hsl"
	//
	// "oklab"/"lab" interpolate in the perceptual Lab spaces (the only
	// option that produces clean mid-grays for hue blends). "linear"
	// interpolates in linear sRGB; "rgb" in gamma-encoded sRGB (the
	// classic naive blend); "hsl" interpolates HSL with shortest-arc
	// hue.
	//
	// Alpha is interpolated linearly. Returns a new tincture instance.
	mix: function(other, amount, space) {
		if (!(other instanceof tincture)) other = tincture(other);
		amount = amount == null ? 0.5 : amount;
		space = space || "oklab";
		const t = Math.max(0, Math.min(1, amount));

		const aHasAlpha = this.hasAlpha;
		const bHasAlpha = other.hasAlpha;
		const aA = aHasAlpha ? this.rgb.a : 1;
		const bA = bHasAlpha ? other.rgb.a : 1;
		const outA = aA + (bA - aA) * t;

		let out;
		if (space === "rgb") {
			out = {
				r: this._correctRGBChannelValue(
					this.rgb.r + (other.rgb.r - this.rgb.r) * t
				),
				g: this._correctRGBChannelValue(
					this.rgb.g + (other.rgb.g - this.rgb.g) * t
				),
				b: this._correctRGBChannelValue(
					this.rgb.b + (other.rgb.b - this.rgb.b) * t
				)
			};
		} else if (space === "linear") {
			const a = this._removeGammaCorrection(this.rgb);
			const b = this._removeGammaCorrection(other.rgb);
			const lin = {
				r: a.r + (b.r - a.r) * t,
				g: a.g + (b.g - a.g) * t,
				b: a.b + (b.b - a.b) * t
			};
			out = this._applyGammaCorrection(lin);
		} else if (space === "hsl") {
			const a = this.hsl;
			const b = other.hsl;
			// Shortest-arc hue interpolation.
			let dh = b.h - a.h;
			if (dh > 180) dh -= 360;
			else if (dh < -180) dh += 360;
			let h = a.h + dh * t;
			if (h < 0) h += 360;
			else if (h >= 360) h -= 360;
			out = tincture({
				h: h,
				s: a.s + (b.s - a.s) * t,
				l: a.l + (b.l - a.l) * t
			}).rgb;
		} else if (space === "lab") {
			const a = this.toLab();
			const b = other.toLab();
			out = this._labToRGB({
				l: a.l + (b.l - a.l) * t,
				a: a.a + (b.a - a.a) * t,
				b: a.b + (b.b - a.b) * t
			});
		} else if (space === "oklab") {
			const a = this.toOklab();
			const b = other.toOklab();
			out = this._oklabToRGB({
				l: a.l + (b.l - a.l) * t,
				a: a.a + (b.a - a.a) * t,
				b: a.b + (b.b - a.b) * t
			});
		} else {
			throw new Error("Unknown mix space: " + space);
		}

		if (aHasAlpha || bHasAlpha) out.a = outA;
		return tincture(out);
	},

	// ─── Harmonies ─────────────────────────────────────────────────────
	//
	// Each harmony returns an array of new tincture instances, with the
	// receiver always at index 0.

	// Two-color harmony: self + complement.
	complementary: function() {
		return [tincture(this.rgb), this.complement()];
	},

	// Three-color harmony: 0°, 120°, 240°.
	triad: function() {
		return [tincture(this.rgb), this.spin(120), this.spin(240)];
	},

	// Four-color harmony: 0°, 90°, 180°, 270°.
	tetrad: function() {
		return [
			tincture(this.rgb),
			this.spin(90),
			this.spin(180),
			this.spin(270)
		];
	},

	// Three-color harmony: 0°, 150°, 210° (complementary split).
	splitComplement: function() {
		return [tincture(this.rgb), this.spin(150), this.spin(210)];
	},

	// n analogous colors centered on the receiver, evenly spaced
	// across `slice` degrees of hue.
	analogous: function(n, slice) {
		n = n == null ? 6 : n;
		slice = slice == null ? 30 : slice;
		if (n < 1) return [];
		if (n === 1) return [tincture(this.rgb)];
		const step = slice / (n - 1);
		const start = -slice / 2;
		const out = [];
		for (let i = 0; i < n; i++) {
			out.push(this.spin(start + i * step));
		}
		return out;
	},

	// n monochromatic shades of the receiver: same hue and saturation,
	// lightness sampled across [0, 100].
	monochromatic: function(n) {
		n = n == null ? 6 : n;
		if (n < 1) return [];
		if (n === 1) return [tincture(this.rgb)];
		const out = [];
		for (let i = 0; i < n; i++) {
			const l = (i / (n - 1)) * 100;
			const hsl = { h: this.hsl.h, s: this.hsl.s, l: l };
			if (this.hasAlpha) hsl.a = this.hsl.a;
			out.push(tincture(hsl));
		}
		return out;
	},

	// ─── Reverse converters used by mix(space: "lab" | "oklab") ───────

	// CIE Lab → linear RGB → sRGB.
	_labToRGB: function(lab) {
		// Lab → XYZ
		const Xn = 0.95047,
			Yn = 1.0,
			Zn = 1.08883;
		const delta = 6 / 29;
		const fy = (lab.l + 16) / 116;
		const fx = lab.a / 500 + fy;
		const fz = fy - lab.b / 200;
		const finv = function(t) {
			return t > delta
				? t * t * t
				: 3 * delta * delta * (t - 4 / 29);
		};
		const xyz = {
			x: Xn * finv(fx),
			y: Yn * finv(fy),
			z: Zn * finv(fz)
		};
		// XYZ → linear sRGB (inverse of _tMatrixRGBToXYZ).
		const M = this._invertMatrix(this._tMatrixRGBToXYZ());
		const lin = {
			r: M[0][0] * xyz.x + M[0][1] * xyz.y + M[0][2] * xyz.z,
			g: M[1][0] * xyz.x + M[1][1] * xyz.y + M[1][2] * xyz.z,
			b: M[2][0] * xyz.x + M[2][1] * xyz.y + M[2][2] * xyz.z
		};
		lin.r = Math.max(0, Math.min(1, lin.r));
		lin.g = Math.max(0, Math.min(1, lin.g));
		lin.b = Math.max(0, Math.min(1, lin.b));
		return this._applyGammaCorrection(lin);
	},

	// OKLab → linear RGB → sRGB. Inverse of `_linearRGBToOklab`.
	_oklabToRGB: function(ok) {
		const lp = ok.l + 0.3963377774 * ok.a + 0.2158037573 * ok.b;
		const mp = ok.l - 0.1055613458 * ok.a - 0.0638541728 * ok.b;
		const sp = ok.l - 0.0894841775 * ok.a - 1.291485548 * ok.b;
		const l = lp * lp * lp;
		const m = mp * mp * mp;
		const s = sp * sp * sp;
		const lin = {
			r:
				4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
			g:
				-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
			b:
				-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
		};
		lin.r = Math.max(0, Math.min(1, lin.r));
		lin.g = Math.max(0, Math.min(1, lin.g));
		lin.b = Math.max(0, Math.min(1, lin.b));
		return this._applyGammaCorrection(lin);
	},

	// ─── Colorblindness simulation & daltonization ────────────────────
	//
	// simulate(type[, options]) — perceptually-grounded CVD simulation.
	//
	//   type     — "protan" | "deutan" | "tritan" | "achroma"
	//              Long aliases ("protanopia", "deuteranomaly", …) accepted.
	//   options  — { severity: 0..1 } (default 1.0 = full dichromacy)
	//
	// Pipeline: sRGB → linear sRGB → projection in linear space →
	// linear sRGB → sRGB. For protan/deutan/tritan the projection is
	// the Brettel/Viénot single-plane dichromat formula (the plane
	// passes through the achromatic axis and a confusion-line anchor:
	// blue for protan/deutan, red for tritan). For achroma it is a
	// luminance-weighted (Rec. 709) collapse to the gray axis.
	//
	// Severity is a Machado-2009-style linear interpolation between the
	// identity and the full dichromat matrix in linear-RGB space.
	//
	// Returns a new tincture instance. Alpha is preserved.
	simulate: function(type, options) {
		const severity =
			options && options.severity != null
				? Math.max(0, Math.min(1, options.severity))
				: 1.0;
		const normalized = this._normalizeCVDType(type);

		let M;
		if (normalized === "achroma") {
			// Rec. 709 luminance coefficients (sum to 1) — applied in
			// linear light produces correct grayscale.
			const Yr = 0.2126,
				Yg = 0.7152,
				Yb = 0.0722;
			const full = [
				[Yr, Yg, Yb],
				[Yr, Yg, Yb],
				[Yr, Yg, Yb]
			];
			M = this._interpolateMatrix3(this._identity3(), full, severity);
		} else {
			const dichromat = this._dichromatRGBMatrix(normalized);
			M = this._interpolateMatrix3(this._identity3(), dichromat, severity);
		}

		const lin = this._removeGammaCorrection(this.rgb);
		const linOut = {
			r: M[0][0] * lin.r + M[0][1] * lin.g + M[0][2] * lin.b,
			g: M[1][0] * lin.r + M[1][1] * lin.g + M[1][2] * lin.b,
			b: M[2][0] * lin.r + M[2][1] * lin.g + M[2][2] * lin.b
		};
		// The projection can produce values just outside [0,1]; clamp
		// before re-encoding (Math.pow of a negative is NaN).
		linOut.r = Math.max(0, Math.min(1, linOut.r));
		linOut.g = Math.max(0, Math.min(1, linOut.g));
		linOut.b = Math.max(0, Math.min(1, linOut.b));

		const out = this._applyGammaCorrection(linOut);
		if (this.rgb.a !== undefined) {
			out.a = this.rgb.a;
		}
		return tincture(out);
	},

	// daltonize(type[, options]) — Fidaner color *correction* for
	// dichromacy. Computes the simulation error in linear RGB and
	// redistributes it into channels the user can still perceive.
	//
	//   type     — "protan" | "deutan" | "tritan" (achroma not supported)
	//   options  — { severity: 0..1 } (default 1.0)
	//
	// Returns a new tincture instance. Alpha is preserved.
	daltonize: function(type, options) {
		const severity =
			options && options.severity != null
				? Math.max(0, Math.min(1, options.severity))
				: 1.0;
		const normalized = this._normalizeCVDType(type);
		if (normalized === "achroma") {
			throw new Error(
				"daltonize: achromatopsia cannot be corrected (no remaining channels)"
			);
		}

		// Build the same simulation matrix the user would experience.
		const dichromat = this._dichromatRGBMatrix(normalized);
		const M = this._interpolateMatrix3(
			this._identity3(),
			dichromat,
			severity
		);

		const lin = this._removeGammaCorrection(this.rgb);
		const linSim = {
			r: M[0][0] * lin.r + M[0][1] * lin.g + M[0][2] * lin.b,
			g: M[1][0] * lin.r + M[1][1] * lin.g + M[1][2] * lin.b,
			b: M[2][0] * lin.r + M[2][1] * lin.g + M[2][2] * lin.b
		};

		// Information lost to the dichromat, in linear sRGB.
		const err = {
			r: lin.r - linSim.r,
			g: lin.g - linSim.g,
			b: lin.b - linSim.b
		};

		// Fidaner shift matrices (canonical form).
		// Red-green deficits push the red-channel error into G and B.
		// Blue-yellow deficit (tritan) pushes the blue error into R and G.
		let shift;
		if (normalized === "tritan") {
			shift = [
				[0, 0, 0.7],
				[0, 0, 0.7],
				[0, 0, 0]
			];
		} else {
			shift = [
				[0, 0, 0],
				[0.7, 0, 0],
				[0.7, 0, 0]
			];
		}

		const corrected = {
			r:
				lin.r +
				shift[0][0] * err.r +
				shift[0][1] * err.g +
				shift[0][2] * err.b,
			g:
				lin.g +
				shift[1][0] * err.r +
				shift[1][1] * err.g +
				shift[1][2] * err.b,
			b:
				lin.b +
				shift[2][0] * err.r +
				shift[2][1] * err.g +
				shift[2][2] * err.b
		};
		corrected.r = Math.max(0, Math.min(1, corrected.r));
		corrected.g = Math.max(0, Math.min(1, corrected.g));
		corrected.b = Math.max(0, Math.min(1, corrected.b));

		const out = this._applyGammaCorrection(corrected);
		if (this.rgb.a !== undefined) {
			out.a = this.rgb.a;
		}
		return tincture(out);
	},

	_normalizeCVDType: function(type) {
		if (typeof type !== "string") {
			throw new Error("CVD type must be a string");
		}
		const t = type.toLowerCase();
		if (t === "protan" || t === "protanopia" || t === "protanomaly")
			return "protan";
		if (t === "deutan" || t === "deuteranopia" || t === "deuteranomaly")
			return "deutan";
		if (t === "tritan" || t === "tritanopia" || t === "tritanomaly")
			return "tritan";
		if (t === "achroma" || t === "achromatopsia" || t === "achromatomaly")
			return "achroma";
		throw new Error("Unknown CVD type: " + type);
	},

	// Build a 3×3 dichromat simulation matrix expressed in linear-sRGB
	// space, by lifting the LMS plane projection through the standard
	// linear-RGB↔LMS transforms:
	//   M_RGB = M_LMS→RGB · M_dichromat_LMS · M_RGB→LMS
	_dichromatRGBMatrix: function(type) {
		const RGBToLMS = this._tMatrixRGBToLMS();
		const LMSToRGB = this._tMatrixLMSToRGB();
		let dichromatLMS;
		if (type === "protan") dichromatLMS = this._tMatrixProtanopia();
		else if (type === "deutan") dichromatLMS = this._tMatrixDeuteranopia();
		else if (type === "tritan") dichromatLMS = this._tMatrixTritanopia();
		else throw new Error("Unknown dichromat type: " + type);
		return this._multiplyMatrices(
			LMSToRGB,
			this._multiplyMatrices(dichromatLMS, RGBToLMS)
		);
	},

	_identity3: function() {
		return [
			[1, 0, 0],
			[0, 1, 0],
			[0, 0, 1]
		];
	},

	_interpolateMatrix3: function(A, B, t) {
		const out = [
			[0, 0, 0],
			[0, 0, 0],
			[0, 0, 0]
		];
		for (let i = 0; i < 3; i++) {
			for (let j = 0; j < 3; j++) {
				out[i][j] = A[i][j] + (B[i][j] - A[i][j]) * t;
			}
		}
		return out;
	},

	_removeGammaCorrection: function(rgbObj) {
		rgbObj = rgbObj ? rgbObj : this.rgb;
		let arr = [rgbObj.r, rgbObj.g, rgbObj.b].map(function(value) {
			value /= 255;
			return value <= 0.04045
				? value / 12.92
				: Math.pow((value + 0.055) / 1.055, 2.4);
		});

		return { r: arr[0], g: arr[1], b: arr[2] };
	},

	_applyGammaCorrection: function(rgbObj) {
		let arr = [rgbObj.r, rgbObj.g, rgbObj.b].map(function(value) {
			return value <= 0.0031308
				? 255 * (value * 12.92)
				: 255 * (1.055 * Math.pow(value, 0.41666) - 0.055);
		});

		return {
			r: this._correctRGBChannelValue(arr[0]),
			g: this._correctRGBChannelValue(arr[1]),
			b: this._correctRGBChannelValue(arr[2])
		};
	},

	_linearRGBToXYZ: function(rgbObj) {
		let transformationMatrix = this._tMatrixRGBToXYZ(),
			rgbMatrix = [[rgbObj.r], [rgbObj.g], [rgbObj.b]],
			xyzMatrix = this._multiplyMatrices(transformationMatrix, rgbMatrix);

		return { x: xyzMatrix[0][0], y: xyzMatrix[1][0], z: xyzMatrix[2][0] };
	},

	_linearRGBToLMS: function(rgbObj) {
		let transformationMatrix = this._tMatrixRGBToLMS(),
			rgbMatrix = [[rgbObj.r], [rgbObj.g], [rgbObj.b]],
			lmsMatrix = this._multiplyMatrices(transformationMatrix, rgbMatrix);

		return { l: lmsMatrix[0][0], m: lmsMatrix[1][0], s: lmsMatrix[2][0] };
	},

	_LMSToRGB: function(lmsObj) {
		let transformationMatrix = this._tMatrixLMSToRGB(),
			lmsMatrix = [[lmsObj.l], [lmsObj.m], [lmsObj.s]],
			rgbMatrix = this._multiplyMatrices(transformationMatrix, lmsMatrix);

		return this._applyGammaCorrection({
			r: rgbMatrix[0][0],
			g: rgbMatrix[1][0],
			b: rgbMatrix[2][0]
		});
	},

	_RGBToLMS: function(rgbObj) {
		rgbObj = rgbObj ? rgbObj : this.rgb;
		rgbObj = this._removeGammaCorrection(rgbObj);

		return this._linearRGBToLMS(rgbObj);
	},

	_XYZToLMS: function(xyzObj) {
		let transformationMatrix = this._tMatrixXYZToLMS(),
			xyzMatrix = [[xyzObj.x], [xyzObj.y], [xyzObj.z]],
			lmsMatrix = this._multiplyMatrices(transformationMatrix, xyzMatrix);

		return { l: lmsMatrix[0][0], m: lmsMatrix[1][0], s: lmsMatrix[2][0] };
	},

	// ─── Perceptual color spaces ───────────────────────────────────────
	// All methods produce a fresh plain object from this.rgb. They do
	// not cache; callers can memoize if needed.

	// sRGB → linear-light sRGB (gamma removed), channels in [0, 1].
	toLinearRGB: function() {
		return this._removeGammaCorrection(this.rgb);
	},

	// sRGB → CIE XYZ, D65. Scale: Y ≈ 1 for white.
	toXYZ: function() {
		return this._linearRGBToXYZ(this.toLinearRGB());
	},

	// sRGB → CIE Lab, D65. L in [0, 100]; a,b are signed.
	toLab: function() {
		return this._XYZToLab(this.toXYZ());
	},

	// sRGB → CIE LCh(ab). L in [0, 100]; C ≥ 0; h in [0, 360).
	toLch: function() {
		return this._labToLch(this.toLab());
	},

	// sRGB → OKLab (Björn Ottosson, 2020). L in [0, 1]; a,b are signed.
	toOklab: function() {
		return this._linearRGBToOklab(this.toLinearRGB());
	},

	// sRGB → OKLCh. L in [0, 1]; C ≥ 0; h in [0, 360).
	toOklch: function() {
		return this._labToLch(this.toOklab());
	},

	// CIE XYZ (D65) → CIE Lab.
	_XYZToLab: function(xyzObj) {
		// D65 reference white on the [0,1] Y=1 scale.
		const Xn = 0.95047,
			Yn = 1.0,
			Zn = 1.08883;
		const delta = 6 / 29;
		const f = function(t) {
			return t > delta * delta * delta
				? Math.cbrt(t)
				: t / (3 * delta * delta) + 4 / 29;
		};
		const fx = f(xyzObj.x / Xn);
		const fy = f(xyzObj.y / Yn);
		const fz = f(xyzObj.z / Zn);
		return {
			l: 116 * fy - 16,
			a: 500 * (fx - fy),
			b: 200 * (fy - fz)
		};
	},

	// Lab-like {l, a, b} → LCh-like {l, c, h}. Works for both CIE Lab
	// and OKLab since the transform is identical (polar form of a,b).
	_labToLch: function(labObj) {
		const c = Math.hypot(labObj.a, labObj.b);
		let h = (Math.atan2(labObj.b, labObj.a) * 180) / Math.PI;
		if (h < 0) h += 360;
		return { l: labObj.l, c: c, h: h };
	},

	// Linear sRGB → OKLab. Reference: Björn Ottosson, "A perceptual
	// color space for image processing" (2020).
	_linearRGBToOklab: function(lin) {
		const l =
			0.4122214708 * lin.r +
			0.5363325363 * lin.g +
			0.0514459929 * lin.b;
		const m =
			0.2119034982 * lin.r +
			0.6806995451 * lin.g +
			0.1073969566 * lin.b;
		const s =
			0.0883024619 * lin.r +
			0.2817188376 * lin.g +
			0.6299787005 * lin.b;
		const lp = Math.cbrt(l);
		const mp = Math.cbrt(m);
		const sp = Math.cbrt(s);
		return {
			l: 0.2104542553 * lp + 0.793617785 * mp - 0.0040720468 * sp,
			a: 1.9779984951 * lp - 2.428592205 * mp + 0.4505937099 * sp,
			b: 0.0259040371 * lp + 0.7827717662 * mp - 0.808675766 * sp
		};
	},

	// ─── Color difference ──────────────────────────────────────────────
	//
	// deltaE(other[, mode]) — perceptual color difference.
	//   mode ∈ { "76", "2000" (default), "ok" }
	//   "76"   — CIE76: euclidean distance in CIE Lab
	//   "2000" — CIEDE2000: CIE 2000 color-difference formula (Sharma 2005)
	//   "ok"   — euclidean distance in OKLab
	//
	// `other` may be a tincture instance, a CSS color string, or any
	// plain object the constructor accepts.
	deltaE: function(other, mode) {
		if (!(other instanceof tincture)) {
			other = tincture(other);
		}
		mode = mode || "2000";
		if (mode === "76") return this._deltaE76(other);
		if (mode === "2000") return this._deltaE2000(other);
		if (mode === "ok") return this._deltaEOK(other);
		throw new Error("Unknown deltaE mode: " + mode);
	},

	_deltaE76: function(other) {
		const a = this.toLab();
		const b = other.toLab();
		return Math.hypot(a.l - b.l, a.a - b.a, a.b - b.b);
	},

	_deltaEOK: function(other) {
		const a = this.toOklab();
		const b = other.toOklab();
		return Math.hypot(a.l - b.l, a.a - b.a, a.b - b.b);
	},

	// CIEDE2000 — Sharma, Wu, Dalal (2005), eq. 2–7.
	// Parametric weights k_L = k_C = k_H = 1.
	_deltaE2000: function(other) {
		const lab1 = this.toLab();
		const lab2 = other.toLab();
		const deg = Math.PI / 180;

		const L1 = lab1.l,
			a1 = lab1.a,
			b1 = lab1.b;
		const L2 = lab2.l,
			a2 = lab2.a,
			b2 = lab2.b;

		const C1 = Math.hypot(a1, b1);
		const C2 = Math.hypot(a2, b2);
		const Cbar = (C1 + C2) / 2;

		const Cbar7 = Math.pow(Cbar, 7);
		const G =
			0.5 * (1 - Math.sqrt(Cbar7 / (Cbar7 + Math.pow(25, 7))));

		const a1p = (1 + G) * a1;
		const a2p = (1 + G) * a2;

		const C1p = Math.hypot(a1p, b1);
		const C2p = Math.hypot(a2p, b2);

		let h1p = (Math.atan2(b1, a1p) * 180) / Math.PI;
		if (h1p < 0) h1p += 360;
		let h2p = (Math.atan2(b2, a2p) * 180) / Math.PI;
		if (h2p < 0) h2p += 360;

		const dLp = L2 - L1;
		const dCp = C2p - C1p;

		let dhp;
		if (C1p * C2p === 0) {
			dhp = 0;
		} else if (Math.abs(h2p - h1p) <= 180) {
			dhp = h2p - h1p;
		} else if (h2p - h1p > 180) {
			dhp = h2p - h1p - 360;
		} else {
			dhp = h2p - h1p + 360;
		}
		const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp / 2) * deg);

		const LbarP = (L1 + L2) / 2;
		const CbarP = (C1p + C2p) / 2;

		let hbarP;
		if (C1p * C2p === 0) {
			hbarP = h1p + h2p;
		} else if (Math.abs(h1p - h2p) <= 180) {
			hbarP = (h1p + h2p) / 2;
		} else if (h1p + h2p < 360) {
			hbarP = (h1p + h2p + 360) / 2;
		} else {
			hbarP = (h1p + h2p - 360) / 2;
		}

		const T =
			1 -
			0.17 * Math.cos((hbarP - 30) * deg) +
			0.24 * Math.cos(2 * hbarP * deg) +
			0.32 * Math.cos((3 * hbarP + 6) * deg) -
			0.2 * Math.cos((4 * hbarP - 63) * deg);

		const dTheta =
			30 * Math.exp(-Math.pow((hbarP - 275) / 25, 2));

		const CbarP7 = Math.pow(CbarP, 7);
		const Rc =
			2 * Math.sqrt(CbarP7 / (CbarP7 + Math.pow(25, 7)));

		const Sl =
			1 +
			(0.015 * Math.pow(LbarP - 50, 2)) /
				Math.sqrt(20 + Math.pow(LbarP - 50, 2));
		const Sc = 1 + 0.045 * CbarP;
		const Sh = 1 + 0.015 * CbarP * T;

		const Rt = -Math.sin(2 * dTheta * deg) * Rc;

		const kL = 1,
			kC = 1,
			kH = 1;
		const termL = dLp / (kL * Sl);
		const termC = dCp / (kC * Sc);
		const termH = dHp / (kH * Sh);

		return Math.sqrt(
			termL * termL +
				termC * termC +
				termH * termH +
				Rt * termC * termH
		);
	},

	_multiplyMatrices: function(mA, mB) {
		var result = new Array(mA.length)
			.fill(0)
			.map(row => new Array(mB[0].length).fill(0));

		return result.map((row, i) => {
			return row.map((val, j) => {
				return mA[i].reduce((a, b, c) => a + b * mB[c][j], 0);
			});
		});
	},

	_invertMatrix: function(matrix) {
		// Thanks to Andrew Ippoliti (@ippo615) for this function
		// http://blog.acipo.com/matrix-inversion-in-javascript/

		if (matrix.length !== matrix[0].length) {
			return;
		}
		let i = 0,
			ii = 0,
			j = 0,
			e = 0;
		let dim = matrix.length;
		let I = [],
			C = [];
		for (i = 0; i < dim; i += 1) {
			I[I.length] = [];
			C[C.length] = [];
			for (j = 0; j < dim; j += 1) {
				if (i == j) {
					I[i][j] = 1;
				} else {
					I[i][j] = 0;
				}

				C[i][j] = matrix[i][j];
			}
		}

		for (i = 0; i < dim; i += 1) {
			e = C[i][i];

			if (e == 0) {
				for (ii = i + 1; ii < dim; ii += 1) {
					if (C[ii][i] != 0) {
						for (j = 0; j < dim; j++) {
							e = C[i][j];
							C[i][j] = C[ii][j];
							C[ii][j] = e;
							e = I[i][j];
							I[i][j] = I[ii][j];
							I[ii][j] = e;
						}

						break;
					}
				}
				e = C[i][i];
				if (e == 0) {
					return;
				}
			}

			for (j = 0; j < dim; j++) {
				C[i][j] = C[i][j] / e;
				I[i][j] = I[i][j] / e;
			}

			for (ii = 0; ii < dim; ii++) {
				if (ii == i) {
					continue;
				}

				e = C[ii][i];

				for (j = 0; j < dim; j++) {
					C[ii][j] -= e * C[i][j];
					I[ii][j] -= e * I[i][j];
				}
			}
		}

		return I;
	},

	_tMatrixRGBToXYZ: function() {
		return [
			[0.4124564, 0.3575761, 0.1804375],
			[0.2126729, 0.7151522, 0.072175],
			[0.0193339, 0.119192, 0.9503041]
		];
	},

	_tMatrixXYZToLMS: function() {
		return [
			[0.4002, 0.7076, -0.0808],
			[-0.2263, 1.1653, 0.0457],
			[0, 0, 0.9182]
		];
	},

	_tMatrixRGBToLMS: function() {
		return this._multiplyMatrices(
			this._tMatrixXYZToLMS(),
			this._tMatrixRGBToXYZ()
		);
	},

	_tMatrixLMSToRGB: function() {
		return this._invertMatrix(this._tMatrixRGBToLMS());
	},

	_redToLMS: function() {
		return this._linearRGBToLMS({ r: 1, g: 0, b: 0 });
	},

	_greenToLMS: function() {
		return this._linearRGBToLMS({ r: 0, g: 1, b: 0 });
	},

	_blueToLMS: function() {
		return this._linearRGBToLMS({ r: 0, g: 0, b: 1 });
	},

	_whiteToLMS: function() {
		return this._linearRGBToLMS({ r: 1, g: 1, b: 1 });
	},

	// Brettel/Viénot dichromat plane: passes through white and a
	// confusion-line anchor color. Solved as a 2-equation linear system
	// via Cramer's rule. The missing cone's response is reconstructed
	// from the remaining two as M = a·X + b·Y in LMS space.

	// Protan: L is missing → L = a·M + b·S, anchor = blue.
	_tMatrixProtanopia: function() {
		const blue = this._blueToLMS();
		const white = this._whiteToLMS();
		const det = white.m * blue.s - blue.m * white.s;
		const a = (white.l * blue.s - blue.l * white.s) / det;
		const b = (white.m * blue.l - blue.m * white.l) / det;
		return [
			[0, a, b],
			[0, 1, 0],
			[0, 0, 1]
		];
	},

	// Deutan: M is missing → M = a·L + b·S, anchor = blue.
	_tMatrixDeuteranopia: function() {
		const blue = this._blueToLMS();
		const white = this._whiteToLMS();
		const det = white.l * blue.s - blue.l * white.s;
		const a = (white.m * blue.s - blue.m * white.s) / det;
		const b = (white.l * blue.m - blue.l * white.m) / det;
		return [
			[1, 0, 0],
			[a, 0, b],
			[0, 0, 1]
		];
	},

	// Tritan: S is missing → S = a·L + b·M, anchor = red.
	_tMatrixTritanopia: function() {
		const red = this._redToLMS();
		const white = this._whiteToLMS();
		const det = white.l * red.m - red.l * white.m;
		const a = (white.s * red.m - red.s * white.m) / det;
		const b = (white.l * red.s - red.l * white.s) / det;
		return [
			[1, 0, 0],
			[0, 1, 0],
			[a, b, 0]
		];
	}
};

// ─── Static helpers for palette accessibility ─────────────────────────

// tincture.checkPalette(palette[, options])
//
// Scan all unordered pairs in `palette` and report perceptual distance
// under an optional CVD simulation. A pair is "safe" if its ΔE meets
// or exceeds `minDeltaE`.
//
//   palette  — array of color inputs (string, object, or tincture)
//   options  — {
//     cvd:        "protan"|"deutan"|"tritan"|"achroma"|null  (default null)
//     severity:   0..1                                       (default 1)
//     minDeltaE:  threshold below which a pair is unsafe     (default 11)
//     mode:       "76"|"2000"|"ok"  ΔE formula               (default "2000")
//   }
//
// Returns: { pairs, unsafe, minDeltaE, safe }
tincture.checkPalette = function(palette, options) {
	options = options || {};
	const cvd = options.cvd || null;
	const severity = options.severity != null ? options.severity : 1;
	const threshold = options.minDeltaE != null ? options.minDeltaE : 11;
	const mode = options.mode || "2000";

	const colors = palette.map(function(c) {
		return c instanceof tincture ? c : tincture(c);
	});
	const view = cvd
		? colors.map(function(c) {
				return c.simulate(cvd, { severity: severity });
		  })
		: colors;

	const pairs = [];
	const unsafe = [];
	let minDE = Infinity;

	for (let i = 0; i < view.length; i++) {
		for (let j = i + 1; j < view.length; j++) {
			const de = view[i].deltaE(view[j], mode);
			const safe = de >= threshold;
			const entry = { i: i, j: j, deltaE: de, safe: safe };
			pairs.push(entry);
			if (!safe) unsafe.push(entry);
			if (de < minDE) minDE = de;
		}
	}
	return {
		pairs: pairs,
		unsafe: unsafe,
		minDeltaE: minDE === Infinity ? 0 : minDE,
		safe: unsafe.length === 0
	};
};

// tincture.nearestDistinguishable(target, against[, options])
//
// Nudge `target`'s lightness until it is at least `minDeltaE` away from
// `against` under the given CVD simulation. Lightness is the cheapest
// dimension to vary while preserving hue and chroma.
//
//   options — {
//     cvd, severity, minDeltaE, mode  (same defaults as checkPalette)
//     step:    HSL lightness step in % (default 2)
//   }
//
// Returns the new tincture instance, or the closest attempt if no value
// in HSL space cleared the threshold.
tincture.nearestDistinguishable = function(target, against, options) {
	options = options || {};
	const cvd = options.cvd || null;
	const severity = options.severity != null ? options.severity : 1;
	const threshold = options.minDeltaE != null ? options.minDeltaE : 11;
	const mode = options.mode || "2000";
	const step = options.step != null ? options.step : 2;

	const targetT = target instanceof tincture ? target : tincture(target);
	const againstT = against instanceof tincture ? against : tincture(against);

	const evalDE = function(t) {
		const a = cvd ? t.simulate(cvd, { severity: severity }) : t;
		const b = cvd ? againstT.simulate(cvd, { severity: severity }) : againstT;
		return a.deltaE(b, mode);
	};

	if (evalDE(targetT) >= threshold) return targetT;

	const baseHsl = targetT.hsl;
	const baseH = baseHsl.h;
	const baseS = baseHsl.s;
	const baseL = baseHsl.l;
	const hasAlpha = targetT.hasAlpha;

	let best = targetT;
	let bestDE = evalDE(targetT);

	// Walk outward from baseL in both directions until we find a hit or
	// exhaust the [0, 100] lightness range.
	const maxDelta = 100;
	for (let d = step; d <= maxDelta; d += step) {
		for (const sign of [-1, 1]) {
			const newL = baseL + sign * d;
			if (newL < 0 || newL > 100) continue;
			const hslInput = { h: baseH, s: baseS, l: newL };
			if (hasAlpha) hslInput.a = baseHsl.a;
			const candidate = tincture(hslInput);
			const de = evalDE(candidate);
			if (de > bestDE) {
				bestDE = de;
				best = candidate;
			}
			if (de >= threshold) return candidate;
		}
	}
	return best;
};

// ─── Static accessibility helpers ─────────────────────────────────────

// tincture.mostReadable(background, candidates[, options])
//
// Pick the most readable foreground from `candidates` against
// `background`. Prefers the highest-contrast candidate that passes the
// WCAG level/size threshold; if none pass and `includeFallback` is not
// false, falls back to black or white (whichever has more contrast).
//
//   options — {
//     level: "AA" | "AAA"              (default "AA")
//     size:  "normal" | "large" | "ui" (default "normal")
//     includeFallback: boolean         (default true)
//   }
tincture.mostReadable = function(background, candidates, options) {
	options = options || {};
	const bg = background instanceof tincture ? background : tincture(background);
	const cands = candidates.map(function(c) {
		return c instanceof tincture ? c : tincture(c);
	});

	let bestPass = null;
	let bestPassRatio = -Infinity;
	let bestAny = null;
	let bestAnyRatio = -Infinity;

	for (const c of cands) {
		const ratio = c.contrast(bg);
		if (c.isReadable(bg, options)) {
			if (ratio > bestPassRatio) {
				bestPassRatio = ratio;
				bestPass = c;
			}
		}
		if (ratio > bestAnyRatio) {
			bestAnyRatio = ratio;
			bestAny = c;
		}
	}

	if (bestPass) return bestPass;
	if (options.includeFallback === false) return bestAny;

	const black = tincture("#000000");
	const white = tincture("#ffffff");
	return black.contrast(bg) >= white.contrast(bg) ? black : white;
};

// tincture.apcaContrast(text, background)
//
// APCA (Accessible Perceptual Contrast Algorithm) — the contrast
// formula in the WCAG 3 draft, by Andrew Somers. Returns the Lightness
// Contrast value Lc on a ~[-108, +106] scale:
//   • Positive Lc — dark text on light background ("BoW").
//   • Negative Lc — light text on dark background ("WoB").
// Typical body-text thresholds: |Lc| ≥ 75 comfortable, ≥ 60 minimum.
//
// Reference: https://github.com/Myndex/SAPC-APCA (SA98G constants).
// Uses the "simple" gamma model (γ = 2.4) rather than the full sRGB
// EOTF, matching the spec.
tincture.apcaContrast = function(text, background) {
	const t = text instanceof tincture ? text : tincture(text);
	const b = background instanceof tincture ? background : tincture(background);

	const mainTRC = 2.4;
	const sRco = 0.2126729,
		sGco = 0.7151522,
		sBco = 0.072175;

	const apcaY = function(rgb) {
		const r = Math.pow(rgb.r / 255, mainTRC);
		const g = Math.pow(rgb.g / 255, mainTRC);
		const bl = Math.pow(rgb.b / 255, mainTRC);
		return sRco * r + sGco * g + sBco * bl;
	};

	// Soft clamp for luminances near black — below blkThrs we push
	// them up by (blkThrs - Y)^blkClmp so that near-black pairs don't
	// produce runaway contrast values.
	const blkThrs = 0.022;
	const blkClmp = 1.414;
	const clampY = function(Y) {
		return Y >= blkThrs ? Y : Y + Math.pow(blkThrs - Y, blkClmp);
	};

	const txtY = clampY(apcaY(t.rgb));
	const bgY = clampY(apcaY(b.rgb));

	const deltaYmin = 0.0005;
	if (Math.abs(bgY - txtY) < deltaYmin) return 0;

	const normBG = 0.56,
		normTXT = 0.57,
		revTXT = 0.62,
		revBG = 0.65,
		scaleBoW = 1.14,
		scaleWoB = 1.14,
		loBoWoffset = 0.027,
		loWoBoffset = 0.027,
		loClip = 0.1;

	let SAPC, outputContrast;
	if (bgY > txtY) {
		// BoW — light background, dark text (positive Lc).
		SAPC = (Math.pow(bgY, normBG) - Math.pow(txtY, normTXT)) * scaleBoW;
		outputContrast = SAPC < loClip ? 0 : SAPC - loBoWoffset;
	} else {
		// WoB — dark background, light text (negative Lc).
		SAPC = (Math.pow(bgY, revBG) - Math.pow(txtY, revTXT)) * scaleWoB;
		outputContrast = SAPC > -loClip ? 0 : SAPC + loWoBoffset;
	}

	return outputContrast * 100;
};

export default tincture;

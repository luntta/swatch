// Import side-effect: registers all built-in spaces with the registry
// and wires the parser dispatcher into the Swatch factory.

import "./spaces/xyz.js";
import "./spaces/srgb.js";
import "./spaces/display-p3.js";
import "./spaces/rec2020.js";
import "./spaces/a98.js";
import "./spaces/prophoto.js";
import "./spaces/lab.js";
import "./spaces/lch.js";
import "./spaces/oklab.js";
import "./spaces/oklch.js";
import "./spaces/hsl.js";
import "./spaces/hsv.js";
import "./spaces/hwb.js";
import "./spaces/cmyk.js";
import "./spaces/hsluv.js";

import "./parse/css.js";

import { parseInput } from "./parse/index.js";
import {
	_bindParseInput,
	_bindChannels,
	_bindGamut
} from "./core/swatch-class.js";
import { getChannel, setChannel } from "./operations/channels.js";
import { inGamut, toGamut } from "./operations/gamut.js";

_bindParseInput(parseInput);
_bindChannels(getChannel, setChannel);
_bindGamut(inGamut, toGamut);

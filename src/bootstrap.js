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
	swatch,
	_bindParseInput,
	_bindChannels,
	_bindGamut,
	_bindManipulation,
	_bindTintShade,
	_bindMix,
	_bindDeltaE,
	_bindNaming,
	_bindTemperature
} from "./core/swatch-class.js";
import { getChannel, setChannel } from "./operations/channels.js";
import { inGamut, toGamut } from "./operations/gamut.js";
import * as manipulation from "./operations/manipulation.js";
import * as tintShade from "./operations/tint-shade.js";
import { mix, average } from "./operations/mix.js";
import { blend } from "./operations/blend.js";
import { deltaE, deltaE76, deltaE2000, deltaEOK } from "./operations/deltaE.js";
import { name, toName, listNamedColors } from "./operations/naming.js";
import { temperature, kelvin } from "./operations/temperature.js";

_bindParseInput(parseInput);
_bindChannels(getChannel, setChannel);
_bindGamut(inGamut, toGamut);
_bindManipulation(manipulation);
_bindTintShade(tintShade);
_bindMix({ mix, average, blend });
_bindDeltaE({ deltaE, deltaE76, deltaE2000, deltaEOK });
_bindNaming({ name, toName, listNamedColors });
_bindTemperature({ kelvin });

// Statics on the factory function.
swatch.temperature = temperature;

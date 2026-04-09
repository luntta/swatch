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
	_bindTemperature,
	_bindAccessibility,
	_bindApca,
	_bindCvd
} from "./core/swatch-class.js";
import { getChannel, setChannel } from "./operations/channels.js";
import { inGamut, toGamut } from "./operations/gamut.js";
import * as manipulation from "./operations/manipulation.js";
import * as tintShade from "./operations/tint-shade.js";
import { mix, average } from "./operations/mix.js";
import { blend } from "./operations/blend.js";
import {
	deltaE,
	deltaE76,
	deltaE94,
	deltaE2000,
	deltaECMC,
	deltaEHyAB,
	deltaEOK
} from "./operations/deltaE.js";
import { name, toName, listNamedColors } from "./operations/naming.js";
import { temperature, kelvin } from "./operations/temperature.js";
import { random } from "./operations/random.js";
import * as accessibility from "./operations/accessibility.js";
import { apcaContrast } from "./operations/apca.js";
import * as cvd from "./operations/cvd.js";
import {
	checkPalette,
	nearestDistinguishable,
	mostReadable
} from "./operations/palette.js";

_bindParseInput(parseInput);
_bindChannels(getChannel, setChannel);
_bindGamut(inGamut, toGamut);
_bindManipulation(manipulation);
_bindTintShade(tintShade);
_bindMix({ mix, average, blend });
_bindDeltaE({
	deltaE,
	deltaE76,
	deltaE94,
	deltaE2000,
	deltaECMC,
	deltaEHyAB,
	deltaEOK
});
_bindNaming({ name, toName, listNamedColors });
_bindTemperature({ kelvin });

_bindAccessibility(accessibility);
_bindApca({ apcaContrast });
_bindCvd(cvd);

// Statics on the factory function.
swatch.temperature = temperature;
swatch.random = random;
swatch.contrast = accessibility.contrast;
swatch.isReadable = accessibility.isReadable;
swatch.ensureContrast = accessibility.ensureContrast;
swatch.apcaContrast = apcaContrast;
swatch.simulate = (c, type, opts) => cvd.simulate(c, type, opts);
swatch.daltonize = (c, type, opts) => cvd.daltonize(c, type, opts);
swatch.checkPalette = checkPalette;
swatch.nearestDistinguishable = nearestDistinguishable;
swatch.mostReadable = mostReadable;

import tincture from "../src/tincture.js";

let cardTemplate = `
	<style>
		.card {
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
				Roboto, Helvetica, Arial, sans-serif,
				"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
			border: 0;
			background: #fff;
			box-shadow: 0 19px 38px rgba(0,0,0,0.15), 0 15px 12px rgba(0,0,0,0.07);
			border-radius: 6px;
			overflow: hidden;
		}

		.card__header {
			padding: 8px 16px;
			display: flex;
			align-items: center;
			border-bottom: 1px solid #e2e5f1;
		}

		.card__title {
			font-weight: 500;
			font-size: 16px;
		}

		.card__body {
			display: grid;
			grid-template-columns: 1fr 2fr;
			grid-template-rows: auto auto;
		}

		.visualization {
			grid-column: 2 / 3;
			grid-row: 1 / 2;
			border-bottom: 1px solid #e2e5f1;
		}

		.contrast {
			grid-column: 1 / 2;
			grid-row: 1 / 2;
			display: flex;
			align-items: center;
			justify-content: center;
			flex-direction: column;
			border-bottom: 1px solid #e2e5f1;
			border-right: 1px solid #e2e5f1;
			padding: 8px 16px;
		}

		.contrast__value {
			font-weight: 600;
			font-size: 28px;
		}

		.wcag {
			grid-column: 1 / 3;
			grid-row: 2 / 3;
			display: grid;
			grid-template-columns: 1fr 1fr 1fr;
			grid-template-rows: auto;
		}

		.visualization > * {
			padding: 8px 16px;
		}

		.wcag__section {
			padding: 0;
			border-right: 1px solid #e2e5f1;
		}

		.wcag__section:last-child {
			border-right: 0;
		}

		dt::after {
			content: ":";
		}

		.section__list {
			display: grid;
			grid-template-columns: auto auto;
			grid-template-rows: auto auto;
			margin: 0;
			align-items: center;
			padding: 4px 0;
		}

		.section__list dt {
			margin: 0;
			padding: 4px 8px 4px 16px;
			font-weight: 500;
		}

		.section__list dd {
			margin: 0;
			padding: 4px 0;
		}

		.section__title {
			margin-bottom: 0;
			font-size: 14px;
			font-weight: 500;
			padding: 8px 16px;
			border-bottom: 1px solid #e2e5f1;
		}

		.label {
			border-radius: 4px;
			background: #888;
			color: #fff;
			font-size: 16px;
			font-weight: 400;
			padding: 2px 6px;
			display: inline-block;
		}

		.label--success {
			background: #0d6322;
			color: #fff;
		}
		.label--fail {
			background: #a7232f;
			color: #fff;
		}
	</style>
	<div class="card">
		<header class="card__header">
			<div class="card__title"></div>
		</header>
		<div class="card__body">
			<div class="visualization">
				<div class="foreground">
					The quick brown fox jumps over the lazy dog
				</div>
				<div class="background">
					The quick brown fox jumps over the lazy dog
				</div>
			</div>
			<div class="contrast">
				<div class="contrast__title">Contrast:</div>
				<div class="contrast__value">N/A</div>
			</div>
			<div class="wcag">
				<div class="wcag__section wcag__section--normal">
					<div class="section__title">Normal text:</div>
					<dl class="section__list">
						<dt class="aa">AA</dt>
						<dd class="aa">
							<span class="label label--na">N/A</span>
						</dd>
						<dt class="aaa">AAA</dt>
						<dd class="aaa">
							<span class="label label--na">N/A</span>
						</dd>
					</dl>
				</div>
				<div class="wcag__section wcag__section--large">
					<div class="section__title">Large text:</div>
					<dl class="section__list">
						<dt class="aa">AA</dt>
						<dd class="aa">
							<span class="label label--na">N/A</span>
						</dd>
						<dt class="aaa">AAA</dt>
						<dd class="aaa">
							<span class="label label--na">N/A</span>
						</dd>
					</dl>
				</div>
				<div class="wcag__section wcag__section--ui">
					<div class="section__title">UI:</div>
					<dl class="section__list">
						<dt class="aa">AA</dt>
						<dd class="aa">
							<span class="label label--na">N/A</span>
						</dd>
					</dl>
				</div>
			</div>
		</div>
	</div>
`;

customElements.define(
	"tincture-card",
	class extends HTMLElement {
		static get observedAttributes() {
			return ["data-title", "data-color1", "data-color2"];
		}

		constructor() {
			super();
			let template = document.createElement("template");
			template.innerHTML = cardTemplate;
			let templateContent = template.content;

			const shadowRoot = this.attachShadow({ mode: "open" }).appendChild(
				templateContent.cloneNode(true)
			);

			const component = this;

			component.shadowRoot.querySelector(
				".card__title",
				component.dataset.title
			);
		}

		attributeChangedCallback(name, oldValue, newValue) {
			let card = this.shadowRoot;
			if (newValue != oldValue) {
				if (name == "data-title") {
					card.querySelector(
						".card__title"
					).textContent = this.dataset.title;
				}

				if (name == "data-color1") {
					let color1 = tincture(this.dataset.color1);
					let color2 = tincture(this.dataset.color2);
					let cvdType = this.dataset.colorBlindnessType;
					// "-omaly" variants get partial severity; "-opia" full.
					let severity = /omaly$/i.test(cvdType) ? 0.6 : 1;
					let colorBlindColor1 =
						cvdType === "True"
							? color1
							: color1.simulate(cvdType, { severity: severity });
					let colorBlindColor1String = colorBlindColor1.toRgbString();
					let colorBlindColor2 =
						cvdType === "True"
							? color2
							: color2.simulate(cvdType, { severity: severity });

					let contrast = color1.getContrast(
						color2.rgb,
						colorBlindColor1.rgb
					);

					let colorContainer = card.querySelector(".visualization");
					let foregroundContainer = colorContainer.querySelector(
						".foreground"
					);
					let backgroundContainer = colorContainer.querySelector(
						".background"
					);

					foregroundContainer.style.color = colorBlindColor1String;
					foregroundContainer.style.backgroundColor = color2.toRgbString();

					backgroundContainer.style.color = color2.toRgbString();
					backgroundContainer.style.backgroundColor = colorBlindColor1String;
					card.querySelector(".contrast__value").textContent =
						+contrast.toFixed(2) + ":1";

					let normalAAALabel = card.querySelector(
						".wcag__section--normal dd.aaa .label"
					);
					let normalAALabel = card.querySelector(
						".wcag__section--normal dd.aa .label"
					);
					let largeAAALabel = card.querySelector(
						".wcag__section--large dd.aaa .label"
					);
					let largeAALabel = card.querySelector(
						".wcag__section--large dd.aa .label"
					);
					let uiAALabel = card.querySelector(
						".wcag__section--ui dd.aa .label"
					);

					if (contrast >= 3) {
						largeAALabel.textContent = "Pass";
						largeAALabel.classList.remove("label--fail");
						largeAALabel.classList.add("label--success");

						uiAALabel.textContent = "Pass";
						uiAALabel.classList.remove("label--fail");
						uiAALabel.classList.add("label--success");
					} else {
						largeAALabel.textContent = "Fail";
						largeAALabel.classList.remove("label--success");
						largeAALabel.classList.add("label--fail");

						uiAALabel.textContent = "Fail";
						uiAALabel.classList.remove("label--success");
						uiAALabel.classList.add("label--fail");
					}

					if (contrast >= 4.5) {
						largeAAALabel.textContent = "Pass";
						largeAAALabel.classList.remove("label--fail");
						largeAAALabel.classList.add("label--success");

						normalAALabel.textContent = "Pass";
						normalAALabel.classList.remove("label--fail");
						normalAALabel.classList.add("label--success");
					} else {
						largeAAALabel.textContent = "Fail";
						largeAAALabel.classList.remove("label--success");
						largeAAALabel.classList.add("label--fail");

						normalAALabel.textContent = "Fail";
						normalAALabel.classList.remove("label--success");
						normalAALabel.classList.add("label--fail");
					}

					if (contrast >= 7) {
						normalAAALabel.textContent = "Pass";
						normalAAALabel.classList.remove("label--fail");
						normalAAALabel.classList.add("label--success");
					} else {
						normalAAALabel.textContent = "Fail";
						normalAAALabel.classList.remove("label--success");
						normalAAALabel.classList.add("label--fail");
					}
				}
			}
		}
	}
);

let testTemplate = `
	<style>
		h1 {
			margin-top: 0;
		}
		.test {
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
				Roboto, Helvetica, Arial, sans-serif,
				"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
		}

		.test__header {
			padding: 16px 16px 0;
		}

		.test__body {
			display: grid;
			grid-template-columns: repeat(1, 1fr);
			grid-gap: 32px;
			padding: 16px;
		}

		.test__input {
			padding: 16px 16px;
			border-radius: 4px;
			border: 1px solid #e2e5f1;
			background: #fff;
			box-shadow: none;
			width: 320px;
			font-size: 18px;
		}

		.color__label {
			font-size: 18px;
			font-weight: 600;
			margin-bottom: 0;
		}

		.color__desc {
			font-size: 14px;
			font-weight: 400;
			margin: 8px 0 16px;
		}
		@media only screen and (min-width: 768px) {
			.test__body {
				grid-template-columns: repeat(2, 1fr);
			}
		}
		@media only screen and (min-width: 1200px) {
			.test__body {
				grid-template-columns: repeat(3, 1fr);
			}
		}

		code {
			background: #fff;
			border-radius: 4px;
			display: inline-block;
			color: #dc3545;
			padding: 2px 4px;
		}
	</style>
	<div class="test">
		<div class="test__header">
			<h1>Color accessibility tester</h1>
			<div class="color color--1">
				<label for="color1input" class="color__label"
					>Test color</label
				>
				<p id="color1desc" class="color__desc">
					Type in any valid RGB (eg.
					<code>rgb(255,0,0)</code>), HSL (eg.
					<code>hsl(100, 50%, 50%)</code>) or HEX (eg.
					<code>#efc818</code>) color
				</p>
				<input
					id="color1input"
					type="text"
					class="test__input"
					placeholder="rgb, hsl or hex string"
					aria-label="Test color"
					aria-describedby="color1desc"
				/>
			</div>
		</div>
		<div class="test__body"><slot name="cards"></slot></div>
	</div>
`;

customElements.define(
	"tincture-color-tester",
	class extends HTMLElement {
		constructor() {
			super();
			let template = document.createElement("template");
			template.innerHTML = testTemplate;
			let templateContent = template.content;

			const colorBlindnessTypes = [
				"True",
				"Protanopia",
				"Protanomaly",
				"Deuteranopia",
				"Deuteranomaly",
				"Tritanopia",
				"Tritanomaly",
				"Achromatopsia",
				"Achromatomaly"
			];

			const shadowRoot = this.attachShadow({ mode: "open" }).appendChild(
				templateContent.cloneNode(true)
			);

			const component = this;

			const input = component.shadowRoot.querySelector(".test__input");

			let white = tincture("#fff");
			let black = tincture("#000000");
			let color2;

			input.addEventListener("input", function(event) {
				let color = tincture(this.value);
				if (color.isValid) {
					let contrastToWhite = color.getContrast(
						white.rgb,
						color.rgb
					);
					let contrastToBlack = color.getContrast(
						black.rgb,
						color.rgb
					);

					if (contrastToBlack >= contrastToWhite) {
						color2 = black;
					} else {
						color2 = white;
					}

					component
						.querySelectorAll("tincture-card")
						.forEach(function(element) {
							element.dataset.color2 = color2.toRgbString();
							element.dataset.color1 = color.toRgbString();
						});
				}
			});

			if (input.value == "") {
				input.value = "#efc818";
			}

			colorBlindnessTypes.forEach(function(type) {
				const element = document.createElement("tincture-card");
				element.dataset.colorBlindnessType = type;
				element.dataset.title = type;
				element.dataset.color2 = "#000000";
				element.dataset.color1 = input.value;
				element.setAttribute("id", "tincture-" + type);
				element.setAttribute("slot", "cards");
				component.appendChild(element);
			});
		}
	}
);

let footerTemplate = `
	<style>
		.app__footer {
			display: flex;
			align-items: center;
			justify-content: center;
			flex-direction: column;
			padding: 32px;
			border-top: 1px solid #e2e5f1;
			margin: 32px;
			color: #222;
		}

		.app__footer > * {
			padding: 8px;
			display: flex;
			align-items: center;
		}

		.app__footer > :last-child {
			border-right: 0;
		}

		.app__footer i {
			font-size: 24px;
		}

		.app__footer > * > * {
			margin: 0 8px;
		}
		@media (min-width: 768px) {
			.app__footer {
				flex-direction: row;
			}
			.app__footer > * {
				border-right: 1px solid #e2e5f1;
			}

			.app__footer > :last-child {
				border-right: 0;
			}
		}
	</style>
	<footer class="app__footer">
		<div>
			Copyright &copy;
			<a href="http://luntta.fi" target="_blank" rel="noopener"
				>Raine Luntta</a
			> 2019
		</div>
		<div>
			<a
				href="https://github.com/luntta/tincture"
				target="_blank"
				rel="noopener"
				aria-label="Github repository"
				><i class="fab fa-github"></i
			></a>
		</div>
		<div>
			License: MIT
		</div>
	</footer>
`;

customElements.define(
	"tincture-color-tester-footer",
	class extends HTMLElement {
		constructor() {
			super();
			let template = document.createElement("template");
			template.innerHTML = footerTemplate;
			let templateContent = template.content;
			const shadowRoot = this.appendChild(templateContent.cloneNode(true));
		}
	}
);

// ============================================================
// <t-image-cvd> · local image CVD simulation with worker previews
// ============================================================

import swatch from "../lib/swatch.js";
import { toast } from "./format.js";

const TYPES = [
	{ key: "normal", label: "Original" },
	{ key: "protan", label: "Protan" },
	{ key: "deutan", label: "Deutan" },
	{ key: "tritan", label: "Tritan" },
	{ key: "achroma", label: "Achroma" },
];

const MAX_PREVIEW_EDGE = 1200;
const MAX_PREVIEW_PIXELS = 900_000;

function fitSize(width, height) {
	const scale = Math.min(
		1,
		MAX_PREVIEW_EDGE / width,
		MAX_PREVIEW_EDGE / height,
		Math.sqrt(MAX_PREVIEW_PIXELS / (width * height))
	);
	return {
		width: Math.max(1, Math.round(width * scale)),
		height: Math.max(1, Math.round(height * scale)),
		scale,
	};
}

function stem(name) {
	return (name || "image").replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "-");
}

function makeImageData(data, width, height) {
	return new ImageData(new Uint8ClampedArray(data), width, height);
}

async function decodeImage(file) {
	if ("createImageBitmap" in window) {
		try {
			return await createImageBitmap(file, { imageOrientation: "from-image" });
		} catch (_err) {
			return await createImageBitmap(file);
		}
	}

	const url = URL.createObjectURL(file);
	try {
		const img = new Image();
		img.decoding = "async";
		img.src = url;
		await img.decode();
		return img;
	} finally {
		URL.revokeObjectURL(url);
	}
}

function processFallback(imageData, severity) {
	const started = performance.now();
	const outputs = TYPES.map(({ key }) => {
		const out = makeImageData(
			imageData.data,
			imageData.width,
			imageData.height
		);
		if (key !== "normal") {
			swatch.simulateImageData(out, key, { severity, inPlace: true });
		}
		return { type: key, imageData: out };
	});
	return { outputs, duration: performance.now() - started };
}

class ImageCvd extends HTMLElement {
	connectedCallback() {
		this.file = this.querySelector("[data-image-file]");
		this.severity = this.querySelector("[data-image-severity]");
		this.severityValue = this.querySelector("[data-image-severity-value]");
		this.status = this.querySelector("[data-image-status]");
		this.grid = this.querySelector("[data-image-grid]");

		this.requestId = 0;
		this.renderTimer = null;
		this.source = null;
		this.fileStem = "image";
		this.worker = this.createWorker();

		this.cards = TYPES.map((type) => this.createCard(type));

		this.file.addEventListener("change", () => {
			const file = this.file.files?.[0];
			if (file) this.load(file);
		});

		this.severity.addEventListener("input", () => {
			const value = Number(this.severity.value);
			this.severityValue.textContent = value.toFixed(2);
			this.scheduleRender();
		});

		this.setStatus("Choose an image to preview CVD simulation locally.");
	}

	disconnectedCallback() {
		this.worker?.terminate();
		clearTimeout(this.renderTimer);
	}

	createWorker() {
		if (!("Worker" in window)) return null;
		try {
			const worker = new Worker(new URL("./image-worker.js", import.meta.url), {
				type: "module",
			});
			worker.onmessage = (event) => this.handleWorkerMessage(event.data);
			worker.onerror = () => {
				this.worker?.terminate();
				this.worker = null;
				this.setStatus("Worker unavailable; using main-thread fallback.");
				this.scheduleRender();
			};
			return worker;
		} catch (_err) {
			return null;
		}
	}

	createCard(type) {
		const card = document.createElement("article");
		card.className = "image-card";
		card.innerHTML = `
			<div class="image-card__canvas-wrap">
				<canvas data-image-canvas></canvas>
			</div>
			<div class="image-card__meta">
				<strong>${type.label}</strong>
				<button type="button" data-image-download disabled>Download PNG</button>
			</div>
		`;
		const canvas = card.querySelector("[data-image-canvas]");
		const button = card.querySelector("[data-image-download]");
		button.addEventListener("click", () => this.download(type.key, canvas));
		this.grid.appendChild(card);
		return { type: type.key, canvas, button };
	}

	setStatus(message) {
		this.status.textContent = message;
	}

	setBusy(isBusy) {
		this.classList.toggle("is-busy", isBusy);
	}

	async load(file) {
		this.setBusy(true);
		this.setStatus(`Decoding ${file.name}…`);
		this.fileStem = stem(file.name);

		try {
			const bitmap = await decodeImage(file);
			const naturalWidth = bitmap.width || bitmap.naturalWidth;
			const naturalHeight = bitmap.height || bitmap.naturalHeight;
			const fitted = fitSize(naturalWidth, naturalHeight);

			const canvas = document.createElement("canvas");
			canvas.width = fitted.width;
			canvas.height = fitted.height;
			const ctx = canvas.getContext("2d", { willReadFrequently: true });
			ctx.drawImage(bitmap, 0, 0, fitted.width, fitted.height);
			if ("close" in bitmap) bitmap.close();

			const imageData = ctx.getImageData(0, 0, fitted.width, fitted.height);
			this.source = {
				width: fitted.width,
				height: fitted.height,
				data: new Uint8ClampedArray(imageData.data),
				naturalWidth,
				naturalHeight,
				scale: fitted.scale,
			};

			const sizeNote =
				fitted.scale < 1
					? ` · preview downscaled to ${fitted.width}×${fitted.height}`
					: "";
			this.setStatus(
				`${file.name} · ${naturalWidth}×${naturalHeight}${sizeNote}`
			);
			this.render();
		} catch (err) {
			this.setStatus(err?.message || "Could not load image.");
			this.setBusy(false);
		}
	}

	scheduleRender() {
		if (!this.source) return;
		clearTimeout(this.renderTimer);
		this.renderTimer = setTimeout(() => this.render(), 60);
	}

	render() {
		if (!this.source) return;
		const severity = Number(this.severity.value);
		this.severityValue.textContent = severity.toFixed(2);
		const id = ++this.requestId;
		const imageData = makeImageData(
			this.source.data,
			this.source.width,
			this.source.height
		);

		this.setBusy(true);
		this.setStatus(`Processing ${this.source.width}×${this.source.height} preview…`);

		if (this.worker) {
			this.worker.postMessage(
				{ id, imageData, severity },
				[imageData.data.buffer]
			);
			return;
		}

		// Fallback only runs when module workers are unavailable.
		setTimeout(() => {
			if (id !== this.requestId) return;
			this.drawOutputs({ id, ...processFallback(imageData, severity) });
		}, 0);
	}

	handleWorkerMessage(message) {
		if (message.id !== this.requestId) return;
		if (message.error) {
			this.setBusy(false);
			this.setStatus(message.error);
			return;
		}
		this.drawOutputs(message);
	}

	drawOutputs({ outputs, duration }) {
		for (const { type, imageData } of outputs) {
			const card = this.cards.find((item) => item.type === type);
			if (!card) continue;
			card.canvas.width = imageData.width;
			card.canvas.height = imageData.height;
			const ctx = card.canvas.getContext("2d");
			ctx.putImageData(imageData, 0, 0);
			card.button.disabled = false;
		}
		this.setBusy(false);
		this.setStatus(
			`Rendered ${this.source.width}×${this.source.height} preview in ${duration.toFixed(1)} ms.`
		);
	}

	download(type, canvas) {
		canvas.toBlob((blob) => {
			if (!blob) {
				toast("download failed");
				return;
			}
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `${this.fileStem}-${type}.png`;
			a.click();
			setTimeout(() => URL.revokeObjectURL(url), 1000);
		}, "image/png");
	}
}

customElements.define("t-image-cvd", ImageCvd);

import { div, p, t } from "./framework.js";

// @ts-ignore
import * as bootstrap from "bootstrap";

export const ToastComponent = (value: string, level?: string) => {
	return div(
		div(
			div(
				div(value).cl("toast-body"),
				t("button")
					.attr("type", "button")
					.cl("btn-close btn-close-white me-2 m-auto")
					.attr("data-bs-dismiss", "toast")
					.attr("aria-label", "Close")
			).cl("d-flex")
		)
			.cl(
				`toast align-items-center position-relative text-bg-${
					level ? level : "success"
				} border-0`
			)
			.attr("role", "alert")
			.attr("aria-live", "assertive")
			.attr("aria-atomic", "true")
			.attr("id", "toast-component")
	).cl("toast-container position-fixed bottom-0 end-0 p-3");
};

export const Toast = (value: string, level?: string) => {
	const toast = ToastComponent(value, level);

	document.body.appendChild(toast);
	const el = document.getElementById("toast-component");
	const toastBootstrap = bootstrap.Toast.getOrCreateInstance(el, {
		delay: 3000,
	});

	toastBootstrap.show();

	el.addEventListener("hidden.bs.toast", () => el.remove());
};

export const messageBoxRight = (text: string, time: string) => {
	const img = t("img")
		.attr("src", "https://picsum.photos/45")
		.attr("alt", "avatar 1")
		.attr("style", "width: 30px; height: 30px")
		.attr("class", "rounded-circle");

	const content = div(
		p(text).attr(
			"class",
			"small p-2 me-3 mb-1 rounded-3 bg-primary text-white"
		),
		p(time).attr(
			"class",
			"small me-3 mb-3 rounded-3 text-muted d-flex justify-content-end"
		)
	);

	const message = div(content, img).attr(
		"class",
		"d-flex flex-row justify-content-end mb-3 pt-1"
	);

	return message;
};

export const messageBoxLeft = (text: string, time: string) => {
	const img = t("img")
		.attr("src", "https://picsum.photos/45")
		.attr("alt", "avatar 1")
		.attr("style", "width: 30px; height: 30px")
		.attr("class", "rounded-circle");

	const content = div(
		p(text).attr(
			"class",
			"small p-2 ms-3 mb-1 rounded-3  bg-body-secondary text-body-primary"
		),
		p(time).attr("class", "small ms-3 mb-3 rounded-3 text-muted")
	);

	const message = div(img, content).attr(
		"class",
		"d-flex flex-row justify-content-start mb-3"
	);

	return message;
};

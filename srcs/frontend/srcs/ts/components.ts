import { a, div, p, span, t } from "./framework.js";

// @ts-ignore
import * as bootstrap from "bootstrap";
import { getCurrentUser } from "./storage.js";
import { navigate } from "./main.js";

export const goToProfile = (uuid: string) => navigate("/profile/" + uuid);

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
	)
		.cl("toast-container position-fixed bottom-0 end-0 p-3")
		.attr("id", "toast-notification-component");
};

export const Toast = (value: string, level?: string, delay?: number) => {
	const preCheck = document.getElementById("toast-notification-component");
	if (preCheck) preCheck.remove();

	if (level === "") level = "primary";
	const toast = ToastComponent(value, level);

	document.body.appendChild(toast);
	const el = document.getElementById("toast-component");
	const wrapper = document.getElementById("toast-notification-component");
	el.addEventListener("hidden.bs.toast", () => wrapper.remove());
	const toastBootstrap = bootstrap.Toast.getOrCreateInstance(el, {
		delay: delay ? delay : 3000,
	});
	toastBootstrap.show();
};

export const userListBox = (text: string, lastMessage?) => {
	const img = t("img")
		.attr("src", "https://picsum.photos/50?random=1")
		.attr("alt", "user avatar")
		.cl("rounded-circle me-2")
		.attr("style", "width: 35px; height: 35px");

	const username = span(text).cl("small fw-semibold mb-0 text-truncate");

	if (lastMessage && lastMessage["user"]["uuid"] === getCurrentUser().uuid) {
		lastMessage["content"] = "You: " + lastMessage["content"];
	}

	const lastMsg = lastMessage
		? p(lastMessage["content"]).cl("small text-muted mb-0 text-truncate")
		: "";

	const userInfo = div(username, lastMsg).cl("flex-grow-1 text-truncate");

	const li = t("li", img, userInfo).cl(
		"d-flex align-items-center mb-3 btn btn-primary w-100"
	);

	return li;
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
			"small p-2 me-3 mb-1 rounded-3 bg-primary text-white text-wrap text-break"
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

export const messageBoxLeft = (text: string, time: string, uuid: string) => {
	const img = t("img")
		.attr("src", "https://picsum.photos/45")
		.attr("alt", "avatar 1")
		.attr("style", "width: 30px; height: 30px")
		.attr("class", "rounded-circle")
		.attr("role", "button")
		.onclick$(() => goToProfile(uuid));

	const content = div(
		p(text).attr(
			"class",
			"small p-2 ms-3 mb-1 rounded-3 bg-body-secondary text-body-primary text-wrap text-break"
		),
		p(time).attr("class", "small ms-3 mb-3 rounded-3 text-muted")
	);

	const message = div(img, content).attr(
		"class",
		"d-flex flex-row justify-content-start mb-3"
	);

	return message;
};

export const messageBox = (
	text: string,
	time: string,
	current: boolean,
	uuid: string
) => {
	return current
		? messageBoxRight(text, time)
		: messageBoxLeft(text, time, uuid);
};

export const userProfileCard = (user, event: (event: MouseEvent) => void) => {
	const avatar = t("img")
		.attr("src", "https://picsum.photos/80")
		.attr("alt", "Avatar")
		.cl("rounded-circle me-3")
		.attr("style", "width: 80px; height:80px")

		.attr("role", "button")
		.onclick$(() => goToProfile(user.uuid));

	const content = div(
		t("h5", user.display_name).cl("mb-1"),
		p(user.uuid).cl("mb-0 small text-muted")
	);

	const startChat = t("button", "Start Chat")
		.cl("btn btn-outline-primary ms-auto")
		.onclick$(event);

	// const addFriend = t("button", "Add Friend")
	// 	.cl("btn btn-success")
	// 	.onclick$(() => {
	// 		console.log("added me friend");
	// 	});
	// return div(avatar, content, div(addFriend, startChat).cl("ms-auto")).cl(
	// 	"card mb-2 d-flex align-items-center p-3 flex-row w-100"
	// );

	return div(avatar, content, startChat).cl(
		"card mb-2 d-flex align-items-center p-3 flex-row w-100"
	);
};

export const relationCard = (
	user,
	relation: string,
	callback: (event: MouseEvent) => void
) => {
	const button = (() => {
		switch (relation) {
			case "blocked":
				return t("button", "Unblock").cl("btn btn-sm btn-warning");
			case "send":
				return t("button", "Unsend").cl("btn btn-sm btn-secondary");
			case "receive":
				return t("button", "Accept").cl("btn btn-sm btn-success");
			case "friends":
				return t("button", "Remove").cl("btn btn-sm btn-danger");
			default:
				return t("button", "Add Friend").cl("btn btn-sm btn-primary");
		}
	})().onclick$(callback);

	return div(
		div(
			t("img")
				.attr("src", "https://picsum.photos/50")
				.attr("alt", "avatar")
				.cl("rounded-circle me-3")
				.attr("role", "button")
				.onclick$(() => goToProfile(user.uuid)),
			div(
				user.display_name + " (@" + user.username + ")",
				t("br"),
				t("small", user.uuid).cl("uuid text-muted")
			)
		).cl("d-flex align-items-center"),
		button
	).cl(
		"friend-card d-flex align-items-center justify-content-between p-2 mb-2 border rounded"
	);
};

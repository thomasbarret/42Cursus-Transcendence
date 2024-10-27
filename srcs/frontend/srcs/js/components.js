import {
	button,
	div,
	h1,
	h3,
	h5,
	h6,
	img,
	li,
	p,
	span,
	t,
	ul,
} from "./framework.js";
// @ts-ignore
import * as bootstrap from "bootstrap";
import { getCurrentUser } from "./storage.js";
import { navigate } from "./main.js";
import { BASE_URL, DEFAULT_AVATAR } from "./handler.js";
export const goToProfile = (uuid) => navigate("/profile/" + uuid);
export const ToastComponent = (value, level) => {
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
export const Toast = (value, level, delay) => {
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
export const userListBox = (user, lastMessage) => {
	const image = img(user.avatar ? user.avatar : DEFAULT_AVATAR)
		.attr("alt", "user avatar")
		.cl("rounded-circle me-2")
		.attr("style", "width: 35px; height: 35px");
	const username = span(user.display_name + " (@" + user.username + ")").cl(
		"small fw-semibold mb-0 text-truncate"
	);
	if (lastMessage && lastMessage["user"]["uuid"] === getCurrentUser().uuid) {
		lastMessage["content"] = "You: " + lastMessage["content"];
	}
	const lastMsg = lastMessage
		? p(lastMessage["content"]).cl("small text-muted mb-0 text-truncate")
		: "";
	const userInfo = div(username, lastMsg).cl("flex-grow-1 text-truncate");
	const li = t("li", image, userInfo).cl(
		"d-flex align-items-center mb-3 btn btn-primary w-100"
	);
	return li;
};
export const messageBoxRight = (text, time, avatar) => {
	const image = img(avatar ? avatar : DEFAULT_AVATAR)
		.attr("alt", "avatar 1")
		.attr("style", "width: 30px; height: 30px")
		.attr("class", "rounded-circle");
	const content = div(
		p(text).cl(
			"small p-2 me-3 mb-1 rounded-3 bg-primary text-white text-wrap text-break"
		),
		p(time).attr(
			"class",
			"small me-3 mb-3 rounded-3 text-muted d-flex justify-content-end"
		)
	);
	const message = div(content, image).attr(
		"class",
		"d-flex flex-row justify-content-end mb-3 pt-1"
	);
	return message;
};
export const messageBoxLeft = (text, time, uuid, avatar) => {
	const image = img(avatar ? avatar : DEFAULT_AVATAR)
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
		p(time).cl("small ms-3 mb-3 rounded-3 text-muted")
	);
	const message = div(image, content).attr(
		"class",
		"d-flex flex-row justify-content-start mb-3"
	);
	return message;
};

export const matchInviteRight = (time, callback, avatar) => {
	const image = img(avatar ? avatar : DEFAULT_AVATAR)
		.attr("alt", "avatar 1")
		.attr("style", "width: 30px; height: 30px")
		.attr("class", "rounded-circle");
	const content = div(
		div(
			h5("Play with me"),
			button("Join Game")
				.cl("btn btn-warning rounded-2")
				.onclick$(callback)
		).cl(
			"container justify-content-center text-center bg-success rounded-2 p-3"
		),
		p(time).attr(
			"class",
			"small me-3 mb-3 rounded-3 text-muted d-flex justify-content-end"
		)
	).cl("mx-2");
	const message = div(content, image).attr(
		"class",
		"d-flex flex-row justify-content-end mb-3 pt-1"
	);
	return message;
};

export const matchInviteLeft = (time, uuid, callback, avatar) => {
	const image = img(avatar ? avatar : DEFAULT_AVATAR)
		.attr("alt", "avatar 1")
		.attr("style", "width: 30px; height: 30px")
		.attr("class", "rounded-circle")
		.attr("role", "button")
		.onclick$(() => goToProfile(uuid));

	const content = div(
		div(
			h5("Play with me"),
			button("Join Game")
				.cl("btn btn-warning rounded-2")
				.onclick$(callback)
		).cl(
			"container justify-content-center text-center bg-success rounded-2 p-3"
		),
		p(time).attr(
			"class",
			"small ms-3 mb-3 rounded-3 text-muted d-flex justify-content-start"
		)
	).cl("mx-2");

	const message = div(image, content).attr(
		"class",
		"d-flex flex-row justify-content-start mb-3"
	);

	return message;
};

export const messageBox = (content, time, current, uuid, avatar) => {
	if (content.startsWith('{"game":')) {
		try {
			const invite = JSON.parse(content);

			const callback = async () => {
				const res = await fetch(BASE_URL + "/game/match/join", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						match_uuid: invite.game,
					}),
				});

				const msg = await res.json();

				if (res.ok) {
					navigate("/lobby/" + invite.game);
				} else Toast("Couldn't join lobby " + msg["error"], "danger");
			};
			return current
				? matchInviteRight(time, callback, avatar)
				: matchInviteLeft(time, uuid, callback, avatar);
		} catch (e) {}
	}

	return current
		? messageBoxRight(content, time, avatar)
		: messageBoxLeft(content, time, uuid, avatar);
};
export const userProfileCard = (user, event) => {
	const avatar = img(user.avatar ? user.avatar : DEFAULT_AVATAR)
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
	return div(avatar, content, startChat).cl(
		"card mb-2 d-flex align-items-center p-3 flex-row w-100"
	);
};
export const relationCard = (user, relation, callback) => {
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
		}
	})().onclick$(callback);
	return div(
		div(
			img(user.avatar ? user.avatar : DEFAULT_AVATAR)
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
export const profileCard = (user, callback) => {
	if (user === false)
		return div(h1("User not found!").cl("display-1")).cl(
			"card-body text-center"
		);
	const add = () => {
		if (user.is_blocked || user.is_friend) return "";
		const btn = button("Add Friend")
			.cl("btn btn-success")
			.onclick$(() => callback(1));
		return user.friend_request_sent ? btn.attr("disabled", "") : btn;
	};
	const block = () => {
		if (user.is_blocked) return "";
		return button("Block")
			.cl("btn btn-danger")
			.onclick$(() => callback(2));
	};
	const buttons = [add(), block()];

	const container = user.me
		? div(
				t("input")
					.cl("form-control mt-3")
					.attr("type", "file")
					.attr("id", "form-file"),
				button("Upload Avatar")
					.cl("btn btn-primary mt-3")
					.onclick$(async () => {
						const avatar = document.getElementById("form-file");
						// @ts-ignore
						const file = avatar.files[0];
						if (file) {
							console.log("uploaded: ", file);
							const formData = new FormData();

							formData.append("avatar", file);

							const res = await fetch(BASE_URL + "/user/@me", {
								method: "POST",
								body: formData,
							});

							const json = await res.json();
							console.log(json);
							if (res.ok) {
								Toast(
									"Updated avatar successfully!",
									"success"
								);
							} else {
								Toast(
									"Couldn't upload avatar, file size might be too large!",
									"danger"
								);
							}
						}
					})
		  ).cl("mx-auto w-25")
		: div(...buttons).cl("d-flex justify-content-center gap-2 mt-3");
	return div(
		img(user.avatar ? user.avatar : DEFAULT_AVATAR)
			.attr("alt", "avatar")
			.attr("style", "width: 120px; height: 120px")
			.attr("id", "avatar-field")
			.cl("rounded-circle mb-3"),
		h3(user.username).cl("card-title"),
		h6(user.uuid).cl("card-title"),
		container,
		div(
			h5("Pong Game Data"),
			ul(
				li("Wins: 10").cl("list-group-item"),
				li("Losses: 0").cl("list-group-item"),
				li("Games Played: 10").cl("list-group-item")
			).cl("list-group list-group-flish mt-3")
		).cl("mt-4")
	).cl("card-body text-center");
};

export const inviteBoxCard = (user, matchId, update) => {
	return div(
		img(user.avatar ? user.avatar : DEFAULT_AVATAR)
			.attr("alt", "avatar")
			.cl("rounded-circle me-2")
			.attr("style", "width: 30px; height: 30px"),
		span(user.display_name).cl("flex-grow-1"),
		button("Invite")
			.cl("btn btn-sm btn-primary")
			.onclick$(async () => {
				const res = await fetch(BASE_URL + "/chat/@me", {
					method: "POST",
					body: JSON.stringify({
						receiver_uuid: user.uuid,
					}),
					headers: {
						"Content-Type": "application/json",
					},
				});

				const channel = await res.json();

				const invite = {
					game: matchId,
				};

				if (res.ok) {
					const msg = await fetch(
						BASE_URL + "/chat/" + channel.uuid,
						{
							method: "POST",
							body: JSON.stringify({
								content: JSON.stringify(invite),
							}),
							headers: {
								"Content-Type": "application/json",
							},
						}
					);
					const message = await msg.json();
					if (msg.ok) {
						Toast("Sent invite successfully!", "success");
					} else
						Toast("Error occured: " + message["error"], "danger");
				} else Toast("Error occured: " + channel["error"], "danger");
				update();
			})
	).cl("d-flex align-items-center mb-2");
};

export const currentPlayerCard = (user) => {
	return div(
		div(
			img(user.avatar ? user.avatar : DEFAULT_AVATAR)
				.attr("alt", "avatar")
				.cl("rounded-circle me-2")
				.attr("style", "width: 30px; height: 30px"),
			div(
				span(user.display_name).cl("fw-bold fs-5"),
				t("small", user.user.uuid).cl("text-muted")
			).cl("d-flex flex-column")
		).cl("d-flex align-items-center")
	).cl(
		"d-flex flex-column align-items-start mb-2 p-2 bg-primary-subtle rounded"
	);
};

import {
	button,
	div,
	h1,
	h3,
	h4,
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
		.attr("style", "width: 50px; height: 50px");
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
		.attr("style", "width: 35px; height: 35px")
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
		.attr("style", "width: 35px; height: 35px")
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

export const matchInviteRight = (time, callback, avatar, tournament) => {
	const image = img(avatar ? avatar : DEFAULT_AVATAR)
		.attr("alt", "avatar 1")
		.attr("style", "width: 35px; height: 35px")
		.attr("class", "rounded-circle");
	const content = div(
		div(
			h5(tournament ? "Join my Tournament" : "Play with me"),
			button("Join Game")
				.cl(
					"btn rounded-2 " +
						(tournament
							? "btn-outline-success"
							: "btn-outline-primary")
				)
				.onclick$(callback)
		).cl(
			"container justify-content-center text-center bg-primary-subtle rounded-2 p-3"
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

export const matchInviteLeft = (time, uuid, callback, avatar, tournament) => {
	const image = img(avatar ? avatar : DEFAULT_AVATAR)
		.attr("alt", "avatar 1")
		.attr("style", "width: 35px; height: 35px")
		.attr("class", "rounded-circle")
		.attr("role", "button")
		.onclick$(() => goToProfile(uuid));

	const content = div(
		div(
			h5(tournament ? "Join my Tournament" : "Play with me"),
			button("Join Game")
				.cl(
					"btn rounded-2 " +
						(tournament
							? "btn-outline-success"
							: "btn-outline-primary")
				)
				.onclick$(callback)
		).cl(
			"container justify-content-center text-center bg-primary-subtle rounded-2 p-3"
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
	if (
		content.startsWith('{"game":') ||
		content.startsWith('{"tournament":')
	) {
		try {
			const { game, tournament } = JSON.parse(content);

			const invite = game ? game : tournament;

			const callback = async () => {
				const url =
					BASE_URL +
					(tournament ? "/game/tournament/join" : "/game/match/join");
				const res = await fetch(url, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						uuid: invite,
					}),
				});

				if (res.ok) {
					navigate(
						tournament
							? "/tournament/" + invite
							: "/lobby/" + invite
					);
				} else
					Toast(
						"Couldn't join lobby please try again later.",
						"danger"
					);
			};
			return current
				? matchInviteRight(time, callback, avatar, tournament)
				: matchInviteLeft(time, uuid, callback, avatar, tournament);
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
				.attr("style", "width: 50px; height: 50px")
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
export const profileCard = (user, callback, update) => {
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

	const editProfileContainer = div(
		t("input")
			.cl("form-control mt-3")
			.attr("type", "text")
			.attr("id", "form-display-name")
			.attr("placeholder", "Display Name"),
		t("input")
			.cl("form-control mt-3")
			.attr("type", "file")
			.attr("id", "form-avatar"),
		button("Edit Profile")
			.cl("btn btn-primary mt-3")
			.onclick$(async () => {
				const display_name =
					document.getElementById("form-display-name");
				const avatar = document.getElementById("form-avatar");
				// @ts-ignore
				const file = avatar.files[0];
				// @ts-ignore
				if (display_name.value || file) {
					const formData = new FormData();

					if (file) formData.append("avatar", file);
					// @ts-ignore
					else if (display_name.value)
						formData.append(
							"display_name",
							// @ts-ignore
							display_name.value
						);

					const res = await fetch(BASE_URL + "/user/@me", {
						method: "POST",
						body: formData,
					});

					const json = await res.json();
					console.log(json);
					if (res.ok) {
						Toast("Edited profile successfully!", "success");
						update();
					} else {
						Toast(
							"Couldn't edit profile, check the file size or if invalid display name",
							"danger"
						);
					}
				}
			})
	).cl("mx-auto w-25");

	const actionsContainer = user.me
		? editProfileContainer
		: div(...buttons).cl("d-flex justify-content-center gap-2 mt-3");

	const profileInfo = div(
		img(user.avatar ? user.avatar : DEFAULT_AVATAR)
			.attr("alt", "avatar")
			.attr("style", "width: 120px; height: 120px")
			.attr("id", "avatar-field")
			.cl("rounded-circle mb-3"),
		h3(user.display_name + " (@" + user.username + ")").cl("card-title"),
		h6(user.uuid).cl("card-title")
	).cl("card-body text-center");

	const tabContainer = div(
		ul(
			li(
				button("Profile")
					.cl("nav-link active")
					.attr("id", "profile-tab")
					.attr("data-bs-toggle", "tab")
					.attr("data-bs-target", "#profile-tab-pane")
					.attr("type", "button")
					.attr("role", "tab")
					.attr("aria-controls", "profile-tab-pane")
					.attr("aria-selected", "true")
			).cl("nav-item"),
			li(
				button("Match History")
					.cl("nav-link")
					.attr("id", "history-tab")
					.attr("data-bs-toggle", "tab")
					.attr("data-bs-target", "#history-tab-pane")
					.attr("type", "button")
					.attr("role", "tab")
					.attr("aria-controls", "history-tab-pane")
					.attr("aria-selected", "false")
			).cl("nav-item")
		)
			.cl("nav nav-tabs")
			.attr("id", "myTab")
			.attr("role", "tablist"),
		div(
			div(
				actionsContainer,
				div(
					h5("Pong Game Data"),
					ul(
						li("Wins: " + user.match_wins).cl("list-group-item"),
						li("Losses: " + user.match_loses).cl("list-group-item"),
						li("Games Played: " + user.match_count).cl(
							"list-group-item"
						)
					).cl("list-group list-group-flush mt-3")
				).cl("mt-4")
			)
				.attr("id", "profile-tab-pane")
				.cl("tab-pane fade show active")
				.attr("role", "tabpanel")
				.attr("aria-labelledby", "profile-tab")
				.attr("tabindex", "0"),
			div(h4("Match History"), p("hello").cl("mt-3"))
				.attr("id", "history-tab-pane")
				.cl("tab-pane fade")
				.attr("role", "tabpanel")
				.attr("aria-labelledby", "history-tab")
				.attr("tabindex", "0")
		)
			.cl("tab-content")
			.attr("id", "myTabContent")
	);
	return div(profileInfo, tabContainer).cl("card-body");
};

export const matchCard = (match) => {
	const currentUserUuid = getCurrentUser().uuid;

	const getPlayer = (player) => {
		if (player) {
			return div(
				img(player.user.avatar ? player.user.avatar : DEFAULT_AVATAR)
					.attr("alt", "avatar")
					.cl("rounded-circle me-2")
					.attr("style", "width: 50px; height: 50px"),
				span(
					player.user.display_name +
						" (@" +
						player.user.username +
						")"
				).cl("fw-semibold")
			).cl("d-flex align-items-center");
		}
		return div("NO PLAYER").cl("text-muted");
	};

	const isCurrentUserWinner =
		match.winner && match.winner.uuid === currentUserUuid;

	let cardClass = "card mb-3 shadow-sm ";
	if (match.status === 4) {
		cardClass += "text-bg-danger-subtle";
	} else if (match.status === 3 && match.winner) {
		cardClass += isCurrentUserWinner
			? "text-bg-success-subtle bg-success-subtle"
			: "text-bg-warning-subtle bg-danger-subtle";
	} else {
		cardClass += "text-bg-light";
	}

	const scoreInfo = h5(match.player1_score + " - " + match.player2_score).cl(
		"fw-bold text-center"
	);

	const statusMap = {
		1: span("Waiting").cl("badge bg-info mb-2"),
		2: span("Started").cl("badge bg-warning mb-2"),
		3: span("Finished").cl("badge bg-primary mb-2"),
		4: span("Cancelled").cl("badge bg-danger mb-2"),
	};
	const matchStatus = statusMap[match.status];

	const winnerInfo =
		match.status === 3 && match.winner
			? div(
					h6("Winner: " + match.winner.display_name).cl("fw-bold"),
					img(
						match.winner.avatar
							? match.winner.avatar
							: DEFAULT_AVATAR
					)
						.attr("alt", "winner avatar")
						.cl("rounded-circle mt-1")
						.attr("style", "width: 30px; height: 30px")
			  ).cl("d-flex flex-column align-items-center")
			: match.status === 4
			? div(h6("Match Cancelled")).cl("text-muted fw-bold mt-2")
			: "";

	const matchInfo = div(
		div(
			div(getPlayer(match.player1), getPlayer(match.player2)).cl(
				"d-flex justify-content-around w-100"
			),
			scoreInfo,
			matchStatus,
			winnerInfo
		).cl("d-flex flex-column align-items-center w-100 p-3")
	).cl("card-body");

	return div(matchInfo).cl(cardClass);
};

export const matchHistory = (matches) => {
	const matchCards = matches.map((match) => matchCard(match));
	return div(...matchCards)
		.cl("overflow-auto p-3")
		.attr(
			"style",
			"max-height: 500px; border: 1px solid #ddd; border-radius: 8px"
		);
};

export const inviteBoxCard = (user, matchId, update, tournament = false) => {
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

				const invite = {};

				invite[tournament ? "tournament" : "game"] = matchId;

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

export const matchPlayersCard = (user, uuid) => {
	return div(
		div(
			img(user.avatar ? user.avatar : DEFAULT_AVATAR)
				.attr("alt", "avatar")
				.cl("rounded-circle me-2")
				.attr("style", "width: 30px; height: 30px"),
			div(
				span(user.display_name).cl("fw-bold fs-5"),
				uuid ? t("small", uuid).cl("text-muted") : ""
			).cl("d-flex flex-column")
		).cl("d-flex align-items-center")
	).cl(
		"d-flex flex-column align-items-start mb-2 p-2 bg-primary-subtle rounded"
	);
};

export const messageTournament = (message) => {
	return div(p(message.user.display_name + ": " + message.content)).cl(
		"text-muted"
	);
};

export const messageInformation = (message) => {
	return div(p(message)).cl("text-info");
};

export const tournamentMatchCard = (match) => {
	const winnerPlayer1 =
		match.player1_score > match.player2_score ? true : false;
	return div(
		span(
			span(match.player_1.display_name)
				.cl(winnerPlayer1 ? "text-success-emphasis" : "")
				.cl("fw-bold"),
			" vs ",
			span(match.player_2.display_name)
				.cl(winnerPlayer1 ? "" : "text-success-emphasis")
				.cl("fw-bold")
		).cl("me-1"),
		span(match.player1_score + ":" + match.player2_score).cl("text-muted")
	).cl("d-flex align-items-center border-end pe-3");
};

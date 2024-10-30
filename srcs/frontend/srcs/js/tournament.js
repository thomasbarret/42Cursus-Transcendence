import { inviteBoxCard, matchPlayersCard, Toast } from "./components.js";
import { eventEmitter } from "./eventemitter.js";
import { BASE_URL } from "./handler.js";
import { socket } from "./socket.js";
import { getCurrentUser } from "./storage.js";

export const tournamentHandler = (_, slug) => {
	console.log("tournament slug: ", slug);

	const inviteBox = document.getElementById("invite-box");
	const currentPlayers = document.getElementById("current-players");
	const chatForm = document.getElementById("chat-form");
	const chatInput = document.getElementById("chat-input");

	const startTournament = document.getElementById("start-tournament");

	const user = getCurrentUser();

	const watchTournamentGame = () => {
		socket.send(
			JSON.stringify({
				event: "GAME_TOURNAMENT_WATCH",
				data: {
					uuid: slug,
				},
			})
		);
	};

	eventEmitter.on("GAME_TOURNAMENT_READY", () => watchTournamentGame());

	const getTournamentData = async () => {
		const res = await fetch(BASE_URL + "/game/tournament/" + slug);

		const data = await res.json();

		console.log("TOURNAMENT DATA: ", data);

		if (res.ok) {
			getChatBox(data.channel);
			if (socket.readyState === WebSocket.OPEN) {
				watchTournamentGame();
			}

			data.players.forEach((matchPlayer) => {
				currentPlayers.appendChild(
					matchPlayersCard(matchPlayer.user, matchPlayer.user.uuid)
				);
			});

			if (user.uuid === data.creator.user.uuid) {
				startTournament.classList.remove("d-none");
				startTournament.onclick = () => {
					socket.send(
						JSON.stringify({
							event: "TOURNAMENT_START",
							data: {
								uuid: slug,
							},
						})
					);
				};
			}

			chatForm.onsubmit = async (event) => {
				event.preventDefault();

				// @ts-ignore
				if (chatInput.value.length >= 1000) {
					Toast("Message is too long", "warning");
					return;
				}

				const res = await fetch(
					BASE_URL + "/chat/" + data.channel.uuid,
					{
						method: "POST",
						body: JSON.stringify({
							// @ts-ignore
							content: chatInput.value,
						}),
						headers: {
							"Content-Type": "application/json",
						},
					}
				);

				const json = await res.json();
				console.log(json);

				if (res.ok) {
					// @ts-ignore
					chatInput.value = 0;
				} else
					Toast("Couldn't send message " + json["error"], "danger");
			};
		} else Toast("Couldn't get tournament data", "danger");
	};

	const getFriendsList = async () => {
		inviteBox.textContent = "";
		const res = await fetch(BASE_URL + "/user/relation/@me");
		const data = await res.json();

		if (res.ok) {
			console.log("friends: ", data);
			const fragment = document.createDocumentFragment();
			data["friends"].forEach((friend) => {
				fragment.appendChild(
					inviteBoxCard(friend.user, slug, getFriendsList, true)
				);
			});
			inviteBox.appendChild(fragment);
		} else {
			Toast("Error occured: " + data["error"], "danger");
		}
	};

	const getChatBox = async (channel) => {
		const res = await fetch(BASE_URL + "/chat/" + channel.uuid);

		const data = await res.json();

		if (res.ok) {
		} else Toast("Tournament chat error " + data["error"], "danger");
		console.log(data);
	};

	getTournamentData();
	getFriendsList();
};

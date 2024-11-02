import {
	inviteBoxCard,
	matchPlayersCard,
	messageInformation,
	messageTournament,
	Toast,
	tournamentMatchCard,
} from "./components.js";
import { eventEmitter } from "./eventemitter.js";
import { Game } from "./game/game.js";
import { BASE_URL } from "./handler.js";
import { socket } from "./socket.js";
import { getCurrentUser } from "./storage.js";

export const tournamentHandler = (_, slug) => {
	console.log("tournament slug: ", slug);

	let game;

	const inviteBox = document.getElementById("invite-box");
	const currentPlayers = document.getElementById("current-players");
	const chatForm = document.getElementById("chat-form");
	const chatInput = document.getElementById("chat-input");

	const chatBox = document.getElementById("chat-box");

	const startTournament = document.getElementById("start-tournament");

	const user = getCurrentUser();

	const waitingOverlay = document.getElementById("waiting-overlay");
	const finishedOverlay = document.getElementById("finished-overlay");
	const tournamentWinner = document.getElementById("tournament-winner");

	const tournamentMatches = document.getElementById("tournament-matches");

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

	eventEmitter.on("GAME_TOURNAMENT_READY", (data) => {
		console.log("tournament ready: ", data);
		watchTournamentGame();
		waitingOverlay.classList.add("d-none");
		if (data.current_match) game = new Game(data.current_match);
	});

	eventEmitter.on("GAME_MESSAGE_CREATE", (data) =>
		chatBox.appendChild(messageTournament(data))
	);

	const setFinished = (data) => {
		waitingOverlay.classList.add("d-none");
		finishedOverlay.classList.remove("d-none");
		if (data.winner) {
			tournamentWinner.textContent = data.winner.display_name;
			Toast(
				"Tournament finished! Winner: " + data.winner.display_name,
				"success"
			);
		}
	};

	eventEmitter.on("GAME_TOURNAMENT_NEXT_MATCH", (data) => {
		setTournamentMatches(data.matches);
		if (data.status === 3) {
			setFinished(data);
		} else {
			chatBox.appendChild(
				messageInformation(
					"Next match is starting, the players are: " +
						data.current_match.player_1.display_name +
						" vs " +
						data.current_match.player_2.display_name
				)
			);
			Toast("Next match starting!", "info");
			game = new Game(data.current_match);
			watchTournamentGame();
		}
	});

	eventEmitter.on("TOURNAMENT_PLAYER_JOIN", (data) => {
		updateCurrentUsers(data.players);
	});

	const setTournamentMatches = (matches) => {
		tournamentMatches.textContent = "";
		matches.forEach((match) => {
			tournamentMatches.appendChild(tournamentMatchCard(match));
		});
	};

	const updateCurrentUsers = (players) => {
		currentPlayers.textContent = "";
		players.forEach((matchPlayer) => {
			currentPlayers.appendChild(
				matchPlayersCard(matchPlayer.user, matchPlayer.user.uuid)
			);
		});
	};

	//TODO: list past matches of the tournament too
	const getTournamentData = async () => {
		const res = await fetch(BASE_URL + "/game/tournament/" + slug);

		const data = await res.json();

		console.log("TOURNAMENT DATA: ", data);

		if (res.ok) {
			if (data.status === 2) {
				waitingOverlay.classList.add("d-none");
				if (data.current_match) game = new Game(data.current_match);
			} else if (data.status === 3) setFinished(data);
			getChatBox(data.channel);

			setTournamentMatches(data.matches);

			socket.addEventListener("open", () => watchTournamentGame(), {
				once: true,
			});

			updateCurrentUsers(data.players);

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
					chatInput.value = "";
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
			const fragment = document.createDocumentFragment();
			data.messages.forEach((message) => {
				fragment.appendChild(messageTournament(message));
			});
			chatBox.appendChild(fragment);
		} else Toast("Tournament chat error " + data["error"], "danger");
		console.log(data);
	};

	getTournamentData();
	getFriendsList();
};

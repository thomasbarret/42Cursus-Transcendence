import * as bootstrap from "bootstrap";
import { BASE_URL } from "./handler.js";
import { matchPlayersCard, inviteBoxCard, Toast } from "./components.js";
import { navigate } from "./main.js";
import { gameHandler } from "./game/pong.js";
import { eventEmitter } from "./eventemitter.js";
import { socket } from "./socket.js";

export const playHandler = (route) => {
	let timerId = 0;

	const tournamentMode = document.getElementById("tournament-mode");
	const oneMode = document.getElementById("one-vs-one");

	const tournamentModal = new bootstrap.Modal("#tournamentModal");
	const createTournament = document.getElementById("create-tournament");
	const joinTournament = document.getElementById("join-tournament");

	const createJoinModal = new bootstrap.Modal("#createJoinModal");
	const createGame = document.getElementById("create-game");
	const joinGame = document.getElementById("join-game");

	const gameUUIDField = document.getElementById("game-uuid");
	const tournamentUUIDField = document.getElementById("tournament-uuid");

	oneMode.addEventListener("click", () => {
		createJoinModal.show();
	});

	createGame.addEventListener("click", async () => {
		const res = await fetch(BASE_URL + "/game/match/create", {
			method: "POST",
		});

		const data = await res.json();

		if (res.ok) {
			createJoinModal.hide();
			Toast("Created lobby: " + data["uuid"], "primary");
			navigate("/lobby/" + data["uuid"]);
		} else {
			Toast("Error occured: " + data["error"], "danger");
		}

		console.log(data);
	});

	joinGame.addEventListener("click", async () => {
		// @ts-ignore
		const uuid = gameUUIDField.value;
		const url = BASE_URL + "/game/match/join";
		const res = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				uuid,
			}),
		});

		if (res.ok) {
			navigate("/lobby/" + uuid);
		} else Toast("Couldn't join lobby please try again later.", "danger");
	});

	joinTournament.addEventListener("click", async () => {
		// @ts-ignore
		const uuid = tournamentUUIDField.value;
		const url = BASE_URL + "/game/tournament/join";
		const res = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				uuid,
			}),
		});

		if (res.ok) {
			navigate("/tournament/" + uuid);
		} else
			Toast("Couldn't join tournament please try again later.", "danger");
	});

	tournamentMode.addEventListener("click", () => {
		tournamentModal.show();
	});

	createTournament.addEventListener("click", async () => {
		const res = await fetch(BASE_URL + "/game/tournament/create", {
			method: "POST",
		});

		const data = await res.json();

		console.log(data);

		if (res.ok) {
			tournamentModal.hide();
			Toast("Created tournament: " + data.uuid, "primary");
			navigate("/tournament/" + data.uuid);
		} else Toast("Error occured, couldn't create tournament", "danger");
	});
};

export const lobbyHandler = (route, slug) => {
	console.log(slug);
	const inviteBox = document.getElementById("invite-box");
	const currentPlayers = document.getElementById("current-players");

	const waitingOverlay = document.getElementById("waiting-overlay");
	const winnerOverlay = document.getElementById("winner-overlay");
	const finalScore = document.getElementById("final-score");
	const winnerText = document.getElementById("winner-text");

	const readyGame = document.getElementById("ready-game");

	const gameUUID = document.getElementById("game-id");

	gameUUID.textContent = slug;

	gameUUID.addEventListener("click", () => {
		navigator.clipboard.writeText(slug).then(() => {
			Toast("Copied game ID to clipboard!", "success");
		});
	});

	eventEmitter.on("GAME_START_MATCH", () => {
		waitingOverlay.classList.add("d-none");
		getMatchData();
	});

	readyGame.addEventListener("click", () => {
		socket.send(
			JSON.stringify({
				event: "GAME_MATCH_READY",
				data: {
					uuid: slug,
				},
			})
		);
	});

	const matchFinish = (data) => {
		if (data.uuid === slug) {
			waitingOverlay.classList.add("d-none");
			winnerOverlay.classList.remove("d-none");
			finalScore.textContent =
				data.player1_score + " : " + data.player2_score;
			winnerText.textContent = data.winner
				? data.winner.display_name
				: "Draw";
		}
	};

	eventEmitter.on("GAME_MATCH_FINISHED", (data) => matchFinish(data));

	const getMatchData = async () => {
		currentPlayers.textContent = "";
		const res = await fetch(BASE_URL + "/game/match/" + slug);
		const matchData = await res.json();

		console.log("match: ", matchData);
		if (res.ok) {
			if (matchData["status"] === 2) {
				waitingOverlay.classList.add("d-none");
				gameHandler(false, matchData);
			} else if (matchData["status"] === 3) matchFinish(matchData);
			if (matchData["player_1"])
				currentPlayers.appendChild(
					matchPlayersCard(
						matchData["player_1"],
						matchData["player_1"].user.uuid
					)
				);
			if (matchData["player_2"])
				currentPlayers.appendChild(
					matchPlayersCard(
						matchData["player_2"],
						matchData["player_2"].user.uuid
					)
				);
		} else
			Toast("Match couldn't be found, please try again later.", "danger");
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
					inviteBoxCard(friend.user, slug, getFriendsList)
				);
			});
			inviteBox.appendChild(fragment);
		} else {
			Toast("Error occured: " + data["error"], "danger");
		}
	};

	getMatchData();
	getFriendsList();
};

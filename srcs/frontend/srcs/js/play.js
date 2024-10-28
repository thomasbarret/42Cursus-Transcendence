import * as bootstrap from "bootstrap";
import { BASE_URL } from "./handler.js";
import { currentPlayerCard, inviteBoxCard, Toast } from "./components.js";
import { navigate } from "./main.js";
import { gameHandler } from "./game/pong.js";
import { eventEmitter } from "./eventemitter.js";
import { socket } from "./socket.js";

export const playHandler = (route) => {
	let timerId = 0;

	const tournamentMode = document.getElementById("tournament-mode");
	const oneVsOne = document.getElementById("one-vs-one");
	const waitingTime = document.getElementById("waiting-time");
	const cancelMatchmaking = document.getElementById("cancel-matchmaking");
	const createGame = document.getElementById("create-game");
	const matchmakingModal = new bootstrap.Modal("#matchmakingModal", {
		keyboard: false,
		backdrop: "static",
	});

	const createJoinModal = new bootstrap.Modal("#createJoinModal", {
		keyboard: false,
		backdrop: "static",
	});

	oneVsOne.addEventListener("click", () => {
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

	tournamentMode.addEventListener("click", () => {
		matchmakingModal.show();
		let timePassed = 1;

		timerId = setInterval(() => {
			const minutes = Math.floor(timePassed / 60);
			const seconds = timePassed % 60;
			waitingTime.textContent = `Time waiting: ${String(minutes).padStart(
				2,
				"0"
			)}:${String(seconds).padStart(2, "0")}`;
			timePassed++;
		}, 1000);
	});

	cancelMatchmaking.addEventListener("click", () => {
		matchmakingModal.hide();
		waitingTime.textContent = "Time waiting: 00:00";
		clearInterval(timerId);
	});
	console.log("player handler");
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
					currentPlayerCard(matchData["player_1"])
				);
			if (matchData["player_2"])
				currentPlayers.appendChild(
					currentPlayerCard(matchData["player_2"])
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

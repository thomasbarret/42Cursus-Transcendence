import {
	matchPlayedAgainst,
	Toast,
	tournamentCard,
	tournamentMatchHistoryCard,
	tournamentPlayerCard,
} from "./components.js";
import { BASE_URL } from "./handler.js";
import { getCurrentUser } from "./storage.js";

import { Chart } from "chart.js";

import { Offcanvas } from "bootstrap";

const gameResults = (user, gameData) => {
	const gamesWon = (() =>
		gameData.filter(
			(game) => game.winner && game.winner.uuid === user.uuid
		))();

	const gamesLost = (() =>
		gameData.filter(
			(game) => game.winner && game.winner.uuid !== user.uuid
		))();

	const gamesDraw = (() => gameData.filter((game) => !game.winner))();

	const gamesPlayed = gamesWon.length + gamesLost.length;
	const winrate = gamesPlayed !== 0 ? gamesWon.length / gamesPlayed : 0;

	return { gamesWon, gamesLost, gamesDraw, winrate };
};
const getDuration = (game) =>
	(new Date(game.end_date).getTime() - new Date(game.start_date).getTime()) /
	1000;

/**
 *
 * @param {Array<Object>} gameData
 */
const getLongestMatch = (gameData) => {
	const matchesDuration = gameData
		.filter((game) => game.start_date && game.end_date)
		.map((game) => {
			if (!game.start_date || !game.end_date) return 0;
			return getDuration(game);
		});

	const finished = gameData.filter(
		(game) => game.status === 3 && game.end_date && game.start_date
	);

	return matchesDuration.length !== 0 ? {
		longest: Math.max(...matchesDuration),
		average:
			matchesDuration.reduce((prev, curr) => prev + curr, 0) /
			matchesDuration.length,
		fastest: Math.min(...matchesDuration),
		durations: matchesDuration,
		finished,
	} : {
		longest: 0,
		average: 0,
		fastest: 0,
		durations: matchesDuration,
		finished,
	};
};
const winData = (user, gameData) => {
	/**
	 * @type {HTMLCanvasElement}
	 */
	// @ts-ignore
	const winsChart = document.getElementById("wins-chart");
	const winrateDisplay = document.getElementById("winrate");

	const { gamesWon, gamesLost, gamesDraw, winrate } = gameResults(
		user,
		gameData
	);

	winrateDisplay.textContent = `${(winrate * 100).toFixed(1)}%`;

	console.log(
		"Games Won: ",
		gamesWon,
		" Games Lost: ",
		gamesLost,
		" Games Draw: ",
		gamesDraw
	);

	const pieChartData = [
		{
			length: gamesWon.length,
			name: "Won",
		},
		{
			length: gamesLost.length,
			name: "Lost",
		},
		{
			length: gamesDraw.length,
			name: "Draw",
		},
	];

	new Chart(winsChart, {
		type: "pie",
		data: {
			labels: pieChartData.map((d) => d.name),
			datasets: [
				{
					data: pieChartData.map((d) => d.length),
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					position: "top",
				},
			},
		},
	});
};

const mostPlayed = (user, data) => {
	/**
	 * @type {HTMLCanvasElement}
	 */
	// @ts-ignore
	const mostPlayedChart = document.getElementById("most-played-chart");

	const mostPlayedAgainstDisplay = document.getElementById(
		"most-played-against"
	);

	const players = data
		.map((game) => {
			return game.player1?.user.uuid === user.uuid
				? game.player2
				: game.player1;
		})
		.filter((player) => player !== null);

	const counts = {};
	players.forEach((player) => {
		counts[player.user.uuid] = (counts[player.user.uuid] || 0) + 1;
	});

	const unique = Object.entries(counts).map(([uuid, count]) => {
		return { count, ...players.find((p) => p.user.uuid === uuid) };
	});

	const sorted = unique.toSorted((a, b) => b.count - a.count);

	console.log(unique);

	sorted.forEach((player) => {
		mostPlayedAgainstDisplay.appendChild(matchPlayedAgainst(player));
	});

	new Chart(mostPlayedChart, {
		type: "line",
		data: {
			labels: unique.map((player) => player.user.display_name),
			datasets: [
				{
					label: "Dataset",
					data: unique.map((player) => player.count),
					borderColor: ["#BB8FCE"],
					fill: false,
					// @ts-ignore
					stepped: true,
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			// @ts-ignore
			interaction: {
				intersect: false,
				axis: "x",
			},
		},
	});
};

const lineChart = (data) => {
	const averageDisplay = document.getElementById("average");
	const longestDisplay = document.getElementById("longest");
	const fastestDisplay = document.getElementById("fastest");
	/**
	 * @type {HTMLCanvasElement}
	 */
	// @ts-ignore
	const timeChart = document.getElementById("time-chart");
	/**
	 * @type {HTMLCanvasElement}
	 */
	// @ts-ignore
	const verticalBarChart = document.getElementById("vertical-bar-chart");

	const durations = getLongestMatch(data);

	const labels = durations.finished.map((game) => {
		const player1 = game.player1?.user.display_name || "NO PLAYER";
		const player2 = game.player2?.user.display_name || "NO PLAYER";
		return `${player1} vs ${player2}`;
	});

	averageDisplay.textContent = `Average: ${durations.average.toFixed(
		2
	)} seconds`;
	longestDisplay.textContent = `Longest: ${durations.longest.toFixed(
		2
	)} seconds`;
	fastestDisplay.textContent = `Fastest: ${durations.fastest.toFixed(
		2
	)} seconds`;

	new Chart(timeChart, {
		type: "line",
		data: {
			labels: labels,
			datasets: [
				{
					label: "Matches Duration (seconds)",
					data: durations.finished.map((game) => getDuration(game)),
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
		},
	});

	new Chart(verticalBarChart, {
		type: "bar",
		data: {
			labels: ["Average", "Longest", "Fastest"],
			datasets: [
				{
					label: "Duration Data (seconds)",
					data: [
						durations.average,
						durations.longest,
						durations.fastest,
					],
					backgroundColor: ["#FA8072", "#20B2AA", "#87CEEB"],
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
		},
	});
};

const calculatePoints = (user, data) => {
	const points = data
		.filter((game) => game.player2 && game.status === 3)
		.map((game) => {
			return game.player1.user.uuid === user.uuid
				? game.player1_score
				: game.player2_score;
		});

	const total = points.reduce((acc, curr) => acc + curr, 0);

	const average = points.length !== 0 ? total / points.length : 0;

	const least = points.length !== 0 ? Math.min(...points) : 0;
	const most = points.length !== 0 ? Math.max(...points) : 0;

	return { total, average, most, least };
};

const horizontalBarChart = (user, gameData) => {
	const totalPoints = document.getElementById("total-points");
	const averagePoints = document.getElementById("average-points");
	const mostPoints = document.getElementById("most-points");
	const leastPoints = document.getElementById("least-points");

	const points = calculatePoints(user, gameData);

	totalPoints.textContent = `Total: ${points.total}`;
	averagePoints.textContent = `Average: ${points.average.toFixed(
		2
	)} per match`;
	mostPoints.textContent = `Most: ${points.most}`;
	leastPoints.textContent = `Least: ${points.least}`;

	/**
	 * @type {HTMLCanvasElement}
	 */
	// @ts-ignore
	const pointsChart = document.getElementById("points-chart");

	new Chart(pointsChart, {
		type: "bar",
		data: {
			labels: Object.keys(points),
			datasets: [
				{
					label: "Point data",
					data: [...Object.values(points)],
					backgroundColor: [
						"#FFA07A",
						"#00FF7F",
						"#87CEEB",
						"#FFD700",
					],
				},
			],
		},
		options: {
			indexAxis: "y",
			elements: {
				// @ts-ignore
				bar: {
					borderWidth: 2,
				},
			},
			responsive: true,
			maintainAspectRatio: false,
		},
	});
};

const tournamentHistory = (tournaments) => {
	const tournamentsDisplay = document.getElementById("tournament-history");
	const offcanvas = new Offcanvas("#tournamentOffcanvas");

	const tournamentName = document.getElementById("tournament-name");
	const tournamentCreator = document.getElementById("tournament-creator");
	const tournamentStatus = document.getElementById("tournament-status");
	const maxScore = document.getElementById("max-score");
	const createdAt = document.getElementById("created-at");
	const winnerName = document.getElementById("winner-name");

	const playersList = document.getElementById("players-list");
	const matchesList = document.getElementById("matches-list");

	const statusMap = {
		1: "Waiting",
		2: "In Progress",
		3: "Finished",
		4: "Cancelled",
	};

	const callback = (tournament) => {
		offcanvas.show();

		playersList.textContent = "";
		matchesList.textContent = "";

		tournamentName.textContent = `${tournament.creator?.user.display_name}'s Tournament`;
		tournamentCreator.textContent = tournament.creator?.user.display_name;
		tournamentStatus.textContent = statusMap[tournament.status];
		maxScore.textContent = tournament.max_score;
		createdAt.textContent = new Date(
			tournament.created_at
		).toLocaleString();
		winnerName.textContent = tournament.winner?.display_name || "No Winner";

		const playerFragment = document.createDocumentFragment();
		tournament.players?.forEach((player) => {
			playerFragment.appendChild(tournamentPlayerCard(player));
		});

		const matchFragment = document.createDocumentFragment();
		tournament.matches?.forEach((match) => {
			matchFragment.appendChild(tournamentMatchHistoryCard(match));
		});

		playersList.appendChild(playerFragment);
		matchesList.appendChild(matchFragment);
	};

	const fragment = document.createDocumentFragment();
	tournaments.forEach((tournament) => {
		fragment.appendChild(tournamentCard(tournament, callback));
	});

	tournamentsDisplay.appendChild(fragment);
};

export const dashboardHandler = async () => {
	Chart.defaults.font.size = 15;

	const user = getCurrentUser();

	const getGameData = async () => {
		const req = await fetch(BASE_URL + "/user/@me/match");
		if (req.ok) {
			const data = await req.json();
			console.log(data);
			return data.matches;
		}
		return false;
	};

	const getTournamentData = async () => {
		const req = await fetch(BASE_URL + "/user/@me/tournament");
		if (req.ok) {
			const data = await req.json();
			console.log("TOURNAMENT DATA: ", data);
			return data.tournaments;
		} else {
			Toast("Couldn't get tournament data", "danger");
		}
	};

	const tournaments = (await getTournamentData()).reverse();

	/**
	 * @type {Array<Object>}
	 */
	const gameData = await getGameData();
	if (!gameData)
		return console.error("Couldn't get game data for user: ", user);

	winData(user, gameData);

	lineChart(gameData);

	mostPlayed(user, gameData);

	horizontalBarChart(user, gameData);

	tournamentHistory(tournaments);
};

import { matchPlayedAgainst } from "./components.js";
import { BASE_URL } from "./handler.js";
import { getCurrentUser } from "./storage.js";

import { Chart } from "chart.js";

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

	const winrate = gamesWon.length / (gamesWon.length + gamesLost.length);

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

	return {
		longest: Math.max(...matchesDuration),
		average:
			matchesDuration.reduce((prev, curr) => prev + curr, 0) /
			matchesDuration.length,
		fastest: Math.min(...matchesDuration),
		durations: matchesDuration,
		finished,
	};
};
const winData = (data) => {
	/**
	 * @type {HTMLCanvasElement}
	 */
	// @ts-ignore
	const winsChart = document.getElementById("wins-chart");
	new Chart(winsChart, {
		type: "pie",
		data: {
			labels: data.map((d) => d.name),
			datasets: [
				{
					data: data.map((d) => d.length),
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

	const labels = data.finished.map((game) => {
		const player1 = game.player1?.user.display_name || "NO PLAYER";
		const player2 = game.player2?.user.display_name || "NO PLAYER";
		return `${player1} vs ${player2}`;
	});

	new Chart(timeChart, {
		type: "line",
		data: {
			labels: labels,
			datasets: [
				{
					label: "Matches Duration (seconds)",
					data: data.finished.map((game) => getDuration(game)),
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
			labels: ["Longest", "Average", "Fastest"],
			datasets: [
				{
					label: "Duration Data (seconds)",
					data: [data.longest, data.average, data.fastest],
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

	const average = total / points.length;

	const least = Math.min(...points);
	const most = Math.max(...points);

	return { total, average, most, least };
};

const horizontalBarChart = (data) => {
	const totalPoints = document.getElementById("total-points");
	const averagePoints = document.getElementById("average-points");
	const mostPoints = document.getElementById("most-points");
	const leastPoints = document.getElementById("least-points");

	totalPoints.textContent = `Total: ${data.total}`;
	averagePoints.textContent = `Average: ${data.average.toFixed(2)} per match`;
	mostPoints.textContent = `Most: ${data.most}`;
	leastPoints.textContent = `Least: ${data.least}`;

	/**
	 * @type {HTMLCanvasElement}
	 */
	// @ts-ignore
	const pointsChart = document.getElementById("points-chart");

	new Chart(pointsChart, {
		type: "bar",
		data: {
			labels: Object.keys(data),
			datasets: [
				{
					label: "Point data",
					data: [...Object.values(data)],
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

export const dashboardHandler = async () => {
	Chart.defaults.font.size = 25;

	const winrateDisplay = document.getElementById("winrate");
	const averageDisplay = document.getElementById("average");
	const longestDisplay = document.getElementById("longest");
	const fastestDisplay = document.getElementById("fastest");

	const getGameData = async () => {
		const req = await fetch(BASE_URL + "/user/@me/match");
		if (req.ok) {
			const data = await req.json();
			console.log(data);
			return data.matches;
		}
		return false;
	};
	const user = getCurrentUser();

	/**
	 * @type {Array<Object>}
	 */
	const gameData = await getGameData();
	if (!gameData)
		return console.error("Couldn't get game data for user: ", user);

	const { gamesWon, gamesLost, gamesDraw, winrate } = gameResults(
		user,
		gameData
	);

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

	winData(pieChartData);
	winrateDisplay.textContent = `${(winrate * 100).toFixed(1)}%`;

	const matchesDurations = getLongestMatch(gameData);
	console.log("Longest Match: ", matchesDurations);

	lineChart(matchesDurations);
	averageDisplay.textContent = `Average: ${matchesDurations.average.toFixed(
		2
	)} seconds`;
	longestDisplay.textContent = `Longest: ${matchesDurations.longest.toFixed(
		2
	)} seconds`;
	fastestDisplay.textContent = `Fastest: ${matchesDurations.fastest.toFixed(
		2
	)} seconds`;

	mostPlayed(user, gameData);

	const points = calculatePoints(user, gameData);
	console.log("Points: ", points);

	horizontalBarChart(points);
};

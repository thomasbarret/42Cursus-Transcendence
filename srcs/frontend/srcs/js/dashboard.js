import { eventEmitter } from "./eventemitter.js";
import { BASE_URL } from "./handler.js";
import { getCurrentUser, isDarkMode } from "./storage.js";

import { Chart } from "chart.js";

const winrate = (user, gameData) => {
	const gamesWon = (() =>
		gameData.filter(
			(game) => game.winner && game.winner.uuid === user.uuid
		))();

	const gamesLost = (() =>
		gameData.filter(
			(game) => game.winner && game.winner.uuid !== user.uuid
		))();

	const gamesDraw = (() => gameData.filter((game) => !game.winner))();

	return { gamesWon, gamesLost, gamesDraw };
};

/**
 *
 * @param {Array<Object>} gameData
 */
const getLongestMatch = (gameData) => {
	const getDuration = (game) =>
		(new Date(game.end_date).getTime() -
			new Date(game.start_date).getTime()) /
		1000;

	const matchesDuration = gameData
		.filter((game) => game.start_date && game.end_date)
		.map((game) => {
			if (!game.start_date || !game.end_date) return 0;
			return getDuration(game);
		});

	return {
		longest: Math.max(...matchesDuration),
		average:
			matchesDuration.reduce((prev, curr) => prev + curr, 0) /
			matchesDuration.length,
		fastest: Math.min(...matchesDuration),
		durations: matchesDuration,
	};
};

export const dashboardHandler = async () => {
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

	const { gamesWon, gamesLost, gamesDraw } = winrate(user, gameData);

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
	const matchDurations = getLongestMatch(gameData);
	console.log("Longest Match: ", matchDurations);

	// drawLineChart("time-chart", matchDurations.durations, {
	// 	longest: matchDurations.longest,
	// 	average: matchDurations.average,
	// 	fastest: matchDurations.fastest,
	// });
	winData(pieChartData);
};

const winData = (data) => {
	const DATA_COUNT = 3;
	const total = data.reduce((prev, curr) => prev + curr.length, 0);

	const NUMBER_CFG = { count: DATA_COUNT, min: 0, max: total };

	const ddata = {
		datasets: [{}],
	};
	/**
	 * @type {HTMLCanvasElement}
	 */
	// @ts-ignore
	const winsChart = document.getElementById("wins-chart");
	Chart.defaults.font.size = 25;
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
			plugins: {
				legend: {
					position: "top",
				},
			},
		},
	});
};

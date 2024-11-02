import { eventEmitter } from "./eventemitter.js";
import { BASE_URL } from "./handler.js";
import { getCurrentUser, isDarkMode } from "./storage.js";

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

const drawPieChart = (
	canvasId,
	data = [{ length: 0, name: "placeholder" }]
) => {
	/**
	 * @type {HTMLCanvasElement}
	 */
	// @ts-ignore
	const canvas = document.getElementById(canvasId);
	const ctx = canvas.getContext("2d");
	const colors = ["#FF5733", "#33FF57", "#3357FF"];

	const total = data.reduce((prev, curr) => prev + curr.length, 0);

	let startAngle = 0;
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	const radius = canvas.width / 6; // Adjust the radius to make the pie smaller
	const centerX = canvas.width / 2;
	const centerY = canvas.height / 2;

	data.forEach(({ length, name }, index) => {
		const sliceAngle = (length / total) * 2 * Math.PI;
		const sliceMidAngle = startAngle + sliceAngle / 2;

		ctx.beginPath();
		ctx.moveTo(centerX, centerY);
		ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
		ctx.closePath();
		ctx.fillStyle = colors[index % colors.length];
		ctx.fill();

		const textX = centerX + (radius + 20) * Math.cos(sliceMidAngle);
		const textY = centerY + (radius + 20) * Math.sin(sliceMidAngle);
		ctx.fillStyle = isDarkMode() ? "white" : "black";
		ctx.font = "14px Arial";
		ctx.fillText(
			`${name.toUpperCase()} ${((length / total) * 100).toFixed(1)}%`,
			textX,
			textY
		);

		startAngle += sliceAngle;
	});
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
			name: "won",
		},
		{
			length: gamesLost.length,
			name: "lost",
		},
		{
			length: gamesDraw.length,
			name: "draw",
		},
	];

	eventEmitter.on("theme", () => drawPieChart("wins-chart", pieChartData));

	drawPieChart("wins-chart", pieChartData);
};

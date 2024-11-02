import { BASE_URL } from "./handler.js";
import { getCurrentUser } from "./storage.js";

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
};

import { Game } from "./game.js";

export const gameHandler = (_, matchData) => {
	const game = new Game(matchData);
	game.start();
};

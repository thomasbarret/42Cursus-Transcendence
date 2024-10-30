import { Game } from "./game.js";

export const gameHandler = (_, matchData) => {
	new Game(matchData);
};

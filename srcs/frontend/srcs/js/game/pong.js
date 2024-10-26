import { Game } from "./game.js";

export const gameHandler = (_, matchData) => {
	const game = new Game(matchData);
};

//TODO
// ! ADD AN EVENTEMITTER AT THE LOCATIONHANDLER IN THE ROUTER
// ! To be able to handle "switch" page events, add and eventEmitter.emit()
// ! Just before the replacement of the innerHTML of the content div.

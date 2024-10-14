import { gameHandler } from "./game.js";
import { aboutHandler, contactHandler, indexHandler } from "./handler.js";
import { Routes } from "./types.js";

const urlPageTitle = "nascent";

export const routes: Record<string, Routes> = {
	404: {
		page: "/pages/not_found.html",
		title: "404 | " + urlPageTitle,
		description: "Page not found",
	},
	"/": {
		page: "/pages/index.html",
		title: "Home | " + urlPageTitle,
		description: "This is the home page",
		handler: indexHandler,
	},
	"/play": {
		page: "/pages/game.html",
		title: "Pong Game | " + urlPageTitle,
		description: "Pong Game",
		handler: gameHandler,
	},
	"/about": {
		page: "/pages/about.html",
		title: "About Us | " + urlPageTitle,
		description: "This is the about page",
		handler: aboutHandler,
	},
	"/contact": {
		page: "/pages/contact.html",
		title: "Contact Us | " + urlPageTitle,
		description: "This is the contact page",
		handler: contactHandler,
	},
};

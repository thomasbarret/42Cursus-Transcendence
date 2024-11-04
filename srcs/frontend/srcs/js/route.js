import { loginHandler, signUpHandler } from "./auth.js";
import { customizationHandler } from "./customization.js";
import { dashboardHandler } from "./dashboard.js";
import { friendsHandler } from "./friends.js";
import { gameHandler } from "./game/pong.js";
import { indexHandler, profileHandler, settingsHandler } from "./handler.js";
import { messageHandler } from "./messages.js";
import { lobbyMiddleware, tournamentMiddleware } from "./middleware.js";
import { lobbyHandler, playHandler } from "./play.js";
import { tournamentHandler } from "./tournament.js";
const urlPageTitle = "transcendence";
export const routes = {
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
		page: "/pages/play.html",
		title: "Play Pong | " + urlPageTitle,
		description: "Pong Game Mode Selector",
		handler: playHandler,
		auth: true,
	},
	"/lobby": {
		page: "/pages/lobby.html",
		title: "Game | " + urlPageTitle,
		description: "Lobby for the Pong game",
		handler: lobbyHandler,
		slug: true,
		no_slug_fallback: "/play",
		middleware: lobbyMiddleware,
	},
	"/tournament": {
		page: "/pages/tournament.html",
		title: "Tournament | " + urlPageTitle,
		description: "Tournament for the Pong Game",
		handler: tournamentHandler,
		slug: true,
		no_slug_fallback: "/play",
		middleware: tournamentMiddleware,
	},
	"/game": {
		page: "/pages/game.html",
		title: "Pong Game | " + urlPageTitle,
		description: "Pong Game",
		handler: gameHandler,
	},
	"/login": {
		page: "/pages/login.html",
		title: "Login | " + urlPageTitle,
		description: "This is the login page!",
		handler: loginHandler,
	},
	"/signup": {
		page: "/pages/signup.html",
		title: "Signup | " + urlPageTitle,
		description: "Signup Page",
		handler: signUpHandler,
	},
	"/settings": {
		page: "/pages/settings.html",
		title: "Settings | " + urlPageTitle,
		description: "Settings Page",
		handler: settingsHandler,
		auth: true,
	},
	"/friends": {
		page: "/pages/friends.html",
		title: "Friends | " + urlPageTitle,
		description: "Friends Page",
		handler: friendsHandler,
		auth: true,
	},
	"/messages": {
		page: "/pages/messages.html",
		title: "Messages | " + urlPageTitle,
		description: "This is the login page!",
		handler: messageHandler,
		auth: true,
	},
	"/profile": {
		page: "/pages/profile.html",
		title: "Profile | " + urlPageTitle,
		description: "This is the profile page",
		handler: profileHandler,
		slug: true,
		auth: true,
	},
	"/dashboard": {
		page: "/pages/dashboard.html",
		title: "Dashboard | " + urlPageTitle,
		description: "This is the dashboard page",
		handler: dashboardHandler,
		auth: true,
	},
	"/customization": {
		page: "/pages/customization.html",
		title: "Customize | " + urlPageTitle,
		description: "This is the customization page",
		handler: customizationHandler,
	},
};

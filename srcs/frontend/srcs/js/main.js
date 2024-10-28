import { eventEmitter } from "./eventemitter.js";
import { keyDownListener, keyUpListener } from "./game/game.js";
import { BASE_URL, mainHandler, navHandler } from "./handler.js";
import { routes } from "./route.js";
import { closeWebSocket, connectWebSocket } from "./socket.js";
import { removeCurrentUser, setCurrentUser } from "./storage.js";
document.addEventListener("click", (e) => {
	const { target } = e;
	if (
		!(target instanceof HTMLElement) ||
		target.getAttribute("data-router-navigation") !== "true"
	) {
		return;
	}
	e.preventDefault();
	urlRoute(e);
});

const clear = () => {
	eventEmitter.clear();
	document.removeEventListener("keyup", keyUpListener);
	document.removeEventListener("keydown", keyDownListener);
};

export const urlRoute = (event) => {
	clear();
	let newLocation = undefined;
	if (typeof event === "string") {
		newLocation = event;
	} else if (event.target instanceof HTMLAnchorElement) {
		event.preventDefault();
		newLocation = event.target.href;
	}
	if (newLocation) {
		window.history.pushState({}, "", newLocation);
		locationHandler();
	}
};
export const checkLoggedIn = async () => {
	try {
		const req = await fetch(BASE_URL + "/user/@me", {
			method: "GET",
		});
		if (req.ok) {
			const json = await req.json();
			connectWebSocket();
			setCurrentUser(json);
		} else {
			closeWebSocket();
			removeCurrentUser();
		}
		return req.ok;
	} catch (error) {
		return false;
	}
};
export const navigate = (path, delay) => {
	let url = window.location.origin;
	if (path.length !== 0) url += path;
	if (delay) {
		setTimeout(() => {
			urlRoute(url);
		}, delay);
	} else {
		urlRoute(url);
	}
};

// create a function that handles the url location
const locationHandler = async () => {
	navHandler();

	let currentLocation = window.location.pathname;
	if (currentLocation.length == 0) {
		currentLocation = "/";
	}
	if (currentLocation.length > 1 && currentLocation.slice(-1) === "/")
		currentLocation = currentLocation.slice(0, -1);
	const paths = currentLocation.split("/").filter((el) => el != "");
	if (paths.length > 1) {
		currentLocation = "/" + paths[0];
	}
	let route = routes[currentLocation] || routes["404"];
	if (!route.slug && paths.length > 1) route = routes["404"];
	else if (route.slug && route.no_slug_fallback && paths.length === 1) {
		navigate(route.no_slug_fallback);
		return;
	}
	if (route.middleware) {
		if (!(await route.middleware(route, paths[1]))) return;
	}
	if (route.auth) {
		if (!(await checkLoggedIn())) {
			navigate("/login");
			return;
		}
	}
	const html = await fetch(route.page).then((response) => response.text());
	const content = document.getElementById("content");
	if (content) content.innerHTML = html;
	if (route.handler) {
		if (paths.length > 1) route.handler(route, paths[1]);
		else route.handler(route);
	}
	document.title = route.title;
};
window.onpopstate = locationHandler;
locationHandler();
document.addEventListener("DOMContentLoaded", () => {
	mainHandler();
});
removeCurrentUser();
connectWebSocket();

import { mainHandler } from "./handler.js";
import { routes } from "./route.js";

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

export const urlRoute = (event: Event | string) => {
	let newLocation = undefined;
	if (typeof event === "string") {
		newLocation = event;
	} else if (event.target instanceof HTMLAnchorElement) {
		event.preventDefault();
		newLocation = event.target.href;
	}
	if (newLocation) {
		// console.log(newLocation);
		window.history.pushState({}, "", newLocation);
		locationHandler();
	}
};

// create a function that handles the url location
const locationHandler = async () => {
	let currentLocation = window.location.pathname;
	if (currentLocation.length == 0) {
		currentLocation = "/";
	}
	const paths = currentLocation.split("/").filter((el) => el != "");

	if (paths.length > 1) {
		currentLocation = "/" + paths[0];
	}

	let route = routes[currentLocation] || routes["404"];
	if (!route.slug && paths.length > 1) route = routes["404"];
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

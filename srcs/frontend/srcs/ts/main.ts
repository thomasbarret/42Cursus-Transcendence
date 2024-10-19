import { BASE_URL, mainHandler, navHandler } from "./handler.js";
import { routes } from "./route.js";
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

export const checkLoggedIn = async () => {
	try {
		const req = await fetch(BASE_URL + "/user/@me/", {
			method: "GET",
		});

		if (req.ok) {
			const json = await req.json();
			setCurrentUser(json);
		} else {
			removeCurrentUser();
		}

		return req.ok;
	} catch (error) {
		return false;
	}
};

// create a function that handles the url location
const locationHandler = async () => {
	navHandler();
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

export const navigate = (path: string, delay?: number) => {
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

const socket = new WebSocket("ws://localhost:8080/ws/gateway/");

socket.addEventListener("open", (e) => {
	console.log(e);
});

socket.addEventListener("message", (e) => {
	console.log("received socket message: ", JSON.parse(e.data));
	const data = JSON.parse(e.data);
	if (data.event === "DIRECT_MESSAGE_CREATE") {
		console.log("message: ", data.data);

		const messageEvent = new CustomEvent("messageEvent", {
			detail: data.data,
		});

		document.dispatchEvent(messageEvent);
	}
});

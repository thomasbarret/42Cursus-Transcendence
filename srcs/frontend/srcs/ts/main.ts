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
		const req = await fetch(BASE_URL + "/user/@me", {
			method: "GET",
		});

		if (req.ok) {
			const json = await req.json();
			connectWebSocket();
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

export let socket: WebSocket;

export const connectWebSocket = () => {
	if (
		socket &&
		(socket.readyState === WebSocket.OPEN ||
			socket.readyState === WebSocket.CONNECTING)
	) {
		console.log("WebSocket is already open or connecting.");
		return;
	}

	socket = new WebSocket(
		`${window.location.protocol === "https:" ? "wss" : "ws"}://${
			window.location.host
		}/ws/gateway/`
	);

	socket.onopen = () => {
		console.log("WebSocket connection established.");
	};

	socket.onclose = () => {
		console.warn("WebSocket connection closed.");
	};

	socket.onerror = (error) => {
		console.error("WebSocket error:", error);
	};

	socket.onmessage = (event) => {
		const data = JSON.parse(event.data);
		console.log("received socket message: ", data);
		switch (data.event) {
			case "DIRECT_MESSAGE_CREATE":
				const messageEvent = new CustomEvent("messageEvent", {
					detail: data.data,
				});

				document.dispatchEvent(messageEvent);
				break;
		}
	};
};

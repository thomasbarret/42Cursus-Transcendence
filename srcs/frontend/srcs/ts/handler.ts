import { messageBoxLeft, messageBoxRight, Toast } from "./components.js";
import { div, h1, t } from "./framework.js";
import { urlRoute } from "./main.js";
import { activateDarkMode, toggleDarkMode } from "./storage.js";
import { Routes } from "./types";

export const BASE_URL = "/api";

export const mainHandler = () => {
	const toggle = document.getElementById("theme-toggle");

	toggle.addEventListener("click", () => {
		toggleDarkMode(toggle as HTMLButtonElement);
	});
	activateDarkMode(toggle as HTMLButtonElement);
};

export const indexHandler = (route: Routes) => {
	console.log("current route: ", route.description);
	let entry = document.getElementById("entry");

	let elements = t(
		"div",
		t("h1", "this is the content of the h1").attr("id", "wow"),
		t("a", "this is the content of the ahref")
			.attr("href", "/asdf")
			.attr("data-router-navigation", "true"),
		[...Array(10)].map((_, i) =>
			h1("this is text number: ", i.toString()).onclick$(() =>
				console.log(i)
			)
		)
	);
	if (entry) entry.appendChild(elements);
};

export const contactHandler = (route: Routes) => {
	console.log("current route: ", route.description);
};

export const aboutHandler = (route: Routes) => {
	console.log("current route: ", route.description);
};

export const messageHandler = (route: Routes) => {
	console.log("message handler: ", route.description);

	const chatBody = document.getElementById("chat-body");

	chatBody.appendChild(messageBoxLeft("so good omg1", "00:44"));
	chatBody.appendChild(messageBoxRight("asldkfjsadlkfjsdalkjf", "00:43"));
	chatBody.appendChild(messageBoxLeft("so good omg2", "00:44"));
	chatBody.appendChild(messageBoxRight("another of my message", "00:44"));
	chatBody.appendChild(messageBoxRight("ttttest", "00:44"));
	chatBody.appendChild(messageBoxRight("", "00:44"));
	chatBody.appendChild(
		messageBoxLeft("wow this is an interactive chat", "00:44")
	);
	chatBody.appendChild(messageBoxLeft("so good omg", "00:44"));
	chatBody.appendChild(
		messageBoxRight(
			"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer pulvinar justo non nibh aliquam, et sollicitudin leo suscipit. Curabitur volutpat molestie magna sit amet laoreet. Nulla venenatis sem sit amet ultrices semper. Curabitur ultricies interdum ex, vel accumsan ex tincidunt ut. Duis varius ultricies vestibulum. In faucibus fringilla ipsum, gravida commodo ligula efficitur id. Donec tincidunt congue velit, nec iaculis diam ultrices non.",
			"00:46"
		)
	);
	chatBody.appendChild(messageBoxLeft("so good omg4", "00:44"));
	setTimeout(() => {
		chatBody.appendChild(messageBoxLeft("wesh wesh k", "00:44"));
	}, 3000);
};

export const profileHandler = (route: Routes, slug?: string) => {
	console.log("current route: ", route.description);
	console.log("current path slug: ", slug);

	const usernameField = document.getElementById("username-field");
	const winField = document.getElementById("win-field");
	const loseField = document.getElementById("lose-field");
	const playedField = document.getElementById("played-field");
	const addFriend = document.getElementById("add-friend");

	if (!slug) {
		usernameField.textContent = "current user";
		addFriend.remove();
	} else {
		usernameField.textContent = slug;
	}

	const winTotal = Math.floor(Math.random() * 20);
	const loseTotal = Math.floor(Math.random() * 20);
	const playedTotal = winTotal + loseTotal;

	winField.textContent = "Wins: " + winTotal.toString();
	loseField.textContent = "Losses: " + loseTotal.toString();
	playedField.textContent = "Games Played: " + playedTotal.toString();

	// const entry = document.getElementById("entry");
	// if (!slug) entry.appendChild(div("this is my own profile page"));
	// else entry.appendChild(div("seeing profile for user: " + slug));
};

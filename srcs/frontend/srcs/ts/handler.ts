import { div, h1, p, t } from "./framework.js";
import { urlRoute } from "./main.js";
import { activateDarkMode, toggleDarkMode } from "./storage.js";
import { Routes } from "./types";

export const BACKEND_URL = "http://localhost:3000";

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
			.attr("id", "navigation"),
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

export const loginHandler = (route: Routes) => {
	console.log("login handler wow: ", route.description);
	const loginForm = document.getElementById("login-form") as HTMLFormElement;

	loginForm.addEventListener("submit", async (event) => {
		event.preventDefault();
		const data = Object.fromEntries(new FormData(loginForm));

		const email = "?email=" + data.email;
		const password = "&password=" + data.password;
		const result = await fetch(BACKEND_URL + "/users" + email + password, {
			method: "GET",
		});

		const json: Array<any> = await result.json();

		if (json.length === 0) {
			console.log("USER NOT FOUND!!!");
			return;
		}
		console.log("SUCCESS!", json);
		setTimeout(() => {
			urlRoute(window.location.origin);
		}, 500);
	});
};

export const messageBoxRight = (text: string, time: string) => {
	const img = t("img")
		.attr("src", "https://picsum.photos/45")
		.attr("alt", "avatar 1")
		.attr("style", "width: 30px; height: 30px")
		.attr("class", "rounded-circle");

	const content = div(
		p(text).attr(
			"class",
			"small p-2 me-3 mb-1 rounded-3 bg-primary text-white"
		),
		p(time).attr(
			"class",
			"small me-3 mb-3 rounded-3 text-muted d-flex justify-content-end"
		)
	);

	const message = div(content, img).attr(
		"class",
		"d-flex flex-row justify-content-end mb-3 pt-1"
	);

	return message;
};

export const messageBoxLeft = (text: string, time: string) => {
	const img = t("img")
		.attr("src", "https://picsum.photos/45")
		.attr("alt", "avatar 1")
		.attr("style", "width: 30px; height: 30px")
		.attr("class", "rounded-circle");

	const content = div(
		p(text).attr(
			"class",
			"small p-2 ms-3 mb-1 rounded-3 bg-light text-dark"
		),
		p(time).attr("class", "small ms-3 mb-3 rounded-3 text-muted")
	);

	const message = div(img, content).attr(
		"class",
		"d-flex flex-row justify-content-start mb-3"
	);

	return message;
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
};

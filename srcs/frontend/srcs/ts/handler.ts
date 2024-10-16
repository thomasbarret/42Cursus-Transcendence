import { h1, t } from "./framework.js";
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

export const messageHandler = (route: Routes) => {
	console.log("message handler: ", route.description);
};

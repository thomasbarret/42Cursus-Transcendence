import {
	messageBoxLeft,
	messageBoxRight,
	Toast,
	userListBox,
} from "./components.js";
import { a, div, h1, t } from "./framework.js";
import { checkLoggedIn, navigate, urlRoute } from "./main.js";
import { activateDarkMode, getCurrentUser, toggleDarkMode } from "./storage.js";
import { Routes } from "./types";

export const BASE_URL = "/api";

export const navHandler = () => {
	const navAuth = document.getElementById("nav-auth");
	navAuth.innerHTML = "";

	checkLoggedIn().then((loggedIn) => {
		if (loggedIn) {
			const logoutButon = t("button", "Logout")
				.cl("btn btn-primary")
				.onclick$(async (event) => {
					await fetch(BASE_URL + "/auth/logout/", {
						method: "POST",
					});
					navigate("/");
					// navHandler();
				});
			navAuth.appendChild(logoutButon);
		} else {
			const loginButton = a("Login")
				.attr("data-router-navigation", "true")
				.cl("btn btn-primary col me-1")
				.attr("href", "/login");

			const signUpButton = a("Sign Up")
				.attr("data-router-navigation", "true")
				.cl("btn col")
				.attr("href", "/signup");

			navAuth.appendChild(loginButton);
			navAuth.appendChild(signUpButton);
		}
	});
};

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
	const userList = document.getElementById("user-list");

	//FOR SINGLE CHANNEL
	// {{base_url}}/api/chat/4352d75c-0001-4161-8d80-e11bad449425/
	try {
		const getMessages = async () => {
			const res = await fetch(BASE_URL + "/chat/@me/");

			if (res.ok) {
				const data = await res.json();

				data.channels.forEach((channel) => {
					const getUser = (users) => {
						const arr = [];
						const not = users.filter(
							(u) => u.uuid != getCurrentUser().uuid
						);

						not.forEach((el) => arr.push(el.display_name));
						return arr;
					};

					const notCurrent = getUser(channel.users);
					console.log(notCurrent);

					userList.appendChild(userListBox(notCurrent.join(", ")));
				});
				console.log(data.channels);
				console.log(getCurrentUser());
			} else {
				console.log("error occured", res);
				Toast("Error occured during message fetch", "danger");
			}
		};

		getMessages();
	} catch (error) {
		Toast("Network error " + error, "danger");
	}

	chatBody.appendChild(messageBoxLeft("so WOWWOWOWWO omg1", "00:44"));
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
	const uuidField = document.getElementById("uuid-field");
	const winField = document.getElementById("win-field");
	const loseField = document.getElementById("lose-field");
	const playedField = document.getElementById("played-field");
	const addFriendField = document.getElementById("add-friend");
	const avatarField = document.getElementById(
		"avatar-field"
	) as HTMLImageElement;

	if (!slug) {
		try {
			const getProfile = async () => {
				const req = await fetch(BASE_URL + "/user/@me/", {
					method: "GET",
				});

				if (req.ok) {
					const data = await req.json();
					usernameField.textContent = data.display_name;
					uuidField.textContent = data.uuid;
					const winTotal = Math.floor(Math.random() * 20);
					const loseTotal = Math.floor(Math.random() * 20);
					const playedTotal = winTotal + loseTotal;

					winField.textContent = "Wins: " + winTotal.toString();
					loseField.textContent = "Losses: " + loseTotal.toString();
					playedField.textContent =
						"Games Played: " + playedTotal.toString();
				} else {
					navigate("/login");
				}
			};
			getProfile();
		} catch (error) {
			Toast("Network error", "danger");
		}
		addFriendField.remove();
	} else {
		usernameField.textContent = slug;
	}

	// const entry = document.getElementById("entry");
	// if (!slug) entry.appendChild(div("this is my own profile page"));
	// else entry.appendChild(div("seeing profile for user: " + slug));
};

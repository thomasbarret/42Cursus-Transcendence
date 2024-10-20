import { Toast } from "./components.js";
import { a, h1, t } from "./framework.js";
import { checkLoggedIn, navigate } from "./main.js";
import { activateDarkMode, toggleDarkMode } from "./storage.js";
import { Routes } from "./types";

// @ts-ignore
import * as bootstrap from "bootstrap";

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

export const aboutHandler = (route: Routes) => {
	console.log("current route: ", route.description);
};

export const profileHandler = (route: Routes, slug?: string) => {
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
				const req = await fetch(BASE_URL + "/user/@me", {
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
};

export const settingsHandler = async (route: Routes) => {
	console.log("settings route");

	const enable2FAButton = document.getElementById("enable-two-factor");
	const QRCodeElement = document.getElementById("qrcode");

	const twoFactorCode = document.getElementById(
		"two-factor-code"
	) as HTMLInputElement;
	const confirmButton = document.getElementById("two-factor-confirm");

	const twoFactorModal = new bootstrap.Modal("#twoFactorAuthModal", {
		keyboard: false,
		backdrop: "static",
	});

	const currentUsername = document.getElementById("current-username");
	const currentEmail = document.getElementById("current-email");
	const twoFactorStatus = document.getElementById("two-factor-status");

	const res = await fetch(BASE_URL + "/auth/settings");

	const data = await res.json();
	if (res.ok) {
		console.log(data);
		currentUsername.textContent = data.username;
		currentEmail.textContent = data.email;
		twoFactorStatus.textContent = data["2fa_enabled"];
		data["2fa_enabled"]
			? twoFactorStatus.classList.toggle("text-success")
			: twoFactorStatus.classList.toggle("text-danger");
	}

	confirmButton.addEventListener("click", async (e) => {
		confirmButton.setAttribute("disabled", "");
		confirmButton.innerHTML = `<span class="visually-hidden" role="status">Loading...</span>`;

		const res = await fetch(BASE_URL + "/auth/2fa/confirm/", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				token: twoFactorCode.value,
			}),
		});

		const data = await res.json();

		confirmButton.removeAttribute("disabled");
		confirmButton.innerHTML = "Verify";
		if (res.ok) {
			Toast("Successfully added 2FA authentification!", "success");
			twoFactorModal.hide();
		} else {
			Toast("2FA: Invalid Token entered, try again.", "danger");
		}

		console.log(data);
	});

	enable2FAButton.addEventListener("click", async (e) => {
		QRCodeElement.textContent = "";
		const res = await fetch(BASE_URL + "/auth/2fa/enable/", {
			method: "POST",
		});

		const data = await res.json();

		if (res.ok) {
			// @ts-ignore
			new QRCode(QRCodeElement, data.secret);

			twoFactorModal.show();
		} else {
			Toast(
				"Error occured when enabling 2FA, please try again later.",
				"danger"
			);
		}

		console.log(data);
	});
};

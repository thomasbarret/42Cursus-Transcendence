import { matchHistory, profileCard, Toast } from "./components.js";
import { a, button, div, h1, t } from "./framework.js";
import { checkLoggedIn, navigate } from "./main.js";
import { activateDarkMode, getCurrentUser, toggleDarkMode } from "./storage.js";
// @ts-ignore
import * as bootstrap from "bootstrap";
export const BASE_URL = "/api";
export const DEFAULT_AVATAR = "https://api.dicebear.com/9.x/glass/svg";

export const SEED_AVATAR = (seed) =>
	`https://api.dicebear.com/9.x/glass/svg?seed=${seed}`;

export const navHandler = () => {
	const navAuth = document.getElementById("nav-auth");
	checkLoggedIn().then((loggedIn) => {
		if (loggedIn) {
			navAuth.innerHTML = "";
			const logoutButon = div(
				getCurrentUser().username,
				button("Logout")
					.cl("btn btn-primary mx-2")
					// @ts-ignore
					.onclick$(async (event) => {
						await fetch(BASE_URL + "/auth/logout/", {
							method: "POST",
						});
						navigate("/");
					})
			).cl("fw-bold");
			navAuth.appendChild(logoutButon);
		} else {
			navAuth.innerHTML = "";
			const loginButton = a("/login", "Login")
				.attr("data-router-navigation", "true")
				.cl("btn btn-primary col me-1");
			const signUpButton = a("/signup", "Sign Up")
				.attr("data-router-navigation", "true")
				.cl("btn col");
			const oauthButton = a(BASE_URL + "/oauth/42/", "Login 42").cl(
				"btn btn-outline-primary col me-2"
			);
			navAuth.appendChild(oauthButton);
			navAuth.appendChild(loginButton);
			navAuth.appendChild(signUpButton);
		}
	});
};
export const mainHandler = () => {
	const toggle = document.getElementById("theme-toggle");
	toggle.addEventListener("click", () => {
		toggleDarkMode(toggle);
	});
	activateDarkMode(toggle);
};
// @ts-ignore
export const indexHandler = (route) => {};

// @ts-ignore
export const profileHandler = (route, slug) => {
	console.log("current path slug: ", slug);

	const profile = document.getElementById("profile");
	try {
		const getUserProfile = async () => {
			profile.textContent = "";
			const url = "/user/" + (slug ? slug : "@me");
			const req = await fetch(BASE_URL + url, {
				method: "GET",
			});
			if (req.ok) {
				const data = await req.json();
				const postRelation = async (type) => {
					const res = await fetch(BASE_URL + "/user/relation/@me", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							username: data.username,
							type,
						}),
					});
					const json = await res.json();
					if (res.ok) {
						Toast(
							'Added relation with "' + data.username + '"',
							"success"
						);
						getUserProfile();
					} else {
						Toast("Error occured: " + json["error"], "danger");
					}
				};
				profile.appendChild(
					profileCard(
						{ ...data, me: !slug },
						postRelation,
						getUserProfile
					)
				);

				const historyButton = document.getElementById("history-tab");
				const historyContent =
					document.getElementById("history-tab-pane");

				historyButton.addEventListener("show.bs.tab", async () => {
					const url = "/user/" + (slug ? slug : "@me") + "/match";
					const res = await fetch(BASE_URL + url);

					const data = await res.json();

					console.log(data);
					if (res.ok) {
						historyContent.textContent = "";
						historyContent.appendChild(matchHistory(data.matches));
					} else
						Toast(
							"Error occured when fetching match history, try again later.",
							"danger"
						);
				});
			} else {
				profile.appendChild(profileCard(false));
				Toast("User not found!", "danger");
			}
		};
		getUserProfile();
	} catch (error) {
		Toast("Network error", "danger");
	}
};

export const settingsHandler = async (route) => {
	console.log("settings route");
	const enable2FAButton = document.getElementById("enable-two-factor");
	const QRCodeElement = document.getElementById("qrcode");
	const twoFactorCode = document.getElementById("two-factor-code");
	const confirmButton = document.getElementById("two-factor-confirm");
	const twoFactorModal = new bootstrap.Modal("#twoFactorAuthModal", {
		keyboard: false,
		backdrop: "static",
	});
	const currentUsername = document.getElementById("current-username");
	const currentEmail = document.getElementById("current-email");
	const twoFactorStatus = document.getElementById("two-factor-status");
	const settignsForm = document.getElementById("settings-form");
	const disable2FAButton = document.getElementById("disable-two-factor");

	/**
	 * @type {HTMLInputElement}
	 */
	// @ts-ignore
	const twoFactorToken = document.getElementById("twofactor");

	const twoFactorInput = document.getElementById("two-factor-input");

	const updateSettings = async () => {
		const res = await fetch(BASE_URL + "/auth/settings");
		const data = await res.json();
		if (res.ok) {
			currentUsername.textContent = data.username;
			currentEmail.textContent = data.email;
			twoFactorStatus.textContent = data["2fa_enabled"];
			if (data["2fa_enabled"]) {
				twoFactorStatus.classList.remove("text-danger");
				twoFactorStatus.classList.add("text-success");
				enable2FAButton.classList.toggle("d-none", true);
				disable2FAButton.classList.toggle("d-none", false);
				twoFactorInput.classList.remove("d-none");
				twoFactorToken.required = true;
			} else {
				twoFactorStatus.classList.remove("text-success");
				twoFactorStatus.classList.add("text-danger");
				disable2FAButton.classList.toggle("d-none", true);
				enable2FAButton.classList.toggle("d-none", false);
				twoFactorInput.classList.add("d-none");
				twoFactorToken.required = false;
			}
		}
	};
	updateSettings();
	const newPassword = document.getElementById("new-password");
	const confirmPassword = document.getElementById("confirm-password");
	const otpModal = new bootstrap.Modal("#disable-otp-modal", {
		keyboard: false,
		backdrop: "static",
	});
	const otpCode = document.getElementById("disable-otp-code");
	const otpSubmit = document.getElementById("disable-otp-submit");
	otpSubmit.addEventListener("click", async () => {
		const res = await fetch(BASE_URL + "/auth/2fa/disable/", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				// @ts-ignore
				token: otpCode.value,
			}),
		});
		const json = await res.json();
		if (res.ok) {
			otpModal.hide();
			Toast("Disabled 2FA authentification successfully!", "success");
			updateSettings();
		} else {
			Toast("Failed to disable 2FA: " + json["error"], "danger");
		}
	});
	disable2FAButton.addEventListener("click", () => {
		otpModal.show();
	});
	settignsForm.addEventListener("submit", async (e) => {
		e.preventDefault();
		// @ts-ignore
		const data = Object.fromEntries(new FormData(settignsForm));
		// @ts-ignore
		if (newPassword.value !== confirmPassword.value) {
			Toast("New password and Confirm password don't match.", "warning");
		} else {
			const body = Object.fromEntries(
				Object.entries(data).filter(
					([_, value]) =>
						typeof value === "string" && value.length > 0
				)
			);
			const res = await fetch(BASE_URL + "/auth/settings", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(body),
			});
			const json = await res.json();
			if (res.ok) {
				Toast("Settings updated successfully!", "success");
				// @ts-ignore
				settignsForm.reset();
				updateSettings();
			} else {
				Toast("Failed to update settings: " + json["error"], "danger");
			}
		}
	});
	// @ts-ignore
	confirmButton.addEventListener("click", async (e) => {
		confirmButton.setAttribute("disabled", "");
		confirmButton.innerHTML = `<span class="visually-hidden" role="status">Loading...</span>`;
		const res = await fetch(BASE_URL + "/auth/2fa/confirm/", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				// @ts-ignore
				token: twoFactorCode.value,
			}),
		});
		// @ts-ignore
		const data = await res.json();
		confirmButton.removeAttribute("disabled");
		confirmButton.innerHTML = "Verify";
		if (res.ok) {
			Toast("Successfully added 2FA authentification!", "success");
			twoFactorModal.hide();
			updateSettings();
		} else {
			Toast("2FA: Invalid Token entered, try again.", "danger");
		}
	});
	// @ts-ignore
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
	});
};

export const failHandler = () => {};

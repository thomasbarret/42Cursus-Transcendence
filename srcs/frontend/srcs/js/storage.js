import { eventEmitter } from "./eventemitter.js";

export const activateDarkMode = (toggle) => {
	const html = document.querySelector("html");
	html.setAttribute("data-bs-theme", isDarkMode() ? "dark" : "light");
	if (toggle) toggle.textContent = isDarkMode() ? "🌙" : "☀️";
	eventEmitter.emit("theme", isDarkMode());
};
export const isDarkMode = () => {
	const mode = localStorage.getItem("theme");
	return mode === "dark";
};
export const toggleDarkMode = (toggle) => {
	localStorage.setItem("theme", isDarkMode() ? "light" : "dark");
	activateDarkMode(toggle);
};
export const setCurrentUser = (data) => {
	localStorage.setItem("user", JSON.stringify(data));
};
export const getCurrentUser = () => {
	return localStorage.getItem("user")
		? JSON.parse(localStorage.getItem("user"))
		: false;
};
export const removeCurrentUser = () => {
	localStorage.removeItem("user");
};

// export const setGameState = (data) => {
// 	sessionStorage.setItem("game", JSON.stringify(data));
// };

// export const getGameState = (uuid) => {
// 	return JSON.parse(sessionStorage.getItem("game"));
// };

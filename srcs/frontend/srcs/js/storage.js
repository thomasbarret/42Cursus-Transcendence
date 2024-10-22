export const themeEvent = new Event("theme");
export const activateDarkMode = (toggle) => {
	const html = document.querySelector("html");
	html.setAttribute("data-bs-theme", isDarkMode() ? "dark" : "light");
	if (toggle) toggle.textContent = isDarkMode() ? "🌙" : "☀️";
	document.dispatchEvent(themeEvent);
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

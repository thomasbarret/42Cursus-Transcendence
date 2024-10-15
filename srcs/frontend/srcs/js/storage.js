export const activateDarkMode = (toggle) => {
    const html = document.querySelector("html");
    html.setAttribute("data-bs-theme", isDarkMode() ? "dark" : "light");
    if (toggle)
        toggle.textContent = isDarkMode() ? "🌙" : "☀️";
};
export const isDarkMode = () => {
    const mode = localStorage.getItem("theme");
    return mode === "dark";
};
export const toggleDarkMode = (toggle) => {
    localStorage.setItem("theme", isDarkMode() ? "light" : "dark");
    activateDarkMode(toggle);
};

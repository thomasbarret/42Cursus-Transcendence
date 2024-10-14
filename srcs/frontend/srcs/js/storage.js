export const isDarkMode = () => {
    const mode = localStorage.getItem("theme");
    return mode === "dark" ? true : false;
};
export const toggleDarkMode = () => {
    const newMode = isDarkMode ? "light" : "dark";
    localStorage.setItem("theme", newMode);
};

import { h1, t } from "./framework.js";
import { activateDarkMode, toggleDarkMode } from "./storage.js";
export const mainHandler = () => {
    const toggle = document.getElementById("theme-toggle");
    toggle.addEventListener("click", () => {
        toggleDarkMode(toggle);
    });
    activateDarkMode(toggle);
};
export const indexHandler = (route) => {
    console.log("current route: ", route.description);
    let entry = document.getElementById("entry");
    let elements = t("div", t("h1", "this is the content of the h1").attr("id", "wow"), t("a", "this is the content of the ahref")
        .attr("href", "/asdf")
        .attr("id", "navigation"), [...Array(10)].map((_, i) => h1("this is text number: ", i.toString()).onclick$(() => console.log(i))));
    if (entry)
        entry.appendChild(elements);
};
export const contactHandler = (route) => {
    console.log("current route: ", route.description);
};
export const aboutHandler = (route) => {
    console.log("current route: ", route.description);
};

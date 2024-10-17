import { messageBoxLeft, messageBoxRight } from "./components.js";
import { h1, t } from "./framework.js";
import { activateDarkMode, toggleDarkMode } from "./storage.js";
export const BASE_URL = "/api";
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
        .attr("data-router-navigation", "true"), [...Array(10)].map((_, i) => h1("this is text number: ", i.toString()).onclick$(() => console.log(i))));
    if (entry)
        entry.appendChild(elements);
};
export const contactHandler = (route) => {
    console.log("current route: ", route.description);
};
export const aboutHandler = (route) => {
    console.log("current route: ", route.description);
};
export const messageHandler = (route) => {
    console.log("message handler: ", route.description);
    const chatBody = document.getElementById("chat-body");
    chatBody.appendChild(messageBoxLeft("so good omg1", "00:44"));
    chatBody.appendChild(messageBoxRight("asldkfjsadlkfjsdalkjf", "00:43"));
    chatBody.appendChild(messageBoxLeft("so good omg2", "00:44"));
    chatBody.appendChild(messageBoxRight("another of my message", "00:44"));
    chatBody.appendChild(messageBoxRight("ttttest", "00:44"));
    chatBody.appendChild(messageBoxRight("", "00:44"));
    chatBody.appendChild(messageBoxLeft("wow this is an interactive chat", "00:44"));
    chatBody.appendChild(messageBoxLeft("so good omg", "00:44"));
    chatBody.appendChild(messageBoxRight("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer pulvinar justo non nibh aliquam, et sollicitudin leo suscipit. Curabitur volutpat molestie magna sit amet laoreet. Nulla venenatis sem sit amet ultrices semper. Curabitur ultricies interdum ex, vel accumsan ex tincidunt ut. Duis varius ultricies vestibulum. In faucibus fringilla ipsum, gravida commodo ligula efficitur id. Donec tincidunt congue velit, nec iaculis diam ultrices non.", "00:46"));
    chatBody.appendChild(messageBoxLeft("so good omg4", "00:44"));
};

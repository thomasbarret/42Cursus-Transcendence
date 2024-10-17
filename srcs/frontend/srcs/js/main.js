import { mainHandler } from "./handler.js";
import { routes } from "./route.js";
document.addEventListener("click", (e) => {
    const { target } = e;
    if (!(target instanceof HTMLElement) ||
        target.getAttribute("data-router-navigation") !== "true") {
        return;
    }
    e.preventDefault();
    urlRoute(e);
});
export const urlRoute = (event) => {
    let newLocation = undefined;
    if (typeof event === "string") {
        newLocation = event;
    }
    else if (event.target instanceof HTMLAnchorElement) {
        event.preventDefault();
        newLocation = event.target.href;
    }
    if (newLocation) {
        console.log(newLocation);
        window.history.pushState({}, "", newLocation);
        locationHandler();
    }
};
// create a function that handles the url location
const locationHandler = async () => {
    let currentLocation = window.location.pathname;
    if (currentLocation.length == 0) {
        currentLocation = "/";
    }
    const route = routes[currentLocation] || routes["404"];
    const html = await fetch(route.page).then((response) => response.text());
    const content = document.getElementById("content");
    if (content)
        content.innerHTML = html;
    if (route.handler)
        route.handler(route);
    document.title = route.title;
};
window.onpopstate = locationHandler;
locationHandler();
document.addEventListener("DOMContentLoaded", () => {
    mainHandler();
});

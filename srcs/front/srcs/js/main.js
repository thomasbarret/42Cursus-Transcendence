import { routes } from "./route.js";
document.addEventListener("click", (e) => {
    const { target } = e;
    if (!(target instanceof HTMLElement) || target.id !== "navigation") {
        return;
    }
    e.preventDefault();
    urlRoute(e);
});
const urlRoute = (event) => {
    if (event.target instanceof HTMLAnchorElement) {
        window.history.pushState({}, "", event.target.href);
        event.preventDefault();
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

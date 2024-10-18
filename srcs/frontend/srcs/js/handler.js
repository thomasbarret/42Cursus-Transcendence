import { Toast, } from "./components.js";
import { a, h1, t } from "./framework.js";
import { checkLoggedIn, navigate } from "./main.js";
import { activateDarkMode, toggleDarkMode } from "./storage.js";
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
        }
        else {
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
export const profileHandler = (route, slug) => {
    console.log("current route: ", route.description);
    console.log("current path slug: ", slug);
    const usernameField = document.getElementById("username-field");
    const uuidField = document.getElementById("uuid-field");
    const winField = document.getElementById("win-field");
    const loseField = document.getElementById("lose-field");
    const playedField = document.getElementById("played-field");
    const addFriendField = document.getElementById("add-friend");
    const avatarField = document.getElementById("avatar-field");
    if (!slug) {
        try {
            const getProfile = async () => {
                const req = await fetch(BASE_URL + "/user/@me/", {
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
                }
                else {
                    navigate("/login");
                }
            };
            getProfile();
        }
        catch (error) {
            Toast("Network error", "danger");
        }
        addFriendField.remove();
    }
    else {
        usernameField.textContent = slug;
    }
    // const entry = document.getElementById("entry");
    // if (!slug) entry.appendChild(div("this is my own profile page"));
    // else entry.appendChild(div("seeing profile for user: " + slug));
};

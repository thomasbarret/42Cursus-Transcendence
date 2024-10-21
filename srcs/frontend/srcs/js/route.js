import { loginHandler, signUpHandler } from "./auth.js";
import { friendsHandler } from "./friends.js";
import { gameHandler } from "./game.js";
import { aboutHandler, indexHandler, profileHandler, settingsHandler, } from "./handler.js";
import { messageHandler } from "./messages.js";
const urlPageTitle = "nascent";
export const routes = {
    404: {
        page: "/pages/not_found.html",
        title: "404 | " + urlPageTitle,
        description: "Page not found",
    },
    "/": {
        page: "/pages/index.html",
        title: "Home | " + urlPageTitle,
        description: "This is the home page",
        handler: indexHandler,
    },
    "/play": {
        page: "/pages/game.html",
        title: "Pong Game | " + urlPageTitle,
        description: "Pong Game",
        handler: gameHandler,
    },
    "/about": {
        page: "/pages/about.html",
        title: "About Us | " + urlPageTitle,
        description: "This is the about page",
        handler: aboutHandler,
    },
    "/login": {
        page: "/pages/login.html",
        title: "Login | " + urlPageTitle,
        description: "This is the login page!",
        handler: loginHandler,
    },
    "/signup": {
        page: "/pages/signup.html",
        title: "Signup | " + urlPageTitle,
        description: "Signup Page",
        handler: signUpHandler,
    },
    "/settings": {
        page: "/pages/settings.html",
        title: "Settings | " + urlPageTitle,
        description: "Settings Page",
        handler: settingsHandler,
        auth: true,
    },
    "/friends": {
        page: "/pages/friends.html",
        title: "Friends | " + urlPageTitle,
        description: "Friends Page",
        handler: friendsHandler,
        auth: true,
    },
    "/messages": {
        page: "/pages/messages.html",
        title: "Messages | " + urlPageTitle,
        description: "This is the login page!",
        handler: messageHandler,
        auth: true,
    },
    "/profile": {
        page: "/pages/profile.html",
        title: "Profile | " + urlPageTitle,
        description: "This is the profile page",
        handler: profileHandler,
        slug: true,
        auth: true,
    },
};

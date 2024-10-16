import { BASE_URL } from "./handler.js";
import { urlRoute } from "./main.js";
export const loginHandler = (route) => {
    console.log("login handler wow: ", route.description);
    const loginForm = document.getElementById("login-form");
    const emailElement = document.getElementById("email-input");
    const passwordElement = document.getElementById("password-input");
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(loginForm));
        const body = {
            email: data.email,
            password: data.password,
        };
        const url = BASE_URL + "/auth/login/";
        try {
            const req = await fetch(url, {
                method: "POST",
                body: JSON.stringify(body),
                headers: {
                    "Content-Type": "application/json",
                },
            });
            console.log(req.status);
            if (req.ok) {
                setTimeout(() => {
                    urlRoute(window.location.origin);
                }, 500);
            }
            else {
                emailElement.classList.add("is-invalid");
                passwordElement.classList.add("is-invalid");
            }
        }
        catch (error) {
            alert("some error happened " + error);
            console.log(error);
        }
    });
};
export const signUpHandler = (route) => {
    console.log("signup handler wow: ", route.description);
};

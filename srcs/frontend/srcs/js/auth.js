import { Toast } from "./components.js";
import { BASE_URL } from "./handler.js";
import { navigate } from "./main.js";
// @ts-ignore
import * as bootstrap from "bootstrap";
const auth = (url, body) => {
    return fetch(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json",
        },
    });
};
export const loginHandler = (route) => {
    const loginForm = document.getElementById("login-form");
    const emailElement = document.getElementById("email-input");
    const passwordElement = document.getElementById("password-input");
    const submitButton = document.getElementById("submit-button");
    const url = BASE_URL + "/auth/login/";
    const otpModal = new bootstrap.Modal("#otpModal", {
        keyboard: false,
        backdrop: "static",
    });
    const otpCode = document.getElementById("otp-code");
    const otpSubmit = document.getElementById("otp-submit");
    loginForm.addEventListener("submit", async (event) => {
        emailElement.classList.remove("is-invalid");
        passwordElement.classList.remove("is-invalid");
        const cpyButton = submitButton.innerHTML;
        submitButton.setAttribute("disabled", "");
        submitButton.innerHTML = `
			<span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
			<span role="status">Loading...</span>
		`;
        event.preventDefault();
        const data = Object.fromEntries(new FormData(loginForm));
        const body = {
            email: data.email,
            password: data.password,
            token: "",
        };
        try {
            const req = await auth(url, body);
            const data = await req.json();
            submitButton.removeAttribute("disabled");
            submitButton.innerHTML = cpyButton;
            if (req.ok) {
                Toast("Successfully logged in!", "success");
                navigate("/profile", 500);
            }
            else {
                if (data["require_2fa"] === true) {
                    otpModal.show();
                    otpSubmit.onclick = async () => {
                        body.token = otpCode.value;
                        const req = await auth(url, body);
                        if (req.ok) {
                            otpModal.hide();
                            Toast("Successfully validated 2FA token.", "success");
                            navigate("/profile", 500);
                        }
                        else
                            Toast("2FA Error: Bad Token, please try again.", "danger");
                    };
                }
                else {
                    emailElement.classList.add("is-invalid");
                    passwordElement.classList.add("is-invalid");
                }
            }
        }
        catch (error) {
            Toast("Network error occurred.", "danger");
            console.log("NETWORK ERROR: ", error);
        }
    });
};
export const signUpHandler = (route) => {
    const signUpForm = document.getElementById("signup-form");
    const usernameElement = document.getElementById("username-input");
    const emailElement = document.getElementById("email-input");
    const passwordElement = document.getElementById("password-input");
    const confirmPasswordElement = document.getElementById("confirm-password-input");
    const reset = () => {
        usernameElement.classList.remove("is-invalid");
        emailElement.classList.remove("is-invalid");
        passwordElement.classList.remove("is-invalid");
        confirmPasswordElement.classList.remove("is-invalid");
    };
    signUpForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        reset();
        if (confirmPasswordElement.value !== passwordElement.value) {
            confirmPasswordElement.classList.add("is-invalid");
            passwordElement.classList.add("is-invalid");
            return;
        }
        else {
            confirmPasswordElement.classList.remove("is-invalid");
            passwordElement.classList.remove("is-invalid");
        }
        const data = Object.fromEntries(new FormData(signUpForm));
        const body = {
            username: data.username,
            email: data.email,
            password: data.password,
        };
        const url = BASE_URL + "/auth/register/";
        try {
            const res = await auth(url, body);
            const json = await res.json();
            if (res.ok) {
                Toast("Successfully created account, you can Login now!", "success");
                navigate("/login", 500);
            }
            else {
                if (json["error"] === "Username already exists")
                    usernameElement.classList.add("is-invalid");
                else if (json["error"] === "Email already exists")
                    emailElement.classList.add("is-invalid");
                Toast("Failed to create account", "danger", 1000);
            }
        }
        catch (error) {
            Toast("Network error occurred.", "danger");
            console.log("NETWORK ERROR: ", error);
        }
    });
};

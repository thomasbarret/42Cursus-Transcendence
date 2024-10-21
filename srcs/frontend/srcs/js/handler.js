import { profileCard, Toast } from "./components.js";
import { a, button, div, h1, t } from "./framework.js";
import { checkLoggedIn, navigate } from "./main.js";
import { activateDarkMode, getCurrentUser, toggleDarkMode } from "./storage.js";
// @ts-ignore
import * as bootstrap from "bootstrap";
export const BASE_URL = "/api";
export const navHandler = () => {
    const navAuth = document.getElementById("nav-auth");
    navAuth.innerHTML = "";
    checkLoggedIn().then((loggedIn) => {
        if (loggedIn) {
            const logoutButon = div(getCurrentUser().username, button("Logout")
                .cl("btn btn-primary mx-2")
                .onclick$(async (event) => {
                await fetch(BASE_URL + "/auth/logout/", {
                    method: "POST",
                });
                navigate("/");
                // navHandler();
            })).cl("fw-bold");
            navAuth.appendChild(logoutButon);
        }
        else {
            const loginButton = a("/login", "Login")
                .attr("data-router-navigation", "true")
                .cl("btn btn-primary col me-1");
            const signUpButton = a("/signup", "Sign Up")
                .attr("data-router-navigation", "true")
                .cl("btn col");
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
    let entry = document.getElementById("entry");
    let elements = t("div", t("h1", "this is the content of the h1").attr("id", "wow"), t("a", "this is the content of the ahref")
        .attr("href", "/asdf")
        .attr("data-router-navigation", "true"), [...Array(10)].map((_, i) => h1("this is text number: ", i.toString()).onclick$(() => console.log(i))));
    if (entry)
        entry.appendChild(elements);
};
export const aboutHandler = (route) => {
    console.log("current route: ", route.description);
};
export const profileHandler = (route, slug) => {
    console.log("current path slug: ", slug);
    const profile = document.getElementById("profile");
    try {
        const getUserProfile = async () => {
            profile.textContent = "";
            const url = "/user/" + (slug ? slug : "@me");
            const req = await fetch(BASE_URL + url, {
                method: "GET",
            });
            if (req.ok) {
                const data = await req.json();
                console.log(data);
                const postRelation = async (type) => {
                    const res = await fetch(BASE_URL + "/user/relation/@me", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            username: data.username,
                            type,
                        }),
                    });
                    const json = await res.json();
                    if (res.ok) {
                        Toast('Added relation with "' + data.username + '"', "success");
                        getUserProfile();
                    }
                    else {
                        Toast("Error occured: " + json["error"], "danger");
                    }
                };
                profile.appendChild(profileCard({ ...data, me: !slug }, postRelation));
            }
            else {
                profile.appendChild(profileCard(false));
                Toast("User not found!", "danger");
            }
        };
        getUserProfile();
    }
    catch (error) {
        Toast("Network error", "danger");
    }
};
export const settingsHandler = async (route) => {
    console.log("settings route");
    const enable2FAButton = document.getElementById("enable-two-factor");
    const QRCodeElement = document.getElementById("qrcode");
    const twoFactorCode = document.getElementById("two-factor-code");
    const confirmButton = document.getElementById("two-factor-confirm");
    const twoFactorModal = new bootstrap.Modal("#twoFactorAuthModal", {
        keyboard: false,
        backdrop: "static",
    });
    const currentUsername = document.getElementById("current-username");
    const currentEmail = document.getElementById("current-email");
    const twoFactorStatus = document.getElementById("two-factor-status");
    const settignsForm = document.getElementById("settings-form");
    const disable2FAButton = document.getElementById("disable-two-factor");
    const updateSettings = async () => {
        const res = await fetch(BASE_URL + "/auth/settings");
        const data = await res.json();
        if (res.ok) {
            currentUsername.textContent = data.username;
            currentEmail.textContent = data.email;
            twoFactorStatus.textContent = data["2fa_enabled"];
            if (data["2fa_enabled"]) {
                twoFactorStatus.classList.toggle("text-success");
                enable2FAButton.classList.toggle("d-none", true);
                disable2FAButton.classList.toggle("d-none", false);
            }
            else {
                twoFactorStatus.classList.toggle("text-danger");
                disable2FAButton.classList.toggle("d-none", true);
                enable2FAButton.classList.toggle("d-none", false);
            }
        }
    };
    updateSettings();
    const newPassword = document.getElementById("new-password");
    const confirmPassword = document.getElementById("confirm-password");
    const otpModal = new bootstrap.Modal("#disable-otp-modal", {
        keyboard: false,
        backdrop: "static",
    });
    const otpCode = document.getElementById("disable-otp-code");
    const otpSubmit = document.getElementById("disable-otp-submit");
    otpSubmit.addEventListener("click", async () => {
        const res = await fetch(BASE_URL + "/auth/2fa/disable/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                token: otpCode.value,
            }),
        });
        const json = await res.json();
        if (res.ok) {
            otpModal.hide();
            Toast("Disabled 2FA authentification successfully!", "success");
            updateSettings();
        }
        else {
            Toast("Failed to disable 2FA: " + json["error"], "danger");
        }
    });
    disable2FAButton.addEventListener("click", () => {
        otpModal.show();
    });
    settignsForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(settignsForm));
        if (newPassword.value !== confirmPassword.value) {
            Toast("New password and Confirm password don't match.", "warning");
        }
        else {
            const body = Object.fromEntries(Object.entries(data).filter(([_, value]) => typeof value === "string" && value.length > 0));
            const res = await fetch(BASE_URL + "/auth/settings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });
            const json = await res.json();
            if (res.ok) {
                Toast("Settings updated successfully!", "success");
                settignsForm.reset();
                updateSettings();
            }
            else {
                Toast("Failed to update settings: " + json["error"], "danger");
            }
        }
    });
    confirmButton.addEventListener("click", async (e) => {
        confirmButton.setAttribute("disabled", "");
        confirmButton.innerHTML = `<span class="visually-hidden" role="status">Loading...</span>`;
        const res = await fetch(BASE_URL + "/auth/2fa/confirm/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                token: twoFactorCode.value,
            }),
        });
        const data = await res.json();
        confirmButton.removeAttribute("disabled");
        confirmButton.innerHTML = "Verify";
        if (res.ok) {
            Toast("Successfully added 2FA authentification!", "success");
            twoFactorModal.hide();
            updateSettings();
        }
        else {
            Toast("2FA: Invalid Token entered, try again.", "danger");
        }
    });
    enable2FAButton.addEventListener("click", async (e) => {
        QRCodeElement.textContent = "";
        const res = await fetch(BASE_URL + "/auth/2fa/enable/", {
            method: "POST",
        });
        const data = await res.json();
        if (res.ok) {
            // @ts-ignore
            new QRCode(QRCodeElement, data.secret);
            twoFactorModal.show();
        }
        else {
            Toast("Error occured when enabling 2FA, please try again later.", "danger");
        }
    });
};

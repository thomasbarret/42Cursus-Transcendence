import { Toast, ToastComponent } from "./components.js";
import { BASE_URL } from "./handler.js";
import { urlRoute } from "./main.js";
import { Routes } from "./types.js";

const auth = (url: string, body: Object) => {
	return fetch(url, {
		method: "POST",
		body: JSON.stringify(body),
		headers: {
			"Content-Type": "application/json",
		},
	});
};

export const loginHandler = (route: Routes) => {
	console.log("login handler wow: ", route.description);
	const loginForm = document.getElementById("login-form") as HTMLFormElement;
	const emailElement = document.getElementById(
		"email-input"
	) as HTMLInputElement;
	const passwordElement = document.getElementById(
		"password-input"
	) as HTMLInputElement;

	const submitButton = document.getElementById("submit-button");

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
		};

		const url = BASE_URL + "/auth/login/";
		try {
			const req = await auth(url, body);
			console.log(req.status);

			submitButton.removeAttribute("disabled");
			submitButton.innerHTML = cpyButton;

			if (req.ok) {
				Toast("Successfully logged in!", "success");
				setTimeout(() => {
					urlRoute(window.location.origin);
				}, 500);
			} else {
				emailElement.classList.add("is-invalid");
				passwordElement.classList.add("is-invalid");
			}
		} catch (error) {
			alert("Network Error " + error.message);
			console.log("NETWORK ERROR: ", error);
		}
	});
};

export const signUpHandler = (route: Routes) => {
	const showToast = document.getElementById("show-toast");

	showToast.addEventListener("click", () => {
		Toast("this is a test sadlkfjsdalfj", "primary");
	});

	console.log("signup handler wow: ", route.description);
	const signUpForm = document.getElementById(
		"signup-form"
	) as HTMLFormElement;

	const usernameElement = document.getElementById(
		"username-input"
	) as HTMLInputElement;
	const emailElement = document.getElementById(
		"email-input"
	) as HTMLInputElement;
	const passwordElement = document.getElementById(
		"password-input"
	) as HTMLInputElement;
	const confirmPasswordElement = document.getElementById(
		"confirm-password-input"
	) as HTMLInputElement;

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
		} else {
			confirmPasswordElement.classList.remove("is-invalid");
			passwordElement.classList.remove("is-invalid");
		}

		const data = Object.fromEntries(new FormData(signUpForm));

		const body = {
			username: data.username,
			email: data.email,
			password: data.password,
		};

		console.log(body);

		const url = BASE_URL + "/auth/register/";
		try {
			const res = await auth(url, body);

			const json = await res.json();
			console.log(json);
			if (res.ok) {
				console.log(res.status);
			} else {
				if (json.error === "Username already exists") {
					console.log("username");
					usernameElement.classList.add("is-invalid");
				} else if (json.error === "Email already exists") {
					console.log("email");
					emailElement.classList.add("is-invalid");
				}
			}
		} catch (error) {
			alert("Network Error" + error.message);
			console.log("NETWORK ERROR: ", error);
		}
	});
};

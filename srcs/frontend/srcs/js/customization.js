export const defaultCustomization = {
	ball: "#000000",
	paddle: "#ff33ec",
	background: "#ffffff",
};

export const getCustomization = () => {
	const colors = JSON.parse(localStorage.getItem("customization"));
	return colors || defaultCustomization;
};

export const setCustomization = (colors) => {
	localStorage.setItem("customization", JSON.stringify(colors));
};

export const customizationHandler = () => {
	/**
	 * @type {HTMLInputElement}
	 */
	// @ts-ignore
	const paddleColor = document.getElementById("paddle-color");
	/**
	 * @type {HTMLInputElement}
	 */
	// @ts-ignore
	const ballColor = document.getElementById("ball-color");
	/**
	 * @type {HTMLInputElement}
	 */
	// @ts-ignore
	const backgroundColor = document.getElementById("background-color");

	const colors = getCustomization() || defaultCustomization;

	console.log(colors);

	const paddleColorDisplay = document.getElementById("paddle-color-display");
	const ballColorDisplay = document.getElementById("ball-color-display");
	const backgroundColorDisplay = document.getElementById(
		"background-color-display"
	);

	const updateValues = () => {
		setCustomization(colors);
		paddleColor.value = colors.paddle;
		ballColor.value = colors.ball;
		backgroundColor.value = colors.background;

		paddleColorDisplay.style.backgroundColor = colors.paddle;
		ballColorDisplay.style.backgroundColor = colors.ball;
		backgroundColorDisplay.style.backgroundColor = colors.background;
	};

	updateValues();
	paddleColor.addEventListener("change", () => {
		colors.paddle = paddleColor.value;
		updateValues();
	});

	ballColor.addEventListener("change", () => {
		colors.ball = ballColor.value;
		updateValues();
	});

	backgroundColor.addEventListener("change", () => {
		colors.background = backgroundColor.value;
		updateValues();
	});
};

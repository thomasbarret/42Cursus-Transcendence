import { themeCard, Toast } from "./components.js";

export const customizations = {
	default: {
		ball: "#ffffff",
		paddle: "#ffffff",
		current_paddle: "#d05bff",
		background: "#000000",
	},
	sunset: {
		ball: "#ff4500",
		paddle: "#ffa500",
		current_paddle: "#ff6347",
		background: "#2e0854",
	},
	neon: {
		ball: "#00ffff",
		paddle: "#ff00ff",
		current_paddle: "#00ff00",
		background: "#1a1a1a",
	},
	ocean: {
		ball: "#1e90ff",
		paddle: "#20b2aa",
		current_paddle: "#00ced1",
		background: "#001f3f",
	},
	retro: {
		ball: "#ffdd57",
		paddle: "#f012be",
		current_paddle: "#b10dc9",
		background: "#3d9970",
	},
	forest: {
		ball: "#7cfc00",
		paddle: "#228b22",
		current_paddle: "#32cd32",
		background: "#0b3d0b",
	},
	volcano: {
		ball: "#ff4500",
		paddle: "#ff6347",
		current_paddle: "#ff8c00",
		background: "#4b0000",
	},
	starlight: {
		ball: "#f8f8ff",
		paddle: "#dcdcdc",
		current_paddle: "#ffebcd",
		background: "#000033",
	},
};

export const getCustomization = () => {
	const colors = JSON.parse(localStorage.getItem("customization"));
	return colors || customizations.default;
};

const setCustomization = (colors) => {
	localStorage.setItem("customization", JSON.stringify(colors));
};

const getCurrentCustomization = () => {
	const customization = localStorage.getItem("current_customization");
	return customization || "default";
};

const setCurrentCustomization = (name) => {
	localStorage.setItem("current_customization", name);
};

export const customizationHandler = () => {
	const themeList = document.getElementById("theme-list");

	const drawThemes = () => {
		const currentCustomization = getCurrentCustomization();
		themeList.textContent = "";
		const themeFragment = document.createDocumentFragment();
		Object.entries(customizations).forEach(([name, value]) => {
			themeFragment.appendChild(
				themeCard(name, value, currentCustomization, callback)
			);
		});
		themeList.appendChild(themeFragment);
	};

	const callback = (name, customization) => {
		setCustomization(customization);
		setCurrentCustomization(name);
		Toast("Updated current theme!", "success");
		drawThemes();
	};

	drawThemes();
};

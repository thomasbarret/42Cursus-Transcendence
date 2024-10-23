import { Toast } from "./components.js";
import { BASE_URL } from "./handler.js";
import { navigate } from "./main.js";

export const lobbyMiddleware = async (route, slug) => {
	const res = await fetch(BASE_URL + "/game/match/" + slug);

	if (!res.ok) {
		Toast("Couldn't find match!", "danger");
		navigate("/play");
		return false;
	}
	return true;
};

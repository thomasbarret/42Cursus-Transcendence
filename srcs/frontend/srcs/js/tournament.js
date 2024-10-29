import { inviteBoxCard, Toast } from "./components.js";
import { BASE_URL } from "./handler.js";

export const tournamentHandler = (_, slug) => {
	console.log("tournament slug: ", slug);

	const inviteBox = document.getElementById("invite-box");

	const getTournamentData = async () => {
		const res = await fetch(BASE_URL + "/game/tournament/" + slug);

		const data = await res.json();

		console.log(data);
		if (res.ok) {
			getChatBox(data.channel);

			data.players.forEach((player) => {
				console.log(player);
			});
		} else Toast("Couldn't get tournament data", "danger");
	};

	const getFriendsList = async () => {
		inviteBox.textContent = "";
		const res = await fetch(BASE_URL + "/user/relation/@me");
		const data = await res.json();

		if (res.ok) {
			console.log("friends: ", data);
			const fragment = document.createDocumentFragment();
			data["friends"].forEach((friend) => {
				fragment.appendChild(
					inviteBoxCard(friend.user, slug, getFriendsList, true)
				);
			});
			inviteBox.appendChild(fragment);
		} else {
			Toast("Error occured: " + data["error"], "danger");
		}
	};

	const getChatBox = async (channel) => {
		const res = await fetch(BASE_URL + "/chat/" + channel.uuid);

		const data = await res.json();

		if (res.ok) {
		} else Toast("Tournament chat error " + data["error"], "danger");
		console.log(data);
	};

	getTournamentData();
	getFriendsList();
};

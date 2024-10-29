import { inviteBoxCard, matchPlayersCard, Toast } from "./components.js";
import { BASE_URL } from "./handler.js";

export const tournamentHandler = (_, slug) => {
	console.log("tournament slug: ", slug);

	const inviteBox = document.getElementById("invite-box");
	const currentPlayers = document.getElementById("current-players");
	const chatForm = document.getElementById("chat-form");
	const chatInput = document.getElementById("chat-input");

	const getTournamentData = async () => {
		const res = await fetch(BASE_URL + "/game/tournament/" + slug);

		const data = await res.json();

		console.log(data);
		if (res.ok) {
			getChatBox(data.channel);

			data.players.forEach((matchPlayer) => {
				currentPlayers.appendChild(
					matchPlayersCard(matchPlayer.user, matchPlayer.user.uuid)
				);
			});

			chatForm.onsubmit = async (event) => {
				event.preventDefault();

				// @ts-ignore
				if (chatInput.value.length >= 1000) {
					Toast("Message is too long", "warning");
					return;
				}

				const res = await fetch(
					BASE_URL + "/chat/" + data.channel.uuid,
					{
						method: "POST",
						body: JSON.stringify({
							// @ts-ignore
							content: chatInput.value,
						}),
						headers: {
							"Content-Type": "application/json",
						},
					}
				);

				const json = await res.json();
				console.log(json);

				if (res.ok) {
					// @ts-ignore
					chatInput.value = 0;
				} else
					Toast("Couldn't send message " + json["error"], "danger");
			};
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

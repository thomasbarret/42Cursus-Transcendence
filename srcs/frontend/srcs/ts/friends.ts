import { relationCard, Toast } from "./components.js";
import { BASE_URL } from "./handler.js";
import { Routes } from "./types.js";

export const friendsHandler = (route: Routes) => {
	console.log("friends route");

	const blockedBody = document.getElementById("blocked-body");
	const receivedBody = document.getElementById("receive-body");
	const sendBody = document.getElementById("send-body");
	const friendsBody = document.getElementById("friends-body");

	const updateFriendsList = async () => {
		blockedBody.textContent = "";
		receivedBody.textContent = "";
		sendBody.textContent = "";
		friendsBody.textContent = "";
		const res = await fetch(BASE_URL + "/user/relation/@me");

		const data = await res.json();

		Object.entries(data).forEach(([type, relations]: [string, any]) => {
			let body = friendsBody;
			switch (type) {
				case "blocked":
					body = blockedBody;
					break;
				case "receive":
					body = receivedBody;
					break;
				case "send":
					body = sendBody;
					break;
				case "friends":
					body = friendsBody;
					break;
			}

			relations.forEach((relation) => {
				const card = relationCard(relation.user, type, async () => {
					console.log("triggered value: ", relation.user.username);

					const res = await fetch(BASE_URL + "/user/relation/@me", {
						method: "DELETE",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							uuid: relation.uuid,
						}),
					});

					const data = await res.json();
					if (res.ok) {
						Toast("Successfully deleted relation!", "primary");
					} else {
						Toast("Error occured: " + data["error"], "danger");
					}

					updateFriendsList();
				});

				body.appendChild(card);
			});
		});
	};
	updateFriendsList();
};

import { relationCard, Toast } from "./components.js";
import { BASE_URL } from "./handler.js";
export const friendsHandler = (route) => {
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
		const deleteRelation = async (relation) => {
			return await fetch(BASE_URL + "/user/relation/@me", {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					uuid: relation.uuid,
				}),
			});
		};
		const acceptRelation = async (relation) => {
			return await fetch(BASE_URL + "/user/relation/@me", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					uuid: relation.uuid,
					status: 2,
				}),
			});
		};
		Object.entries(data).forEach(([type, relations]) => {
			let body = friendsBody;
			let callback = deleteRelation;
			switch (type) {
				case "blocked":
					body = blockedBody;
					callback = deleteRelation;
					break;
				case "receive":
					body = receivedBody;
					callback = acceptRelation;
					break;
				case "send":
					body = sendBody;
					callback = deleteRelation;
					break;
				case "friends":
					body = friendsBody;
					callback = deleteRelation;
					break;
			}
			relations.forEach((relation) => {
				const card = relationCard(relation.user, type, async () => {
					const res = await callback(relation);
					const data = await res.json();
					if (res.ok) {
						Toast("Success: " + data["message"], "primary");
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

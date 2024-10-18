import { messageBox, Toast, userListBox } from "./components.js";
import { BASE_URL } from "./handler.js";
import { getCurrentUser } from "./storage.js";
import { Routes } from "./types.js";

export const messageHandler = (route: Routes) => {
	console.log("message handler: ", route.description);

	const chatBody = document.getElementById("chat-body");
	const chatTitle = document.getElementById("chat-title");
	const userList = document.getElementById("user-list");
	const currentUser = getCurrentUser();

	const messageInput = document.getElementById(
		"message-input"
	) as HTMLFormElement;
	const messageInputField = document.getElementById(
		"message-input-field"
	) as HTMLInputElement;

	let currentChat: string = "";

	const addMessageToChat = (message) => {
		chatBody.appendChild(
			messageBox(
				message.content,
				message.created_at,
				message.user.uuid === currentUser.uuid
			)
		);
	};

	const renderBody = async (channel, title) => {
		if (currentChat === channel.uuid) return;
		currentChat = channel.uuid;

		messageInput.addEventListener("submit", async (e) => {
			e.preventDefault();

			const content = Object.fromEntries(
				new FormData(messageInput)
			).input.toString();
			if (content.length === 0) return;

			const otherUser = channel.users.filter(
				(u) => u.uuid != currentUser.uuid
			)[0].uuid;

			const res = await fetch(BASE_URL + "/chat/@me/", {
				method: "POST",
				body: JSON.stringify({
					receiver_uuid: otherUser,
					content: content,
				}),
				headers: {
					"Content-Type": "application/json",
				},
			});

			const message = await res.json();
			if (res.ok) {
				messageInputField.value = "";
				addMessageToChat(message);
				chatBody.scrollTop = chatBody.scrollHeight;
			} else Toast("An error has occured: " + message, "danger");
		});

		console.log(channel);
		chatTitle.textContent = title;
		chatBody.innerHTML = "";

		const res = await fetch(BASE_URL + "/chat/" + channel.uuid);
		const data = await res.json();

		console.log("messages: ", data);

		data.messages.forEach((message) => addMessageToChat(message));
	};

	try {
		const getMessages = async () => {
			const res = await fetch(BASE_URL + "/chat/@me/");

			if (res.ok) {
				const data = await res.json();

				data.channels.forEach((channel) => {
					const getUser = (users) => {
						const arr = [];
						const not = users.filter(
							(u) => u.uuid != currentUser.uuid
						);

						not.forEach((el) => arr.push(el.display_name));
						return arr;
					};

					const notCurrent = getUser(channel.users);

					const title = notCurrent.join(", ");

					userList.appendChild(
						userListBox(title).onclick$(() =>
							renderBody(channel, title)
						)
					);
				});
				console.log("data.channels: ", data.channels);
				console.log("current user: ", currentUser);
			} else {
				console.log("error occured", res);
				Toast("Error occured during message fetch", "danger");
			}
		};

		getMessages();
	} catch (error) {
		Toast("Network error " + error, "danger");
	}
};

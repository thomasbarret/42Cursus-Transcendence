import {
	messageBox,
	Toast,
	userListBox,
	userProfileCard,
} from "./components.js";
import { eventEmitter } from "./eventemitter.js";
import { BASE_URL } from "./handler.js";
import { getCurrentUser } from "./storage.js";
import { formatChatDate } from "./utils.js";
// @ts-ignore
export const messageHandler = (route) => {
	const chatBody = document.getElementById("chat-body");
	const chatTitle = document.getElementById("chat-title");
	const userList = document.getElementById("user-list");
	const currentUser = getCurrentUser();
	const inputBar = document.getElementById("message-input-bar");
	const searchFriend = document.getElementById("search-friend");
	const addFriend = document.getElementById("add-friend");
	const messageInput = document.getElementById("message-input");
	const messageInputField = document.getElementById("message-input-field");
	const searchFriendInputField = document.getElementById(
		"search-friend-input-field"
	);
	let currentChat = "";
	let allChannels = [];
	try {
		addFriend.addEventListener("submit", async (e) => {
			e.preventDefault();
			chatBody.innerHTML = "";
			// @ts-ignore
			const searchName = Object.fromEntries(new FormData(addFriend)).name;
			const res = await fetch(
				BASE_URL + "/user/search?query=" + searchName
			);
			const users = (await res.json()).users;
			if (!users || users.length === 0)
				Toast("No user has been found.. :(", "warning");
			else {
				console.log(users);
				users.forEach((user) => {
					chatBody.appendChild(
						// @ts-ignore
						userProfileCard(user, async (event) => {
							const res = await fetch(BASE_URL + "/chat/@me", {
								method: "POST",
								body: JSON.stringify({
									receiver_uuid: user.uuid,
								}),
								headers: {
									"Content-Type": "application/json",
								},
							});
							if (res.ok) {
								const data = await res.json();
								getMessages();
								renderBody(data);
								// @ts-ignore
								searchFriendInputField.value = "";
							} else
								Toast(
									"Problem occured during channel creation.",
									"error"
								);
						})
					);
				});
			}
		});
		// @ts-ignore
		searchFriend.addEventListener("click", (event) => {
			chatBody.innerHTML = "";
			inputBar.classList.toggle("d-none", true);
			chatTitle.textContent = "";
			addFriend.classList.toggle("d-none", false);
		});
		const addMessageToChat = (message) => {
			chatBody.appendChild(
				messageBox(
					message.content,
					formatChatDate(message.created_at),
					message.user.uuid === currentUser.uuid,
					message.user.uuid,
					message.user.avatar
				)
			);
			chatBody.scrollTop = chatBody.scrollHeight;
		};

		eventEmitter.on("DIRECT_MESSAGE_CREATE", async (data) => {
			await getMessages();
			if (currentChat === data.channel_uuid) addMessageToChat(data);
		});

		const renderBody = async (channel) => {
			// if (currentChat === channel.uuid) return;
			currentChat = channel.uuid;
			inputBar.classList.toggle("d-none", false);
			addFriend.classList.toggle("d-none", true);
			messageInput.onsubmit = async (e) => {
				e.preventDefault();
				// @ts-ignore
				if (messageInputField.value.length > 1000) {
					Toast(
						"You are limited to a maximum of 1000 characters per message.",
						"danger"
					);
					return;
				}
				const content = Object.fromEntries(
					// @ts-ignore
					new FormData(messageInput)
				).input.toString();
				if (content.length === 0) return;
				const res = await fetch(BASE_URL + "/chat/" + channel.uuid, {
					method: "POST",
					body: JSON.stringify({
						content: content,
					}),
					headers: {
						"Content-Type": "application/json",
					},
				});
				const message = await res.json();
				if (res.ok) {
					// @ts-ignore
					messageInput.reset();
				} else {
					Toast(
						"An error has occured: " + message["error"],
						"danger"
					);
				}
			};
			chatBody.innerHTML = "";
			chatTitle.textContent =
				getChannelUser(channel.users).display_name +
				" (@" +
				getChannelUser(channel.users).username +
				")";
			const res = await fetch(BASE_URL + "/chat/" + channel.uuid);
			const data = await res.json();
			data.messages.forEach((message) => addMessageToChat(message));
		};
		const getChannelUser = (users) =>
			users.filter((u) => u.uuid != currentUser.uuid)[0];
		const addChannel = (channel) => {
			const user = getChannelUser(channel.users);
			allChannels.push(channel);
			userList.appendChild(
				userListBox(user, channel["last_message"]).onclick$(() =>
					renderBody(channel)
				)
			);
		};
		const getMessages = async () => {
			const res = await fetch(BASE_URL + "/chat/@me");
			if (res.ok) {
				const data = await res.json();
				userList.textContent = "";
				data.channels.reverse().forEach((channel) => {
					addChannel(channel);
				});
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

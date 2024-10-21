import { messageBox, Toast, userListBox, userProfileCard, } from "./components.js";
import { BASE_URL } from "./handler.js";
import { getCurrentUser } from "./storage.js";
import { formatChatDate } from "./utils.js";
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
    const searchFriendInputField = document.getElementById("search-friend-input-field");
    let currentChat = "";
    let allChannels = [];
    try {
        addFriend.addEventListener("submit", async (e) => {
            e.preventDefault();
            chatBody.innerHTML = "";
            const searchName = Object.fromEntries(new FormData(addFriend)).name;
            const res = await fetch(BASE_URL + "/user/search?query=" + searchName);
            const users = (await res.json()).users;
            if (!users || users.length === 0)
                Toast("No user has been found.. :(", "warning");
            else {
                console.log(users);
                users.forEach((user) => {
                    chatBody.appendChild(userProfileCard(user, async (event) => {
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
                            searchFriendInputField.value = "";
                        }
                        else
                            Toast("Problem occured during channel creation.", "error");
                    }));
                });
            }
        });
        searchFriend.addEventListener("click", (event) => {
            chatBody.innerHTML = "";
            inputBar.classList.toggle("d-none", true);
            chatTitle.textContent = "";
            addFriend.classList.toggle("d-none", false);
        });
        const addMessageToChat = (message) => {
            chatBody.appendChild(messageBox(message.content, formatChatDate(message.created_at), message.user.uuid === currentUser.uuid, message.user.uuid));
            chatBody.scrollTop = chatBody.scrollHeight;
        };
        document.addEventListener("messageEvent", async (event) => {
            const data = event.detail;
            getMessages();
            if (currentChat === data.channel_uuid)
                addMessageToChat(event.detail);
        });
        const renderBody = async (channel) => {
            // if (currentChat === channel.uuid) return;
            currentChat = channel.uuid;
            inputBar.classList.toggle("d-none", false);
            addFriend.classList.toggle("d-none", true);
            messageInput.onsubmit = async (e) => {
                e.preventDefault();
                if (messageInputField.value.length > 1000) {
                    Toast("You are limited to a maximum of 1000 characters per message.", "danger");
                    return;
                }
                const content = Object.fromEntries(new FormData(messageInput)).input.toString();
                if (content.length === 0)
                    return;
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
                    messageInput.reset();
                }
                else {
                    Toast("An error has occured: " + message["error"], "danger");
                }
            };
            chatBody.innerHTML = "";
            chatTitle.textContent = getChannelTitle(channel.users);
            const res = await fetch(BASE_URL + "/chat/" + channel.uuid);
            const data = await res.json();
            data.messages.forEach((message) => addMessageToChat(message));
        };
        const getChannelTitle = (users) => {
            const arr = [];
            const not = users.filter((u) => u.uuid != currentUser.uuid);
            not.forEach((el) => arr.push(el.display_name + " (@" + el.username + ")"));
            return arr.join(", ");
        };
        const addChannel = (channel) => {
            const title = getChannelTitle(channel.users);
            allChannels.push(channel);
            userList.appendChild(userListBox(title, channel["last_message"]).onclick$(() => renderBody(channel)));
        };
        const getMessages = async () => {
            const res = await fetch(BASE_URL + "/chat/@me");
            if (res.ok) {
                const data = await res.json();
                console.log("channel: ", data);
                // if (
                // 	allChannels.length === data.channels.length &&
                // 	allChannels.every(
                // 		(channel, index) =>
                // 			channel["uuid"] === data.channels[index]["uuid"]
                // 	)
                // ) {
                // 	console.log("entered this condition: ", data);
                // 	return;
                // }
                userList.textContent = "";
                data.channels.reverse().forEach((channel) => {
                    addChannel(channel);
                });
                // .sort(
                // 	(a: string, b: string) =>
                // 		new Date(b).getTime() - new Date(a).getTime()
                // )
            }
            else {
                console.log("error occured", res);
                Toast("Error occured during message fetch", "danger");
            }
        };
        getMessages();
    }
    catch (error) {
        Toast("Network error " + error, "danger");
    }
};

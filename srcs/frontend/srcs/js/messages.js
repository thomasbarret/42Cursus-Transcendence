import { messageBox, Toast, userListBox, userProfileCard, } from "./components.js";
import { BASE_URL } from "./handler.js";
import { getCurrentUser } from "./storage.js";
import { formatChatDate } from "./utils.js";
export const messageHandler = (route) => {
    console.log("message handler: ", route.description);
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
    addFriend.addEventListener("submit", async (e) => {
        e.preventDefault();
        chatBody.innerHTML = "";
        const searchName = Object.fromEntries(new FormData(addFriend)).name;
        const res = await fetch(BASE_URL + "/user/search?query=" + searchName);
        const users = (await res.json()).users;
        if (!users || users.length === 0)
            Toast("No user has been found.. :(", "warning");
        else {
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
                        addChannel(data);
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
        console.log("search friend");
        chatBody.innerHTML = "";
        inputBar.classList.toggle("d-none", true);
        chatTitle.textContent = "";
        addFriend.classList.toggle("d-none", false);
    });
    const addMessageToChat = (message) => {
        chatBody.appendChild(messageBox(message.content, formatChatDate(message.created_at), message.user.uuid === currentUser.uuid));
        chatBody.scrollTop = chatBody.scrollHeight;
    };
    document.addEventListener("messageEvent", (event) => {
        const data = event.detail;
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
                messageInputField.value = "";
            }
            else
                Toast("An error has occured: " + message, "danger");
            // if (res.ok) {
            // 	messageInputField.value = "";
            // 	addMessageToChat(message);
            // } else Toast("An error has occured: " + message, "danger");
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
        not.forEach((el) => arr.push(el.display_name));
        return arr.join(", ");
    };
    const addChannel = (channel) => {
        const title = getChannelTitle(channel.users);
        if (allChannels.find((el) => el.uuid === channel.uuid)) {
            // Toast("Channel already exists.", "warning");
            return;
        }
        allChannels.push(channel);
        userList.appendChild(userListBox(title).onclick$(() => renderBody(channel)));
    };
    try {
        const getMessages = async () => {
            const res = await fetch(BASE_URL + "/chat/@me");
            if (res.ok) {
                const data = await res.json();
                data.channels.forEach((channel) => {
                    addChannel(channel);
                });
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

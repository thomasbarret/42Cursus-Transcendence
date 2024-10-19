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
                    // if (res.ok)
                    // const data = await res.json();
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
    const messageInput = document.getElementById("message-input");
    const messageInputField = document.getElementById("message-input-field");
    let currentChat = "";
    const addMessageToChat = (message) => {
        chatBody.appendChild(messageBox(message.content, formatChatDate(message.created_at), message.user.uuid === currentUser.uuid));
        chatBody.scrollTop = chatBody.scrollHeight;
    };
    document.addEventListener("messageEvent", (event) => {
        const data = event.detail;
        if (currentChat === data.channel_uuid)
            addMessageToChat(event.detail);
    });
    // messageInput.removeEventListener("submit");
    const renderBody = async (channel, title) => {
        // if (currentChat === channel.uuid) return;
        currentChat = channel.uuid;
        inputBar.classList.toggle("d-none", false);
        addFriend.classList.toggle("d-none", true);
        messageInput.onsubmit = async (e) => {
            e.preventDefault();
            const content = Object.fromEntries(new FormData(messageInput)).input.toString();
            if (content.length === 0)
                return;
            const otherUser = channel.users.filter((u) => u.uuid != currentUser.uuid)[0].uuid;
            const res = await fetch(BASE_URL + "/chat/" + channel.uuid, {
                method: "POST",
                body: JSON.stringify({
                    // receiver_uuid: otherUser,
                    content: content,
                }),
                headers: {
                    "Content-Type": "application/json",
                },
            });
            const message = await res.json();
            if (res.ok) {
                messageInputField.value = "";
                // addMessageToChat(message);
            }
            else
                Toast("An error has occured: " + message, "danger");
            // if (res.ok) {
            // 	messageInputField.value = "";
            // 	addMessageToChat(message);
            // } else Toast("An error has occured: " + message, "danger");
        };
        chatBody.innerHTML = "";
        chatTitle.textContent = title;
        const res = await fetch(BASE_URL + "/chat/" + channel.uuid);
        const data = await res.json();
        data.messages.forEach((message) => addMessageToChat(message));
    };
    try {
        const getMessages = async () => {
            const res = await fetch(BASE_URL + "/chat/@me");
            if (res.ok) {
                const data = await res.json();
                data.channels.forEach((channel) => {
                    const getUser = (users) => {
                        const arr = [];
                        const not = users.filter((u) => u.uuid != currentUser.uuid);
                        not.forEach((el) => arr.push(el.display_name));
                        return arr;
                    };
                    const notCurrent = getUser(channel.users);
                    const title = notCurrent.join(", ");
                    userList.appendChild(userListBox(title).onclick$(() => renderBody(channel, title)));
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

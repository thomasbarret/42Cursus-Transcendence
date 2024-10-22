import { Toast } from "./components.js";
import { getCurrentUser } from "./storage.js";
export let socket;
export let socketReconnectTry = 0;
export const closeWebSocket = () => {
	if (
		(socket && socket.readyState === WebSocket.OPEN) ||
		socket.readyState === WebSocket.CONNECTING
	)
		socket.close();
};
export const connectWebSocket = () => {
	if (
		socket &&
		(socket.readyState === WebSocket.OPEN ||
			socket.readyState === WebSocket.CONNECTING)
	) {
		console.log("WebSocket is already open or connecting.");
		return;
	}
	socket = new WebSocket(
		`${window.location.protocol === "https:" ? "wss" : "ws"}://${
			window.location.host
		}/ws/gateway/`
	);
	socket.onopen = () => {
		socketReconnectTry = 0;
		console.log("WebSocket connection established.");
	};
	socket.onclose = () => {
		console.warn("WebSocket connection closed.");
		// keep trying to reconnect for now
		// socketReconnectTry++;
		setTimeout(async () => {
			if (getCurrentUser()) {
				if (socketReconnectTry === 5) {
					Toast(
						"Failed to make WebSocket connection, please retry again later.",
						"danger"
					);
				} else {
					connectWebSocket();
				}
			}
		}, 1000);
	};
	socket.onerror = (error) => {
		console.error("WebSocket error:", error);
	};
	socket.onmessage = (event) => {
		const data = JSON.parse(event.data);
		console.log("received socket message: ", data);
		switch (data.event) {
			case "DIRECT_MESSAGE_CREATE":
				const messageEvent = new CustomEvent("messageEvent", {
					detail: data.data,
				});
				document.dispatchEvent(messageEvent);
				break;
		}
	};
};

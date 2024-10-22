import * as bootstrap from "bootstrap";

export const playHandler = (route) => {
	const oneVsOne = document.getElementById("one-vs-one");
	const waitingTime = document.getElementById("waiting-time");
	const cancelMatchmaking = document.getElementById("cancel-matchmaking");
	const matchmakingModal = new bootstrap.Modal("#matchmakingModal", {
		keyboard: false,
		backdrop: "static",
	});

	let timerId = 0;

	oneVsOne.addEventListener("click", () => {
		matchmakingModal.show();
		let timePassed = 1;

		timerId = setInterval(() => {
			const minutes = Math.floor(timePassed / 60);
			const seconds = timePassed % 60;
			waitingTime.textContent = `Time waiting: ${String(minutes).padStart(
				2,
				"0"
			)}:${String(seconds).padStart(2, "0")}`;
			timePassed++;
		}, 1000);
	});

	cancelMatchmaking.addEventListener("click", () => {
		matchmakingModal.hide();
		waitingTime.textContent = "Time waiting: 00:00";
		clearInterval(timerId);
	});

	console.log("player handler");
};

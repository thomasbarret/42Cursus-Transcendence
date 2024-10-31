import { eventEmitter } from "../eventemitter.js";
import { socket } from "../socket.js";
import { getCurrentUser, isDarkMode } from "../storage.js";
import { Ball } from "./ball.js";
import { REFERENCE_HEIGHT, REFERENCE_WIDTH } from "./constants.js";
import { Paddle } from "./paddle.js";

export let keyDownListener = null;
export let keyUpListener = null;

export const defaultCustomization = {
	ball: {
		light_color: "black",
		dark_color: "white",
	},
	paddle: {
		light_color: "#ff33ec",
		dark_color: "#ff33ec",
		// color: "rgb(255, 51, 236)",
	},
};

export class Game {
	constructor(remote, customization = defaultCustomization) {
		document.removeEventListener("keydown", keyDownListener);
		document.removeEventListener("keyup", keyUpListener);

		this.animationFrame = null;
		this.finished = false;
		this.remote = remote;
		this.canvas = document.querySelector("canvas");
		this.ctx = this.canvas.getContext("2d");

		this.customization = customization;

		this.scoreText = document.getElementById("score-text");
		this.scale = {
			x: this.canvas.width / REFERENCE_WIDTH,
			y: this.canvas.height / REFERENCE_HEIGHT,
		};

		this.deltaTime = 0;
		this.lastTime = 0;

		this.ballActive = true;
		this.user = getCurrentUser();

		this.ball = new Ball(this.canvas, this.scale, this.remote);
		this.player_1 = new Paddle(
			"left",
			this.canvas,
			this.scale,
			this.remote
		);
		this.player_2 = new Paddle(
			"right",
			this.canvas,
			this.scale,
			this.remote
		);

		if (this.remote) {
			this.isPlaying =
				this.user.uuid === this.remote.player_1.user.uuid ||
				this.user.uuid === this.remote.player_2.user.uuid;

			if (this.isPlaying) {
				this.currentPlayer =
					this.user.uuid === this.remote.player_1.user.uuid
						? this.player_1
						: this.player_2;
			}
		}

		this.setColor();
		this.eventListeners();
		this.start();
	}

	start() {
		this.clear(false);

		this.ball.draw();
		this.player_1.draw();
		this.player_2.draw();

		if (this.remote) {
			this.player_1.points = this.remote.player1_score;
			this.player_2.points = this.remote.player2_score;
			this.setScore();

			if (this.remote.status === 3) {
				this.finished = true;
				return;
			}
		}

		this.animationFrame = window.requestAnimationFrame(
			this.loop.bind(this)
		);
	}

	setColor() {
		this.color = isDarkMode() ? "rgb(0 0 0)" : "rgb(255 255 255)";
		this.transparent = isDarkMode()
			? "rgb(0 0 0 / 10%)"
			: "rgb(255 255 255 / 10%)";

		const elementColor = isDarkMode() ? "white" : "black";
		this.player_1.color = elementColor;
		this.player_2.color = elementColor;
		if (this.remote && this.isPlaying) {
			this.currentPlayer.color = isDarkMode()
				? this.customization.paddle.dark_color
				: this.customization.paddle.light_color;
		}
		this.ball.color = elementColor;
	}

	clear(transparent = true) {
		this.ctx.fillStyle = transparent ? this.transparent : this.color;
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
	}

	setScore() {
		this.scoreText.textContent = `${this.player_1.points} : ${this.player_2.points}`;
	}

	reset() {
		this.player_1.reset();
		this.player_2.reset();
		this.setScore();

		this.ballActive = false;
		this.ball.reset();
		setTimeout(() => {
			this.ballActive = true;
		}, 1500);
	}

	sendRemote(event, state) {
		if (this.remote && !this.finished) {
			socket.send(
				JSON.stringify({
					event,
					data: {
						direction: state,
						uuid: this.remote.uuid,
					},
				})
			);
		}
	}

	loop(timestamp) {
		this.clear();
		if (!this.remote) {
			if (this.lastTime === 0) this.lastTime = timestamp;
			this.deltaTime = Math.min(
				(timestamp - this.lastTime) / 1000,
				1 / 60
			);
			this.lastTime = timestamp;

			if (this.ballActive) {
				if (
					!this.ball
						.draw()
						.move(this.deltaTime, this.player_1, this.player_2)
				) {
					this.reset();
				}
			} else {
				this.ball.draw();
			}
		}

		this.ball.draw();
		this.player_1.draw();
		this.player_2.draw();
		if (!this.remote) {
			this.player_1.move(this.deltaTime);
			this.player_2.move(this.deltaTime);
		}

		this.animationFrame = window.requestAnimationFrame(
			this.loop.bind(this)
		);
	}

	lerp(start, end, factor) {
		return start + (end - start) * factor;
	}

	eventListeners() {
		if (this.remote) {
			document.addEventListener(
				"keydown",
				(keyDownListener = (event) => {
					if (!this.finished && this.isPlaying) {
						if (
							this.currentPlayer.keyHandler(event, true) !== false
						) {
							this.sendRemote(
								"GAME_MATCH_INPUT",
								this.currentPlayer.direction
							);
						}
					}
				})
			);

			document.addEventListener(
				"keyup",
				(keyUpListener = (event) => {
					if (!this.finished && this.isPlaying) {
						if (
							this.currentPlayer.keyHandler(event, false) !==
							false
						) {
							this.sendRemote(
								"GAME_MATCH_INPUT",
								this.currentPlayer.direction
							);
						}
					}
				})
			);
		} else {
			document.addEventListener(
				"keydown",
				(keyDownListener = (event) => {
					this.player_1.keyHandler(event, true);
					this.player_2.keyHandler(event, true);
				})
			);

			document.addEventListener(
				"keyup",
				(keyDownListener = (event) => {
					this.player_1.keyHandler(event, false);
					this.player_2.keyHandler(event, false);
				})
			);
		}

		eventEmitter.on("theme", () => {
			this.setColor();
		});

		if (this.remote) {
			eventEmitter.on("GAME_STATE_UPDATE", (data) => {
				this.ball.x = data.b_x;
				this.ball.y = data.b_y;
				this.player_1.y = data.p1_pos;
				this.player_2.y = data.p2_pos;
			});

			eventEmitter.on("GAME_SCORE_UPDATE", (data) => {
				this.player_1.points = data.p1_score;
				this.player_2.points = data.p2_score;
				this.setScore();
			});

			eventEmitter.on("GAME_MATCH_FINISHED", (data) => {
				if (data.uuid === this.remote.uuid) {
					this.finished = true;
					document.removeEventListener("keydown", keyDownListener);
					document.removeEventListener("keyup", keyUpListener);
				}
			});
		}
	}
}

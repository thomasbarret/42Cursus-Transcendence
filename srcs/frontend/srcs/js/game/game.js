import { Toast } from "../components.js";
import { eventEmitter } from "../eventemitter.js";
import { BASE_URL } from "../handler.js";
import { socket } from "../socket.js";
import { getCurrentUser, isDarkMode } from "../storage.js";
import { Ball } from "./ball.js";
import {
	BALL_LERP,
	MATCH_UPDATE_INTERVAL,
	PADDLE_LERP,
	REFERENCE_HEIGHT,
	REFERENCE_WIDTH,
} from "./constants.js";
import { Paddle } from "./paddle.js";

export class Game {
	constructor(remote) {
		this.animationFrame = null;
		this.finished = false;
		this.remote = remote;
		this.canvas = document.querySelector("canvas");
		this.ctx = this.canvas.getContext("2d");

		this.scoreText = document.getElementById("score-text");
		this.scale = {
			x: this.canvas.width / REFERENCE_WIDTH,
			y: this.canvas.height / REFERENCE_HEIGHT,
		};

		this.deltaTime = 0;
		this.lastTime = 0;
		this.lastExecutionTime = 0;
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

		this.setColor();
		this.eventListeners();

		if (this.remote) {
			this.currentPlayer =
				this.user.uuid === this.remote.player_1.user.uuid
					? this.player_1
					: this.player_2;
			this.authoritative = this.currentPlayer === this.player_1;
		}
		this.start();
	}

	start() {
		this.clear(false);

		this.ball.draw();
		this.player_1.draw();
		this.player_2.draw();

		if (this.remote) {
			if (this.remote.status === 3) this.finished = true;

			this.player_1.points = this.remote.player1_score;
			this.player_2.points = this.remote.player2_score;
			this.setScore();
		}

		this.animationFrame = window.requestAnimationFrame(
			this.draw.bind(this)
		);

		if (this.remote) {
			this.matchUpdateInterval = setInterval(() => {
				this.updateBallData();
			}, MATCH_UPDATE_INTERVAL);
		}
	}

	setColor() {
		this.color = isDarkMode() ? "rgb(0 0 0)" : "rgb(255 255 255)";
		this.transparent = isDarkMode()
			? "rgb(0 0 0 / 10%)"
			: "rgb(255 255 255 / 10%)";

		const elementColor = isDarkMode() ? "white" : "black";
		this.player_1.color = elementColor;
		this.player_2.color = elementColor;
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
						state,
						uuid: this.remote.uuid,
					},
				})
			);
		}
	}

	updateBallData() {
		if (this.remote && this.authoritative) {
			//TODO: Might need to do throttling here but let's leave it off for now.

			this.sendRemote("GAME_MATCH_STATE_UPDATE", {
				ball: {
					x: this.ball.x,
					y: this.ball.y,
					vx: this.ball.vx,
					vy: this.ball.vy,
				},
				player1_score: this.player_1.points,
				player2_score: this.player_2.points,
				player1_position: this.player_1.y,
				player2_position: this.player_2.y,
			});
		}
	}

	async scoreHandler() {
		if (this.remote) {
			let winner = null;
			if (this.player_1.points >= this.remote.max_score) {
				winner = this.remote.player_1.user.uuid;
			} else if (this.player_2.points >= this.remote.max_score) {
				winner = this.remote.player_2.user.uuid;
			}

			this.sendRemote("GAME_MATCH_SCORE_UPDATE", {
				player1_score: this.player_1.points,
				player2_score: this.player_2.points,
			});

			const res = await fetch(
				BASE_URL + "/game/match/" + this.remote.uuid,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						score: this.currentPlayer.points,
						...(winner ? { winner_uuid: winner } : {}),
					}),
				}
			);
			if (!res.ok)
				Toast("An error occurred while updating the score", "danger");
		}
	}

	draw(timestamp) {
		if (this.lastTime === 0) this.lastTime = timestamp;
		this.clear();

		this.deltaTime = Math.min((timestamp - this.lastTime) / 1000, 1 / 60);
		this.lastTime = timestamp;

		if (this.remote) {
			this.ball.x = this.lerp(this.ball.x, this.ball.target.x, BALL_LERP);
			this.ball.y = this.lerp(this.ball.y, this.ball.target.y, BALL_LERP);
			this.player_1.y = this.lerp(
				this.player_1.y,
				this.player_1.target,
				PADDLE_LERP
			);
			this.player_2.y = this.lerp(
				this.player_2.y,
				this.player_2.target,
				PADDLE_LERP
			);
		}

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

		this.player_1.draw().move(this.deltaTime);
		this.player_2.draw().move(this.deltaTime);

		this.animationFrame = window.requestAnimationFrame(
			this.draw.bind(this)
		);
	}

	lerp(start, end, factor) {
		return start + (end - start) * factor;
	}

	eventListeners() {
		document.addEventListener(
			"visibilitychange",
			(this.visibilityListener = () => {
				this.sendRemote(
					"GAME_MATCH_PAUSE_EVENT",
					document.visibilityState
				);
			})
		);

		if (this.remote) {
			document.addEventListener(
				"keydown",
				(this.keyDownListener = (event) => {
					if (!this.finished) {
						if (
							this.currentPlayer.keyHandler(event, true) !== false
						) {
							this.sendRemote(
								"GAME_MATCH_PADDLE_UPDATE",
								this.currentPlayer.direction
							);
						}
					}
				})
			);

			document.addEventListener(
				"keyup",
				(this.keyDownListener = (event) => {
					if (!this.finished) {
						if (
							this.currentPlayer.keyHandler(event, false) !==
							false
						) {
							this.sendRemote(
								"GAME_MATCH_PADDLE_UPDATE",
								this.currentPlayer.direction
							);
						}
					}
				})
			);
		} else {
			document.addEventListener(
				"keydown",
				(this.keyDownListener = (event) => {
					this.player_1.keyHandler(event, true);
					this.player_2.keyHandler(event, true);
				})
			);

			document.addEventListener(
				"keyup",
				(this.keyDownListener = (event) => {
					this.player_1.keyHandler(event, false);
					this.player_2.keyHandler(event, false);
				})
			);
		}

		eventEmitter.on("theme", () => {
			this.setColor();
		});

		if (this.remote) {
			eventEmitter.on("GAME_MATCH_STATE_UPDATE", (data) => {
				this.ball.target = {
					x: data.state.ball.x,
					y: data.state.ball.y,
					vx: data.state.ball.vx,
					vy: data.state.ball.vy,
				};
				this.player_1.target = data.state.player1_position;
				this.player_2.target = data.state.player2_position;
				this.player_1.points = data.state.player1_score;
				this.player_2.points = data.state.player2_score;
			});
		}

		eventEmitter.on("GAME_MATCH_PADDLE_UPDATE", (data) => {
			const player =
				data.player_uuid === this.remote.player_1.uuid
					? this.player_1
					: this.player_2;
			player.direction = data.state;
		});

		eventEmitter.on("GAME_MATCH_SCORE_UPDATE", (data) => {
			if (data.state === "hidden") {
			}
		});

		eventEmitter.on("GAME_MATCH_FINISHED", (data) => {});
	}
}

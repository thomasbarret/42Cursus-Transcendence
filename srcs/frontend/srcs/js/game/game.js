import { Toast } from "../components.js";
import { eventEmitter } from "../eventemitter.js";
import { BASE_URL } from "../handler.js";
import { socket } from "../socket.js";
import { getCurrentUser, isDarkMode } from "../storage.js";
import { Ball } from "./ball.js";
export let animFrame;
export let matchUpdateInterval;
export let keyUpListener;
export let keyDownListener;

const PADDLE_VELOCITY = 8 * 40;
const BALL_VELOCITY = 3 * 175;
const referenceWidth = 840;
const referenceHeight = 500;

const DIRECTION = {
	IDLE: 1,
	UP: 2,
	DOWN: 3,
};

const paddleSizes = {
	width: 10,
	height: 120,
};

const RADIUS = 10;

const MAX_ANGLE_DEVIATION = 45;

export const gameHandler = (_, matchData) => {
	const gameBoard = document.getElementById("game-board");
	// @ts-ignore
	const ctx = gameBoard.getContext("2d");
	if (!ctx) return false;
	const scoreText = document.getElementById("score-text");
	// const resetButton = document.getElementById("reset-btn");
	const scale = {
		// @ts-ignore
		x: gameBoard.width / referenceWidth,
		// @ts-ignore
		y: gameBoard.height / referenceHeight,
	};
	let deltaTime;
	const oldBall = {
		x: 75,
		y: 150,
		vx: BALL_VELOCITY,
		vy: BALL_VELOCITY / 2.5,
		radius: RADIUS,
		color: "white",
		move(canvas, paddleLeft, paddleRight) {
			const calculateImpactPoint = (paddle) => {
				const impact = (this.y - paddle.y) / paddle.height;
				const normalized = impact * 2 - 1;
				const clampedImpact = Math.max(-1, Math.min(normalized, 1));

				this.vx = -this.vx;
				// const thetaBase = Math.atan2(this.vy, this.vx);

				const thetaNew =
					clampedImpact * (MAX_ANGLE_DEVIATION * (Math.PI / 180));

				const speed = Math.sqrt(this.vx ** 2 + this.vy ** 2);
				this.vx = Math.sign(this.vx) * speed * Math.cos(thetaNew);
				this.vy = speed * Math.sin(thetaNew);
				sendBallData();
			};
			this.x += this.vx * deltaTime;
			this.y += this.vy * deltaTime;
			// paddle right
			if (
				this.x + this.radius >= paddleRight.x &&
				this.y >= paddleRight.y &&
				this.y <= paddleRight.y + paddleRight.height
			) {
				calculateImpactPoint(paddleRight);
				return this;
			}
			// paddle left
			if (
				this.x - this.radius <= paddleLeft.x + paddleLeft.width &&
				this.y >= paddleLeft.y &&
				this.y <= paddleLeft.y + paddleLeft.height
			) {
				calculateImpactPoint(paddleLeft);
				return this;
			}
			// if it touches up and down border:
			if (
				this.x + this.radius >= canvas.width ||
				this.x - this.radius <= 0
			) {
				if (this.x + this.radius >= canvas.width) {
					paddleLeft.points += 1;
				} else if (this.x - this.radius <= 0) {
					paddleRight.points += 1;
				}
				scoreHandler();
				return false;
			}
			if (
				this.y + this.radius >= canvas.height ||
				this.y - this.radius <= 0
			) {
				sendBallData();
				this.vy *= -1;
			}
			return this;
		},
		init(canvas, scale) {
			this.x = canvas.width / 2;
			this.y = canvas.height / 2;
			this.radius *= scale.x;
			this.vx *= scale.x;
			this.vy *= scale.y;
			return this;
		},
		draw(ctx) {
			ctx.beginPath();
			ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
			ctx.closePath();
			ctx.fillStyle = this.color;
			ctx.fill();
			return this;
		},
		reset(canvas) {
			this.x = canvas.width / 2;
			this.y = canvas.height / 2;
			return this;
		},
	};

	// @ts-ignore
	const ball = new Ball(gameBoard, scale);

	const user = getCurrentUser();
	const sendMatchData = (event, state) => {
		if (matchData && socket.readyState === WebSocket.OPEN) {
			socket.send(
				JSON.stringify({
					event: event,
					data: {
						uuid: matchData.uuid,
						state: state,
					},
				})
			);
		}
	};

	const paddleLeft = {
		x: 0,
		y: 0,
		vy: PADDLE_VELOCITY,
		width: paddleSizes.width,
		height: paddleSizes.height,
		color: "white",
		direction: DIRECTION.IDLE,
		keys: {
			upKey: "w",
			downKey: "s",
			altUpKey: "ArrowUp",
			altDownKey: "ArrowDown",
		},
		points: 0,
		init(canvas, scale) {
			this.x = 0;
			this.y = canvas.height / 2;
			this.width *= scale.x;
			this.height *= scale.y;
			this.vy *= scale.y;
			return this;
		},
		draw(ctx) {
			ctx.fillStyle = this.color;
			ctx.fillRect(this.x, this.y, this.width, this.height);
			return this;
		},
		move(canvas) {
			if (this.direction === DIRECTION.IDLE) return this;
			if (this.y + this.height >= canvas.height)
				this.y = canvas.height - this.height;
			else if (this.y <= 0) this.y = 0;
			if (this.direction === DIRECTION.UP) this.y -= this.vy * deltaTime;
			if (this.direction === DIRECTION.DOWN)
				this.y += this.vy * deltaTime;
			return this;
		},
		keyHandler(event, value) {
			if (this.direction !== DIRECTION.IDLE && value === false) {
				this.direction = DIRECTION.IDLE;
				if (matchData)
					sendMatchData("GAME_MATCH_PADDLE_UPDATE", this.direction);
			} else if (matchData) {
				if (
					event.key === this.keys.upKey ||
					event.key === this.keys.altUpKey
				) {
					event.preventDefault();
					if (this.direction !== DIRECTION.UP) {
						this.direction = DIRECTION.UP;
						sendMatchData(
							"GAME_MATCH_PADDLE_UPDATE",
							this.direction
						);
					}
				}
				if (
					event.key === this.keys.downKey ||
					event.key === this.keys.altDownKey
				) {
					event.preventDefault();
					if (this.direction !== DIRECTION.DOWN) {
						this.direction = DIRECTION.DOWN;
						sendMatchData(
							"GAME_MATCH_PADDLE_UPDATE",
							this.direction
						);
					}
				}
			} else {
				if (
					this.direction !== DIRECTION.UP &&
					event.key === this.keys.upKey
				) {
					event.preventDefault();
					if (this.direction !== DIRECTION.UP)
						this.direction = DIRECTION.UP;
				}
				if (event.key === this.keys.downKey) {
					event.preventDefault();
					if (this.direction !== DIRECTION.DOWN)
						this.direction = DIRECTION.DOWN;
				}
			}
			return this;
		},
		reset(canvas) {
			this.x = 0;
			this.y = canvas.height / 2;
			return this;
		},
	};
	const paddleRight = {
		x: 0,
		y: 0,
		vy: PADDLE_VELOCITY,
		width: paddleSizes.width,
		height: paddleSizes.height,
		color: "white",
		direction: DIRECTION.IDLE,
		keys: {
			upKey: "ArrowUp",
			downKey: "ArrowDown",
			altUpKey: "w",
			altDownKey: "s",
		},
		points: 0,
		init(canvas, scale) {
			this.width *= scale.x;
			this.height *= scale.y;
			this.x = canvas.width - this.width;
			this.y = canvas.height / 2;
			this.vy *= scale.y;
			return this;
		},
		draw(ctx) {
			ctx.fillStyle = this.color;
			ctx.fillRect(this.x, this.y, this.width, this.height);
			return this;
		},
		move(canvas) {
			if (this.direction === DIRECTION.IDLE) return this;
			if (this.y + this.height >= canvas.height)
				this.y = canvas.height - this.height;
			else if (this.y <= 0) this.y = 0;
			if (this.direction === DIRECTION.UP) this.y -= this.vy * deltaTime;
			if (this.direction === DIRECTION.DOWN)
				this.y += this.vy * deltaTime;
			return this;
		},
		keyHandler(event, value) {
			if (this.direction !== DIRECTION.IDLE && value === false) {
				this.direction = DIRECTION.IDLE;
				if (matchData)
					sendMatchData("GAME_MATCH_PADDLE_UPDATE", this.direction);
			} else if (matchData) {
				if (
					event.key === this.keys.upKey ||
					event.key === this.keys.altUpKey
				) {
					event.preventDefault();
					if (this.direction !== DIRECTION.UP) {
						this.direction = DIRECTION.UP;
						sendMatchData(
							"GAME_MATCH_PADDLE_UPDATE",
							this.direction
						);
					}
				}
				if (
					event.key === this.keys.downKey ||
					event.key === this.keys.altDownKey
				) {
					event.preventDefault();
					if (this.direction !== DIRECTION.DOWN) {
						this.direction = DIRECTION.DOWN;
						sendMatchData(
							"GAME_MATCH_PADDLE_UPDATE",
							this.direction
						);
					}
				}
			} else {
				if (event.key === this.keys.upKey) {
					event.preventDefault();
					if (this.direction !== DIRECTION.UP)
						this.direction = DIRECTION.UP;
				}
				if (event.key === this.keys.downKey) {
					event.preventDefault();
					if (this.direction !== DIRECTION.DOWN)
						this.direction = DIRECTION.DOWN;
				}
			}
			return this;
		},
		reset(canvas) {
			this.x = canvas.width - this.width;
			this.y = canvas.height / 2;
			return this;
		},
	};

	const scoreHandler = async () => {
		if (matchData) {
			let winner;
			if (paddleLeft.points >= matchData.max_score) {
				winner = matchData.player_1.user.uuid;
			} else if (paddleRight.points >= matchData.max_score) {
				winner = matchData.player_2.user.uuid;
			}

			sendMatchData("GAME_MATCH_SCORE_UPDATE", {
				left_score: paddleLeft.points,
				right_score: paddleRight.points,
			});

			const current =
				user.uuid === matchData.player_1.user.uuid
					? paddleLeft
					: paddleRight;

			const res = await fetch(
				BASE_URL + "/game/match/" + matchData.uuid,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						score: current.points,
						...(winner ? { winner_uuid: winner } : {}),
					}),
				}
			);
			if (!res.ok) Toast("Couldn't update match score!", "danger");
		}
	};

	let ballActive = true;
	let color;
	let tr;
	const setColor = () => {
		color = isDarkMode() ? "rgb(0 0 0)" : "rgb(255 255 255)";
		tr = isDarkMode() ? "rgb(0 0 0 / 10%)" : "rgb(255 255 255 / 10%)";
		const elColor = isDarkMode() ? "white" : "black";
		paddleLeft.color = elColor;
		paddleRight.color = elColor;
		ball.color = elColor;
	};
	const clear = (transparent) => {
		if (transparent === false) ctx.fillStyle = color;
		else ctx.fillStyle = tr;
		// @ts-ignore
		ctx.fillRect(0, 0, gameBoard.width, gameBoard.height);
	};
	const setScoreText = () =>
		scoreText &&
		(scoreText.textContent =
			paddleLeft.points + " : " + paddleRight.points);

	const reset = () => {
		paddleLeft.reset(gameBoard);
		paddleRight.reset(gameBoard);
		setScoreText();
		ballActive = false;
		ball.reset();
		setTimeout(() => {
			ballActive = true;
		}, 1500);
	};

	let lastExecutionTime = 0;

	const sendBallData = () => {
		if (matchData && matchData.player_1.user.uuid === user.uuid) {
			const now = Date.now();
			const throttleInterval = 1000 / 45;

			if (now - lastExecutionTime >= throttleInterval) {
				lastExecutionTime = now;
				sendMatchData("GAME_MATCH_STATE_UPDATE", {
					x: ball.x,
					y: ball.y,
					vx: ball.vx,
					vy: ball.vy,
					left_score: paddleLeft.points,
					right_score: paddleRight.points,
					left_paddle: paddleLeft.y,
					right_paddle: paddleRight.y,
				});
			}
		}
	};
	matchUpdateInterval = setInterval(() => {
		sendBallData();
	}, 1000 / 11);

	const target = {
		x: ball.x,
		y: ball.y,
		left: paddleLeft.y,
		right: paddleRight.y,
		reset() {
			this.x = ball.x;
			this.y = ball.y;
			this.left = paddleLeft.y;
			this.right = paddleRight.y;
		},
	};

	if (matchData) {
		eventEmitter.on("GAME_MATCH_STATE_UPDATE", (data) => {
			target.x = data.state.x;
			target.y = data.state.y;
			ball.vx = data.state.vx;
			ball.vy = data.state.vy;
			paddleLeft.points = data.state.left_score;
			paddleRight.points = data.state.right_score;
			target.left = data.state.left_paddle;
			target.right = data.state.right_paddle;
		});

		eventEmitter.on("GAME_MATCH_PADDLE_UPDATE", (data) => {
			const player =
				data.player_uuid === matchData.player_1.uuid
					? paddleLeft
					: paddleRight;

			player.direction = data.state;
		});

		eventEmitter.on("GAME_MATCH_SCORE_UPDATE", (data) => {
			paddleLeft.points = data.state.left_score;
			paddleRight.points = data.state.right_score;
			reset();
		});

		eventEmitter.on("GAME_MATCH_PAUSE_EVENT", (data) => {
			if (data.state === "hidden") {
				lastTime = 0;
				target.reset();
				window.cancelAnimationFrame(animFrame);
			} else {
				animFrame = window.requestAnimationFrame(draw);
			}
		});

		eventEmitter.on("GAME_MATCH_FINISHED", () => {
			window.cancelAnimationFrame(animFrame);
			matchData = false;
		});
	}

	let lastTime = 0;

	const lerp = (start, end, factor) => start + (end - start) * factor;

	const draw = (timestamp) => {
		if (lastTime === 0) lastTime = timestamp;

		clear();
		deltaTime = Math.min((timestamp - lastTime) / 1000, 1 / 60);
		lastTime = timestamp;

		if (matchData) {
			ball.x = lerp(ball.x, target.x, 0.1);
			ball.y = lerp(ball.y, target.y, 0.1);
			paddleLeft.y = lerp(paddleLeft.y, target.left, 0.1);
			paddleRight.y = lerp(paddleRight.y, target.right, 0.1);
		}

		if (ballActive) {
			if (!ball.draw().move(deltaTime, paddleLeft, paddleRight)) {
				reset();
				target.reset();
			}
		} else ball.draw();

		paddleLeft.draw(ctx).move(gameBoard);
		paddleRight.draw(ctx).move(gameBoard);
		animFrame = window.requestAnimationFrame(draw);
	};

	// @ts-ignore
	document.addEventListener("visibilitychange", (event) => {
		sendMatchData("GAME_MATCH_PAUSE_EVENT", document.visibilityState);
	});

	document.addEventListener(
		"keydown",
		(keyDownListener = (e) => {
			if (matchData) {
				if (user.uuid === matchData.player_1.user.uuid)
					paddleLeft.keyHandler(e, true);
				else if (user.uuid === matchData.player_2.user.uuid)
					paddleRight.keyHandler(e, true);
			} else {
				paddleLeft.keyHandler(e, true);
				paddleRight.keyHandler(e, true);
			}
		})
	);

	// gameBoard.addEventListener("mouseenter", () => {
	// animFrame = window.requestAnimationFrame(draw);
	// });

	document.addEventListener(
		"keyup",
		(keyUpListener = (e) => {
			if (matchData) {
				if (user.uuid === matchData.player_1.user.uuid)
					paddleLeft.keyHandler(e, false);
				else if (user.uuid === matchData.player_2.user.uuid)
					paddleRight.keyHandler(e, false);
			} else {
				paddleLeft.keyHandler(e, false);
				paddleRight.keyHandler(e, false);
			}
		})
	);
	document.addEventListener("theme", () => {
		color = isDarkMode() ? "rgb(0 0 0)" : "rgb(255 255 255)";
		tr = isDarkMode() ? "rgb(0 0 0 / 10%)" : "rgb(255 255 255 / 10%)";
		setColor();
	});

	// sendMatchData("GAME_MATCH_PAUSE_EVENT", document.visibilityState);
	setColor();
	clear(false);
	ball.draw();
	paddleLeft.init(gameBoard, scale).draw(ctx);
	paddleRight.init(gameBoard, scale).draw(ctx);
	if (matchData) {
		if (matchData.status === 3) {
			matchData = false;
		}
		paddleLeft.points = matchData.player1_score;
		paddleRight.points = matchData.player2_score;
		setScoreText();
	}
	animFrame = window.requestAnimationFrame(draw);
};

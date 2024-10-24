import { eventEmitter } from "./eventemitter.js";
import { socket } from "./socket.js";
import { getCurrentUser, isDarkMode } from "./storage.js";
export let animFrame;
export let matchUpdateInterval;
export let keyUpListener;
export let keyDownListener;

const PADDLE_VELOCITY = 8 * 40;
const BALL_VELOCITY = 3 * 175;
const MAX_BALL_VELOCITY = BALL_VELOCITY * 2.5;
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
	const ball = {
		x: 75,
		y: 150,
		vx: BALL_VELOCITY,
		vy: BALL_VELOCITY / 2.5,
		maxvX: MAX_BALL_VELOCITY,
		maxvY: MAX_BALL_VELOCITY / 2.5,
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
				return false;
			}
			if (
				this.y + this.radius >= canvas.height ||
				this.y - this.radius <= 0
			) {
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

	const user = getCurrentUser();
	const sendPaddleDirection = (direction, ball_position) => {
		if (socket.readyState === WebSocket.OPEN) {
			const data = {
				uuid: matchData.uuid,
				paddle_position: direction,
				ball_position: ball_position,
			};
			if (!ball_position) delete data.ball_position;
			socket.send(
				JSON.stringify({
					event: "GAME_MATCH_PADDLE_UPDATE",
					data: data,
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
		keyHandler(event, value, multiplayer) {
			if (this.direction !== DIRECTION.IDLE && value === false) {
				this.direction = DIRECTION.IDLE;
				if (multiplayer) sendPaddleDirection(this.direction);
			} else if (multiplayer) {
				if (
					event.key === this.keys.upKey ||
					event.key === this.keys.altUpKey
				) {
					event.preventDefault();
					if (this.direction !== DIRECTION.UP) {
						this.direction = DIRECTION.UP;
						sendPaddleDirection(this.direction);
					}
				}
				if (
					event.key === this.keys.downKey ||
					event.key === this.keys.altDownKey
				) {
					event.preventDefault();
					if (this.direction !== DIRECTION.DOWN) {
						this.direction = DIRECTION.DOWN;
						sendPaddleDirection(this.direction);
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
		keyHandler(event, value, multiplayer) {
			if (this.direction !== DIRECTION.IDLE && value === false) {
				this.direction = DIRECTION.IDLE;
				if (multiplayer) sendPaddleDirection(this.direction);
			} else if (multiplayer) {
				if (
					event.key === this.keys.upKey ||
					event.key === this.keys.altUpKey
				) {
					event.preventDefault();
					if (this.direction !== DIRECTION.UP) {
						this.direction = DIRECTION.UP;
						sendPaddleDirection(this.direction);
					}
				}
				if (
					event.key === this.keys.downKey ||
					event.key === this.keys.altDownKey
				) {
					event.preventDefault();
					if (this.direction !== DIRECTION.DOWN) {
						this.direction = DIRECTION.DOWN;
						sendPaddleDirection(this.direction);
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
	let ballActive = true;
	let color;
	let tr;
	const setColor = () => {
		color = isDarkMode() ? "rgb(0 0 0)" : "rgb(255 255 255)";
		tr = isDarkMode() ? "rgb(0 0 0 / 8%)" : "rgb(255 255 255 / 8%)";
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
	const reset = () => {
		paddleLeft.reset(gameBoard);
		paddleRight.reset(gameBoard);
		if (scoreText)
			scoreText.textContent =
				paddleLeft.points + " : " + paddleRight.points;
		ballActive = false;
		ball.reset(gameBoard);
		sendBallData();
		setTimeout(() => {
			ballActive = true;
		}, 1500);
	};

	let lastExecutionTime = 0;

	const sendBallData = () => {
		const now = Date.now();
		const throttleInterval = 1000 / 15;

		if (now - lastExecutionTime >= throttleInterval) {
			lastExecutionTime = now;
			if (matchData && matchData.player_1.user.uuid === user.uuid) {
				sendPaddleDirection(paddleLeft.direction, {
					x: ball.x,
					y: ball.y,
					vx: ball.vx,
					vy: ball.vy,
					left_score: paddleLeft.points,
					right_score: paddleRight.points,
				});
			}
		}
	};
	let lastTime = 0;
	// let fpsInterval = 1000 / 45;
	const draw = (timestamp) => {
		if (!lastTime) lastTime = timestamp;
		clear();
		deltaTime = (timestamp - lastTime) / 1000;
		lastTime = timestamp;

		if (ballActive) {
			if (!ball.draw(ctx).move(gameBoard, paddleLeft, paddleRight))
				reset();
		} else ball.draw(ctx);

		paddleLeft.draw(ctx).move(gameBoard);
		paddleRight.draw(ctx).move(gameBoard);
		animFrame = window.requestAnimationFrame(draw);
	};
	matchUpdateInterval = setInterval(() => {
		sendBallData();
	}, 500);
	// resetButton.addEventListener("click", () => {
	// 	paddleLeft.points = 0;
	// 	paddleRight.points = 0;
	// 	reset();
	// });
	// @ts-ignore
	// gameBoard.addEventListener("mouseover", (e) => {
	// 	animFrame = window.requestAnimationFrame(draw);
	// });
	// @ts-ignore
	// gameBoard.addEventListener("mouseout", (e) => {
	// 	window.cancelAnimationFrame(animFrame);
	// 	// important: fixes issue that if mouse is out, it doesnt launch the ball at mach 10
	// 	lastTime = 0;
	// });

	eventEmitter.on("GAME_MATCH_PADDLE_UPDATE", (data) => {
		const current =
			data.player_uuid === matchData.player_1.uuid
				? paddleLeft
				: paddleRight;

		current.direction = data.paddle_position;
		if (data.ball_position) {
			ball.x = data.ball_position.x;
			ball.y = data.ball_position.y;
			ball.vx = data.ball_position.vx;
			ball.vy = data.ball_position.vy;
			paddleLeft.points = data.ball_position.left_score;
			paddleRight.points = data.ball_position.right_score;
		}
	});

	document.addEventListener(
		"keydown",
		(keyDownListener = (e) => {
			if (matchData) {
				if (user.uuid === matchData.player_1.user.uuid)
					paddleLeft.keyHandler(e, true, true);
				else if (user.uuid === matchData.player_2.user.uuid)
					paddleRight.keyHandler(e, true, true);
			} else {
				paddleLeft.keyHandler(e, true);
				paddleRight.keyHandler(e, true);
			}
		})
	);
	document.addEventListener(
		"keyup",
		(keyUpListener = (e) => {
			if (matchData) {
				if (user.uuid === matchData.player_1.user.uuid)
					paddleLeft.keyHandler(e, false, true);
				else if (user.uuid === matchData.player_2.user.uuid)
					paddleRight.keyHandler(e, false, true);
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
	setColor();
	clear(false);
	ball.init(gameBoard, scale).draw(ctx);
	paddleLeft.init(gameBoard, scale).draw(ctx);
	paddleRight.init(gameBoard, scale).draw(ctx);
	animFrame = window.requestAnimationFrame(draw);
};

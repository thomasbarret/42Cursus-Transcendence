import { isDarkMode } from "./storage.js";
import { Ball, Paddle, Routes, Scale } from "./types.js";

let animFrame: number;

const PADDLE_VELOCITY = 8 * 150;
const BALL_VELOCITY = 3 * 150;
const MAX_BALL_VELOCITY = BALL_VELOCITY * 2.5;

const referenceWidth = 840;
const referenceHeight = 500;
export const gameHandler = (route: Routes) => {
	console.log("current route: ", route.description);
	const gameBoard = document.getElementById(
		"game-board"
	) as HTMLCanvasElement;
	const ctx = gameBoard.getContext("2d") as CanvasRenderingContext2D;
	if (!ctx) return false;
	const scoreText = document.getElementById("score-text");
	const resetButton = document.getElementById("reset-btn");

	const scale: Scale = {
		x: gameBoard.width / referenceWidth,
		y: gameBoard.height / referenceHeight,
	};

	let deltaTime;

	const ball: Ball = {
		x: 75,
		y: 150,
		vx: BALL_VELOCITY,
		vy: BALL_VELOCITY / 2.5,
		maxvX: MAX_BALL_VELOCITY,
		maxvY: MAX_BALL_VELOCITY / 2.5,
		radius: 15,
		color: "white",
		move(
			canvas: HTMLCanvasElement,
			paddleLeft: Paddle,
			paddleRight: Paddle
		) {
			this.x += this.vx * deltaTime;
			this.y += this.vy * deltaTime;

			// if (this.x + this.radius >= canvas.width || this.x - this.radius <= 0) {
			// 	if (this.vx > 0 && this.vx < this.maxvX) this.vx += 1;
			// 	else if (this.vx < 0 && this.vx > -this.maxvX) this.vx -= 1;
			// 	this.vx *= -1;
			// }

			if (
				(this.x + this.radius >= paddleRight.x &&
					this.y >= paddleRight.y &&
					this.y <= paddleRight.y + paddleRight.height) ||
				(this.x - this.radius <= paddleLeft.x + paddleLeft.width &&
					this.y >= paddleLeft.y &&
					this.y <= paddleLeft.y + paddleLeft.height)
			) {
				this.vx *= -1;
				return this;
			}

			// if it touches up and down border:
			if (
				this.x + this.radius >= canvas.width ||
				this.x - this.radius <= 0
			) {
				// speed incrementation, no need to bother with this for now
				// if (this.vx > 0 && this.vx < this.maxvX) this.vx += 1;
				// else if (this.vx < 0 && this.vx > -this.maxvX) this.vx -= 1;

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
				if (this.vy > 0 && this.vy < this.maxvY) this.vy += 1;
				else if (this.vy < 0 && this.vy > -this.maxvY) this.vy -= 1;
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
		draw(ctx: CanvasRenderingContext2D) {
			ctx.beginPath();
			ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
			ctx.closePath();
			ctx.fillStyle = this.color;
			ctx.fill();
			return this;
		},
		reset(canvas: HTMLCanvasElement) {
			this.x = canvas.width / 2;
			this.y = canvas.height / 2;
			return this;
		},
	};

	const paddleLeft: Paddle = {
		x: 0,
		y: 0,
		vy: PADDLE_VELOCITY,
		width: 15,
		height: 150,
		color: "white",
		keys: {
			up: false,
			down: false,
			upKey: "w",
			downKey: "s",
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
		draw(ctx: CanvasRenderingContext2D) {
			ctx.fillStyle = this.color;
			ctx.fillRect(this.x, this.y, this.width, this.height);
			return this;
		},
		move(canvas: HTMLCanvasElement) {
			if (this.y + this.height >= canvas.height) this.keys.down = false;
			else if (this.y <= 0) this.keys.up = false;
			if (this.keys.up) this.y -= this.vy * deltaTime;
			if (this.keys.down) this.y += this.vy * deltaTime;
			return this;
		},
		keyHandler(event: KeyboardEvent, value: boolean) {
			if (event.key == this.keys.upKey) this.keys.up = value;
			if (event.key == this.keys.downKey) this.keys.down = value;
			return this;
		},
		reset(canvas: HTMLCanvasElement) {
			this.x = 0;
			this.y = canvas.height / 2;
			return this;
		},
	};

	const paddleRight: Paddle = {
		x: 0,
		y: 0,
		vy: PADDLE_VELOCITY,
		width: 15,
		height: 150,
		color: "white",
		keys: {
			up: false,
			down: false,
			upKey: "ArrowUp",
			downKey: "ArrowDown",
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
		draw(ctx: CanvasRenderingContext2D) {
			ctx.fillStyle = this.color;
			ctx.fillRect(this.x, this.y, this.width, this.height);
			return this;
		},
		move(canvas: HTMLCanvasElement) {
			if (this.y + this.height >= canvas.height) this.keys.down = false;
			else if (this.y <= 0) this.keys.up = false;
			if (this.keys.up) this.y -= this.vy * deltaTime;
			if (this.keys.down) this.y += this.vy * deltaTime;
			return this;
		},
		keyHandler(event: KeyboardEvent, value: boolean) {
			if (event.key == this.keys.upKey) {
				event.preventDefault();

				this.keys.up = value;
			}
			if (event.key == this.keys.downKey) {
				event.preventDefault();

				this.keys.down = value;
			}
			return this;
		},
		reset(canvas: HTMLCanvasElement) {
			this.x = canvas.width - this.width;
			this.y = canvas.height / 2;
			return this;
		},
	};

	let ballActive = true;
	let color: string;
	let tr: string;
	const setColor = () => {
		color = isDarkMode() ? "rgb(0 0 0)" : "rgb(255 255 255)";
		tr = isDarkMode() ? "rgb(0 0 0 / 10%)" : "rgb(255 255 255 / 10%)";

		const elColor = isDarkMode() ? "white" : "black";
		paddleLeft.color = elColor;
		paddleRight.color = elColor;
		ball.color = elColor;
	};

	const clear = (transparent?: boolean) => {
		// ctx.clearRect(0, 0, gameBoard.width, gameBoard.height);

		if (transparent === false) ctx.fillStyle = color;
		else ctx.fillStyle = tr;
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
		setTimeout(() => {
			ballActive = true;
		}, 500);
	};

	let lastTime: DOMHighResTimeStamp = 0;
	const draw = (timestamp: DOMHighResTimeStamp) => {
		if (!lastTime) lastTime = timestamp;
		deltaTime = (timestamp - lastTime) / 1000;
		lastTime = timestamp;

		clear();
		if (ballActive) {
			if (!ball.draw(ctx).move(gameBoard, paddleLeft, paddleRight))
				reset();
		} else ball.draw(ctx);

		paddleLeft.draw(ctx).move(gameBoard);
		paddleRight.draw(ctx).move(gameBoard);
		animFrame = window.requestAnimationFrame(draw);
	};

	resetButton.addEventListener("click", () => {
		paddleLeft.points = 0;
		paddleRight.points = 0;
		reset();
	});

	gameBoard.addEventListener("mouseover", (e: MouseEvent) => {
		animFrame = window.requestAnimationFrame(draw);
	});

	gameBoard.addEventListener("mouseout", (e: MouseEvent) => {
		window.cancelAnimationFrame(animFrame);
		// important: fixes issue that if mouse is out, it doesnt launch the ball at mach 10
		lastTime = 0;
	});

	document.addEventListener("keydown", (e) => {
		paddleLeft.keyHandler(e, true);
		paddleRight.keyHandler(e, true);
	});

	document.addEventListener("keyup", (e) => {
		paddleLeft.keyHandler(e, false);
		paddleRight.keyHandler(e, false);
	});

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
};

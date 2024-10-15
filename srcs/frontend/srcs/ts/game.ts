import { Ball, Paddle, Routes, Scale } from "./types.js";

let animFrame: number;

const PADDLE_VELOCITY = 8;
const BALL_VELOCITY = 3;
const MAX_BALL_VELOCITY = BALL_VELOCITY * 2.5;

const referenceWidth = 840;
const referenceHeight = 500;

const ball: Ball = {
	x: 75,
	y: 150,
	vx: BALL_VELOCITY,
	vy: BALL_VELOCITY / 2.5,
	maxvX: MAX_BALL_VELOCITY,
	maxvY: MAX_BALL_VELOCITY / 2.5,
	radius: 15,
	color: "red",
	move(canvas: HTMLCanvasElement, paddleLeft: Paddle, paddleRight: Paddle) {
		this.x += this.vx;
		this.y += this.vy;

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
		if (this.x + this.radius >= canvas.width || this.x - this.radius <= 0) {
			// speed incrementation, no need to bother with this for now
			// if (this.vx > 0 && this.vx < this.maxvX) this.vx += 1;
			// else if (this.vx < 0 && this.vx > -this.maxvX) this.vx -= 1;

			if (this.x + this.radius >= canvas.width) {
				paddleLeft.points += 1;
				return false;
			} else if (this.x - this.radius <= 0) {
				paddleRight.points += 1;
				return false;
			} else this.vx *= -1;
		}

		if (
			this.y + this.radius >= canvas.height ||
			this.y - this.radius <= 0
		) {
			if (this.vy > 0 && this.vy < this.maxvY) this.vy += 1;
			else if (this.vy < 0 && this.vy > -this.maxvY) this.vy -= 1;
			this.vy *= -1;
		}
		// console.log("Ball X: ", this.x, ", velocity X: ", this.vx);
		// console.log("Ball Y: ", this.y, ", velocity Y: ", this.vy);
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
		// this.vx = 5;
		// this.vy = 2;
		return this;
	},
};

const paddleLeft: Paddle = {
	x: 0,
	y: 0,
	vy: PADDLE_VELOCITY,
	width: 25,
	height: 100,
	color: "blue",
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
		if (this.keys.up) this.y -= this.vy;
		if (this.keys.down) this.y += this.vy;
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
	width: 25,
	height: 100,
	color: "green",
	keys: {
		up: false,
		down: false,
		upKey: "ArrowUp",
		downKey: "ArrowDown",
	},
	points: 0,
	init(canvas, scale) {
		this.x = canvas.width - this.width;
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
		if (this.keys.up) this.y -= this.vy;
		if (this.keys.down) this.y += this.vy;
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
export const gameHandler = (route: Routes) => {
	console.log("current route: ", route.description);
	const entry = document.getElementById("entry");
	const gameBoard = document.getElementById(
		"game-board"
	) as HTMLCanvasElement;
	const ctx = gameBoard.getContext("2d");
	if (!ctx) return false;
	const scoreText = document.getElementById("score-text");

	const scale: Scale = {
		x: gameBoard.width / referenceWidth,
		y: gameBoard.height / referenceHeight,
	};

	const clear = () => {
		// ctx.clearRect(0, 0, gameBoard.width, gameBoard.height);
		ctx.fillStyle = "rgb(0 0 0 / 10%)";
		ctx.fillRect(0, 0, gameBoard.width, gameBoard.height);
	};

	const reset = () => {
		ball.reset(gameBoard);
		paddleLeft.reset(gameBoard);
		paddleRight.reset(gameBoard);
		if (scoreText)
			scoreText.textContent =
				paddleLeft.points + " : " + paddleRight.points;
	};

	const draw = () => {
		clear();
		if (!ball.draw(ctx).move(gameBoard, paddleLeft, paddleRight)) reset();

		paddleLeft.draw(ctx).move(gameBoard);
		paddleRight.draw(ctx).move(gameBoard);
		animFrame = window.requestAnimationFrame(draw);
	};

	gameBoard.addEventListener("mouseover", (e: MouseEvent) => {
		animFrame = window.requestAnimationFrame(draw);
	});

	gameBoard.addEventListener("mouseout", (e: MouseEvent) => {
		window.cancelAnimationFrame(animFrame);
	});

	document.addEventListener("keydown", (e) => {
		paddleLeft.keyHandler(e, true);
		paddleRight.keyHandler(e, true);
	});

	document.addEventListener("keyup", (e) => {
		paddleLeft.keyHandler(e, false);
		paddleRight.keyHandler(e, false);
	});

	ctx.fillStyle = "rgb(0 0 0)";
	ctx.fillRect(0, 0, gameBoard.width, gameBoard.height);
	ball.init(gameBoard, scale).draw(ctx);
	paddleLeft.init(gameBoard, scale).draw(ctx);
	paddleRight.init(gameBoard, scale).draw(ctx);
};

import { isDarkMode } from "../storage.js";
import { DIRECTION, PADDLE_SIZE, PADDLE_VELOCITY } from "./constants.js";

export class Paddle {
	/**
	 *
	 * @param {'left' | 'right'} side
	 * @param {HTMLCanvasElement} canvas
	 * @param {import("./ball").Scale} scale
	 */
	constructor(side, canvas, scale) {
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
		this.scale = scale;
		this.side = side;

		this.width = PADDLE_SIZE.WIDTH * scale.x;
		this.height = PADDLE_SIZE.HEIGHT * scale.y;
		this.vy = PADDLE_VELOCITY * scale.y;
		this.color = isDarkMode() ? "white" : "black";
		this.direction = DIRECTION.IDLE;
		this.points = 0;

		this.y = (canvas.height - this.height) / 2;
		if (side === "left") {
			this.x = 0;
			this.keys = {
				up: "w",
				down: "s",
				altUp: "ArrowUp",
				altDown: "ArrowDown",
			};
		} else {
			this.x = canvas.width - this.width;
			this.keys = {
				up: "ArrowUp",
				down: "ArrowDown",
				altUp: "w",
				altDown: "s",
			};
		}

		this.reset();
	}

	/**
	 * @returns {Paddle}
	 */
	reset() {
		this.y = (this.canvas.height - this.height) / 2;
		return this;
	}

	/**
	 * @returns {Paddle}
	 */
	draw() {
		this.ctx.fillStyle = this.color;
		this.ctx.fillRect(this.x, this.y, this.width, this.height);
		return this;
	}

	/**
	 * @param {number} deltaTime
	 * @returns {Paddle}
	 */
	move(deltaTime) {
		if (this.direction === DIRECTION.IDLE) return this;

		if (this.direction === DIRECTION.UP) {
			this.y -= this.vy * deltaTime;
			if (this.y < 0) this.y = 0;
		} else if (this.direction === DIRECTION.DOWN) {
			this.y += this.vy * deltaTime;
			if (this.y + this.height > this.canvas.height)
				this.y = this.canvas.height - this.height;
		}
		return this;
	}

	/**
	 * @param {KeyboardEvent} event
	 * @param {boolean} isKeyDown
	 * @param {Object} matchData
	 * @param {Function} sendMatchdata
	 * @returns {Paddle}
	 */
	keyHandler(event, isKeyDown, matchData, sendMatchdata) {
		const key = event.key;

		if (!isKeyDown) {
			if (this.direction !== DIRECTION.IDLE) {
				this.direction = DIRECTION.IDLE;
				sendMatchdata("GAME_MATCH_PADDLE_UPDATE", this.direction);
			}
			return this;
		}

		if (key === this.keys.up) {
			event.preventDefault();
			if (this.direction !== DIRECTION.UP) {
				this.direction = DIRECTION.UP;
				sendMatchdata("GAME_MATCH_PADDLE_UPDATE", this.direction);
			}
		}
		if (key === this.keys.down) {
			event.preventDefault();
			if (this.direction !== DIRECTION.DOWN) {
				this.direction = DIRECTION.DOWN;
				sendMatchdata("GAME_MATCH_PADDLE_UPDATE", this.direction);
			}
		}
		return this;
	}
}

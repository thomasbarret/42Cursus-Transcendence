// js doc for scale which has a x and y
/**
 * @typedef {Object} Scale
 * @property {number} x
 * @property {number} y
 */

import { isDarkMode } from "../storage.js";
import { BALL_VELOCITY, MAX_ANGLE_DEVIATION, RADIUS } from "./constants.js";
import { Paddle } from "./paddle.js";

export class Ball {
	/**
	 * @param {HTMLCanvasElement} canvas
	 * @param {Scale} scale
	 */
	constructor(canvas, scale) {
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
		this.scale = scale;
		this.radius = RADIUS * scale.x;
		this.reset();
		this.color = isDarkMode() ? "white" : "black";
		this.vx = 0;
		this.vy = 0;
		this.x = 0;
		this.y = 0;
	}

	/**
	 * @returns {Ball}
	 */
	reset() {
		this.x = this.canvas.width / 2;
		this.y = this.canvas.height / 2;

		const angle = (Math.random() * Math.PI) / 4 - Math.PI / 8;
		const speed = BALL_VELOCITY * this.scale.x;
		const direction = Math.random() < 0.5 ? 1 : -1;

		this.vx = direction * speed * Math.cos(angle);
		this.vy = speed * Math.sin(angle);
		return this;
	}

	/**
	 * @returns {Ball}
	 */
	draw() {
		this.ctx.beginPath();
		this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
		this.ctx.closePath();
		this.ctx.fillStyle = this.color;
		this.ctx.fill();
		return this;
	}

	/**
	 * @param {number} deltaTime
	 * @param {Paddle} paddleLeft
	 * @param {Paddle} paddleRight
	 * @returns {boolean}
	 */
	move(deltaTime, paddleLeft, paddleRight) {
		let nextX = this.x + this.vx * deltaTime;
		let nextY = this.y + this.vy * deltaTime;

		if (
			nextY - this.radius <= 0 ||
			nextY + this.radius >= this.canvas.height
		) {
			this.vy *= -1;
			nextY = this.y + this.vy * deltaTime;
		}

		/**
		 *
		 * @param {Paddle} paddle
		 * @returns {boolean}
		 */
		const paddleCollision = (paddle) => {
			return (
				nextX - this.radius < paddle.x + paddle.width &&
				nextX + this.radius > paddle.x &&
				nextY + this.radius > paddle.y &&
				nextY - this.radius < paddle.y + paddle.height
			);
		};

		/**
		 * @param {Paddle} paddle
		 * @returns {number}
		 */
		const getBounceAngle = (paddle) => {
			const relativeIntersectY = paddle.y + paddle.height / 2 - nextY;
			const normalizedRelativeIntersectionY =
				relativeIntersectY / (paddle.height / 2);
			return (
				normalizedRelativeIntersectionY *
				(MAX_ANGLE_DEVIATION * (Math.PI / 180))
			);
		};

		if (paddleCollision(paddleLeft)) {
			this.x = paddleLeft.x + paddleLeft.width + this.radius;
			this.vx *= -1;

			const bounceAngle = getBounceAngle(paddleLeft);
			const speed = Math.sqrt(this.vx ** 2 + this.vy ** 2);

			this.vx = speed * Math.cos(bounceAngle);
			this.vy = speed * -Math.sin(bounceAngle);
		} else if (paddleCollision(paddleRight)) {
			this.x = paddleRight.x - this.radius;
			this.vx *= -1;

			const bounceAngle = getBounceAngle(paddleRight);
			const speed = Math.sqrt(this.vx ** 2 + this.vy ** 2);

			this.vx = -speed * Math.cos(bounceAngle);
			this.vy = speed * -Math.sin(bounceAngle);
		}

		this.x += this.vx * deltaTime;
		this.y += this.vy * deltaTime;

		if (this.x - this.radius <= 0) {
			paddleRight.points += 1;
			this.reset();
			return false;
		} else if (this.x + this.radius >= this.canvas.width) {
			paddleLeft.points += 1;
			this.reset();
			return false;
		}
		return true;
	}
}

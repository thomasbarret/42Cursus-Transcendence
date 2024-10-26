const RADIUS = 10;
const BALL_VELOCITY = 3 * 175;
const MAX_ANGLE_DEVIATION = 45;

// js doc for scale which has a x and y
/**
 * @typedef {Object} Scale
 * @property {number} x
 * @property {number} y
 */

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
		this.color = "white";
		this.vx = 0;
		this.vy = 0;
		this.x = 0;
		this.y = 0;
	}

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

	draw() {
		this.ctx.beginPath();
		this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
		this.ctx.closePath();
		this.ctx.fillStyle = this.color;
		this.ctx.fill();
		return this;
	}

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

		const paddleCollision = (paddle) => {
			return (
				nextX - this.radius < paddle.x + paddle.width &&
				nextX + this.radius > paddle.x &&
				nextY + this.radius > paddle.y &&
				nextY - this.radius < paddle.y + paddle.height
			);
		};

		if (paddleCollision(paddleLeft)) {
			this.x = paddleLeft.x + paddleLeft.width + this.radius;
			this.vx *= -1;

			const relativeIntersectY =
				paddleLeft.y + paddleLeft.height / 2 - nextY;
			const normalizedRelativeIntersectionY =
				relativeIntersectY / (paddleLeft.height / 2);
			const bounceAngle =
				normalizedRelativeIntersectionY *
				(MAX_ANGLE_DEVIATION * (Math.PI / 180));

			const speed = Math.sqrt(this.vx ** 2 + this.vy ** 2);
			this.vx = speed * Math.cos(bounceAngle);
			this.vy = speed * -Math.sin(bounceAngle);
		} else if (paddleCollision(paddleRight)) {
			this.x = paddleRight.x - this.radius;
			this.vx *= -1;

			const relativeIntersectY =
				paddleRight.y + paddleRight.height / 2 - nextY;
			const normalizedRelativeIntersectionY =
				relativeIntersectY / (paddleRight.height / 2);
			const bounceAngle =
				normalizedRelativeIntersectionY *
				(MAX_ANGLE_DEVIATION * (Math.PI / 180));

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

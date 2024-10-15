import { isDarkMode } from "./storage.js";
let animFrame;
const PADDLE_VELOCITY = 8;
const BALL_VELOCITY = 3;
const MAX_BALL_VELOCITY = BALL_VELOCITY * 2.5;
const referenceWidth = 840;
const referenceHeight = 500;
export const gameHandler = (route) => {
    console.log("current route: ", route.description);
    const gameBoard = document.getElementById("game-board");
    const ctx = gameBoard.getContext("2d");
    if (!ctx)
        return false;
    const scoreText = document.getElementById("score-text");
    const scale = {
        x: gameBoard.width / referenceWidth,
        y: gameBoard.height / referenceHeight,
    };
    const ball = {
        x: 75,
        y: 150,
        vx: BALL_VELOCITY,
        vy: BALL_VELOCITY / 2.5,
        maxvX: MAX_BALL_VELOCITY,
        maxvY: MAX_BALL_VELOCITY / 2.5,
        radius: 15,
        color: "white",
        move(canvas, paddleLeft, paddleRight) {
            this.x += this.vx;
            this.y += this.vy;
            // if (this.x + this.radius >= canvas.width || this.x - this.radius <= 0) {
            // 	if (this.vx > 0 && this.vx < this.maxvX) this.vx += 1;
            // 	else if (this.vx < 0 && this.vx > -this.maxvX) this.vx -= 1;
            // 	this.vx *= -1;
            // }
            if ((this.x + this.radius >= paddleRight.x &&
                this.y >= paddleRight.y &&
                this.y <= paddleRight.y + paddleRight.height) ||
                (this.x - this.radius <= paddleLeft.x + paddleLeft.width &&
                    this.y >= paddleLeft.y &&
                    this.y <= paddleLeft.y + paddleLeft.height)) {
                this.vx *= -1;
                return this;
            }
            // if it touches up and down border:
            if (this.x + this.radius >= canvas.width ||
                this.x - this.radius <= 0) {
                // speed incrementation, no need to bother with this for now
                // if (this.vx > 0 && this.vx < this.maxvX) this.vx += 1;
                // else if (this.vx < 0 && this.vx > -this.maxvX) this.vx -= 1;
                if (this.x + this.radius >= canvas.width) {
                    paddleLeft.points += 1;
                }
                else if (this.x - this.radius <= 0) {
                    paddleRight.points += 1;
                }
                return false;
            }
            if (this.y + this.radius >= canvas.height ||
                this.y - this.radius <= 0) {
                if (this.vy > 0 && this.vy < this.maxvY)
                    this.vy += 1;
                else if (this.vy < 0 && this.vy > -this.maxvY)
                    this.vy -= 1;
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
    const paddleLeft = {
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
        draw(ctx) {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            return this;
        },
        move(canvas) {
            if (this.y + this.height >= canvas.height)
                this.keys.down = false;
            else if (this.y <= 0)
                this.keys.up = false;
            if (this.keys.up)
                this.y -= this.vy;
            if (this.keys.down)
                this.y += this.vy;
            return this;
        },
        keyHandler(event, value) {
            if (event.key == this.keys.upKey)
                this.keys.up = value;
            if (event.key == this.keys.downKey)
                this.keys.down = value;
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
        draw(ctx) {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            return this;
        },
        move(canvas) {
            if (this.y + this.height >= canvas.height)
                this.keys.down = false;
            else if (this.y <= 0)
                this.keys.up = false;
            if (this.keys.up)
                this.y -= this.vy;
            if (this.keys.down)
                this.y += this.vy;
            return this;
        },
        keyHandler(event, value) {
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
        reset(canvas) {
            this.x = canvas.width - this.width;
            this.y = canvas.height / 2;
            return this;
        },
    };
    let ballActive = true;
    const clear = (transparent) => {
        // ctx.clearRect(0, 0, gameBoard.width, gameBoard.height);
        const color = isDarkMode() ? "rgb(0 0 0)" : "rgb(255 255 255)";
        const tr = isDarkMode() ? "rgb(0 0 0 / 10%)" : "rgb(255 255 255 / 10%)";
        if (transparent === false)
            ctx.fillStyle = color;
        else
            ctx.fillStyle = tr;
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
    const draw = () => {
        clear();
        if (ballActive) {
            if (!ball.draw(ctx).move(gameBoard, paddleLeft, paddleRight))
                reset();
        }
        else
            ball.draw(ctx);
        paddleLeft.draw(ctx).move(gameBoard);
        paddleRight.draw(ctx).move(gameBoard);
        animFrame = window.requestAnimationFrame(draw);
    };
    gameBoard.addEventListener("mouseover", (e) => {
        animFrame = window.requestAnimationFrame(draw);
    });
    gameBoard.addEventListener("mouseout", (e) => {
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
    clear(false);
    ball.init(gameBoard, scale).draw(ctx);
    paddleLeft.init(gameBoard, scale).draw(ctx);
    paddleRight.init(gameBoard, scale).draw(ctx);
};

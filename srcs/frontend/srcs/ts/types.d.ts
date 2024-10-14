// import { AllHTMLAttributes, HTMLAttributes } from "react";

export interface Routes {
	page: string;
	title: string;
	description: string;
	handler?: (route: Routes) => void;
}

export type TagElement<K extends keyof HTMLElementTagNameMap> =
	HTMLElementTagNameMap[K] & {
		attr: (name: string, value: string) => TagElement<K>;
		onclick$: (callback: (event: MouseEvent) => void) => TagElement<K>;
	};

export interface GameObject {
	x: number;
	y: number;
	color: string;
	draw(ctx: CanvasRenderingContext2D): this;
	reset(canvas: HTMLCanvasElement): this;
	init(canvas: HTMLCanvasElement): this;
}

export interface Ball extends GameObject {
	vx: number;
	vy: number;
	maxvX: number;
	maxvY: number;
	radius: number;
	move(
		canvas: HTMLCanvasElement,
		paddleLeft: Paddle,
		paddleRight: Paddle
	): this | boolean;
}

export interface Paddle extends GameObject {
	vy: number;
	width: number;
	height: number;
	keys: {
		up: boolean;
		down: boolean;
		upKey: string;
		downKey: string;
	};
	points: number;
	move(canvas: HTMLCanvasElement): this;
	keyHandler(event: KeyboardEvent, value: boolean): this;
}

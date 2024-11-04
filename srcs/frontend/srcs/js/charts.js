import { isDarkMode } from "./storage";

export const drawLineChart = (canvasId, gameDurations, metrics) => {
	/**
	 * @type {HTMLCanvasElement}
	 */
	// @ts-ignore
	const canvas = document.getElementById(canvasId);
	const ctx = canvas.getContext("2d");

	const padding = 40;
	const width = canvas.width - padding * 2;
	const height = canvas.height - padding * 2;

	const maxDuration = Math.max(...gameDurations, metrics.longest) * 1.1;

	const scaleY = (duration) =>
		height - (duration / maxDuration) * height + padding;
	const scaleX = (index) =>
		padding + (width / (gameDurations.length - 1)) * index;

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	ctx.beginPath();
	ctx.lineWidth = 2;
	ctx.strokeStyle = "#4A90E2";
	gameDurations.forEach((duration, index) => {
		const x = scaleX(index);
		const y = scaleY(duration);
		if (index === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	});
	ctx.stroke();

	const markerColors = {
		fastest: "#33FF57",
		average: "#FFC300",
		longest: "#FF5733",
	};
	Object.entries(metrics).forEach(([key, time]) => {
		const y = scaleY(time);

		ctx.beginPath();
		ctx.strokeStyle = markerColors[key];
		ctx.lineWidth = 1;
		ctx.setLineDash([5, 5]);
		ctx.moveTo(padding, y);
		ctx.lineTo(canvas.width - padding, y);
		ctx.stroke();

		ctx.setLineDash([]);
		ctx.fillStyle = markerColors[key];
		ctx.font = "14px Arial";
		ctx.fillText(
			`${key.toUpperCase()}: ${time}s`,
			canvas.width - padding + 10,
			y
		);
	});
};

export const drawPieChart = (
	canvasId,
	data = [{ length: 0, name: "placeholder" }]
) => {
	/**
	 * @type {HTMLCanvasElement}
	 */
	// @ts-ignore
	const canvas = document.getElementById(canvasId);
	const ctx = canvas.getContext("2d");
	const colors = ["#FF5733", "#33FF57", "#3357FF"];

	const total = data.reduce((prev, curr) => prev + curr.length, 0);

	let startAngle = 0;
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	const radius = canvas.width / 6;
	const centerX = canvas.width / 2;
	const centerY = canvas.height / 2;

	data.forEach(({ length, name }, index) => {
		const sliceAngle = (length / total) * 2 * Math.PI;
		const sliceMidAngle = startAngle + sliceAngle / 2;

		ctx.beginPath();
		ctx.moveTo(centerX, centerY);
		ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
		ctx.closePath();
		ctx.fillStyle = colors[index % colors.length];
		ctx.fill();

		const textX = centerX + (radius + 20) * Math.cos(sliceMidAngle);
		const textY = centerY + (radius + 20) * Math.sin(sliceMidAngle);
		ctx.fillStyle = isDarkMode() ? "white" : "black";
		ctx.font = "14px Arial";
		ctx.fillText(
			`${name.toUpperCase()} ${((length / total) * 100).toFixed(1)}%`,
			textX,
			textY
		);

		startAngle += sliceAngle;
	});
};

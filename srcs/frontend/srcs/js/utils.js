export const formatChatDate = (value) => {
	const date = new Date(value);
	const formattedDate = `${date.getDate()} ${date.toLocaleString("en-US", {
		month: "short",
	})} ${date.getHours().toString().padStart(2, "0")}:${date
		.getMinutes()
		.toString()
		.padStart(2, "0")}`;

	return formattedDate;
};

export const invertColor = (hex) => {
	return (Number(`0x1${hex}`) ^ 0xffffff)
		.toString(16)
		.substr(1)
		.toUpperCase();
};

export const hexToRGBA = (hex, opacity) => {
	hex = hex.replace("#", "");

	let r = parseInt(hex.substring(0, 2), 16);
	let g = parseInt(hex.substring(2, 4), 16);
	let b = parseInt(hex.substring(4, 6), 16);

	return `rgb(${r} ${g} ${b} / ${opacity}%)`;
};

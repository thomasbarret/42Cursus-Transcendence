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
		.substring(1)
		.toUpperCase();
};

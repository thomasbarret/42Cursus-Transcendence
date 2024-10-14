import { h1, tag } from "./framework.js";
import { Routes } from "./types";

export const indexHandler = (route: Routes) => {
	console.log("current route: ", route.description);
	let entry = document.getElementById("entry");

	let elements = tag(
		"div",
		tag("h1", "this is the content of the h1").attr("id", "wow"),
		tag("a", "this is the content of the ahref")
			.attr("href", "/asdf")
			.attr("id", "navigation"),
		[...Array(10)].map((_, i) =>
			h1("this is text number: ", i.toString()).onclick$(() =>
				console.log(i)
			)
		)
	);
	if (entry) entry.appendChild(elements);
};

export const contactHandler = (route: Routes) => {
	console.log("current route: ", route.description);
};

export const aboutHandler = (route: Routes) => {
	console.log("current route: ", route.description);
};

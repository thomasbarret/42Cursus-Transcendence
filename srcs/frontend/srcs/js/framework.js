export const t = (name, ...child) => {
	const result = document.createElement(name);
	const appendChildTag = (el) => {
		if (typeof el === "string")
			result.appendChild(document.createTextNode(el));
		else result.appendChild(el);
	};
	child.flat().forEach(appendChildTag);
	result.attr = (name, value) => {
		result.setAttribute(name, value);
		return result;
	};
	result.cl = (value) => {
		if (value.length === 0) return result;
		const vals = value.split(" ");
		result.classList.add(...vals);
		return result;
	};
	result.onclick$ = (callback) => {
		result.onclick = callback;
		return result;
	};
	return result;
};
export const h1 = (...children) => t("h1", ...children);
export const h2 = (...children) => t("h2", ...children);
export const h3 = (...children) => t("h3", ...children);
export const h4 = (...children) => t("h4", ...children);
export const h5 = (...children) => t("h5", ...children);
export const h6 = (...children) => t("h6", ...children);
export const p = (...children) => t("p", ...children);
export const a = (href, ...children) => t("a", ...children).attr("href", href);
export const img = (source, ...children) =>
	t("img", ...children).attr("src", source);
export const div = (...children) => t("div", ...children);
export const span = (...children) => t("span", ...children);
export const button = (...children) => t("button", ...children);
export const li = (...children) => t("li", ...children);
export const ul = (...children) => t("ul", ...children);

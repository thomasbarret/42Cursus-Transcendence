import { TagElement } from "./types";

export const t = <K extends keyof HTMLElementTagNameMap>(
	name: keyof HTMLElementTagNameMap,
	...child: (
		| TagElement<K>
		| HTMLElement
		| string
		| (TagElement<K> | HTMLElement | string)[]
	)[]
): TagElement<K> => {
	const result = document.createElement(name) as TagElement<K>;

	const appendChildTag = (el: TagElement<K> | string) => {
		if (typeof el === "string")
			result.appendChild(document.createTextNode(el));
		else result.appendChild(el);
	};

	(child.flat() as (TagElement<K> | string)[]).forEach(appendChildTag);

	result.attr = (name, value) => {
		result.setAttribute(name as string, value);
		return result;
	};

	result.cl = (value: string) => {
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

export const h1 = (
	...children: (
		| HTMLElement
		| TagElement<keyof HTMLElementTagNameMap>
		| string
	)[]
): TagElement<keyof HTMLElementTagNameMap> => t("h1", ...children);

export const h2 = (
	...children: (
		| HTMLElement
		| TagElement<keyof HTMLElementTagNameMap>
		| string
	)[]
): TagElement<keyof HTMLElementTagNameMap> => t("h2", ...children);

export const h3 = (
	...children: (
		| HTMLElement
		| TagElement<keyof HTMLElementTagNameMap>
		| string
	)[]
): TagElement<keyof HTMLElementTagNameMap> => t("h3", ...children);

export const h4 = (
	...children: (
		| HTMLElement
		| TagElement<keyof HTMLElementTagNameMap>
		| string
	)[]
): TagElement<keyof HTMLElementTagNameMap> => t("h4", ...children);

export const h5 = (
	...children: (
		| HTMLElement
		| TagElement<keyof HTMLElementTagNameMap>
		| string
	)[]
): TagElement<keyof HTMLElementTagNameMap> => t("h5", ...children);

export const h6 = (
	...children: (
		| HTMLElement
		| TagElement<keyof HTMLElementTagNameMap>
		| string
	)[]
): TagElement<keyof HTMLElementTagNameMap> => t("h6", ...children);

export const p = (
	...children: (
		| HTMLElement
		| TagElement<keyof HTMLElementTagNameMap>
		| string
	)[]
): TagElement<keyof HTMLElementTagNameMap> => t("p", ...children);

export const a = (
	href: string,
	...children: (
		| HTMLElement
		| TagElement<keyof HTMLElementTagNameMap>
		| string
	)[]
): TagElement<keyof HTMLElementTagNameMap> =>
	t("a", ...children).attr("href", href);

export const img = (
	source: string,
	...children: (
		| HTMLElement
		| TagElement<keyof HTMLElementTagNameMap>
		| string
	)[]
): TagElement<keyof HTMLElementTagNameMap> =>
	t("img", ...children).attr("src", source);

export const div = (
	...children: (
		| HTMLElement
		| TagElement<keyof HTMLElementTagNameMap>
		| string
	)[]
): TagElement<keyof HTMLElementTagNameMap> => t("div", ...children);

export const span = (
	...children: (
		| HTMLElement
		| TagElement<keyof HTMLElementTagNameMap>
		| string
	)[]
): TagElement<keyof HTMLElementTagNameMap> => t("span", ...children);

export const button = (
	...children: (
		| HTMLElement
		| TagElement<keyof HTMLElementTagNameMap>
		| string
	)[]
): TagElement<keyof HTMLElementTagNameMap> => t("button", ...children);

export const li = (
	...children: (
		| HTMLElement
		| TagElement<keyof HTMLElementTagNameMap>
		| string
	)[]
): TagElement<keyof HTMLElementTagNameMap> => t("li", ...children);

export const ul = (
	...children: (
		| HTMLElement
		| TagElement<keyof HTMLElementTagNameMap>
		| string
	)[]
): TagElement<keyof HTMLElementTagNameMap> => t("ul", ...children);

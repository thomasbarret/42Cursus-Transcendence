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

export const p = (
	...children: (
		| HTMLElement
		| TagElement<keyof HTMLElementTagNameMap>
		| string
	)[]
): TagElement<keyof HTMLElementTagNameMap> => t("p", ...children);

export const a = (
	...children: (
		| HTMLElement
		| TagElement<keyof HTMLElementTagNameMap>
		| string
	)[]
): TagElement<keyof HTMLElementTagNameMap> => t("a", ...children);

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

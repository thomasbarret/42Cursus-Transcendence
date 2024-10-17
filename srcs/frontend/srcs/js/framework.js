export const t = (name, ...child) => {
    const result = document.createElement(name);
    const appendChildTag = (el) => {
        if (typeof el === "string")
            result.appendChild(document.createTextNode(el));
        else
            result.appendChild(el);
    };
    child.flat().forEach(appendChildTag);
    result.attr = (name, value) => {
        result.setAttribute(name, value);
        return result;
    };
    result.cl = (value) => {
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
export const p = (...children) => t("p", ...children);
export const a = (...children) => t("a", ...children);
export const div = (...children) => t("div", ...children);
export const span = (...children) => t("span", ...children);

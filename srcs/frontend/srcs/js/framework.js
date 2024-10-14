export const tag = (name, ...child) => {
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
    result.onclick$ = (callback) => {
        result.onclick = callback;
        return result;
    };
    return result;
};
export const h1 = (...children) => tag("h1", ...children);
export const p = (...children) => tag("p", ...children);
export const a = (...children) => tag("a", ...children);
export const div = (...children) => tag("div", ...children);
export const span = (...children) => tag("span", ...children);

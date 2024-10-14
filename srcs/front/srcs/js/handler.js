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
export const indexHandler = (route) => {
    console.log("current route: ", route.description);
    let entry = document.getElementById("entry");
    let elements = tag("div", tag("h1", "this is the content of the h1").attr("id", "wow"), tag("a", "this is the content of the ahref")
        .attr("href", "/asdf")
        .attr("id", "navigation"), [...Array(10)].map((_, i) => tag("h1", "this is text number: ", i.toString()).onclick$(() => console.log(i))));
    if (entry)
        entry.appendChild(elements);
};
export const contactHandler = (route) => {
    console.log("current route: ", route.description);
};
export const aboutHandler = (route) => {
    console.log("current route: ", route.description);
};

import { div, p, span, t } from "./framework.js";
// @ts-ignore
import * as bootstrap from "bootstrap";
export const ToastComponent = (value, level) => {
    return div(div(div(div(value).cl("toast-body"), t("button")
        .attr("type", "button")
        .cl("btn-close btn-close-white me-2 m-auto")
        .attr("data-bs-dismiss", "toast")
        .attr("aria-label", "Close")).cl("d-flex"))
        .cl(`toast align-items-center position-relative text-bg-${level ? level : "success"} border-0`)
        .attr("role", "alert")
        .attr("aria-live", "assertive")
        .attr("aria-atomic", "true")
        .attr("id", "toast-component")).cl("toast-container position-fixed bottom-0 end-0 p-3");
};
export const Toast = (value, level, delay) => {
    if (level === "")
        level = "primary";
    const toast = ToastComponent(value, level);
    document.body.appendChild(toast);
    const el = document.getElementById("toast-component");
    const toastBootstrap = bootstrap.Toast.getOrCreateInstance(el, {
        delay: delay ? delay : 3000,
    });
    toastBootstrap.show();
    el.addEventListener("hidden.bs.toast", () => el.remove());
};
export const userListBox = (text) => {
    const img = t("img")
        .attr("src", "https://picsum.photos/50?random=1")
        .attr("alt", "user avatar")
        .cl("rounded-circle me-2")
        .attr("style", "width: 35px; height: 35px");
    const user = span(text).cl("small fw-semibold");
    const li = t("li", img, user).cl("d-flex align-items-center mb-3 btn btn-primary");
    return li;
};
export const messageBoxRight = (text, time) => {
    const img = t("img")
        .attr("src", "https://picsum.photos/45")
        .attr("alt", "avatar 1")
        .attr("style", "width: 30px; height: 30px")
        .attr("class", "rounded-circle");
    const content = div(p(text).attr("class", "small p-2 me-3 mb-1 rounded-3 bg-primary text-white"), p(time).attr("class", "small me-3 mb-3 rounded-3 text-muted d-flex justify-content-end"));
    const message = div(content, img).attr("class", "d-flex flex-row justify-content-end mb-3 pt-1");
    return message;
};
export const messageBoxLeft = (text, time) => {
    const img = t("img")
        .attr("src", "https://picsum.photos/45")
        .attr("alt", "avatar 1")
        .attr("style", "width: 30px; height: 30px")
        .attr("class", "rounded-circle");
    const content = div(p(text).attr("class", "small p-2 ms-3 mb-1 rounded-3  bg-body-secondary text-body-primary"), p(time).attr("class", "small ms-3 mb-3 rounded-3 text-muted"));
    const message = div(img, content).attr("class", "d-flex flex-row justify-content-start mb-3");
    return message;
};

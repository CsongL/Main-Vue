import { createRender } from '../runtime-core'

export function createElement(type) {
    return document.createElement(type);
}

export function patchProps(el, key, val) {
    // 判断属性是一个要添加在元素上的事件还是只是单纯的元素属性
    let isOnEvent = /^on[A-Z]/.test(key);
    if(isOnEvent) {
        let eventName = key.slice(2).toLowerCase();
        el.addEventListener(eventName, val);
    } else {
        el.setAttribute(key, val);
    }
}

export function insert(el, container) {
    container.appendChild(el);
}

let renderer: any = createRender({
    createElement,
    patchProps,
    insert
})

export const createApp = (...args) => {
    return renderer.createApp(...args);
}

export * from '../runtime-core'
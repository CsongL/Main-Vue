import { createRender } from '../runtime-core'

export function createElement(type) {
    return document.createElement(type);
}

export function patchProps(el, key, prevVal, nextVal) {
    // 判断属性是一个要添加在元素上的事件还是只是单纯的元素属性
    let isOnEvent = /^on[A-Z]/.test(key);
    if(isOnEvent) {
        let eventName = key.slice(2).toLowerCase();
        el.addEventListener(eventName, nextVal);
    } else {
        if(nextVal === undefined || nextVal === null) {
            el.removeAttribute(key);
        } else {
            el.setAttribute(key, nextVal);
        }
    }
}

export function remove(el) {
    const parent = el.parentNode;
    console.log('remove', el, parent);
    if(parent) {
        parent.removeChild(el);
    }
}

export function setElementText(el, text) {
    el.textContent = text;
}

export function insert(el, container, anchor = null) {
    container.insertBefore(el, anchor);
}

let renderer: any = createRender({
    createElement,
    patchProps,
    insert,
    remove,
    setElementText
})

export const createApp = (...args) => {
    return renderer.createApp(...args);
}

export * from '../runtime-core'
import { ShapeFlags } from "../shared/shapeFlags";
import { isObject } from "../shared/index"

export const Fragment = Symbol("Fragment");
export const Text = Symbol("Text");


export function createVNode(type, props?, children?) {
    const vNode = {
        type, // 其实就是组件对象或者元素对象
        props, // 组件或者元素属性
        children, // 组件内的子元素或 元素内的子元素
        shapeFlags: getShapeFlag(type), // 该虚拟节点的类型是什么类型，组件或元素以及children的类型
        el: null // 获取该虚拟节点的根元素
    }

    if(vNode.shapeFlags && typeof vNode.children === 'string') {
        vNode.shapeFlags = vNode.shapeFlags | ShapeFlags.TEXT_CHILDREN;
    } else if(vNode.shapeFlags && Array.isArray(vNode.children)) {
        vNode.shapeFlags = vNode.shapeFlags | ShapeFlags.ARRAY_CHILDREN;
    }

    nomalizeSlots(vNode, vNode.children)
    return vNode;
}

function nomalizeSlots(vNode, children) {
    if(vNode.shapeFlags & ShapeFlags.STATEFUL_COMPONENT) {
        if(typeof children === 'object') {
            vNode.shapeFlags |= ShapeFlags.SLOTS_CHILDREN;
        }
    }
}

function getShapeFlag(type) {
    if(typeof type === 'string') {
        return ShapeFlags.ELEMENT;
    } else if(isObject(type)) {
        return ShapeFlags.STATEFUL_COMPONENT;
    }
}

export function createTextVNode(text: string) {
    createVNode(Text, {}, text);
}
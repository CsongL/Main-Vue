export function createVNode(type, props?, children?) {
    const vNode = {
        type, // 其实就是组件对象或者元素对象
        props, // 组件或者元素属性
        children, // 组件内的子元素或 元素内的子元素
        el: null // 获取该虚拟节点的根元素
    }
    return vNode;
}
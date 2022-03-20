import { createVNode } from "./vNode";

export function createAppApi(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                // 不论是什么 先要创建一个vNode, 因为之后的逻辑操作都是在vNode上进行的
                const vNode = createVNode(rootComponent);
                // 调用render函数 在跟容器上渲染根组件对应的虚拟节点
                render(vNode, rootContainer);
            }
        }
    }
}

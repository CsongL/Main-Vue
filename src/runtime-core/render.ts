import { createComponentInstance, setupComponent } from './component'

export function render(vNode, container) {
    // 调用patch进行vNode的拆箱操作，也就是看虚拟节点后是否还有其他节点
    patch(vNode, container);
}

function patch(vNode, container) {
    // 先判虚拟节点的类型 是元素还是 组件
    // 如果是元素 则调用 processElement();
    // 如果是组件 则调用 processComponent();
    processComponent(vNode, container);
}

function processComponent(vNode, container) {
    // 判断是要重新创建一个组件，还是更新一个组件
    // 创建一个新的组件
    mountComponent(vNode, container);
}

function mountComponent(vNode, container) {
    // 第一步创建一个组件实例对象
    const instance = createComponentInstance(vNode);

    // 第二部设置组件实例对象的属性
    setupComponent(instance);
    setupRenderEffect(instance, container);
}

function setupRenderEffect(instance, container) {
    const subTree = instance.render;

    if(subTree) {
        patch(subTree, container);
    }
}
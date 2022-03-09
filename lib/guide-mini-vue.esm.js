function createVNode(type, props, children) {
    const vNode = {
        type // 其实就是组件对象或者元素对象
    };
    return vNode;
}

function createComponentInstance(vNode) {
    const instance = {
        vNode,
        type: vNode.type // vNode.type 对应的才是真正的组件
    };
    return instance;
}
function setupComponent(instance) {
    // initProps
    // initSlots
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const component = instance.type;
    let { setup } = component;
    if (setup) {
        const setupResult = setup();
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // 如果setupResult是一个对象
    if (typeof setupResult === 'object') {
        instance.setupState = setupResult;
    }
    finishComponent(instance);
}
function finishComponent(instance) {
    const component = instance.type;
    if (!instance.render) {
        instance.render = component.render;
    }
}

function render(vNode, container) {
    // 调用patch进行vNode的拆箱操作，也就是看虚拟节点后是否还有其他节点
    patch(vNode);
}
function patch(vNode, container) {
    // 先判虚拟节点的类型 是元素还是 组件
    // 如果是元素 则调用 processElement();
    // 如果是组件 则调用 processComponent();
    processComponent(vNode);
}
function processComponent(vNode, container) {
    // 判断是要重新创建一个组件，还是更新一个组件
    // 创建一个新的组件
    mountComponent(vNode);
}
function mountComponent(vNode, container) {
    // 第一步创建一个组件实例对象
    const instance = createComponentInstance(vNode);
    // 第二部设置组件实例对象的属性
    setupComponent(instance);
    setupRenderEffect(instance);
}
function setupRenderEffect(instance, container) {
    const subTree = instance.render;
    if (subTree) {
        patch(subTree);
    }
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            // 不论是什么 先要创建一个vNode, 因为之后的逻辑操作都是在vNode上进行的
            const vNode = createVNode(rootComponent);
            // 调用render函数 在跟容器上渲染根组件对应的虚拟节点
            render(vNode);
        }
    };
}

function h(type, props, children) {
    return createVNode(type);
}

export { createApp, h };

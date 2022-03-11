function createVNode(type, props, children) {
    const vNode = {
        type,
        props,
        children,
        el: null // 获取该虚拟节点的根元素
    };
    return vNode;
}

const publicPropertiesMap = {
    $el: (i) => i.vNode.el
};
const componentPublicInstance = {
    get({ _: instance }, key) {
        let { setupState } = instance;
        if (key in setupState) {
            return setupState[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    }
};

function createComponentInstance(vNode) {
    const instance = {
        vNode,
        type: vNode.type,
        setupState: {}
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
    // 设置组件实例对象代理属性，设置这个是为能够在组件对象的render()方法中去调用组件setup()方法所返回的对象中的属性
    instance.proxy = new Proxy({ _: instance }, componentPublicInstance);
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

const isObject = (val) => {
    return val !== null && typeof val === 'object';
};

function render(vNode, container) {
    // 调用patch进行vNode的拆箱操作，也就是看虚拟节点后是否还有其他节点
    patch(vNode, container);
}
function patch(vNode, container) {
    // 先判虚拟节点的类型 是元素还是 组件
    // 如果虚拟节点的type是一个string类型， 那么该虚拟节点就是一个元素，
    // 如果vNode.type 类型是一个Object，那么这个虚拟节点就是一个组件
    // 如果是元素 则调用 processElement();
    // 如果是组件 则调用 processComponent();
    let { type } = vNode;
    if (typeof type === 'string') {
        processElement(vNode, container);
    }
    else if (isObject(type)) {
        processComponent(vNode, container);
    }
}
function processElement(vNode, container) {
    // 在这里要去判断是新建一个元素还是更新一个元素
    mountElement(vNode, container);
}
function mountElement(vNode, container) {
    // 走到这里说明vNode表示的是一个元素，因此vNode.type表述的就是该元素的类型
    let el = (vNode.el = document.createElement(vNode.type));
    let { children } = vNode;
    if (typeof children === "string") {
        el.textContent = children;
    }
    else if (Array.isArray(children)) {
        // 因为是挂载该元素的子元素，因此该元素就应该是这些子元素的容器
        mountChildren(children, el);
    }
    let { props } = vNode;
    for (const key in props) {
        el.setAttribute(key, props[key]);
    }
    container.appendChild(el);
}
function mountChildren(children, container) {
    children.forEach((v) => {
        patch(v, container);
    });
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
    setupRenderEffect(instance, vNode, container);
}
function setupRenderEffect(instance, vNode, container) {
    let { proxy } = instance;
    const subTree = instance.render.call(proxy);
    if (subTree) {
        patch(subTree, container);
    }
    vNode.el = subTree.el;
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            // 不论是什么 先要创建一个vNode, 因为之后的逻辑操作都是在vNode上进行的
            const vNode = createVNode(rootComponent);
            // 调用render函数 在跟容器上渲染根组件对应的虚拟节点
            render(vNode, rootContainer);
        }
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

export { createApp, h };

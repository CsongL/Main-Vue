const extend = Object.assign;
const isObject = (val) => {
    return val !== null && typeof val === 'object';
};
const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const camelize = (str) => {
    return str.replace(/-(\w)/, (_, c) => {
        return c.toUpperCase();
    });
};
const captialize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
function createVNode(type, props, children) {
    const vNode = {
        type,
        props,
        children,
        shapeFlags: getShapeFlag(type),
        el: null // 获取该虚拟节点的根元素
    };
    if (vNode.shapeFlags && typeof vNode.children === 'string') {
        vNode.shapeFlags = vNode.shapeFlags | 4 /* TEXT_CHILDREN */;
    }
    else if (vNode.shapeFlags && Array.isArray(vNode.children)) {
        vNode.shapeFlags = vNode.shapeFlags | 8 /* ARRAY_CHILDREN */;
    }
    nomalizeSlots(vNode, vNode.children);
    return vNode;
}
function nomalizeSlots(vNode, children) {
    if (vNode.shapeFlags & 2 /* STATEFUL_COMPONENT */) {
        if (typeof children === 'object') {
            vNode.shapeFlags |= 16 /* SLOTS_CHILDREN */;
        }
    }
}
function getShapeFlag(type) {
    if (typeof type === 'string') {
        return 1 /* ELEMENT */;
    }
    else if (isObject(type)) {
        return 2 /* STATEFUL_COMPONENT */;
    }
}
function createTextVNode(text) {
    createVNode(Text, {}, text);
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

const publicPropertiesMap = {
    $el: (i) => i.vNode.el,
    $slot: (i) => i.slots
};
const componentPublicInstance = {
    get({ _: instance }, key) {
        let { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        if (hasOwn(props, key)) {
            return props[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    }
};

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

function createDep(effects) {
    const dep = new Set(effects);
    return dep;
}

const targetMap = new WeakMap(); //key是 target(目标独享), value是一个map
function trigger(target, type, key) {
    let depMap = targetMap.get(target);
    if (!depMap)
        return;
    let deps = [];
    let dep = depMap.get(key);
    deps.push(dep);
    let effects = [];
    deps.forEach((dep) => {
        effects.push(...dep);
    });
    triggerEffects(createDep(effects));
}
function triggerEffects(dep) {
    for (let effect of dep) {
        if (effect.schedule) {
            effect.schedule();
        }
        else {
            effect.run();
        }
    }
}

const get = createGet();
const set = createSet();
const readonlyGet = createGet(true);
const shallowReadonlyGet = createGet(true, true);
function createGet(isReadonly = false, isShallow = false) {
    return function get(target, key, receiver) {
        if (key === "__V_isReactive" /* IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "__V_isReadonly" /* IS_READONLY */) {
            return isReadonly;
        }
        let result = Reflect.get(target, key, receiver);
        // 只有最外层对象是一个响应式对象，对象内部属性所对应的对象不再将其变为一个内部对象
        if (isShallow) {
            return result;
        }
        if (isObject(result)) {
            return isReadonly ? readonly(result) : reactive(result);
        }
        return result;
    };
}
function createSet() {
    return function set(target, key, value, receiver) {
        let result = Reflect.set(target, key, value, receiver);
        // 触发依赖
        trigger(target, 'set', key);
        return result;
    };
}
const mutableHandler = {
    get,
    set
};
const readonlyHandler = {
    get: readonlyGet,
    set(target, key) {
        console.warn(`Set target's ${String(key)} failed, because target is readonly`, target);
        return true;
    }
};
const shallowReadonlyHandler = extend({}, readonlyHandler, {
    get: shallowReadonlyGet
});

// reactiveMap  用来  存储target的代理对象
const reactiveMap = new WeakMap();
function reactive(target) {
    return createReactiveObj(target, mutableHandler);
}
function readonly(target) {
    return createReactiveObj(target, readonlyHandler);
}
function shallowReadonly(target) {
    return createReactiveObj(target, shallowReadonlyHandler);
}
function createReactiveObj(target, baseHandler) {
    // 如果之前已经创建过代理对象那么从map中获取，提高效率
    if (reactiveMap.has(target))
        return reactiveMap.get(target);
    const proxy = new Proxy(target, baseHandler);
    reactiveMap.set(target, proxy);
    return proxy;
}

function emit(instance, event, ...args) {
    const { props } = instance.vNode;
    const toHandlerKey = (str) => {
        return 'on' + captialize(str);
    };
    let key = toHandlerKey(camelize(event));
    if (hasOwn(props, key)) {
        const handler = props[key];
        handler(...args);
    }
}

function initSlots(instance, children) {
    let { vNode } = instance;
    if (vNode.shapeFlags & 16 /* SLOTS_CHILDREN */) {
        normalizeObjectSlots(children, (instance.slots = {}));
    }
}
function normalizeObjectSlots(rawSlots, slots) {
    for (const key in rawSlots) {
        let value = rawSlots[key];
        if (typeof value === 'function') {
            slots[key] = (prop) => normalizeSlots(value(prop));
        }
    }
}
function normalizeSlots(value) {
    return Array.isArray(value) ? value : [value];
}

function createComponentInstance(vNode, parent) {
    const instance = {
        vNode,
        type: vNode.type,
        setupState: {},
        props: {},
        slots: {},
        provides: parent ? parent.provides : {},
        parent,
        emit: () => { }, // 声明组件实例对象的emit属性
    };
    instance.emit = emit.bind(null, instance);
    return instance;
}
function setupComponent(instance) {
    let { props, children } = instance.vNode;
    // initProps
    initProps(instance, props);
    // initSlots
    initSlots(instance, children);
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const component = instance.type;
    // 设置组件实例对象代理属性，设置这个是为能够在组件对象的render()方法中去调用组件setup()方法所返回的对象中的属性
    instance.proxy = new Proxy({ _: instance }, componentPublicInstance);
    let { setup } = component;
    if (setup) {
        setCurrentInstance(instance);
        const setupResult = setup(shallowReadonly(instance.props), { emit: instance.emit });
        handleSetupResult(instance, setupResult);
    }
    setCurrentInstance(null);
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
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}

function createAppApi(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                // 不论是什么 先要创建一个vNode, 因为之后的逻辑操作都是在vNode上进行的
                const vNode = createVNode(rootComponent);
                // 调用render函数 在跟容器上渲染根组件对应的虚拟节点
                render(vNode, rootContainer);
            }
        };
    };
}

function createRender(options) {
    const { createElement: hostCreateElement, patchProps: hostPatchProps, insert: hostInsert, } = options;
    function render(vNode, container) {
        // 调用patch进行vNode的拆箱操作，也就是看虚拟节点后是否还有其他节点
        patch(vNode, container, null);
    }
    function patch(vNode, container, parentComponent) {
        // 先判虚拟节点的类型 是元素还是 组件
        // 如果虚拟节点的type是一个string类型， 那么该虚拟节点就是一个元素，
        // 如果vNode.type 类型是一个Object，那么这个虚拟节点就是一个组件
        // 如果是元素 则调用 processElement();
        // 如果是组件 则调用 processComponent();
        let { type, shapeFlags } = vNode;
        switch (type) {
            case Fragment:
                processFragment(vNode, container, parentComponent);
                break;
            case Text:
                processText(vNode, container);
                break;
            default:
                if (shapeFlags & 1 /* ELEMENT */) {
                    processElement(vNode, container, parentComponent);
                }
                else if (shapeFlags & 2 /* STATEFUL_COMPONENT */) {
                    processComponent(vNode, container, parentComponent);
                }
        }
    }
    function processFragment(vNode, container, parentComponent) {
        mountChildren(vNode, container, parentComponent);
    }
    function processText(vNode, container) {
        let { children } = vNode;
        let textNode = document.createTextNode(children.text);
        container.appendChild(textNode);
    }
    function processElement(vNode, container, parentComponent) {
        // 在这里要去判断是新建一个元素还是更新一个元素
        mountElement(vNode, container, parentComponent);
    }
    function mountElement(vNode, container, parentComponent) {
        // 走到这里说明vNode表示的是一个元素，因此vNode.type表述的就是该元素的类型
        let el = (vNode.el = hostCreateElement(vNode.type));
        let { children, shapeFlags } = vNode;
        if (shapeFlags & 4 /* TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (shapeFlags & 8 /* ARRAY_CHILDREN */) {
            // 因为是挂载该元素的子元素，因此该元素就应该是这些子元素的容器
            mountChildren(children, el, parentComponent);
        }
        let { props } = vNode;
        for (const key in props) {
            const val = props[key];
            hostPatchProps(el, key, val);
        }
        hostInsert(el, container);
    }
    function mountChildren(children, container, parentComponent) {
        children.forEach((v) => {
            patch(v, container, parentComponent);
        });
    }
    function processComponent(vNode, container, parentComponent) {
        // 判断是要重新创建一个组件，还是更新一个组件
        // 创建一个新的组件
        mountComponent(vNode, container, parentComponent);
    }
    function mountComponent(vNode, container, parentComponent) {
        // 第一步创建一个组件实例对象
        const instance = createComponentInstance(vNode, parentComponent);
        // 第二部设置组件实例对象的属性
        setupComponent(instance);
        setupRenderEffect(instance, vNode, container);
    }
    function setupRenderEffect(instance, vNode, container) {
        let { proxy } = instance;
        if (!instance.render)
            return;
        const subTree = instance.render.call(proxy);
        if (subTree) {
            patch(subTree, container, instance);
        }
        vNode.el = subTree.el;
    }
    // 最终返回的是一个对象，这个对象里面有一个createApp属性
    // 这个属性对应的就是createApp.ts文件中 createAppApi方法返回的那个函数
    return {
        createApp: createAppApi(render)
    };
}

function renderSlots(slots, name, prop) {
    const slot = slots[name];
    if (slot) {
        if (typeof slot === 'function') {
            return createVNode('div', {}, slot(prop));
        }
    }
}

function provide(key, value) {
    var _a;
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        const parentProvides = (_a = currentInstance.parent) === null || _a === void 0 ? void 0 : _a.provides;
        if (provides === parentProvides) {
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    var _a;
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const parentProvides = (_a = currentInstance.parent) === null || _a === void 0 ? void 0 : _a.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) {
            if (typeof defaultValue === 'function') {
                return defaultValue();
            }
            return defaultValue;
        }
    }
}

function createElement(type) {
    return document.createElement(type);
}
function patchProps(el, key, val) {
    // 判断属性是一个要添加在元素上的事件还是只是单纯的元素属性
    let isOnEvent = /^on[A-Z]/.test(key);
    if (isOnEvent) {
        let eventName = key.slice(2).toLowerCase();
        el.addEventListener(eventName, val);
    }
    else {
        el.setAttribute(key, val);
    }
}
function insert(el, container) {
    container.appendChild(el);
}
let renderer = createRender({
    createElement,
    patchProps,
    insert
});
const createApp = (...args) => {
    return renderer.createApp(...args);
};

export { createApp, createElement, createRender, createTextVNode, getCurrentInstance, h, inject, insert, patchProps, provide, renderSlots };

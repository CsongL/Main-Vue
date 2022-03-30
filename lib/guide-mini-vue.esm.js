const extend = Object.assign;
const EMPTY_OBJECT = {};
const isObject = (val) => {
    return val !== null && typeof val === 'object';
};
const hasChanged = (value, oldValue) => {
    return !Object.is(value, oldValue);
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
        component: null,
        key: props === null || props === void 0 ? void 0 : props.key,
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
    $slot: (i) => i.slots,
    $props: (i) => i.props,
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

let activeEffect = void 0; // 全局变量 表示正在收集的依赖
let shouldTrack = false; // 用来判断是否应该收集这个依赖，在代码作用机制上与activeEffect类似
const targetMap = new WeakMap(); //key是 target(目标独享), value是一个map
// 依赖对象类
class ReactiveEffect {
    // public 的作用是 实例对象可以访问到 就相当于是 this.fn = fn;
    constructor(fn, schedule) {
        this.fn = fn;
        this.schedule = schedule;
        // 用来标明这个effect对象是否还起作用，也就是这个effect对象是否还会被调用
        // 另一方面也是用来优化, 避免多次调用active函数
        this.active = true;
        this.deps = [];
        console.log('创建ReactiveEffect 对象');
    }
    run() {
        console.log('ReactiveEffect run function');
        // 在这个函数里面执行fn, 从而实现 依赖收集
        // 如果这个effect实例对象已经调用过stop()函数,那么就不应该在出发依赖收集,而只是单纯的执行函数
        // 如果调用过stop()函数，那么会到只this.active标签的值变为false，
        if (!this.active) {
            this.fn();
        }
        activeEffect = this;
        shouldTrack = true;
        if (!activeEffect)
            return;
        let result = activeEffect.fn(); // 在执行这个函数的过程中，从而触发track()收集依赖
        activeEffect = undefined;
        shouldTrack = false;
        return result;
    }
    stop() {
        if (this.active) {
            cleanupEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    }
}
function cleanupEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    effect.deps.length = 0;
}
function effect(fn, options = {}) {
    // 创建依赖实例对象
    const _effect = new ReactiveEffect(fn, options.schedule);
    // 通过object方法将options上的属性都赋值给依赖实例对象
    extend(_effect, options);
    // 执行依赖实例对象的run函数
    _effect.run();
    // 为什么要有runner 想要直接通过runner运行run函数从而拿到fn函数的返回值
    let runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}
function isTrack() {
    return shouldTrack && activeEffect !== undefined;
}
function track(target, type, key) {
    // 在开始收集依赖之前，判断是shouldTrack 是否为true 以及 activeEffect是否有对应的值
    if (!isTrack()) {
        return;
    }
    let depMap = targetMap.get(target);
    if (!depMap) {
        depMap = new Map();
        targetMap.set(target, depMap);
    }
    let dep = depMap.get(key);
    if (!dep) {
        dep = createDep();
        depMap.set(key, dep);
    }
    trackEffect(dep);
}
function trackEffect(dep) {
    // 用集合才存放对于这个对象的这个属性的所有依赖对象
    if (activeEffect && !dep.has(activeEffect)) {
        dep.add(activeEffect);
        activeEffect.deps.push(dep);
    }
}
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
        if (!isReadonly) {
            // 收集依赖
            track(target, 'get', key);
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

class RefImpl {
    constructor(value) {
        this._V_isRef = true; // 用来判断一个对象是否是ref
        this._rawValue = value;
        this._value = convert(value);
        this.deps = createDep();
    }
    get value() {
        trackRefValue(this);
        return this._value;
    }
    set value(newValue) {
        if (hasChanged(newValue, this._rawValue)) {
            this._rawValue = newValue;
            this._value = convert(newValue);
            triggerRefValue(this);
        }
    }
}
function ref(value) {
    return new RefImpl(value);
}
function trackRefValue(ref) {
    if (isTrack()) {
        trackEffect(ref.deps);
    }
}
function triggerRefValue(ref) {
    triggerEffects(ref.deps);
}
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function isRef(ref) {
    return !!ref._V_isRef;
}
// 如果参数是ref实例对象，返回ref.value的值， 如果参数不是ref实例对象，那么直接返回参数的值
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
function proxyRef(objectWithRef) {
    return new Proxy(objectWithRef, {
        get(target, key) {
            return unRef(target[key]);
        },
        set(target, key, value, receiver) {
            if (isRef(target[key]) && !isRef(value)) {
                return target[key].value = value;
            }
            else {
                return Reflect.set(target, key, value, receiver);
            }
        }
    });
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
        next: null,
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
        instance.setupState = proxyRef(setupResult);
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

function shouldUpdateComponent(prevVNode, nextVNode) {
    let { props: prevProps } = prevVNode;
    let { props: nextProps } = nextVNode;
    for (let key in nextProps) {
        if (nextProps[key] !== prevProps[key]) {
            return true;
        }
    }
    return false;
}

// 存放各个更新视图任务
const queue = [];
// 用来避免向微任务队列中放入多个相同的flushJob()函数
// 只有在第一次调用时, 会将flushJob()函数放入微任务队列中，
// 即使再有新的不同的任务进来，也只是将新的任务放入queue中，而不会再将其flushJob()函数放入微任务队列中
// 因为flushJob()是会将queue中的任务都拿出来运行的，所以没必要在微任务队列中加入多个flushJob()
// 如果放入多个flushJob() 其实也就是导致后面的呢queue为空，没有可执行的内容，所以不划算
let isFlushPending = false;
function nextTick(fn) {
    return fn ? Promise.resolve().then(fn) : Promise.resolve();
}
function queryJob(job) {
    if (!queue.includes(job)) {
        queue.push(job);
        queueFlush();
    }
}
function queueFlush() {
    if (isFlushPending)
        return;
    isFlushPending = true;
    nextTick(flushJob);
}
function flushJob() {
    isFlushPending = false;
    let job;
    while ((job = queue.shift())) {
        if (job) {
            job();
        }
    }
}

function createRender(options) {
    const { createElement: hostCreateElement, patchProps: hostPatchProps, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText } = options;
    function render(vNode, container) {
        // 调用patch进行vNode的拆箱操作，也就是看虚拟节点后是否还有其他节点
        patch(null, vNode, container, null, null);
    }
    // n1表示之前旧的虚拟节点， n2表示现在新的虚拟节点
    function patch(n1, n2, container, anchor, parentComponent) {
        // 先判虚拟节点的类型 是元素还是 组件
        // 如果虚拟节点的type是一个string类型， 那么该虚拟节点就是一个元素，
        // 如果vNode.type 类型是一个Object，那么这个虚拟节点就是一个组件
        // 如果是元素 则调用 processElement();
        // 如果是组件 则调用 processComponent();
        let { type, shapeFlags } = n2;
        switch (type) {
            case Fragment:
                processFragment(n2, container, parentComponent);
                break;
            case Text:
                processText(n2, container);
                break;
            default:
                if (shapeFlags & 1 /* ELEMENT */) {
                    processElement(n1, n2, container, anchor, parentComponent);
                }
                else if (shapeFlags & 2 /* STATEFUL_COMPONENT */) {
                    processComponent(n1, n2, container, parentComponent);
                }
        }
    }
    function processFragment(vNode, container, parentComponent) {
        mountChildren(vNode.children, container, parentComponent);
    }
    function processText(vNode, container) {
        let { children } = vNode;
        let textNode = document.createTextNode(children.text);
        container.appendChild(textNode);
    }
    function processElement(n1, n2, container, anchor, parentComponent) {
        // 在这里要去判断是新建一个元素还是更新一个元素
        if (!n1) {
            console.log('mount');
            mountElement(n2, container, anchor, parentComponent);
        }
        else {
            console.log('update');
            updateElement(n1, n2, container, parentComponent);
        }
    }
    function mountElement(vNode, container, anchor, parentComponent) {
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
            hostPatchProps(el, key, null, val);
        }
        hostInsert(el, container, anchor);
    }
    function updateElement(n1, n2, container, parentComponent) {
        // 更新元素
        const oldProps = n1.props || EMPTY_OBJECT;
        const newProps = n2.props || EMPTY_OBJECT;
        // el说我们根据vNode的type创建出来的元素
        const el = (n2.el = n1.el);
        updateChildren(n1, n2, el, parentComponent);
        updateProps(el, oldProps, newProps);
    }
    function updateChildren(n1, n2, container, parentComponent) {
        console.log('updateChildren');
        const prevShapeFlag = n1.shapeFlags;
        const currShapeFlag = n2.shapeFlags;
        const c1 = n1.children;
        const c2 = n2.children;
        if (currShapeFlag & 4 /* TEXT_CHILDREN */) {
            if (prevShapeFlag & 8 /* ARRAY_CHILDREN */) {
                unMountChild(c1);
            }
            if (c1 !== c2) {
                hostSetElementText(container, c2);
            }
        }
        else {
            if (prevShapeFlag & 4 /* TEXT_CHILDREN */) {
                hostSetElementText(container, '');
                mountChildren(c2, container, parentComponent);
            }
            if (prevShapeFlag & 8 /* ARRAY_CHILDREN */) {
                patchKeyedChildren(c1, c2, container, parentComponent);
            }
        }
    }
    function patchKeyedChildren(c1, c2, container, parentComponent) {
        const l2 = c2.length;
        let i = 0;
        let e1 = c1.length - 1;
        let e2 = l2 - 1;
        const isSameVNode = (node1, node2) => {
            return node1.type === node2.type && node1.key === node2.key;
        };
        // 比较左侧相同点, 直到不同点
        while (i <= e1 && i <= e2) {
            const oldNode = c1[i];
            const newNode = c2[i];
            if (isSameVNode(oldNode, newNode)) {
                patch(oldNode, newNode, container, null, parentComponent);
                i++;
            }
            else {
                break;
            }
        }
        // 比较右侧相同点 直到不同的地方
        while (i <= e1 && i <= e2) {
            const oldNode = c1[e1];
            const newNode = c2[e2];
            if (isSameVNode(oldNode, newNode)) {
                patch(oldNode, newNode, container, null, parentComponent);
                e1--;
                e2--;
            }
            else {
                break;
            }
        }
        //新的比老的多
        if (i > e1 && i <= e2) {
            let nextPos = e2 + 1;
            let anchor = nextPos < l2 ? c2[nextPos].el : null;
            while (i <= e2) {
                patch(null, c2[i], container, anchor, parentComponent);
                i++;
            }
        }
        else if (i > e2 && i <= e1) {
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        else {
            let oldStart = i;
            let newStart = i;
            let toBePatchCount = e2 - i + 1;
            let count = 0;
            let keyToIndexMap = new Map();
            let newIndexToOldIndex = new Array(toBePatchCount).fill(0);
            let maxNewIndex = 0;
            let move = false; // 用来判断新children中有没有旧的节点是要移动
            for (let index = newStart; index <= e2; index++) {
                keyToIndexMap.set(c2[index].key, index);
            }
            for (let index = oldStart; index <= e1; index++) {
                let oldNode = c1[index];
                if (count >= toBePatchCount) {
                    hostRemove(oldNode.el);
                    continue;
                }
                let newIndex;
                if (oldNode.key !== null) {
                    newIndex = keyToIndexMap.get(oldNode.key);
                }
                else {
                    for (let i = newStart; i <= e2; i++) {
                        if (isSameVNode(oldNode, c2[i])) {
                            newIndex = i;
                            break;
                        }
                    }
                }
                if (newIndex === undefined) {
                    hostRemove(oldNode.el);
                }
                else {
                    // 如果nexIndex 对应的节点在老children中也有，那么就记录一下
                    // 记录的是在新children中该节点的位置与其在旧children节点位置的对应
                    // 数组的下标表示的是新children中该节点在要更新的这部分中的下标
                    // index + 1 是为了怕 index为0, 该数组中值为零则表示该节点属于新节点
                    newIndexToOldIndex[newIndex - newStart] = index + 1;
                    // 如果在新children中 节点的位置和oldChildren中节点的位置一样，
                    // 那么就不需要移动，就可以不用计算最长递增子序列，从而提高效率
                    if (newIndex >= maxNewIndex) {
                        maxNewIndex = newIndex;
                    }
                    else {
                        move = true;
                    }
                    patch(oldNode, c2[newIndex], container, null, parentComponent);
                    count++;
                }
            }
            // 为什么要求最长递增子序列
            // 通过求解最长递增子序列， 我们可以减少节点的移动，只移动不是最长递增子序列中的节点
            // 从而提高效率
            let increasingNewIndexSequence = move ? getSequence(newIndexToOldIndex) : [];
            let j = increasingNewIndexSequence.length - 1;
            for (let i = toBePatchCount - 1; i >= 0; i--) {
                let currIndex = i + newStart;
                let currNode = c2[currIndex];
                let anchor = currIndex + 1 < l2 ? c2[currIndex + 1].el : null;
                if (newIndexToOldIndex[i] === 0) {
                    // 该节点是新节点 需要创建
                    patch(null, currNode, container, anchor, parentComponent);
                }
                else if (move) {
                    // 说明有节点需要移动
                    if (j < 0 || increasingNewIndexSequence[j] !== i) {
                        // 说明这个节点不是那个最长递增子序列当中的节点
                        // 因此这个节点需要被重新插入位置
                        hostInsert(currNode.el, container, anchor);
                    }
                    else {
                        // 说明该节点是最长自增子序列中的一个值
                        // 那么什么都不做，继续判断
                        j--;
                    }
                }
            }
        }
    }
    function unMountChild(children) {
        children.forEach((child) => {
            hostRemove(child.el);
        });
    }
    function updateProps(el, oldProps, newProps) {
        for (const key in newProps) {
            const prevProp = oldProps[key];
            const nextProp = newProps[key];
            if (prevProp !== nextProp) {
                hostPatchProps(el, key, prevProp, nextProp);
            }
        }
        // 若是在newProps没有这个属性，则需要将这个属性删除
        for (const key in oldProps) {
            if (!(key in newProps)) {
                hostPatchProps(el, key, oldProps[key], null);
            }
        }
    }
    function mountChildren(children, container, parentComponent) {
        children.forEach((v) => {
            patch(null, v, container, null, parentComponent);
        });
    }
    function processComponent(n1, n2, container, parentComponent) {
        // 判断是要重新创建一个组件，还是更新一个组件
        // 创建一个新的组件
        if (!n1) {
            mountComponent(n2, container, parentComponent);
        }
        else {
            updateComponent(n1, n2);
        }
    }
    function mountComponent(vNode, container, parentComponent) {
        // 第一步创建一个组件实例对象
        const instance = (vNode.component = createComponentInstance(vNode, parentComponent));
        // 第二部设置组件实例对象的属性
        setupComponent(instance);
        setupRenderEffect(instance, vNode, container);
    }
    function setupRenderEffect(instance, vNode, container) {
        instance.update = effect(() => {
            if (!instance.isMounted) {
                let { proxy } = instance;
                if (!instance.render)
                    return;
                const subTree = instance.render.call(proxy);
                instance.subTree = subTree;
                if (subTree) {
                    patch(null, subTree, container, null, instance);
                }
                vNode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                let { proxy } = instance;
                if (!instance.render)
                    return;
                // 更新组件其实这里就是处理更新组件上的属性
                // 组件内部的元素 其实 就是更新元素的路数
                // 刚开始进来时 都是以组件的形式，然后在慢慢拆分为元素，
                // 总的来说 就是 组件上更新的是组件的属性，落到最后其实本质上还是更新元素
                // 所以这里就只用更新 组件属性， 而更新元素 在之前实现的元素更新里面已经实现了
                const { next, vNode } = instance;
                if (next) {
                    next.el = vNode.el;
                    updateComponentPreRender(instance, next);
                }
                const subTree = instance.render.call(proxy);
                const previewTree = instance.subTree;
                console.log('previewTree', previewTree);
                console.log('currentTree', subTree);
                instance.subTree = subTree;
                if (subTree) {
                    patch(previewTree, subTree, container, null, instance);
                }
                vNode.el = subTree.el;
            }
        }, {
            schedule() {
                // 视图异步更新，避免多次值被多次改变时，视图也要被多次更新
                // 减少性能开销
                console.log('schedule-update');
                queryJob(instance.update);
            }
        });
    }
    // 更新组件
    function updateComponent(n1, n2) {
        // 获取旧虚拟节点对应的组件实例对象
        const instance = (n2.component = n1.component);
        if (shouldUpdateComponent(n1, n2)) {
            // 组件上的属性发生了更新，那么组件实例对象上的props属性需要发生更新
            // 旧节点对应的组件实例对象的下一个更新的虚拟节点
            instance.next = n2;
            // 调用 setUpRenderEffect函数内effect()函数返回的runner 从而重新调用是实例对象上的render()函数，从而重新触发组件内元素的更新
            instance.update();
        }
        else {
            // 组件属性没有更新，那么只需要更新组件内的元素就行
            n2.el = n1.el;
            instance.vNode = n2;
        }
    }
    function updateComponentPreRender(instance, nextVNode) {
        // 更新组件实例对象对应的vNode
        instance.vNode = nextVNode;
        // 更新组件实例对象上的属性为对应的最新虚拟节点上的属性
        instance.props = nextVNode.props;
        // 更新完成之后 将instance.next 设置为null 因为已经当前组件实例对象已经更新完毕
        instance.next = null;
    }
    // 最终返回的是一个对象，这个对象里面有一个createApp属性
    // 这个属性对应的就是createApp.ts文件中 createAppApi方法返回的那个函数
    return {
        createApp: createAppApi(render)
    };
}
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
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
function patchProps(el, key, prevVal, nextVal) {
    // 判断属性是一个要添加在元素上的事件还是只是单纯的元素属性
    let isOnEvent = /^on[A-Z]/.test(key);
    if (isOnEvent) {
        let eventName = key.slice(2).toLowerCase();
        el.addEventListener(eventName, nextVal);
    }
    else {
        if (nextVal === undefined || nextVal === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextVal);
        }
    }
}
function remove(el) {
    const parent = el.parentNode;
    console.log('remove', el, parent);
    if (parent) {
        parent.removeChild(el);
    }
}
function setElementText(el, text) {
    el.textContent = text;
}
function insert(el, containerElement, anchor = null) {
    containerElement.insertBefore(el, anchor);
}
let renderer = createRender({
    createElement,
    patchProps,
    insert,
    remove,
    setElementText
});
const createApp = (...args) => {
    return renderer.createApp(...args);
};

export { createApp, createElement, createRender, createTextVNode, getCurrentInstance, h, inject, insert, nextTick, patchProps, provide, proxyRef, ref, remove, renderSlots, setElementText };

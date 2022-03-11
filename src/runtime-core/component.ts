import { componentPublicInstance } from "./componentpublicInstance";

export function createComponentInstance(vNode) {
    const instance = {
        vNode,
        type: vNode.type, // vNode.type 对应的才是真正的组件
        setupState: {}
    }
    return instance
}

export function setupComponent(instance) {
    // initProps
    // initSlots
    setupStatefulComponent(instance);
}

function setupStatefulComponent(instance) {
    const component = instance.type;

    // 设置组件实例对象代理属性，设置这个是为能够在组件对象的render()方法中去调用组件setup()方法所返回的对象中的属性
    instance.proxy = new Proxy({_: instance}, componentPublicInstance )

    let { setup } = component;
    
    if(setup) {
        const setupResult = setup();

        handleSetupResult(instance, setupResult);
    }
}

function handleSetupResult(instance, setupResult) {
    // 如果setupResult是一个对象
    if(typeof setupResult === 'object') {
        instance.setupState = setupResult;
    }

    finishComponent(instance);
}

function finishComponent(instance) {
    const component = instance.type;

    if(!instance.render) {
        instance.render = component.render;
    }
}
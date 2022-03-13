import { componentPublicInstance } from "./componentpublicInstance";
import { initProps } from "./ComponentProps";
import { shallowReadonly } from "../reactivity/src/reactivity"

export function createComponentInstance(vNode) {
    const instance = {
        vNode,
        type: vNode.type, // vNode.type 对应的才是真正的组件
        setupState: {},
        props: {} // 组件上的属性，父组件给子组件传值
    }
    return instance
}

export function setupComponent(instance) {
    let { props } = instance.vNode;
    initProps(instance, props);
    // initSlots
    setupStatefulComponent(instance);
}

function setupStatefulComponent(instance) {
    const component = instance.type;

    // 设置组件实例对象代理属性，设置这个是为能够在组件对象的render()方法中去调用组件setup()方法所返回的对象中的属性
    instance.proxy = new Proxy({_: instance}, componentPublicInstance )

    let { setup } = component;
    
    if(setup) {
        const setupResult = setup(shallowReadonly(instance.props));

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
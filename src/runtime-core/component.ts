export function createComponentInstance(vNode) {
    const instance = {
        vNode,
        type: vNode.type // vNode.type 对应的才是真正的组件
    }
}

export function setupComponent(instance) {
    // initProps
    // initSlots
    setupStatefulComponent(instance);
}

function setupStatefulComponent(instance) {
    const component = instance.type;

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
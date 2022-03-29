import { hasOwn } from "../shared/index";


const publicPropertiesMap = {
    $el: (i) => i.vNode.el,
    $slot: (i) => i.slots,
    $props: (i) => i.props,
};

export const componentPublicInstance = {
    get({_: instance}, key) {
        let { setupState, props } = instance;
        if(hasOwn(setupState,key)) {
            return setupState[key];
        } if(hasOwn(props, key)) {
            return props[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if(publicGetter) {
            return publicGetter(instance);
        }
    }
}
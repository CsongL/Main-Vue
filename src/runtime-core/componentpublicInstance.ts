const publicPropertiesMap = {
    $el: (i) => i.vNode.el
};

export const componentPublicInstance = {
    get({_: instance}, key) {
        let { setupState } = instance;
        if(key in setupState) {
            return setupState[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if(publicGetter) {
            return publicGetter(instance);
        }
    }
}
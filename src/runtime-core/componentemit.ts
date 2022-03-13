
import { hasOwn, captialize, camelize } from '../shared/index'

export function emit(instance, event, ...args) {
    const { props } = instance.vNode;

    const toHandlerKey = (str) => {
        return 'on' + captialize(str);
    }
    let key =toHandlerKey(camelize(event));
    if(hasOwn(props, key)) {
        const handler = props[key];
        handler(...args);
    }
}
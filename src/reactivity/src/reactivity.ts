
import { 
    mutableHandler
} from './baseHandler'

// reactiveMap  用来  存储target的代理对象
export const reactiveMap = new WeakMap();


export function reactive(target) {
    return createReactiveObj(target, mutableHandler)
}


function createReactiveObj(target, mutableHandler) {
    // 如果之前已经创建过代理对象那么从map中获取，提高效率
    if(reactiveMap.has(target))  return reactiveMap.get(target);

    const proxy = new Proxy(target, mutableHandler);

    reactiveMap.set(target, proxy);

    return proxy;
}
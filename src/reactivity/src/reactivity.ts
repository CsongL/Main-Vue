
import { 
    mutableHandler,
    readonlyHandler,
    shallowReadonlyHandler
} from './baseHandler'

// reactiveMap  用来  存储target的代理对象
export const reactiveMap = new WeakMap();


export const enum ReactiveFlags {
    IS_REACTIVE = '__V_isReactive',
    IS_READONLY = '__V_isReadonly'
}

export function reactive(target) {
    return createReactiveObj(target, mutableHandler)
}

export function readonly(target) {
    return createReactiveObj(target, readonlyHandler);
}

export function shallowReadonly(target) {
    return createReactiveObj(target, shallowReadonlyHandler);
}

function createReactiveObj(target, baseHandler) {
    // 如果之前已经创建过代理对象那么从map中获取，提高效率
    if(reactiveMap.has(target))  return reactiveMap.get(target);

    const proxy = new Proxy(target, baseHandler);

    reactiveMap.set(target, proxy);

    return proxy;
}

// 用来判断一个函数是不是reactive对象
// 通过调用代理对象上的ReactiveFlags.IS_REACTIVE属性
// 从而在代理对象处理器的get方法中进行判断, 
// 因为要么是 相应对象，要么是readonly对象，所以可以通过createGet()函数的readonly参数进行判断
// 如果该方法传入的是目标对象，那么是不会出发get方法，从而就是undefined，通过 !!undefined 将其转为false
export function isReactive(obj) {
    return !!obj[ReactiveFlags.IS_REACTIVE];
}

export function isReadonly(obj) {
    return !!obj[ReactiveFlags.IS_READONLY];
}
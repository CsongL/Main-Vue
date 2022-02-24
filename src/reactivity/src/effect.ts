import { createDep } from './dep'


let activeEffect = void 0; // 全局变量 表示正在收集的依赖
const targetMap = new WeakMap(); //key是 target(目标独享), value是一个map

// 依赖对象类
export class ReactiveEffect {
    deps = [];
    constructor(public fn) {
        console.log('创建ReactiveEffect 对象');
    }
    run() {
        // 在这个函数里面执行fn, 从而实现 依赖收集
        activeEffect = this as any;

        if(!activeEffect) return
        
        let result = activeEffect.fn(); // 在执行这个函数的过程中，从而触发track()收集依赖

        activeEffect = undefined;


        return result;
    }
}

export function effect(fn) {

    const _effect = new ReactiveEffect(fn);

    _effect.run();
}

export function track(target, type, key) {
    let depMap = targetMap.get(target);
    if(!depMap) {
        depMap = new Map();
        targetMap.set(target, depMap);
    }

    let dep = depMap.get(key);
    if(!dep) {
        dep = createDep();
        depMap.set(key, dep);
    }
    
    trackEffect(dep);
}

function trackEffect(dep) {
    if(!dep.has(activeEffect)) {
        dep.add(activeEffect);
        (activeEffect as any).deps.push(dep);
    }
}

export function trigger(target, type, key) {
    let depMap = targetMap.get(target);
    
    if(!depMap) return;

    let deps: Array<any> = [];

    let dep = depMap.get(key);

    deps.push(dep);

    let effects : Array<any> = [];

    deps.forEach((dep) => {
        effects.push(...dep);
    })

    triggerEffects(createDep(effects));
}

function triggerEffects(dep) {
    for(let effect of dep) {
        effect.run();
    }
}
import { createDep } from './dep'
import { extend } from '../../shared/index'

let activeEffect = void 0; // 全局变量 表示正在收集的依赖
let shouldTrack = false; // 用来判断是否应该收集这个依赖，在代码作用机制上与activeEffect类似
const targetMap = new WeakMap(); //key是 target(目标独享), value是一个map

// 依赖对象类
export class ReactiveEffect {
    // 用来标明这个effect对象是否还起作用，也就是这个effect对象是否还会被调用
    // 另一方面也是用来优化, 避免多次调用active函数
    active = true;
    deps = [];
    public onStop?: () => void;
    // public 的作用是 实例对象可以访问到 就相当于是 this.fn = fn;
    constructor(public fn, public schedule?) {
        console.log('创建ReactiveEffect 对象');
    }
    run() {
        console.log('ReactiveEffect run function')
        // 在这个函数里面执行fn, 从而实现 依赖收集

        // 如果这个effect实例对象已经调用过stop()函数,那么就不应该在出发依赖收集,而只是单纯的执行函数
        // 如果调用过stop()函数，那么会到只this.active标签的值变为false，
        if(!this.active) {
            this.fn();
        }

        activeEffect = this as any;
        shouldTrack = true;

        if(!activeEffect) return
        
        let result = activeEffect.fn(); // 在执行这个函数的过程中，从而触发track()收集依赖

        activeEffect = undefined;
        shouldTrack = false;

        return result;
    }
    stop() {
        if(this.active){
            cleanupEffect(this);
            if(this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    }
}

export function stop(runner) {
    runner.effect.stop();
}

function cleanupEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    })
    effect.deps.length = 0;
}

export function effect(fn, options: any = {}) {
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

export function track(target, type, key) {
    // 在开始收集依赖之前，判断是shouldTrack 是否为true 以及 activeEffect是否有对应的值
    if(!isTrack()) {
        return;
    }
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
    // 用集合才存放对于这个对象的这个属性的所有依赖对象
    if(activeEffect && !dep.has(activeEffect)) {
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
        if(effect.schedule) {
            effect.schedule();
        } else {
            effect.run();
        }
    }
}
import { ReactiveEffect } from './effect'

class ComputedRefImpl {
    private _dirty: boolean = true;
    private _value: any;
    // 这一个思想很重要，根据getter创建一个依赖实例对象，从而可以通过schedule来改变_dirty值，
    // 在第一次获取计算对象的属性值时，会进行依赖收集,因为会执行effect.run()函数来进行依赖收集 
    // 在对响应式对象设置值时，会触发收集到的依赖，又因为我们传递了schedule参数，所以最终会执行schedule参数所对应的函数，而在这个schedule函数内我们可以重新将this_dirty设置 为true，从而当下次获取计算属性时，会再次调用effect.run()；
    // 获取计算对象的属性的值时，我们通过运行effect.run()函数来运行getter函数，从而拿到对应的值，
    // schedule 是在设置响应式对象属性的值时触发依赖时所运行的，而effect.run() 是直接通过调用运行的
    private _effect : ReactiveEffect; 
    constructor(getter: () => any) {
        this._effect = new ReactiveEffect(getter, () => {
            if(this._dirty) return;
            this._dirty = true;
        })
    }
    get value() { 
        // 上锁，如果被依赖的数据没有改变，那么就不需要运行effect.run函数
        // 解锁是在声明effect对象的schedule属性中完成的
        if(this._dirty) {
            this._dirty = false;
            this._value = this._effect.run();
        }
        return this._value;
    }
}

export function computed(getter: () => any) {
    return new ComputedRefImpl(getter);
}
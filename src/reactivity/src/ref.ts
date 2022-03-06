import { trackEffect, isTrack, triggerEffects } from '../src/effect'
import { reactive } from '../src/reactivity'
import { createDep } from '../src/dep'
import { isObject, hasChanged } from '../../shared/index'

class RefImpl {
    private _value : any;
    public deps;
    private _rawValue: any;
    private _V_isRef = true; // 用来判断一个对象是否是ref
    constructor(value) {
        this._rawValue = value;
        this._value = convert(value);
        this.deps = createDep();
    }
    get value() {
        trackRefValue(this);
        return this._value;
    }
    set value(newValue) {
        if(hasChanged(newValue, this._rawValue)) {
            this._rawValue = newValue;
            this._value = convert(newValue);
            triggerRefValue(this);
        } 
    }
}

export function ref(value) {
    return new RefImpl(value)
}

function trackRefValue(ref) {
    if(isTrack()) {
        trackEffect(ref.deps)
    }
}

function triggerRefValue(ref) {
    triggerEffects(ref.deps);
}

function convert(value) {
    return isObject(value) ? reactive(value) : value
}

export function isRef(ref) {
    return !!ref._V_isRef;
}

// 如果参数是ref实例对象，返回ref.value的值， 如果参数不是ref实例对象，那么直接返回参数的值
export function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}

export function proxyRef(objectWithRef) {
    return new Proxy(objectWithRef, {
        get(target, key) {
            return unRef(target[key]);
        },
        set(target, key, value, receiver) {
            if(isRef(target[key]) && !isRef(value)) {
                return target[key].value = value;
            } else {
                return Reflect.set(target, key, value, receiver);
            }
        }
    })
}
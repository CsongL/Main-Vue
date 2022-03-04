import { trackEffect, isTrack, triggerEffects } from '../src/effect'
import { reactive } from '../src/reactivity'
import { createDep } from '../src/dep'
import { isObject, hasChanged } from '../../shared/index'

class RefImpl {
    private _value : any;
    public deps;
    private _rawValue: any;
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
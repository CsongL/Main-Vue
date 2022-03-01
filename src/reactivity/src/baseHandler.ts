import { track, trigger} from './effect'
import { ReactiveFlags } from './reactivity'



const get = createGet();
const set = createSet();
const readonlyGet = createGet(true)

function createGet(readonly = false) {
    return function get(target, key, receiver) {
        
        if(key === ReactiveFlags.IS_REACTIVE) {
            return !readonly;
        } else if (key === ReactiveFlags.IS_READONLY) {
            return readonly;
        }

        let result = Reflect.get(target, key, receiver);

        if(!readonly) {
            // 收集依赖
            track(target, 'get', key);
        }

        

        return result;
    };
}

function createSet() {
    return function set(target, key, value, receiver) {
        
        let result = Reflect.set(target, key, value, receiver);

        // 触发依赖
        trigger(target, 'set', key);

        return result;
    }
}

export const mutableHandler = {
    get,
    set
}

export const readonlyHandler = {
    get: readonlyGet,
    set(target, key) {
        console.warn(`Set target's ${String(key)} failed, because target is readonly`, target);
        return true;
    }
}
import { track, trigger} from './effect'


const get = createGet();
const set = createSet();

function createGet() {
    return function get(target, key, receiver) {
        let result = Reflect.get(target, key, receiver);

        // 收集依赖
        track(target, 'get', key);

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
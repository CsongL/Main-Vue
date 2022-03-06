import{ ref, isRef, unRef, proxyRef } from '../src/ref'
import { effect } from '../src/effect'
import { reactive } from '../src/reactivity'

describe('ref', () => {
    it("ref function", () => {
        let obj = ref(1);
        expect(obj.value).toBe(1);
    })

    it("should be a reactive", () => {
        let refObject = ref(1);
        let count = 0;
        let dummy;
        let runner = effect(() => {
            count++;
            dummy = refObject.value;
        });
        expect(count).toBe(1);
        expect(dummy).toBe(1);
        refObject.value = 2;
        expect(count).toBe(2);
        expect(dummy).toBe(2);
        refObject.value = 2;
        expect(count).toBe(2);
        expect(dummy).toBe(2);
    })
    
    it('isRef', () => {
        let refObj = ref(1);
        let basicValue  = 1;
        let reactiveObj = reactive({
            age: 1
        })
        expect(isRef(refObj)).toBe(true);
        expect(isRef(basicValue)).toBe(false);
        expect(isRef(reactiveObj)).toBe(false);
    })

    // unRef 的功能就是 如果参数 是 ref实例对象，那么就返回ref.value, 如果参数不是ref实例对象，那么就直接返回这个参数
    it('unRef', () => {
        let refObj = ref(1);
        let basicValue = 2;
        expect(unRef(refObj)).toBe(1);
        expect(unRef(basicValue)).toBe(2);
    })

    it('proxyRef', () => {
        let user = {
            age: ref(10),
            name: 'cai'
        }
        let refObj = proxyRef(user);
        expect(user.age.value).toBe(10);
        expect(refObj.age).toBe(10);
        expect(refObj.name).toBe('cai');
        refObj.age = 20;
        expect(user.age.value).toBe(20);
        expect(refObj.age).toBe(20);
        refObj.age = ref(30);
        expect(refObj.age).toBe(30);
        expect(user.age.value).toBe(30);
    })
})
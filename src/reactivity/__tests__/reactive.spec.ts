import { reactive, isReactive, isProxy } from '../src/reactivity'


describe('reactive', () => {
    test("Object", () => {
        const original = {foo : 1};
        const observed = reactive(original);
    })

    it('isReactive', () => {
        let original = {foo : 1};
        let reactiveObj = reactive(original);
        expect(isReactive(reactiveObj)).toBe(true);
        expect(isReactive(original)).toBe(false);
        expect(isProxy(reactiveObj)).toBe(true);
        expect(isProxy(original)).toBe(false);
    })

    it('nest Object', () => {
        let original = {
            foo: 1,
            bar: {
                name: 2
            },
            arr: [1,2,3]
        }
        let reactiveObj = reactive(original);
        expect(isReactive(reactiveObj)).toBe(true);
        expect(isReactive(reactiveObj.bar)).toBe(true);
        expect(isReactive(reactiveObj.arr)).toBe(true);
    })

})
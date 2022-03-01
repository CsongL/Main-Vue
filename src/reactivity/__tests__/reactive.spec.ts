import { reactive, isReactive } from '../src/reactivity'


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
    })
})
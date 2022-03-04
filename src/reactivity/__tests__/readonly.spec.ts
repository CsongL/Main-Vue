import { readonly, isReadonly, isProxy} from '../src/reactivity'

describe('readonly', () => {
    it('readonly function', () => {
        let original = {foo : 1};
        let readonlyObj = readonly(original);
        expect(original).not.toBe(readonlyObj);
        expect(readonlyObj.foo).toBe(1);
    })

    it('readonly warn', () => {
        console.warn = jest.fn();
        const user = readonly({age : 10});
        user.age = 11;
        expect(console.warn).toBeCalled();
    })

    it('isReadonly', () => {
        let original = {foo: 1};
        let readonlyObj = readonly(original);
        expect(isReadonly(original)).toBe(false);
        expect(original).not.toBe(readonlyObj);
        expect(isReadonly(readonlyObj)).toBe(true);
        expect(isProxy(original)).toBe(false);
        expect(isProxy(readonlyObj)).toBe(true);
    })

    it('nest readonly', () => {
        let original = {
            foo: 1,
            bar: {
                name: 2
            },
            arr: [1,2,3]
        }
        let readonlyObj = readonly(original);
        expect(isReadonly(readonlyObj)).toBe(true);
        expect(isReadonly(readonlyObj.bar)).toBe(true);
        expect(isReadonly(readonlyObj.arr)).toBe(true);
    })
})
import { shallowReadonly, isReadonly } from "../src/reactivity";

describe("shallow readonly", () => {
    it("shallowReadonly", () => {
        const original = {foo: {n : 1}};
        const object = shallowReadonly(original);
        expect(isReadonly(object)).toBe(true);
        expect(isReadonly(object.foo)).toBe(false);
    })

    it("when set a value on the shallowReadonly object, it will run log.warn", ()=> {
        console.warn = jest.fn();
        const object = shallowReadonly({foo : {n : 1}});
        object.foo.n = 2;
        expect(console.warn).toBeCalled();
    }) 
})
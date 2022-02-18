import { reactive } from '../src/reactivity'

describe('reactive', () => {
    test("Object", () => {
        const original = {foo : 1};
        const observed = reactive(original);
    })
})
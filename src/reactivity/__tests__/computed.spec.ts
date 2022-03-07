import { reactive } from '../src/reactivity'
import { computed } from '../src/computed'

describe('computed', () => {
    it('computed basic function', () => {
        let value = reactive({
            foo: 1
        })
        let cValue = computed(() => {
            return value.foo;
        })

        expect(cValue.value).toBe(1);
    })

    it('impl lazy computed', () => {
        let value = reactive({
            foo : 1
        })
        let getter = jest.fn(() => {
            return value.foo;
        })
        let cValue = computed(getter);
        
        expect(cValue.value).toBe(1);
        expect(getter).toBeCalledTimes(1);

        expect(cValue.value).toBe(1);
        expect(getter).toBeCalledTimes(1);

        value.foo = 2;
        expect(cValue.value).toBe(2);
        expect(getter).toBeCalledTimes(2);
    })
})